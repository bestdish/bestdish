# ✅ The Correct Dev → Prod Workflow

## 🎯 Philosophy

**Development = Your Playground** 🛠️
- Run scrapers here
- Add/edit content
- Experiment freely
- Test everything

**Production = The Live Site** 🌐
- Only deploy when dev is perfect
- Manual approval required
- Controlled updates

---

## 📋 Daily Workflow

### Morning - Work in Development

```bash
# Start dev server
cd /Users/nate/Desktop/bestdish/bestdish
bash start-dev.sh

# Visit http://localhost:3000
```

**Do your work:**
- Run scrapers (add Manchester restaurants)
- Upload photos via admin
- Edit dish descriptions
- Test new features
- **Everything happens in DEV database** ✅

---

### Afternoon - Deploy to Production

**When you're happy with changes:**

#### 1. Deploy Code Changes
```bash
cd /Users/nate/Desktop/bestdish/bestdish
npx vercel --prod
```

#### 2. Deploy Database Changes
**Ask me:** "Deploy dev database to prod"

**Or run manually:**
```bash
cd /Users/nate/Desktop/bestdish/bestdish

export DEV_DATABASE_URL="postgresql://postgres.brwejqxzcpjxmxxagbtp:C8uy578mOyl7TA9p@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
export PROD_DATABASE_URL="postgresql://postgres.yoeguahpdrtctrvaheer:C8uy578mOyl7TA9p@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

npx tsx scripts/deploy-dev-to-prod.ts
```

#### 3. Sync Images (If Needed)
**If you added photos in dev:**
- Photos are in **dev Supabase bucket**
- Need to copy to **prod bucket**
- **Ask me:** "Sync dev images to prod"

---

## 🎬 Typical Day

### Example: Adding 10 New Manchester Restaurants

**Morning (Dev):**
1. Run scraper on localhost
2. Review results at http://localhost:3000/manchester
3. Add photos to any missing ones via http://localhost:3000/admin
4. Test everything looks good

**Afternoon (Deploy):**
1. Say to me: **"Deploy dev to prod"**
2. I'll sync the database
3. You run: `npx vercel --prod` (for code changes if any)
4. Done! Live at https://bestdish.co.uk

---

## 🔄 What Gets Synced Automatically

### Automatic (via Vercel deployment):
- ✅ Code changes
- ✅ UI updates
- ✅ New features
- ✅ Config files

### Manual (via database sync):
- 📊 New dishes
- 📊 New restaurants
- 📊 New cities
- 📊 Reviews

### Manual (separate process):
- 📸 Images (stored in Supabase, not in database)

---

## 🎯 Simple Rules

1. **Always work in dev first** ✅
2. **Test thoroughly on localhost** ✅
3. **When satisfied, ask me to deploy database** ✅
4. **Run `npx vercel --prod` for code** ✅
5. **Production updates = deliberate, not accidental** ✅

---

## 🆘 Emergency: Need to Pull Prod → Dev?

**If production has something dev doesn't:**

Ask me: **"Sync prod to dev"** (opposite direction)

I can run both directions:
- **Dev → Prod:** Normal deployment
- **Prod → Dev:** Emergency restore or refresh

---

## ✅ Current State

**Development (localhost:3000):**
- 22 Manchester dishes
- Your workspace - modify freely!
- Runs scrapers here

**Production (bestdish.co.uk):**
- 22 Manchester dishes (same as dev right now)
- Only update when you approve
- Instagram pulls from here

---

**This is the professional way!** See `CORRECT-WORKFLOW.md` for the full guide.

**Ready to go to the gym now?** Instagram will post automatically at 4pm tomorrow! 🎉





