# 🚀 Development vs Production Workflow

## Overview

You now have **two completely separate environments**:

### 🧪 Development (Local)
- **Database:** `bestdish-development` (Supabase)
- **URL:** http://localhost:3000
- **Data:** 3 cities (London, Manchester, Edinburgh), 30 restaurants, 21 dishes
- **Purpose:** Safe testing, experiments, scraper testing
- **Changes:** Only affect your local machine

### 🌐 Production (Live)
- **Database:** `bestdish-production` (Supabase)
- **URL:** https://bestdish.co.uk
- **Data:** 11 cities, 52 restaurants, 35 dishes, 1 review
- **Purpose:** Live site for users
- **Changes:** Affect real users immediately

---

## 📝 Daily Workflow

### Making Code Changes

#### 1. **Test Locally First** ✅ Recommended
```bash
# Start local dev server (uses development database)
cd /Users/nate/Desktop/bestdish/bestdish
bash start-dev.sh

# Open http://localhost:3000
# Make changes, test features
# Any data changes only affect development database
```

#### 2. **When Happy with Changes**
```bash
# Commit your code
git add .
git commit -m "Your change description"
git push origin main

# Deploy to production
npx vercel --prod
```

#### 3. **Verify Production**
- Visit https://bestdish.co.uk
- Test the changes on live site
- Check admin panel: https://bestdish.co.uk/admin
  - Username: `admin`
  - Password: `BestDish2025!Secure#Admin`

---

## 🔄 Working with Data

### Testing Data Changes Locally
```bash
# Any database operations locally use DEVELOPMENT database
# Examples:
- Adding test reviews
- Creating test dishes
- Uploading test photos
- Running scrapers to test them

# These changes ONLY affect development - production is safe!
```

### Adding Real Data to Production
```bash
# Option A: Manual via admin panel (recommended)
1. Go to https://bestdish.co.uk/admin
2. Add cities/restaurants/dishes directly
3. Changes are immediately live

# Option B: Run scraper on production (careful!)
# Connect to production database temporarily
# Only do this when you're sure the scraper works!
```

---

## 🗄️ Database Access

### View Development Database
```bash
# Supabase Dashboard
https://supabase.com/dashboard/project/brwejqxzcpjxmxxagbtp

# Or locally with Prisma Studio
cd /Users/nate/Desktop/bestdish/bestdish
npx prisma studio
```

### View Production Database
```bash
# Supabase Dashboard
https://supabase.com/dashboard/project/yoeguahpdrtctrvaheer
```

---

## 🛠️ Common Tasks

### Start Local Development
```bash
cd /Users/nate/Desktop/bestdish/bestdish
bash start-dev.sh
# Visit http://localhost:3000
```

### Deploy to Production
```bash
cd /Users/nate/Desktop/bestdish/bestdish
npx vercel --prod
# Visit https://bestdish.co.uk
```

### Copy Production Data to Development
```bash
# If you want to refresh dev with latest production data
cd /Users/nate/Desktop/bestdish/bestdish

# 1. Export from production (script already exists)
npx tsx scripts/export-production-data.ts

# 2. Clear development database
# Go to Supabase dashboard → SQL Editor → run:
# TRUNCATE TABLE "Review", "Dish", "Restaurant", "City", "User" CASCADE;

# 3. Import to development
npx tsx scripts/populate-dev-db.ts
```

### Test Scraper Safely
```bash
# Scrapers use whatever database is in your .env
# Your .env points to DEVELOPMENT - so it's safe to test!

cd /Users/nate/Desktop/bestdish/bestdish
npx tsx scripts/scrape-manchester.ts

# This adds data to DEVELOPMENT database only
# Test it works, then decide if you want to run on production
```

---

## 🔐 Credentials Reference

### Admin Panel
- **Username:** admin
- **Password:** BestDish2025!Secure#Admin

### Environment Files
- **Local:** `.env` (points to development database)
- **Production:** Vercel environment variables (points to production database)
- **Backup:** `env-local-development.txt` and `env-production-vercel.txt`

### Supabase Projects
- **Development:** `bestdish-development` (brwejqxzcpjxmxxagbtp)
- **Production:** `bestdish-production` (yoeguahpdrtctrvaheer)

---

## ⚠️ Important Rules

### DO ✅
- Always test locally first
- Use development database for experiments
- Test scrapers on development before production
- Commit code changes regularly
- Deploy to production when confident

### DON'T ❌
- Run untested scrapers on production
- Delete production data without backup
- Share service_role keys publicly
- Test directly on live site
- Mix up database credentials

---

## 🆘 Troubleshooting

### Local dev connects to wrong database
```bash
# Check your .env file
cat .env | grep DATABASE_URL
# Should show: brwejqxzcpjxmxxagbtp (development)

# If wrong, copy from backup:
cp env-local-development.txt .env
```

### Production shows wrong data
```bash
# Check Vercel environment variables
# Should show: yoeguahpdrtctrvaheer (production)
# Go to: vercel.com → bestdish → Settings → Environment Variables
```

### Need to reset development database
```bash
# Go to Supabase dashboard for development project
# SQL Editor → New query:
TRUNCATE TABLE "Review", "Dish", "Restaurant", "City", "User" CASCADE;

# Then re-populate:
npx tsx scripts/populate-dev-db.ts
```

---

## 🎯 Best Practices

1. **Local First:** Always test changes locally before deploying
2. **Small Commits:** Commit code changes frequently
3. **Test Data:** Use development database for testing features
4. **Backup:** Export production data regularly
5. **Monitor:** Check production site after deployments
6. **Admin Access:** Keep admin credentials secure
7. **Database Separation:** Never confuse dev/prod databases

---

## 📊 Quick Status Check

**Local Development Running?**
```bash
lsof -ti:3000 && echo "✅ Running" || echo "❌ Not running"
```

**Production Live?**
```bash
curl -s -o /dev/null -w "%{http_code}" https://bestdish.co.uk
# Should return: 200
```

**Which database am I using locally?**
```bash
cat .env | grep DATABASE_URL | grep -o "brwejqxzcpjxmxxagbtp\\|yoeguahpdrtctrvaheer"
# Should return: brwejqxzcpjxmxxagbtp (development)
```

---

## 🎉 Summary

You now have a professional development workflow:
- ✅ Safe local testing environment
- ✅ Separate development database
- ✅ Production site with real data
- ✅ Clear deployment process
- ✅ Database isolation
- ✅ No more accidental production changes!

**Happy coding! 🚀**




