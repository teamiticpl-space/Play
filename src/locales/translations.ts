export type Language = 'en' | 'th'

export interface Translations {
  // Common
  loading: string
  error: string
  save: string
  cancel: string
  delete: string
  edit: string
  create: string
  next: string
  back: string

  // Navigation
  dashboard: string
  profile: string
  logout: string
  login: string
  register: string

  // Quiz
  quiz: string
  quizName: string
  quizDescription: string
  createQuiz: string
  editQuiz: string
  deleteQuiz: string
  playQuiz: string
  questions: string
  question: string
  addQuestion: string

  // Question
  questionText: string
  timeLimit: string
  points: string
  choices: string
  correctAnswer: string

  // Game
  startGame: string
  gamePin: string
  waitingForPlayers: string
  playersJoined: string
  startQuiz: string

  // Settings
  settings: string
  theme: string
  autoAdvance: string
  autoAdvanceTimer: string
  enableAutoAdvance: string
  manualMode: string
  teamMode: string
  enableTeamMode: string
  numberOfTeams: string
  autoRead: string
  autoReadQuestions: string
  isPublic: string
  makePublic: string

  // Results
  results: string
  score: string
  leaderboard: string

  // Player
  playerName: string
  joinGame: string
  enterPin: string

  // Messages
  quizCreated: string
  quizUpdated: string
  quizDeleted: string
  errorLoadingQuiz: string
  errorSavingQuiz: string

  // Dashboard
  myQuizzes: string
  manageQuizzes: string
  noQuizzes: string
  createFirstQuiz: string
}

export const translations: Record<Language, Translations> = {
  en: {
    // Common
    loading: 'Loading...',
    error: 'Error',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    next: 'Next',
    back: 'Back',

    // Navigation
    dashboard: 'Dashboard',
    profile: 'Profile',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',

    // Quiz
    quiz: 'Quiz',
    quizName: 'Quiz Name',
    quizDescription: 'Description',
    createQuiz: 'Create New Quiz',
    editQuiz: 'Edit Quiz',
    deleteQuiz: 'Delete Quiz',
    playQuiz: 'Play Quiz',
    questions: 'Questions',
    question: 'Question',
    addQuestion: 'Add Question',

    // Question
    questionText: 'Question Text',
    timeLimit: 'Time Limit (seconds)',
    points: 'Points',
    choices: 'Answer Choices',
    correctAnswer: 'Correct Answer',

    // Game
    startGame: 'Start Game',
    gamePin: 'Game PIN',
    waitingForPlayers: 'Waiting for players...',
    playersJoined: 'Players Joined',
    startQuiz: 'Start Quiz',

    // Settings
    settings: 'Settings',
    theme: 'Theme',
    autoAdvance: 'Auto-Advance',
    autoAdvanceTimer: 'Auto-Advance Timer',
    enableAutoAdvance: 'Enable Auto-Advance Timer',
    manualMode: 'Manual mode: Host will need to click "Next" button to continue',
    teamMode: 'Team Mode',
    enableTeamMode: 'Enable Team Mode',
    numberOfTeams: 'Number of Teams',
    autoRead: 'Auto-Read',
    autoReadQuestions: 'Auto-Read Questions Aloud',
    isPublic: 'Public',
    makePublic: 'Make this quiz public (anyone can play)',

    // Results
    results: 'Results',
    score: 'Score',
    leaderboard: 'Leaderboard',

    // Player
    playerName: 'Player Name',
    joinGame: 'Join Game',
    enterPin: 'Enter PIN',

    // Messages
    quizCreated: 'Quiz created successfully!',
    quizUpdated: 'Quiz updated successfully!',
    quizDeleted: 'Quiz deleted successfully!',
    errorLoadingQuiz: 'Failed to load quiz',
    errorSavingQuiz: 'Failed to save quiz',

    // Dashboard
    myQuizzes: 'My Quizzes',
    manageQuizzes: 'Manage and play your quiz collections',
    noQuizzes: 'No quizzes yet',
    createFirstQuiz: 'Create your first quiz to get started!',
  },

  th: {
    // Common
    loading: 'กำลังโหลด...',
    error: 'ข้อผิดพลาด',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    create: 'สร้าง',
    next: 'ถัดไป',
    back: 'ย้อนกลับ',

    // Navigation
    dashboard: 'แดชบอร์ด',
    profile: 'โปรไฟล์',
    logout: 'ออกจากระบบ',
    login: 'เข้าสู่ระบบ',
    register: 'สมัครสมาชิก',

    // Quiz
    quiz: 'แบบทดสอบ',
    quizName: 'ชื่อแบบทดสอบ',
    quizDescription: 'คำอธิบาย',
    createQuiz: 'สร้างแบบทดสอบใหม่',
    editQuiz: 'แก้ไขแบบทดสอบ',
    deleteQuiz: 'ลบแบบทดสอบ',
    playQuiz: 'เล่นแบบทดสอบ',
    questions: 'คำถาม',
    question: 'คำถาม',
    addQuestion: 'เพิ่มคำถาม',

    // Question
    questionText: 'ข้อความคำถาม',
    timeLimit: 'เวลาจำกัด (วินาที)',
    points: 'คะแนน',
    choices: 'ตัวเลือก',
    correctAnswer: 'คำตอบที่ถูกต้อง',

    // Game
    startGame: 'เริ่มเกม',
    gamePin: 'รหัสเกม',
    waitingForPlayers: 'รอผู้เล่น...',
    playersJoined: 'ผู้เล่นเข้าร่วม',
    startQuiz: 'เริ่มทดสอบ',

    // Settings
    settings: 'การตั้งค่า',
    theme: 'ธีม',
    autoAdvance: 'เปลี่ยนอัตโนมัติ',
    autoAdvanceTimer: 'ตั้งเวลาเปลี่ยนอัตโนมัติ',
    enableAutoAdvance: 'เปิดใช้งานตั้งเวลาเปลี่ยนอัตโนมัติ',
    manualMode: 'โหมดกดเอง: ผู้จัดจะต้องกดปุ่ม "ถัดไป" เพื่อดำเนินการต่อ',
    teamMode: 'โหมดทีม',
    enableTeamMode: 'เปิดใช้งานโหมดทีม',
    numberOfTeams: 'จำนวนทีม',
    autoRead: 'อ่านอัตโนมัติ',
    autoReadQuestions: 'อ่านคำถามอัตโนมัติด้วยเสียง',
    isPublic: 'สาธารณะ',
    makePublic: 'ทำให้แบบทดสอบนี้เป็นสาธารณะ (ทุกคนสามารถเล่นได้)',

    // Results
    results: 'ผลลัพธ์',
    score: 'คะแนน',
    leaderboard: 'กระดานคะแนน',

    // Player
    playerName: 'ชื่อผู้เล่น',
    joinGame: 'เข้าร่วมเกม',
    enterPin: 'ใส่รหัส',

    // Messages
    quizCreated: 'สร้างแบบทดสอบสำเร็จ!',
    quizUpdated: 'อัปเดตแบบทดสอบสำเร็จ!',
    quizDeleted: 'ลบแบบทดสอบสำเร็จ!',
    errorLoadingQuiz: 'โหลดแบบทดสอบไม่สำเร็จ',
    errorSavingQuiz: 'บันทึกแบบทดสอบไม่สำเร็จ',

    // Dashboard
    myQuizzes: 'แบบทดสอบของฉัน',
    manageQuizzes: 'จัดการและเล่นแบบทดสอบของคุณ',
    noQuizzes: 'ยังไม่มีแบบทดสอบ',
    createFirstQuiz: 'สร้างแบบทดสอบแรกของคุณเพื่อเริ่มต้น!',
  },
}
