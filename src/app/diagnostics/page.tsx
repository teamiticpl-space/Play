'use client'

import { supabase } from '@/types/types'
import { useEffect, useState } from 'react'

interface DiagnosticResult {
  name: string
  status: 'pass' | 'fail' | 'warning' | 'pending'
  message: string
  details?: string
}

export default function DiagnosticsPage() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [running, setRunning] = useState(false)

  const runDiagnostics = async () => {
    setRunning(true)
    const diagnostics: DiagnosticResult[] = []

    // Test 1: Environment Variables
    try {
      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
      const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      diagnostics.push({
        name: 'Environment Variables',
        status: hasUrl && hasKey ? 'pass' : 'fail',
        message: hasUrl && hasKey
          ? 'Environment variables are configured'
          : 'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
        details: `URL: ${hasUrl ? '✓' : '✗'}, Key: ${hasKey ? '✓' : '✗'}`,
      })
    } catch (error) {
      diagnostics.push({
        name: 'Environment Variables',
        status: 'fail',
        message: 'Error checking environment variables',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Test 2: Supabase Connection
    try {
      const { data, error } = await supabase.from('quiz_sets').select('id').limit(1)

      diagnostics.push({
        name: 'Supabase Connection',
        status: error ? 'fail' : 'pass',
        message: error ? 'Failed to connect to Supabase' : 'Successfully connected to Supabase',
        details: error ? error.message : 'Connection successful',
      })
    } catch (error) {
      diagnostics.push({
        name: 'Supabase Connection',
        status: 'fail',
        message: 'Error connecting to Supabase',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Test 3: Anonymous Authentication
    try {
      const { data, error } = await supabase.auth.signInAnonymously()

      diagnostics.push({
        name: 'Anonymous Authentication',
        status: error ? 'fail' : 'pass',
        message: error
          ? 'Anonymous auth is not enabled'
          : 'Anonymous auth is working',
        details: error
          ? 'Go to Supabase Dashboard → Authentication → Providers → Enable Anonymous Sign-ins'
          : `User ID: ${data.user?.id}`,
      })
    } catch (error) {
      diagnostics.push({
        name: 'Anonymous Authentication',
        status: 'fail',
        message: 'Error testing anonymous auth',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Test 4: Session Check
    try {
      const { data: sessionData } = await supabase.auth.getSession()

      diagnostics.push({
        name: 'Current Session',
        status: sessionData.session ? 'pass' : 'warning',
        message: sessionData.session
          ? 'Session is active'
          : 'No active session (this is OK for testing)',
        details: sessionData.session
          ? `User: ${sessionData.session.user.email || sessionData.session.user.id}`
          : 'User is not logged in',
      })
    } catch (error) {
      diagnostics.push({
        name: 'Current Session',
        status: 'fail',
        message: 'Error checking session',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Test 5: Database Tables
    try {
      const tables = ['quiz_sets', 'questions', 'choices', 'games', 'participants', 'answers', 'profiles'] as const
      const results = await Promise.all(
        tables.map(async (table) => {
          const { error } = await supabase.from(table as any).select('id').limit(1)
          return { table, exists: !error }
        })
      )

      const allExist = results.every((r) => r.exists)
      const existingTables = results.filter((r) => r.exists).map((r) => r.table)
      const missingTables = results.filter((r) => !r.exists).map((r) => r.table)

      diagnostics.push({
        name: 'Database Tables',
        status: allExist ? 'pass' : 'fail',
        message: allExist
          ? 'All required tables exist'
          : `Missing tables: ${missingTables.join(', ')}`,
        details: `Found: ${existingTables.length}/${tables.length} tables`,
      })
    } catch (error) {
      diagnostics.push({
        name: 'Database Tables',
        status: 'fail',
        message: 'Error checking tables',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Test 6: Participant Insert (Critical for joining games)
    try {
      // First ensure we have a session
      const { data: sessionData } = await supabase.auth.getSession()
      let userId = sessionData.session?.user.id

      if (!userId) {
        const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously()
        if (anonError) throw anonError
        userId = anonData.user?.id
      }

      if (!userId) {
        throw new Error('Could not get user ID')
      }

      // Try to check participants table structure
      const { error } = await supabase.from('participants').select('user_id').limit(1)

      diagnostics.push({
        name: 'Participants Table (user_id column)',
        status: error ? 'fail' : 'pass',
        message: error
          ? 'Participants table may be missing user_id column'
          : 'Participants table is properly configured',
        details: error
          ? 'Run supabase/safe_setup.sql to add missing columns'
          : 'user_id column exists',
      })
    } catch (error) {
      diagnostics.push({
        name: 'Participants Table (user_id column)',
        status: 'fail',
        message: 'Error checking participants table',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Test 7: Realtime
    try {
      const channel = supabase.channel('diagnostics-test')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'games'
        }, () => {})
        .subscribe()

      // Wait a bit for subscription to establish
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const status = channel.state
      await channel.unsubscribe()

      diagnostics.push({
        name: 'Realtime Subscriptions',
        status: status === 'joined' ? 'pass' : 'warning',
        message: status === 'joined'
          ? 'Realtime is working'
          : `Realtime status: ${status}`,
        details: status === 'joined'
          ? 'Successfully subscribed to realtime channel'
          : 'Realtime may not be enabled for all tables',
      })
    } catch (error) {
      diagnostics.push({
        name: 'Realtime Subscriptions',
        status: 'fail',
        message: 'Error testing realtime',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    setResults(diagnostics)
    setRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-50'
      case 'fail':
        return 'text-red-600 bg-red-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'pass':
        return '✅'
      case 'fail':
        return '❌'
      case 'warning':
        return '⚠️'
      default:
        return '⏳'
    }
  }

  const passCount = results.filter((r) => r.status === 'pass').length
  const failCount = results.filter((r) => r.status === 'fail').length
  const warningCount = results.filter((r) => r.status === 'warning').length

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 System Diagnostics
          </h1>
          <p className="text-gray-600 mb-8">
            Checking SupaQuiz configuration and connectivity
          </p>

          {/* Summary */}
          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-600">{passCount}</div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-red-600">{failCount}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-yellow-600">{warningCount}</div>
                <div className="text-sm text-yellow-700">Warnings</div>
              </div>
            </div>
          )}

          {/* Run Button */}
          <button
            onClick={runDiagnostics}
            disabled={running}
            className="w-full mb-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {running ? 'Running Diagnostics...' : 'Run Diagnostics Again'}
          </button>

          {/* Results */}
          <div className="space-y-4">
            {results.length === 0 && !running && (
              <div className="text-center text-gray-500 py-8">
                Click &quot;Run Diagnostics&quot; to start
              </div>
            )}

            {results.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${
                  result.status === 'pass'
                    ? 'border-green-200 bg-green-50'
                    : result.status === 'fail'
                    ? 'border-red-200 bg-red-50'
                    : result.status === 'warning'
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getStatusIcon(result.status)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {result.name}
                    </h3>
                    <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                    {result.details && (
                      <p className="text-xs text-gray-600 bg-white bg-opacity-50 rounded p-2 font-mono">
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Help Section */}
          {failCount > 0 && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                📚 Need Help?
              </h2>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>
                  • Check{' '}
                  <code className="bg-white px-2 py-1 rounded">
                    TROUBLESHOOTING.md
                  </code>{' '}
                  for detailed solutions
                </li>
                <li>
                  • Run{' '}
                  <code className="bg-white px-2 py-1 rounded">
                    supabase/safe_setup.sql
                  </code>{' '}
                  in Supabase SQL Editor
                </li>
                <li>
                  • Enable Anonymous Authentication in Supabase Dashboard →
                  Authentication → Providers
                </li>
                <li>
                  • Verify{' '}
                  <code className="bg-white px-2 py-1 rounded">.env.local</code>{' '}
                  has correct credentials
                </li>
                <li>
                  • Check Supabase Dashboard → Logs for error messages
                </li>
              </ul>
            </div>
          )}

          {/* Success Message */}
          {failCount === 0 && warningCount === 0 && results.length > 0 && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-green-900 mb-2">
                🎉 All Systems Operational!
              </h2>
              <p className="text-sm text-green-800">
                Your SupaQuiz installation is properly configured and ready to
                use. You can start creating quizzes and hosting games!
              </p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <a
            href="/host/dashboard"
            className="block bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">📊 Dashboard</h3>
            <p className="text-sm text-gray-600">Manage your quizzes</p>
          </a>
          <a
            href="/host/dashboard/create"
            className="block bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900">➕ Create Quiz</h3>
            <p className="text-sm text-gray-600">Build a new quiz</p>
          </a>
        </div>
      </div>
    </div>
  )
}
