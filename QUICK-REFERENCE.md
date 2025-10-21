# 🚀 BestDish Quick Reference Guide

## 📋 Environment Variables Checklist

Add these **9 variables** to Vercel:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_SITE_URL=https://bestdish.co.uk
```

**Optional (add later for search):**
```env
GOOGLE_API_KEY=AIzaSy...
GOOGLE_CSE_ID=...
```

---

## 🌐 DNS Records for bestdish.co.uk

Add these in your domain registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 300 |
| CNAME | www | cname.vercel-dns.com | 300 |

---

## 🔄 Your Daily Workflow

### Adding New Content (Dishes)

```bash
# 1. Start local server
cd /Users/nate/Desktop/bestdish/bestdish
npm run dev

# 2. Scrape new dishes
npx ts-node -P tsconfig.scripts.json -r tsconfig-paths/register scripts/scrape-to-target.ts

# 3. Test at http://localhost:3000
# - Check new dishes appear
# - Verify photos load
# - Test search

# 4. Deploy to production
git add .
git commit -m "Added 10 new dishes in Edinburgh"
git push

# ✅ Live in 2-3 minutes at bestdish.co.uk
```

### Making Code Changes

```bash
# 1. Edit code
# 2. Test locally with npm run dev
# 3. Fix any bugs
# 4. Deploy
git add .
git commit -m "Fixed search bug"
git push

# ✅ Auto-deploys to production
```

### Urgent Hotfix

```bash
# 1. Make minimal fix
# 2. Quick test
# 3. Push immediately
git add .
git commit -m "HOTFIX: Critical bug"
git push

# ✅ Live in 2 minutes
```

---

## 🔍 SEO URLs (Already Working!)

| Resource | URL |
|----------|-----|
| Sitemap | https://bestdish.co.uk/sitemap.xml |
| Robots.txt | https://bestdish.co.uk/robots.txt |
| Homepage | https://bestdish.co.uk |
| City Example | https://bestdish.co.uk/manchester |
| Dish Example | https://bestdish.co.uk/manchester/hawksmoor/porterhouse-steak |

---

## 📊 Monitoring

### Vercel Dashboard
- **URL:** https://vercel.com/dashboard
- **Check:** Deployments, errors, analytics

### Supabase Dashboard
- **URL:** https://supabase.com/dashboard
- **Check:** Database, storage, API usage

### Google Search Console
- **URL:** https://search.google.com/search-console
- **Setup:** Day 1 after launch
- **Check:** Pages indexed, search queries, errors

---

## 🛠️ Common Commands

### Development
```bash
npm run dev              # Start local server (port 3000)
npm run build            # Test production build
npx prisma studio        # Open database GUI (port 5555)
```

### Scraping
```bash
# Scrape to specific target
npx ts-node -P tsconfig.scripts.json -r tsconfig-paths/register scripts/scrape-to-target.ts

# Pre-flight check before deploy
npx ts-node -P tsconfig.scripts.json -r tsconfig-paths/register scripts/pre-flight-check.ts
```

### Database
```bash
npx prisma generate      # Regenerate Prisma client
npx prisma db push       # Push schema changes to DB
npx prisma studio        # Open database browser
```

### Deployment
```bash
git add .
git commit -m "Description"
git push                 # Auto-deploys to production
```

---

## ⚠️ Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Live Site** | https://bestdish.co.uk | Your production site |
| **Admin Panel** | https://bestdish.co.uk/admin | Manage content |
| **Vercel** | https://vercel.com/dashboard | Deployment & analytics |
| **Supabase** | https://supabase.com/dashboard | Database & storage |
| **GitHub** | https://github.com/YOUR-USERNAME/bestdish | Code repository |

---

## 🐛 Quick Fixes

### Site Not Loading
1. Check Vercel dashboard for errors
2. Check environment variables are set
3. Rollback to previous deployment

### Images Not Loading
1. Supabase → Storage → dish-photos
2. Make bucket public
3. Check CORS settings

### Database Connection Error
1. Verify DATABASE_URL in Vercel
2. Check Supabase is not paused
3. Verify connection pooling: `?pgbouncer=true`

### Build Failed
1. Check build logs in Vercel
2. Test build locally: `npm run build`
3. Fix errors, push again

---

## 📈 Growth Milestones

### Week 1
- [ ] 100 visitors
- [ ] 10 reviews
- [ ] Google indexed

### Month 1
- [ ] 1,000 visitors
- [ ] 50 reviews
- [ ] 100 dishes

### Month 3
- [ ] 5,000 visitors
- [ ] 200 reviews
- [ ] 200 dishes
- [ ] Monetization

---

## 💡 Pro Tips

### Testing Locally First = No Surprises
Always run `npm run dev` and test before pushing to production.

### Small, Frequent Deploys > Big Releases
Deploy often. Easier to debug. Faster to fix.

### Monitor After Each Deploy
Check Vercel logs for first 10 minutes after deployment.

### Keep Environment Variables in Sync
Local `.env` should match Vercel production settings.

### Use Preview Branches for Big Changes
Create a branch, test on preview URL, then merge.

---

## 🚨 Emergency Contacts

- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/support
- **GitHub Status:** https://www.githubstatus.com

---

## 🎯 Your Launch Checklist

Before launching:

- [ ] All environment variables added to Vercel
- [ ] DNS records updated for bestdish.co.uk
- [ ] Local site works perfectly
- [ ] Sitemap accessible: /sitemap.xml
- [ ] Robots.txt accessible: /robots.txt
- [ ] Mobile responsive tested
- [ ] Admin panel works

After launching:

- [ ] Test live site on mobile & desktop
- [ ] Submit sitemap to Google Search Console
- [ ] Share on social media
- [ ] Monitor for first 24 hours
- [ ] Celebrate! 🎉

---

## 📚 Full Documentation

- **Production Launch:** `PRODUCTION-LAUNCH.md`
- **Deployment Guide:** `DEPLOYMENT.md`
- **Quick Deploy:** `DEPLOY-NOW.md`
- **Ready Checklist:** `READY-TO-DEPLOY.md`

---

**Remember:** You have 26 excellent dishes. That's plenty to launch! 

Ship it, get feedback, iterate. 🚀


