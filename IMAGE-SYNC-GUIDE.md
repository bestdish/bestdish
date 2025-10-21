# 📸 Image Sync Guide

## Overview

Both sync scripts now handle **database AND images** automatically! When you sync between dev and prod, images in Supabase Storage are copied along with the database records.

---

## 🔧 Required Environment Variables

### For Dev → Prod Sync (sync-dev-to-prod.ts)

You need these environment variables:

```bash
# Development (source)
DEV_DATABASE_URL="postgresql://..."
DEV_SUPABASE_URL="https://yourdevproject.supabase.co"
DEV_SUPABASE_SERVICE_ROLE_KEY="your-dev-service-role-key"

# Production (destination)
PROD_DATABASE_URL="postgresql://..."
PROD_SUPABASE_URL="https://yourprodproject.supabase.co"
PROD_SUPABASE_SERVICE_ROLE_KEY="your-prod-service-role-key"
```

### For Prod → Dev Sync (sync-prod-to-dev.ts)

Same variables as above!

---

## 🚀 How to Use

### Sync Dev → Prod (Deploy)

```bash
cd /Users/nate/Desktop/bestdish/bestdish

# Set all environment variables
export DEV_DATABASE_URL="..."
export DEV_SUPABASE_URL="..."
export DEV_SUPABASE_SERVICE_ROLE_KEY="..."
export PROD_DATABASE_URL="..."
export PROD_SUPABASE_URL="..."
export PROD_SUPABASE_SERVICE_ROLE_KEY="..."

# Run deploy
npx tsx scripts/sync-dev-to-prod.ts
```

### Sync Prod → Dev (Testing)

```bash
cd /Users/nate/Desktop/bestdish/bestdish

# Set all environment variables (same as above)
export DEV_DATABASE_URL="..."
export DEV_SUPABASE_URL="..."
export DEV_SUPABASE_SERVICE_ROLE_KEY="..."
export PROD_DATABASE_URL="..."
export PROD_SUPABASE_URL="..."
export PROD_SUPABASE_SERVICE_ROLE_KEY="..."

# Run sync
npx tsx scripts/sync-prod-to-dev.ts
```

---

## 📋 What Gets Synced

### Database Records
- ✅ Cities
- ✅ Restaurants
- ✅ Dishes
- ✅ Reviews

### Images
- ✅ City photos
- ✅ Restaurant photos
- ✅ Dish photos

All images are copied from the `dish-photos` bucket in the source Supabase project to the destination Supabase project.

---

## 🎯 Smart Features

### Duplicate Detection
- Script checks if image already exists in destination
- Skips images that are already synced
- Reports: synced, skipped, and failed counts

### Error Handling
- Continues syncing even if individual images fail
- Shows detailed error messages for failed images
- Database sync completes even if some images fail

---

## 🔍 Finding Your Service Role Keys

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Find the **service_role** key (NOT the anon key!)
4. **⚠️ Keep this secret!** Don't commit it to git

---

## ✅ Example Output

```
🚀 Deploying Development → Production
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  WARNING: This will REPLACE all production data with dev data!

Waiting 5 seconds... (Ctrl+C to cancel)

📊 Current Production:
   0 cities, 0 restaurants, 0 dishes, 0 reviews

🗑️  Clearing production database...
  ✅ Cleared

📍 Copying cities...
  ✅ Copied 3 cities

🍽️  Copying restaurants...
  ✅ Copied 22 restaurants

🍕 Copying dishes...
  ✅ Copied 22 dishes

⭐ Copying reviews...
  ✅ Copied 0 reviews

📸 Syncing images from dev → prod...
  ✅ Synced 22 images, skipped 0 (already exist), failed 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ DEPLOYMENT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Before:
   0 cities, 0 restaurants, 0 dishes

📊 After:
   3 cities, 22 restaurants, 22 dishes

🎉 Production is now updated with development data!
🌐 Live at: https://bestdish.co.uk
```

---

## 🆘 Troubleshooting

### "Missing Supabase admin credentials"
- Make sure you've exported the `*_SUPABASE_URL` and `*_SUPABASE_SERVICE_ROLE_KEY` variables
- Check spelling of environment variable names

### "Failed to download [image]"
- Image might not exist in source bucket
- Check if the image path in the database is correct
- Verify source Supabase credentials

### "Failed to upload [image]"
- Check destination Supabase credentials
- Verify the `dish-photos` bucket exists in destination
- Make sure bucket permissions allow service role access

---

**You're all set!** 🎉

When you ask me to "sync dev to prod" or "sync prod to dev", I'll run the appropriate script with both database AND images synced automatically!

