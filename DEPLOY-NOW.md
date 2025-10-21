# 🚀 Deploy BestDish to Production in 10 Minutes

## ✅ Pre-Deployment Checklist

Your app is ready! Here's what's already done:

- [x] 27 published dishes across 4 cities (Manchester, London, Birmingham, Newcastle/Nationwide)
- [x] Beautiful yellow/black/white design
- [x] Search functionality
- [x] Admin panel for managing content
- [x] Review system with moderation
- [x] Featured dishes carousel
- [x] Mobile-responsive design
- [x] SEO optimization (sitemaps, structured data)

---

## Step-by-Step Deployment

### 1. Push to GitHub (2 minutes)

```bash
cd /Users/nate/Desktop/bestdish/bestdish

# Initialize git (if not already done)
git init
git add .
git commit -m "Ready for production deployment"

# Create repo on GitHub, then:
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/bestdish.git
git push -u origin main
```

### 2. Deploy to Vercel (3 minutes)

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select your `bestdish` repo
4. **Root Directory:** `./bestdish` (important!)
5. Click **"Deploy"**

⏳ Wait 2-3 minutes...

### 3. Add Environment Variables (5 minutes)

In Vercel dashboard → Your Project → Settings → Environment Variables

Add these **10 variables** (copy from your local `.env` file):

| Variable | Where to find it |
|----------|------------------|
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (Transaction pooling) |
| `DIRECT_URL` | Supabase → Settings → Database → Connection string (Direct connection) |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as SUPABASE_URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as SUPABASE_ANON_KEY |
| `GOOGLE_API_KEY` | Your Google API key |
| `GOOGLE_CSE_ID` | Your Custom Search Engine ID |
| `GEMINI_API_KEY` | Your Gemini API key |

**Important:** Select **"Production, Preview, and Development"** for all variables

### 4. Redeploy (1 minute)

After adding environment variables:

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 2 minutes

✅ **Your site is live!**

---

## 🎉 You're Live!

Your site URL: `https://bestdish-[random].vercel.app`

### Test These Features:

1. **Homepage:** Should show all dishes and cities
2. **Search:** Try searching for "burger" or "pasta"
3. **Dish Page:** Click any dish, verify photo and description load
4. **Submit Review:** Test the comment form (anonymous)
5. **Admin Panel:** Go to `/admin` to manage content

---

## Next Steps

### Immediate (Today)

- [ ] Test site on your phone
- [ ] Share with 2-3 friends for feedback
- [ ] Monitor Vercel logs for errors

### This Week

- [ ] Buy a custom domain (e.g., `bestdish.co.uk`)
- [ ] Add domain in Vercel settings
- [ ] Update DNS records
- [ ] Enable SSL (automatic in Vercel)

### This Month

- [ ] Add 20 more dishes (manual upload via admin)
- [ ] Set up Instagram automation (n8n)
- [ ] Submit to Google Search Console
- [ ] Create social media accounts
- [ ] Launch on Product Hunt

---

## Common Issues & Fixes

### "Build Failed"
- Check build logs in Vercel
- Ensure all environment variables are set
- Verify `DATABASE_URL` has `?pgbouncer=true`

### "Images Not Loading"
- Go to Supabase → Storage → dish-photos
- Make bucket public
- Check bucket policies allow `SELECT`

### "Search Not Working"
- Verify `GOOGLE_API_KEY` and `GOOGLE_CSE_ID` are set
- Check API is enabled in Google Cloud Console
- Test search locally first

### "Admin Panel Empty"
- Check your production database has data
- Run `npx prisma db push` if needed
- Verify `DATABASE_URL` is correct

---

## Quick Commands

**View production logs:**
```bash
vercel logs bestdish --prod
```

**Deploy from CLI:**
```bash
vercel --prod
```

**Check environment variables:**
```bash
vercel env ls
```

---

## 🎊 Congratulations!

You've built and deployed a **production-ready restaurant discovery platform** with:

- ✅ Modern Next.js 15 architecture
- ✅ PostgreSQL database (Supabase)
- ✅ AI-powered content generation
- ✅ Image optimization and CDN
- ✅ SEO optimization
- ✅ Mobile-responsive design
- ✅ Admin content management

**Time to celebrate and share with the world!** 🚀

---

**Need help?** Check the full `DEPLOYMENT.md` guide for detailed troubleshooting.


