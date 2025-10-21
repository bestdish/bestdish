# Single Production Database Migration Plan

## Overview

Consolidate to using **only the production Supabase database** (`yoeguahpdrtctrvaheer`) for both local development and live production, eliminating the development database entirely.

## Why This Makes Sense Now

✅ **Curated Dish Tool** - Reliable, manual workflow replaces error-prone scrapers  
✅ **Quality Over Quantity** - Building library carefully, not bulk importing  
✅ **Simpler** - No sync complexity, no duplicate infrastructure  
✅ **Immediate** - Changes visible instantly on both local and live  

## Current State

**Development Database:** `brwejqxzcpjxmxxagbtp`  
**Production Database:** `yoeguahpdrtctrvaheer`  

Both currently configured in `.env` file

## Target State

**Single Database:** `yoeguahpdrtctrvaheer` (production only)  
**Both environments use:** Same database, same photo bucket  

## Step-by-Step Migration

### PHASE 1: Pre-Migration Safety (Backups & Verification)

#### 1.1 Export Production Database
```bash
cd /Users/nate/Desktop/bestdish/bestdish
npx tsx scripts/export-production.ts
```
Creates: `exports/production-backup-[timestamp].json`

#### 1.2 Verify Supabase Backups
- Login to Supabase dashboard
- Check Settings → Database → Backups
- Confirm Point-in-Time Recovery enabled
- Note: Supabase keeps 7 days of backups automatically

#### 1.3 Document Current State
- List all current restaurants
- List all current dishes
- Count reviews
- Save for reference

### PHASE 2: Comprehensive Code Scan (100+ Checks)

#### 2.1 Scan for Dev Database References
Will check EVERY file for:
- `DEV_DATABASE_URL`
- `DEV_SUPABASE_URL`  
- `DEV_SUPABASE_SERVICE_ROLE_KEY`
- `brwejqxzcpjxmxxagbtp` (dev project ID)
- Development database references

Locations to check:
- `app/` directory (all pages, API routes)
- `lib/` directory (all utilities)
- `components/` directory
- `scripts/` directory
- `middleware.ts`
- `.env` file
- Documentation files
- Any config files

#### 2.2 Scan for Hardcoded URLs
Check for any hardcoded references to:
- Development Supabase URL
- Development bucket paths
- Development database connection strings

#### 2.3 Verify All Uses Are Via Environment Variables
Confirm that ALL database/storage access uses:
- `process.env.DATABASE_URL` (not `DEV_DATABASE_URL`)
- `process.env.NEXT_PUBLIC_SUPABASE_URL` (not `DEV_SUPABASE_URL`)
- `process.env.SUPABASE_SERVICE_ROLE_KEY` (not `DEV_SUPABASE_SERVICE_ROLE_KEY`)

### PHASE 3: Update Configuration

#### 3.1 Update `.env` File
```bash
# Remove these lines:
DEV_DATABASE_URL=...
DEV_SUPABASE_URL=...
DEV_SUPABASE_SERVICE_ROLE_KEY=...
PROD_DATABASE_URL=...
PROD_SUPABASE_URL=...
PROD_SUPABASE_SERVICE_ROLE_KEY=...

# Replace with single production config:
DATABASE_URL=postgresql://postgres.yoeguahpdrtctrvaheer:C8uy578mOyl7TA9p@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:C8uy578mOyl7TA9p@db.yoeguahpdrtctrvaheer.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://yoeguahpdrtctrvaheer.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production anon key]
SUPABASE_SERVICE_ROLE_KEY=[production service role key]
```

#### 3.2 Update Documentation Files
- `env-local-development.txt` - Document production-only approach
- `env-production-vercel.txt` - Keep as-is (already production)
- `DATABASE-SETUP.md` - Remove two-database sections
- `ADMIN-WORKFLOW.md` - Remove sync workflows

#### 3.3 Delete Sync Scripts
Remove these files entirely:
- `scripts/sync-prod-to-dev.ts`
- `scripts/sync-dev-to-prod.ts`
- `scripts/auto-sync-prod-to-dev.ts`
- `.github/workflows/daily-sync.yml`

### PHASE 4: Restart & Test Locally (50+ Tests)

#### 4.1 Restart Dev Server
- Kill current server
- Delete `.next` cache
- Start fresh with new environment

#### 4.2 Test All Features Locally
- [ ] Homepage loads correctly
- [ ] City pages load
- [ ] Restaurant pages load  
- [ ] Dish pages load
- [ ] Images display correctly
- [ ] Search works
- [ ] Admin login works
- [ ] Admin dashboard loads
- [ ] City Management works
- [ ] Dish Management works
- [ ] Review Moderation works
- [ ] Featured Dishes works
- [ ] Pending Dishes works
- [ ] **Curated Dish Tool works**
- [ ] Can create new dish
- [ ] Instagram photo extraction works
- [ ] Dish appears immediately
- [ ] Review submission works
- [ ] Navigation works

#### 4.3 Verify Database Connection
- Check logs for database connection
- Confirm connecting to `yoeguahpdrtctrvaheer`
- Verify NO attempts to connect to `brwejqxzcpjxmxxagbtp`

#### 4.4 Verify Image Storage
- Upload test image
- Check Supabase dashboard - should appear in PRODUCTION bucket
- Verify image displays on page
- Check image URL in source - should be production URL

### PHASE 5: Production Deployment Test

#### 5.1 Deploy to Vercel
- Push code changes
- Verify Vercel build succeeds
- Check Vercel environment variables match

#### 5.2 Test Live Site
- [ ] Live site loads (bestdish.co.uk)
- [ ] Can browse dishes
- [ ] Images display
- [ ] Search works
- [ ] Admin works on live site
- [ ] Creating dish on local appears on live immediately
- [ ] Creating dish on live appears on local immediately

### PHASE 6: Cross-Environment Verification

#### 6.1 Data Consistency Test
1. Create test dish locally
2. Verify appears on live site immediately
3. Update dish on live site
4. Verify update visible locally immediately
5. Delete test dish
6. Confirm deletion on both environments

This proves both are using the SAME database.

#### 6.2 Image Consistency Test
1. Upload image locally
2. Check Supabase production bucket
3. Verify image visible on live site
4. Confirm image URL is production URL

### PHASE 7: Final Verification Scan

#### 7.1 Grep Entire Codebase Again
- Search for `brwejqxzcpjxmxxagbtp` - should find ZERO results
- Search for `DEV_DATABASE` - should find ZERO results in code
- Search for `DEV_SUPABASE` - should find ZERO results in code
- Only mentions should be in backup files or git history

#### 7.2 Check All Import Statements
- Verify no imports of deleted sync scripts
- Check for broken references
- Verify all imports resolve

#### 7.3 Build Verification
- Run `npm run build` (if possible)
- Check for any build errors
- Verify no missing dependencies

### PHASE 8: Safety Confirmation

Only after ALL above checks pass:

✅ **Safe to Delete Dev Supabase Project**

You can then:
1. Login to Supabase dashboard
2. Navigate to dev project (`brwejqxzcpjxmxxagbtp`)
3. Delete `dish-photos` bucket
4. Delete entire project
5. No impact on your application

## Post-Migration: Fresh Start

### Clear Production Database
```bash
npx tsx scripts/clear-database.ts
```

### Seed Cities
```bash
npx tsx scripts/seed-cities.ts
```

### Start Curating
Use `/admin/curated-dish` to add dishes one by one

## Rollback Plan (If Issues Found)

If any verification fails:

1. **Stop immediately**
2. **Restore `.env` to two-database config**
3. **Restart dev server**
4. **Fix issues**
5. **Retry migration**

## Verification Commands

I will run these checks:
```bash
# Count dev database references
grep -r "DEV_DATABASE_URL" app/ lib/ components/ scripts/ | wc -l

# Find dev project ID references  
grep -r "brwejqxzcpjxmxxagbtp" app/ lib/ components/ | wc -l

# Check for dev Supabase URL
grep -r "DEV_SUPABASE" app/ lib/ components/ scripts/ | wc -l

# Verify production is used
grep -r "yoeguahpdrtctrvaheer" .env

# Check image upload logic
grep -r "dish-photos" lib/ app/api/

# And 100+ more checks...
```

## Success Criteria

Migration is successful when:

1. ✅ Zero references to dev database in active code
2. ✅ All features work locally
3. ✅ All features work on production
4. ✅ Local and production show identical data
5. ✅ Images work on both environments
6. ✅ No errors in logs
7. ✅ Test dish creation works end-to-end
8. ✅ Vercel deployment verified

**Only then** is it safe to delete the dev Supabase project.

---

Ready to proceed when you confirm!

