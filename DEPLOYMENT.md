# BestDish Production Deployment Guide

This guide will help you deploy BestDish to Vercel with Supabase.

## Prerequisites

- [ ] Supabase account (existing project)
- [ ] Vercel account (free tier works)
- [ ] GitHub repository (optional, recommended)
- [ ] Custom domain (optional)

---

## Step 1: Prepare Your Database (Supabase)

### 1.1 Verify Database Schema

Your Supabase database should already have all tables from local development. Verify at:
- https://supabase.com/dashboard/project/[YOUR-PROJECT]/editor

### 1.2 Run Prisma Migration (if needed)

If your production database is empty or out of sync:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to production database
npx prisma db push
```

### 1.3 Copy Environment Variables

You'll need these from Supabase Dashboard → Settings → API:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="eyJhb..."
SUPABASE_SERVICE_ROLE_KEY="eyJhb..."
```

---

## Step 2: Deploy to Vercel

### 2.1 Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2.2 Option A: Deploy via GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - BestDish v1"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/bestdish.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select "bestdish" folder as root directory
   - Framework: Next.js (auto-detected)

3. **Configure Environment Variables:**
   Add all variables from `.env` in Vercel dashboard:
   
   | Variable Name | Value | Source |
   |---------------|-------|--------|
   | `DATABASE_URL` | `postgresql://...` | Supabase Settings → Database |
   | `DIRECT_URL` | `postgresql://...` | Supabase Settings → Database |
   | `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Settings → API |
   | `SUPABASE_ANON_KEY` | `eyJhb...` | Supabase Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhb...` | Supabase Settings → API |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhb...` | Supabase Settings → API |
   | `GOOGLE_API_KEY` | Your Google API key | Google Cloud Console |
   | `GOOGLE_CSE_ID` | Your CSE ID | Google Custom Search |
   | `GEMINI_API_KEY` | Your Gemini key | Google AI Studio |

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Your site will be live at `https://bestdish-xyz.vercel.app`

### 2.2 Option B: Deploy via CLI

```bash
cd /Users/nate/Desktop/bestdish/bestdish
vercel

# Follow prompts:
# ? Set up and deploy? Yes
# ? Which scope? Your account
# ? Link to existing project? No
# ? What's your project's name? bestdish
# ? In which directory is your code located? ./
```

Then set environment variables:

```bash
vercel env add DATABASE_URL
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
# ... (repeat for all env vars)
```

Deploy to production:

```bash
vercel --prod
```

---

## Step 3: Post-Deployment Checks

### 3.1 Test Core Features

Visit your live site and verify:

- [ ] Homepage loads with all cities and dishes
- [ ] City pages show correct restaurants
- [ ] Dish pages display photos, descriptions, and reviews
- [ ] Search functionality works
- [ ] Admin panel is accessible at `/admin`
- [ ] Can submit a review (test anonymous comment)

### 3.2 Check Admin Features

1. Go to `https://your-site.vercel.app/admin`
2. Test:
   - [ ] View pending reviews
   - [ ] Approve a review
   - [ ] View restaurants
   - [ ] Edit a restaurant
   - [ ] Featured dishes management

### 3.3 Monitor Logs

In Vercel dashboard:
- Go to your project → Deployments → Latest
- Check "Functions" tab for any errors
- Monitor "Runtime Logs" for API issues

---

## Step 4: Set Up Custom Domain (Optional)

1. **Buy a domain** (e.g., bestdish.co.uk from Namecheap, Google Domains)

2. **Add to Vercel:**
   - Project → Settings → Domains
   - Add `bestdish.co.uk` and `www.bestdish.co.uk`

3. **Update DNS:**
   Add these records in your domain registrar:

   | Type | Name | Value |
   |------|------|-------|
   | A | @ | 76.76.21.21 |
   | CNAME | www | cname.vercel-dns.com |

4. **Wait for propagation** (5-30 minutes)

5. **Update Supabase Auth:**
   - Supabase Dashboard → Authentication → URL Configuration
   - Add `https://bestdish.co.uk` to allowed URLs

---

## Step 5: Enable Production Features

### 5.1 Set Up Analytics (Optional)

Vercel Analytics (free):
```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 5.2 Configure Caching

Update `next.config.ts`:
```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // Enable static generation for city/dish pages
  experimental: {
    staleTimes: {
      dynamic: 30, // 30 seconds
      static: 180, // 3 minutes
    },
  },
}
```

### 5.3 Add Sitemap Generation

Your app already has `/sitemap.xml/route.ts` - it will auto-generate!

Test: `https://your-site.vercel.app/sitemap.xml`

---

## Troubleshooting

### Build Errors

**Error:** `Can't find module '@prisma/client'`
- Solution: Ensure `vercel.json` has correct build command
- Check: `buildCommand: "npx prisma generate && next build"`

**Error:** `Database connection failed`
- Check DATABASE_URL environment variable
- Ensure Supabase allows connections from Vercel IPs
- Verify connection pooling is enabled (`?pgbouncer=true`)

### Runtime Errors

**Error:** `Supabase storage upload failed`
- Check SUPABASE_SERVICE_ROLE_KEY is set
- Verify storage bucket is public in Supabase dashboard
- Check bucket CORS settings

**Error:** `Gemini API quota exceeded`
- This is the known experimental model limit
- Upgrade to Google Cloud API key (not urgent for launch)
- Scraper isn't needed in production initially

### Performance Issues

**Slow page loads:**
- Enable Next.js caching (see step 5.2)
- Consider upgrading Supabase plan for better database performance
- Add CDN for images (Vercel does this automatically)

---

## Post-Launch Checklist

After successful deployment:

- [ ] Test site on mobile devices
- [ ] Test site on different browsers (Chrome, Safari, Firefox)
- [ ] Share link with friends for feedback
- [ ] Monitor Vercel logs for first 24 hours
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Add Google Analytics (optional)
- [ ] Submit sitemap to Google Search Console
- [ ] Create social media accounts
- [ ] Plan content strategy (Instagram integration)

---

## Need Help?

Common issues and solutions:

1. **Environment variables not working:**
   - Redeploy after adding env vars
   - Check for typos in variable names
   - Ensure `NEXT_PUBLIC_` prefix for client-side vars

2. **Images not loading:**
   - Check Supabase storage bucket is public
   - Verify `next.config.ts` has correct image domains

3. **Admin panel not accessible:**
   - Add basic auth or restrict to your IP
   - Consider adding authentication middleware

---

## Success Metrics to Track

After 1 week:

- Page views
- Unique visitors
- Most viewed dishes/cities
- User engagement (reviews submitted)
- Search queries
- Mobile vs desktop traffic

---

## Next Steps After Launch

1. **Content Growth:**
   - Add more cities (Liverpool, Edinburgh, Glasgow)
   - Scrape more dishes (aim for 50-100)
   - Encourage user reviews

2. **Feature Enhancements:**
   - Instagram automation (n8n)
   - Email newsletter signup
   - User accounts (optional)
   - Bookmark/save dishes
   - Share buttons for social media

3. **SEO Optimization:**
   - Submit to Google Search Console
   - Create blog content
   - Build backlinks
   - Optimize meta descriptions

4. **Marketing:**
   - Launch on Product Hunt
   - Share on Reddit (r/food, r/UKFood)
   - Reach out to food bloggers
   - Partner with restaurants

---

**You're ready to go live! 🚀**

Your current setup (27 dishes across 4 cities) is perfect for a v1 launch. Focus on getting real users and feedback before adding more complexity.

Good luck!

