# 🚀 Deployment Guide

## Prerequisites

✅ Git repository initialized
✅ Environment variables ready
✅ Supabase project configured

---

## 🎯 Option 1: Vercel (Recommended)

### Why Vercel?
- ✅ Built by Next.js creators
- ✅ Zero configuration needed
- ✅ Automatic HTTPS
- ✅ Free tier includes everything
- ✅ Best performance for Next.js

### Steps

#### 1. Push to GitHub

```bash
# Create a new repository at github.com
# Then run these commands:

git remote add origin https://github.com/YOUR_USERNAME/kahoot-alternative.git
git branch -M main
git push -u origin main
```

#### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"New Project"**
4. Import your GitHub repository
5. Configure Environment Variables:
   - Click **"Environment Variables"**
   - Add these variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://qkqkgswwkpklftnajsug.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key
     ```
6. Click **"Deploy"**
7. Wait 2-3 minutes ⏱️
8. Done! 🎉

Your app will be live at: `https://your-project.vercel.app`

### Automatic Deployments

Every time you push to GitHub:
- Vercel automatically deploys the new version
- Preview deployments for pull requests
- Production deployment for main branch

---

## 🌐 Option 2: Netlify

### Why Netlify?
- ✅ Easy to use interface
- ✅ Good Next.js support with plugin
- ✅ Free tier available

### Steps

#### 1. Push to GitHub

```bash
# Same as Vercel option above
git remote add origin https://github.com/YOUR_USERNAME/kahoot-alternative.git
git branch -M main
git push -u origin main
```

#### 2. Deploy on Netlify

1. Go to [netlify.com](https://netlify.com)
2. Sign in with GitHub
3. Click **"Add new site"** → **"Import an existing project"**
4. Choose **GitHub** and select your repository
5. Build settings (should auto-detect):
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Add Environment Variables:
   - Click **"Show advanced"** → **"New variable"**
   - Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://qkqkgswwkpklftnajsug.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...your-anon-key
     ```
7. Click **"Deploy site"**
8. Wait 3-5 minutes ⏱️
9. Done! 🎉

Your app will be live at: `https://your-site-name.netlify.app`

### Install Next.js Plugin (if not auto-installed)

If deployment fails, manually add the Next.js plugin:
1. Go to **Site settings** → **Plugins**
2. Search for **"Next.js Runtime"**
3. Install and redeploy

---

## 🔧 Environment Variables

These are required for deployment:

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Connect to database |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Authenticate requests |

**⚠️ Important:**
- Never commit `.env.local` to Git
- Add environment variables in the deployment platform UI
- Variables with `NEXT_PUBLIC_` prefix are exposed to browser

---

## 📱 Custom Domain (Optional)

### Vercel
1. Go to **Project Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed

### Netlify
1. Go to **Domain settings**
2. Add custom domain
3. Update DNS records as instructed

---

## 🐛 Troubleshooting

### Build Fails

**Issue:** Build fails with module not found
**Fix:**
```bash
npm install
npm run build  # Test locally first
```

### Environment Variables Not Working

**Issue:** App can't connect to Supabase
**Fix:**
- Verify variables are set in deployment platform
- Check variable names are EXACT (case-sensitive)
- Redeploy after adding variables

### Supabase Connection Error

**Issue:** 401 Unauthorized or CORS errors
**Fix:**
1. Go to Supabase Dashboard
2. Settings → API
3. Add your deployment URL to **Allowed Origins**:
   - `https://your-project.vercel.app`
   - `https://your-site-name.netlify.app`

### Images Not Loading

**Issue:** BGlobby.jpg not showing
**Fix:**
- Verify file is in `/public` folder
- Check file is committed to Git
- Clear cache and hard reload (Ctrl+Shift+R)

---

## 🚀 Quick Deploy Commands

```bash
# Setup Git (if not done)
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main

# Then deploy via Vercel or Netlify web UI
```

---

## 📊 Performance Tips

1. **Enable Analytics** (Vercel/Netlify)
2. **Set up monitoring** for uptime
3. **Use CDN** (automatic on both platforms)
4. **Enable caching** (automatic on both platforms)

---

## 🎉 Post-Deployment

After deployment, test these features:
- ✅ Login/Register
- ✅ Create Quiz
- ✅ Join Game (as player)
- ✅ Host Game
- ✅ Real-time updates
- ✅ Leaderboard
- ✅ Avatar selection
- ✅ Theme selection
- ✅ Auto-advance timer
- ✅ Mobile responsive

---

## 📞 Need Help?

- **Vercel Docs**: [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)
- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

---

Good luck with your deployment! 🚀✨
