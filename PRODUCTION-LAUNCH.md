# 🚀 BestDish Production Launch Plan

## Phase 1: Deploy to Vercel (15 minutes)

### Step 1: Push to GitHub (3 min)

```bash
cd /Users/nate/Desktop/bestdish/bestdish

# Initialize git
git init
git add .
git commit -m "BestDish v1 - Production Launch 🚀"
git branch -M main

# Create repo on GitHub.com (bestdish), then:
git remote add origin https://github.com/YOUR-USERNAME/bestdish.git
git push -u origin main
```

### Step 2: Import to Vercel (2 min)

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select your `bestdish` repo
4. **Framework:** Next.js (auto-detected)
5. **Root Directory:** Leave blank
6. **Build Command:** `npm run build` (default)
7. **Output Directory:** `.next` (default)
8. Click **"Deploy"** (but it will fail without env vars - that's OK!)

### Step 3: Add Environment Variables (5 min)

In Vercel: **Project Settings → Environment Variables**

Add these **8 required variables**:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
GEMINI_API_KEY=AIzaSy...
```

**Optional (for search - can add later):**
```env
GOOGLE_API_KEY=AIzaSy...
GOOGLE_CSE_ID=...
```

**Important:** Select **"Production, Preview, and Development"** for all

### Step 4: Redeploy (2 min)

1. Go to **Deployments** tab
2. Click **"..."** on failed deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

✅ **Your site is now live at:** `https://bestdish-[random].vercel.app`

---

## Phase 2: Connect Custom Domain (10 minutes)

### Step 1: Add Domain to Vercel (2 min)

1. In Vercel: **Project Settings → Domains**
2. Click **"Add"**
3. Enter: `bestdish.co.uk`
4. Click **"Add"**
5. Repeat for: `www.bestdish.co.uk`

Vercel will show you the DNS records you need.

### Step 2: Update DNS Records (5 min)

Go to your domain registrar (where you bought bestdish.co.uk) and add these records:

**For bestdish.co.uk:**
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 300 |

**For www.bestdish.co.uk:**
| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | www | cname.vercel-dns.com | 300 |

### Step 3: Wait for DNS Propagation (3-30 min)

- Vercel will automatically detect the changes
- SSL certificate will be issued automatically
- You'll see "Valid Configuration" in Vercel dashboard

### Step 4: Set Primary Domain

1. In Vercel Domains, click **"..."** next to `bestdish.co.uk`
2. Select **"Set as Primary Domain"**
3. This ensures all traffic redirects to bestdish.co.uk (not www)

✅ **Your site is now live at:** `https://bestdish.co.uk`

---

## Phase 3: SEO Configuration (Already Done! ✅)

Your site **already has** all SEO optimizations built-in:

### ✅ Sitemap (Auto-Generated)
- **URL:** https://bestdish.co.uk/sitemap.xml
- **Location:** `app/sitemap.xml/route.ts`
- **Updates:** Automatically on each visit
- **Includes:** All cities, restaurants, and dishes

### ✅ Robots.txt (Configured)
- **URL:** https://bestdish.co.uk/robots.txt
- **Location:** `app/robots.txt/route.ts`
- **Allows:** All search engine crawlers
- **Points to:** Sitemap URL

### ✅ Structured Data (JSON-LD)
- **Location:** `lib/seo.ts`
- **Includes:**
  - Organization schema
  - Restaurant schemas
  - Recipe/Dish schemas
  - Review aggregation
  - Rating data

### ✅ Meta Tags
- Title tags with keywords
- Meta descriptions
- Open Graph tags (social sharing)
- Twitter Card tags
- Canonical URLs

### Post-Launch SEO Tasks

**Immediate (Day 1):**

1. **Submit to Google Search Console**
   - Go to https://search.google.com/search-console
   - Add property: `https://bestdish.co.uk`
   - Verify ownership (Vercel makes this easy)
   - Submit sitemap: `https://bestdish.co.uk/sitemap.xml`

2. **Submit to Bing Webmaster Tools**
   - Go to https://www.bing.com/webmasters
   - Add site: `https://bestdish.co.uk`
   - Import from Google Search Console (easier)

**Week 1:**

3. **Monitor Indexing**
   - Check Google: `site:bestdish.co.uk`
   - Should show all pages within 7 days

4. **Fix Any Issues**
   - Google Search Console → Coverage report
   - Fix any crawl errors

---

## Phase 4: Future Deployment Workflow

### The Best Practice Approach 🎯

**Always test locally first, then deploy!**

```
Local Development → Test → Commit → Push → Auto-Deploy to Vercel
```

### Your Future Workflow

#### Option A: Content Updates (Scraping, Admin Changes)

**Best Practice:** Test locally, then deploy

```bash
# 1. Test locally
cd /Users/nate/Desktop/bestdish/bestdish
npm run dev

# 2. Scrape new dishes (if needed)
npx ts-node scripts/scrape-to-target.ts

# 3. Test in browser
# → Go to http://localhost:3000
# → Check new dishes appear correctly
# → Test search, reviews, etc.

# 4. Commit & deploy
git add .
git commit -m "Added 10 new London dishes"
git push

# ✅ Vercel auto-deploys in 2-3 minutes
```

#### Option B: Code Changes (Features, Bug Fixes)

**Best Practice:** Always test locally first

```bash
# 1. Make changes to code
# 2. Test locally with npm run dev
# 3. Fix any bugs
# 4. Commit and push
# ✅ Vercel auto-deploys
```

#### Option C: Urgent Hotfixes

**When:** Site is broken, need immediate fix

```bash
# 1. Make minimal fix
# 2. Quick local test
# 3. Push immediately
# ✅ Live in 2 minutes
```

### Why This Workflow?

✅ **Catch bugs before users see them**
✅ **Test scraper results locally first**
✅ **Verify new content looks good**
✅ **No downtime or broken deploys**
✅ **Confidence in every deployment**

### Vercel Auto-Deploy Magic

Once set up, **every push to main = automatic deployment**:

1. You push code to GitHub
2. Vercel detects the push
3. Builds your app
4. Runs tests (if configured)
5. Deploys to production
6. Updates bestdish.co.uk

**No manual steps needed!**

### Preview Deployments

For testing before going live:

```bash
# Create a feature branch
git checkout -b add-glasgow-dishes

# Make changes, commit
git add .
git commit -m "Add Glasgow restaurants"

# Push to branch
git push origin add-glasgow-dishes

# ✅ Vercel creates a preview URL
# Test at: bestdish-git-add-glasgow-dishes-yourusername.vercel.app

# If good, merge to main
git checkout main
git merge add-glasgow-dishes
git push

# ✅ Now it's live on bestdish.co.uk
```

---

## Phase 5: Post-Launch Monitoring

### Day 1 Checklist

After going live, test these:

- [ ] Homepage loads: https://bestdish.co.uk
- [ ] www redirect works: https://www.bestdish.co.uk → https://bestdish.co.uk
- [ ] City pages work: https://bestdish.co.uk/manchester
- [ ] Dish pages work: Click any dish
- [ ] Search works (if Google API added)
- [ ] Mobile layout looks good
- [ ] Try submitting a review
- [ ] Admin panel accessible: https://bestdish.co.uk/admin
- [ ] Sitemap loads: https://bestdish.co.uk/sitemap.xml
- [ ] Robots.txt loads: https://bestdish.co.uk/robots.txt

### Week 1 Monitoring

**Check Vercel Analytics:**
- Unique visitors
- Page views
- Most viewed pages
- Geographic distribution

**Check Google Search Console:**
- Pages indexed
- Search queries
- Click-through rate
- Any crawl errors

**Check Supabase:**
- Database performance
- Storage usage
- API calls

---

## Scraping Strategy for Production

### Initial Launch (Now)

✅ **26 dishes** - Perfect for v1!

### Week 1-2

**Goal:** 50 total dishes

**Approach:**
```bash
# Local scraping, test results, then deploy
npm run dev  # Start local server
npx ts-node scripts/scrape-to-target.ts  # Scrape to 50 dishes
# Test locally, verify quality
git commit -am "Added 24 new dishes"
git push  # Deploy to production
```

### Month 1

**Goal:** 100-150 dishes

**Approach:**
- Scrape weekly in batches
- Always test locally first
- Deploy when you have 10-20 good dishes
- Monitor user engagement to prioritize cities

### Ongoing

**Approach:**
- Scrape based on user demand
- Monitor which cities users search for
- Add dishes for trending restaurants
- Quality over quantity

---

## Emergency Procedures

### Site Down

1. Check Vercel dashboard for errors
2. Check Supabase status
3. Rollback to previous deployment in Vercel

### Database Issues

1. Check Supabase dashboard
2. Verify connection strings
3. Check for migration issues

### Images Not Loading

1. Check Supabase Storage
2. Verify bucket is public
3. Check CORS settings

---

## Cost Monitoring

### Vercel (Free Tier)
- 100GB bandwidth/month
- Unlimited deployments
- **Upgrade when:** >100GB/month (~50k visitors)

### Supabase (Free Tier)
- 500MB database
- 1GB storage
- 2GB bandwidth/month
- **Upgrade when:** Database >400MB or >50k API requests/month

### APIs
- **Google Custom Search:** 100 queries/day free
- **Gemini API:** Current limits OK for now
- **Upgrade when:** Need more scraping capacity

---

## Success Metrics

### Week 1 Goals
- [ ] 100 unique visitors
- [ ] 10+ user reviews submitted
- [ ] 5+ dishes featured on social media
- [ ] Zero critical bugs

### Month 1 Goals
- [ ] 1,000 unique visitors
- [ ] 50+ user reviews
- [ ] 100+ dishes published
- [ ] Featured in local food blog

### Month 3 Goals
- [ ] 5,000 unique visitors
- [ ] 200+ reviews
- [ ] 200+ dishes
- [ ] Monetization strategy defined

---

## 🎉 You're Ready to Launch!

### Final Checklist

Before you deploy:

- [ ] All environment variables documented
- [ ] Local site works perfectly
- [ ] Database has 26 dishes
- [ ] Domain is ready (bestdish.co.uk)
- [ ] GitHub repo created
- [ ] Vercel account ready

### Launch Command

```bash
cd /Users/nate/Desktop/bestdish/bestdish
git init
git add .
git commit -m "🚀 BestDish v1 - Launch Day!"
git push -u origin main
```

Then follow Vercel setup steps above.

---

**Good luck with your launch! 🍽️✨**

*Remember: Ship early, iterate based on feedback. Your 26 dishes are plenty to start!*

