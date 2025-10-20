# Bulk Manchester Scraper Guide

## Overview

The bulk scraper finds the top 100 dishes in Manchester and creates them as **pending dishes** (without photos) in the admin panel. You can then manually add photos and Instagram handles before publishing.

## What Gets Scraped

### Included ✅
- **Dish name** - AI identifies the best dish at each restaurant
- **Restaurant name**
- **City** - Manchester
- **Description** - 150-200 word AI-generated critical appraisal
- **Restaurant details** - Address, website, cuisine
- **FAQs** - 5 AI-generated questions and answers
- **Editorial quotes** - Extracted from web sources with attribution
- **Instagram handle** - Only if 99% confident (multiple sources confirm)

### Excluded ❌
- **Photos** - Always null, you upload manually
- **Instagram handle** - Null unless AI finds high confidence

## Running the Scraper

### 1. Prerequisites

Make sure you have:
- Manchester city in your database (`slug: 'manchester'`)
- Environment variables set:
  - `GEMINI_API_KEY`
  - `GOOGLE_CUSTOM_SEARCH_API_KEY`
  - `GOOGLE_SEARCH_ENGINE_ID`

### 2. Run the Script

```bash
cd /Users/nate/Desktop/bestdish/bestdish
npx tsx scripts/scrape-manchester-100-pending.ts
```

### 3. What Happens

The script will:
1. Search Google for top Manchester restaurants (targeting ~100)
2. For each restaurant:
   - Search web for articles and reviews
   - AI analyzes content to identify best dish
   - Extract restaurant details (address, cuisine, website)
   - Generate description, FAQs, and quotes
   - Check Instagram handle confidence
   - Save as pending dish (`isBest: false`)

### 4. Progress Tracking

You'll see output like:

```
🚀 Starting Manchester bulk scraper...

✓ Found city: Manchester

🔍 Finding top 100 Manchester restaurants...
  Searching: "best restaurants Manchester 2024"
  ...
✓ Found 100 unique restaurants

📋 Processing 100 restaurants...

[1/100] 📍 Dishoom Manchester
  🔍 Searching web...
  ✓ Found 5 articles
  📱 Instagram: @dishoom (100% confidence)
  🤖 Analyzing with AI...
  ✓ Identified: Bacon Naan Roll
  💰 Price: £6.50
  🍽️  Cuisine: Indian
  ❓ Generating FAQs...
  ✓ Generated 5 FAQs
  🏪 Creating restaurant...
  💾 Creating pending dish...
  ✅ Created as pending dish

[2/100] 📍 Hawksmoor Manchester
  ...

📊 Progress: 10/100 | Success: 8 | Failed: 2
```

### 5. View Results

After running, go to:
- **Admin panel:** `https://bestdish.co.uk/admin/pending-dishes`
- Or local: `http://localhost:3000/admin/pending-dishes`

You'll see all scraped dishes waiting for photos.

## Curation Workflow

For each pending dish:

### 1. Review the Content
- Check the dish name makes sense
- Read the description
- Review FAQs
- Check if Instagram handle was captured

### 2. Add Photo
- Click "Upload Photo"
- Select a high-quality image
- Photo uploads to Supabase

### 3. Add/Update Instagram Handle (if needed)
- If confidence was <99%, handle will be null
- Go to Restaurant Management
- Add the Instagram handle manually

### 4. Publish
- Click "Publish to Website"
- Dish goes live (`isBest: true`)
- Appears on city page
- Triggers Instagram post (if Make.com webhook configured)

## Features

### Intelligent Instagram Detection

The scraper counts Instagram handle mentions across sources:
- **99%+ confidence** = Handle appears 4+ times → Saved automatically
- **<99% confidence** = Insufficient mentions → Left null for manual entry

### Duplicate Prevention

- Checks if restaurant exists (by slug)
- Checks if dish exists (by slug)
- Skips if dish already in database

### Error Handling

- Skips restaurants with no web content
- Skips if AI analysis fails
- Continues on errors (doesn't crash)
- Shows success/fail count at end

### Rate Limiting

- 2 second delay between restaurants
- 1 second delay between Google searches
- Prevents API rate limits

## Performance

**Expected Time:**
- ~200 seconds for 100 restaurants (with 2s delay)
- Plus AI processing time (~5-10s per dish)
- **Total:** ~30-45 minutes for full run

**Success Rate:**
- Expect 70-80% success rate
- Some restaurants won't have enough content
- AI might fail on ambiguous menus

## Customization

### Target Different City

Edit the script:

```typescript
const city = await prisma.city.findUnique({
  where: { slug: 'london' }  // Change city here
})
```

### Adjust Search Queries

Edit the `queries` array in `findTop100Restaurants()`:

```typescript
const queries = [
  'best restaurants Manchester 2024',
  'Michelin star Manchester',  // Add custom queries
  'hidden gems Manchester food'
]
```

### Change Instagram Confidence Threshold

Edit `extractInstagramHandle()`:

```typescript
return { 
  handle: confidence >= 90 ? `@${bestHandle}` : null,  // Lower threshold
  confidence 
}
```

## Troubleshooting

### "No articles found, skipping"
- Restaurant might not have online presence
- Try more specific search terms
- Normal for small/new restaurants

### "AI analysis failed"
- Gemini API might be rate limited
- Content might be too generic
- Check `GEMINI_API_KEY` is valid

### "Insufficient content"
- Less than 200 chars of scraped text
- Restaurant needs more web presence
- Normal for lesser-known places

### Script Hangs
- Check network connection
- Verify API keys are valid
- Try with smaller batch first

## Next Steps

After scraping:

1. **Review pending dishes** in admin panel
2. **Prioritize** high-quality restaurants
3. **Add photos** from Instagram or website
4. **Publish** best dishes first
5. **Monitor** which dishes get good engagement
6. **Delete** low-quality scraped dishes

## Tips

- Run during off-peak hours (AI API limits)
- Start with 10-20 restaurants to test
- Review first batch before running full 100
- Keep track of which need photos
- Use Make.com to auto-post to Instagram when published

## Statistics

After completion, you'll see:
```
✅ Scraping complete!
   Success: 75 dishes
   Failed: 25 restaurants

👉 View pending dishes at: /admin/pending-dishes
```

This gives you 75 high-quality dishes ready for curation!

