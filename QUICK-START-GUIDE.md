# 🚀 BestDish - Quick Start Guide

**Your food discovery site is LIVE and Instagram is automated!**

---

## 📱 Quick Links

- **Live Site:** https://bestdish.co.uk
- **Manchester:** https://bestdish.co.uk/manchester
- **Admin Panel:** https://bestdish.co.uk/admin (username: `admin`, password: `BestDish2025!Secure#Admin`)
- **Instagram:** @bestdish.mcr (posts daily at 4pm automatically!)
- **n8n:** http://localhost:5678 (automation platform - not needed unless making changes)
- **Make.com:** https://www.make.com (Instagram automation - just needs to be toggled ON)

---

## 🎯 What You Need to Do

### Right Now (1 minute):
1. **Open Make.com:** https://www.make.com
2. **Click on your workflow:** "Daily Instagram Dish Poster"
3. **Toggle the switch to ON** (bottom left)
4. **Click Save**
5. **Done!** First post goes out tomorrow at 4pm 📸

---

## 📋 Daily Usage

### To Add More Manchester Dishes:

**Work in Development:**
```bash
cd /Users/nate/Desktop/bestdish/bestdish
bash start-dev.sh
# Visit http://localhost:3000/admin
```

1. Add restaurants via admin
2. Upload photos
3. Test on localhost
4. When happy, ask me: **"Deploy dev to prod"**

---

## 🎨 Instagram Automation

**What happens automatically:**
- **Every day at 4pm** ⏰
- **Make.com workflow triggers** 🤖
- **Fetches random Manchester dish** from production 📊
- **Posts to @bestdish.mcr** with professional caption 📸
- **Includes:** Photo + description + hashtags + location ✅

**You do:** Nothing! Completely hands-free ✨

---

## 🔧 Common Commands

### Start Development Server
```bash
cd /Users/nate/Desktop/bestdish/bestdish
bash start-dev.sh
```

### Deploy Code Changes to Production
```bash
cd /Users/nate/Desktop/bestdish/bestdish
npx vercel --prod
```

### Deploy Database Changes
**Just ask me:** "Deploy dev to prod" or "Sync dev to production"

---

## 📊 Current Status

**Production Site:**
- 42 dishes across UK
- 22 Manchester dishes (your focus)
- 42 restaurants
- All with quality photos
- Instagram API live

**Instagram:**
- Workflow ready
- Just needs activation (toggle ON)
- Posts daily at 4pm
- Fully automated

**Development:**
- Synced with production
- Ready for new work
- Safe testing environment

---

## 🆘 If Something Breaks

### Production Site Issues
1. Check Vercel: https://vercel.com/bestdish/bestdish
2. Check environment variables are correct
3. Ask me for help!

### Instagram Not Posting
1. Check Make.com executions log
2. Token might have expired (regenerate in Facebook)
3. Ask me for help!

### Development Server Won't Start
```bash
cd /Users/nate/Desktop/bestdish/bestdish
lsof -ti:3000 | xargs kill -9  # Kill any process on port 3000
bash start-dev.sh
```

---

## 📚 Full Documentation

- **`CORRECT-WORKFLOW.md`** - Complete dev/prod workflow
- **`INSTAGRAM-SETUP-STEPS.md`** - Instagram automation guide
- **`SESSION-COMPLETE.md`** - Today's achievements
- **`END-OF-SESSION-SUMMARY.md`** - Final status
- **`QUICK-START-GUIDE.md`** - This guide!

---

## 🎊 You're All Set!

**Just toggle ON your Make.com workflow and you're done!**

First automated Instagram post: **Tomorrow at 4pm** 📸🎉

---

**Questions?** Check the docs or just ask me! 🤖




