# 🔄 Keeping Dev & Prod in Sync

## Current Status

**Development:** Clean slate, ready for testing  
**Production:** 22 quality Manchester dishes ✅

---

## 📋 Recommended Workflow

### When to Sync:

**Sync Production → Development when:**
- ✅ You want to test with real production data
- ✅ Production has new content you want to experiment with
- ✅ You're about to make changes and want a realistic test environment

**How often:** Once a week, or whenever production changes significantly

---

## 🚀 How to Sync

### Option 1: Run the Sync Script (Automatic)

```bash
cd /Users/nate/Desktop/bestdish/bestdish

# Set both database URLs
export PROD_DATABASE_URL="postgresql://postgres.yoeguahpdrtctrvaheer:C8uy578mOyl7TA9p@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
export DEV_DATABASE_URL="postgresql://postgres.brwejqxzcpjxmxxagbtp:C8uy578mOyl7TA9p@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Run sync
npx tsx scripts/sync-prod-to-dev.ts
```

**What it does:**
- Clears dev database
- Copies all cities, restaurants, dishes, reviews from prod → dev
- Syncs all images from prod → dev Supabase storage
- Takes ~30-60 seconds (depending on number of images)

---

### Option 2: Ask Me to Sync

Just say: **"Sync prod to dev"** and I'll run it for you! ✅

---

## 🎯 Typical Workflow

### Monday - Friday (Development)
1. Work on `localhost:3000` (dev database)
2. Add features, test changes
3. Experiment freely - won't affect production

### When Ready to Deploy
1. **Test thoroughly** on localhost
2. **Commit code changes**
3. **Deploy to Vercel:** `npx vercel --prod`
4. **For database changes:** Manually replicate in production admin OR export/import

### Weekly Sync
1. **Run sync script** to refresh dev with latest prod data
2. **Now dev = prod** for realistic testing
3. **Make your changes** in dev
4. **Test**, then deploy

---

## 🔐 Important Notes

### Database Changes:
- **Code deploys automatically** via Vercel ✅
- **Database changes do NOT** - you need to sync manually ⚠️

### Images:
- **Dev images** stored in dev Supabase bucket
- **Prod images** stored in prod Supabase bucket  
- **Images sync automatically** with database sync! ✅
- Both `deploy-dev-to-prod.ts` and `sync-prod-to-dev.ts` now sync images AND database

---

## 🆘 Quick Commands

**Sync prod → dev:**
```bash
cd /Users/nate/Desktop/bestdish/bestdish
PROD_DATABASE_URL="<prod-url>" DEV_DATABASE_URL="<dev-url>" npx tsx scripts/sync-prod-to-dev.ts
```

**Or just ask me:** "Sync databases please!" 🤖

---

## ✅ Current Setup

**Production (bestdish.co.uk):**
- 22 Manchester dishes
- 22 restaurants  
- All with quality photos
- Instagram API ready

**Development (localhost:3000):**
- Clean and ready
- Can sync from prod anytime
- Safe testing environment

**Instagram Automation:**
- Make.com workflow ready
- Posts daily at 4pm
- Uses production data
- Fully automated ✅

---

**You're all set!** 🎉


