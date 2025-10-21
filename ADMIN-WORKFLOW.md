# Admin Workflow & Database Sync Guide

## Overview

This document outlines the workflow for managing BestDish content, particularly focusing on review moderation and database synchronization between production and development environments.

## Database Architecture

### Two-Environment Setup

We maintain two separate databases:

1. **Production Database** (`PROD_DATABASE_URL`)
   - Live user data
   - Public-facing content
   - User-submitted reviews
   - Active at bestdish.uk

2. **Development Database** (`DEV_DATABASE_URL`)
   - Local testing environment
   - Safe experimentation
   - Synced daily from production
   - Running on localhost:3000

### Why Two Databases?

- **Safety**: Test changes without affecting live users
- **Development**: Build new features with realistic data
- **Rollback**: Easy recovery if something goes wrong
- **Performance**: Test queries without impacting production

## Automated Database Sync

### Daily Synchronization

A GitHub Actions workflow runs **daily at 3 AM UTC** to sync production data to development:

```yaml
Production → Development (One-way sync)
- Cities
- Restaurants  
- Dishes
- Reviews (including pending reviews)
- Images
```

### Content Deployment (Manual)

When you want to deploy new content from development to production:

```bash
npx tsx scripts/sync-dev-to-prod.ts
```

This safely syncs:
- ✅ Cities, Restaurants, Dishes
- ✅ Images
- ✅ **Preserves production user reviews**

### Manual Sync

You can also trigger a sync manually:

```bash
# From the bestdish directory
cd /Users/nate/Desktop/bestdish/bestdish
npx tsx scripts/auto-sync-prod-to-dev.ts
```

Or use GitHub Actions:
1. Go to Actions tab on GitHub
2. Select "Daily Database Sync"
3. Click "Run workflow"

### Sync Logs

Logs are stored in `/logs/sync-prod-to-dev-*.log` and include:
- Start/end timestamps
- Number of records synced
- Any errors or warnings
- Image sync status

## Review Moderation Workflow

### Where to Moderate Reviews

You have two options for moderating user-submitted reviews:

#### Option 1: Production (Recommended for immediate action)

**Pros:**
- Changes are immediately live
- Users see approved reviews right away
- No sync needed

**Cons:**
- No undo (be careful!)
- Working with live data

**When to use:**
- Daily review moderation
- Time-sensitive content
- Immediate user feedback needed

**Steps:**
1. Access production admin: `https://bestdish.uk/admin`
2. Navigate to "Review Moderation"
3. Approve or reject reviews
4. Changes are live immediately

#### Option 2: Development (Testing/Training)

**Pros:**
- Safe environment
- Can test moderation interface
- No impact on live site

**Cons:**
- Changes won't appear on live site
- Requires daily sync to see new reviews
- Better for learning the interface

**When to use:**
- Training new moderators
- Testing moderation features
- Experimenting with workflows

**Steps:**
1. Run a manual sync to get latest reviews
2. Access dev admin: `http://localhost:3000/admin`
3. Navigate to "Review Moderation"
4. Practice moderating reviews

### Best Practice: Moderate in Production

**Recommended workflow:**
1. Check production admin daily
2. Moderate new reviews immediately
3. Development database will sync overnight automatically
4. Use dev environment for testing new features only

## Admin Section Features

### Dashboard
- Overview of all content statistics
- Quick actions for pending reviews and images
- Real-time counts

### Dish Management
- Add/edit restaurants and their signature dishes
- Upload dish photos
- Manage dish information and descriptions

### City Management
- Update city photos for homepage
- Manage city information
- View restaurants per city

### Review Moderation
- Approve or reject user comments
- View dish and restaurant context
- See submission timestamps

### Featured Dishes
- Mark dishes to appear in "Featured" section on homepage
- Toggle featured status
- See current featured count

### Pending Dishes
- Upload photos for dishes without images
- Preview dishes before publishing
- Publish dishes to live site

## Safety & Permissions

### Admin Authentication

The admin panel is protected by HTTP Basic Auth + session cookies:
- First visit: Username/password prompt
- After login: 8-hour session cookie
- No re-authentication needed during session

### Data Safety

**Production:**
- ⚠️ All changes are permanent
- ❌ No automatic backups (use manual exports)
- ✅ Audit logs available

**Development:**
- ✅ Safe to experiment
- ✅ Wiped daily during sync
- ✅ No impact on users

## Troubleshooting

### Sync Issues

If sync fails:
1. Check GitHub Actions logs
2. Verify environment variables are set
3. Check database connectivity
4. Review error logs in `/logs/`

### Review Moderation

If reviews aren't appearing:
1. Confirm user submitted review successfully
2. Check it's marked as `approved: false`
3. Verify database connection
4. Check API endpoints are working

### Image Upload Issues

If images aren't uploading:
1. Check Supabase storage bucket permissions
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Check file size limits
4. Review browser console for errors

## Environment Variables

### Production
```
PROD_DATABASE_URL=postgresql://...
PROD_SUPABASE_URL=https://...
PROD_SUPABASE_SERVICE_ROLE_KEY=...
```

### Development
```
DEV_DATABASE_URL=postgresql://...
DEV_SUPABASE_URL=https://...
DEV_SUPABASE_SERVICE_ROLE_KEY=...
```

### Admin Auth
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=...
```

## Support & Questions

For issues or questions:
1. Check this documentation first
2. Review logs in `/logs/`
3. Check GitHub Actions for sync status
4. Contact technical team

---

**Last Updated:** October 2025
**Version:** 1.0

