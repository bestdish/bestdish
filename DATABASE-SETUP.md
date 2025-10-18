# Database & Environment Setup

## Overview

BestDish uses **one Supabase project** for both development and production:

### Production Database (Single Source)
- **Project ID:** `yoeguahpdrtctrvaheer`
- **Purpose:** Both local development and live website
- **Bucket:** `dish-photos`
- **Used by:** Both `localhost:3000` and `bestdish.co.uk`

**Why Single Database?**
- With the new Curated Dish Tool, dishes are manually added one at a time
- No more bulk scraping that needs testing in isolation
- Eliminates sync complexity and data inconsistencies
- Same data visible on localhost and live site
- Supabase provides automatic backups for safety

## Environment Variables Setup

### `.env` File (Local Development)

Your `.env` file contains production credentials for both local and deployment:

```bash
# Production Database (used for everything)
DATABASE_URL=postgresql://postgres.yoeguahpdrtctrvaheer:...
NEXT_PUBLIC_SUPABASE_URL=https://yoeguahpdrtctrvaheer.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=changeme123

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Google Custom Search
GOOGLE_API_KEY=your-google-api-key
GOOGLE_CX=your-custom-search-engine-id

# Make.com Instagram Webhook
MAKE_WEBHOOK_URL=https://hook.us1.make.com/your-webhook-id

# App URL
NEXT_PUBLIC_URL=https://bestdish.co.uk
```

### How It Works

**When running locally (`npm run dev`):**
- Uses `DATABASE_URL` → Points to **production** database
- Changes are immediately visible on live site
- Use caution when testing destructive operations

**When deploying to Vercel:**
- Uses same environment variables from Vercel dashboard
- Points to **production** database
- Lives at bestdish.co.uk

**Important:** Local development and live site see the **same data**. Test carefully!

## Review Moderation Strategy

### Moderate Anywhere

Since both local and production use the same database:

1. **Local Admin Panel:**
   - Visit `http://localhost:3000/admin`
   - Moderate reviews
   - Changes are live immediately

2. **Production Admin Panel:**
   - Visit `https://bestdish.co.uk/admin`
   - Moderate reviews
   - Changes visible immediately

**Best Practice:** Use whichever is more convenient - they're identical!

## Image Storage

### Production Bucket (Only)
- URL: `https://yoeguahpdrtctrvaheer.supabase.co/storage/v1/object/public/dish-photos/`
- Used by: Both local development and live website
- Public bucket for dish and restaurant photos

## Instagram Auto-Posting

### Make.com Webhook

To enable automatic Instagram posting when you create dishes:

1. **Setup Make.com:**
   - Create a webhook trigger in your Make.com scenario
   - Copy the webhook URL (e.g., `https://hook.us1.make.com/abc123xyz`)

2. **Add to `.env`:**
   ```bash
   MAKE_WEBHOOK_URL=https://hook.us1.make.com/your-webhook-id
   ```

3. **How it works:**
   - When you create a dish via Curated Dish Tool
   - System sends webhook to Make.com with `dishId`
   - Make.com calls `/api/instagram/post-dish` to get formatted data
   - Make.com posts to Instagram automatically

See `INSTAGRAM-MAKE-WORKFLOW.md` for detailed setup instructions.

## Quick Reference

| Environment | Database | Supabase Project | Admin URL |
|------------|----------|------------------|-----------|
| Local Development | yoeguahpdrtctrvaheer | Production Project | http://localhost:3000/admin |
| Live Website | yoeguahpdrtctrvaheer | Production Project | https://bestdish.co.uk/admin |

**Note:** Both environments use the same database and storage.

## Troubleshooting

### "Cannot connect to database"
- Verify Supabase project is active
- Check `DATABASE_URL` credentials are correct
- Ensure IP is whitelisted in Supabase (if restricted)

### "Images not loading"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- Check `dish-photos` bucket exists and is public
- Ensure image files exist in Supabase storage

### "Admin login not persisting"
- Clear browser cookies for localhost
- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`
- Restart Next.js dev server after changing `.env`

### "Instagram webhook not firing"
- Check `MAKE_WEBHOOK_URL` is set in `.env`
- Verify webhook URL has no trailing slash
- Ensure Make.com scenario is active (ON)
- Restart Next.js server after adding env variable

### "Dish creation succeeds but Instagram doesn't post"
- Check Make.com scenario execution log
- Verify `/api/instagram/post-dish` endpoint is accessible
- Test API endpoint manually with curl (see INSTAGRAM-MAKE-WORKFLOW.md)

---

**Last Updated:** October 2025  
**Version:** 3.0 (Single Database + Instagram Integration)

