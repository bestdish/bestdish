# Bulk Manchester Scraper - Implementation Complete ✅

## What Was Built

A bulk scraper that finds the top 100 dishes in Manchester and saves them as **pending dishes** (without photos) for manual curation via the admin panel.

## Files Created

### 1. Main Scraper: `scripts/scrape-manchester-100-pending.ts`
- Finds top 100 Manchester restaurants via Google search
- For each restaurant:
  - AI identifies the best dish
  - Generates 150-200 word description
  - Creates editorial quotes from web sources
  - Generates 5 FAQs
  - Extracts restaurant details (address, website, cuisine)
  - Detects Instagram handle (only if 99% confident)
  - Saves as pending dish (`isBest: false, photoUrl: null`)

### 2. Test Scraper: `scripts/scrape-manchester-5-test.ts`
- Same functionality but only processes 5 restaurants
- Perfect for testing before running full batch
- Runs in ~5-10 minutes

### 3. Documentation: `BULK-SCRAPER-GUIDE.md`
- Complete usage instructions
- Troubleshooting guide
- Customization options
- Curation workflow

## How It Works

```
1. Google Search → Finds top 100 Manchester restaurants
   ↓
2. Web Scraping → Searches articles/reviews for each
   ↓
3. AI Analysis → Identifies best dish + generates content
   ↓
4. Extract Details → Restaurant info, quotes, FAQs
   ↓
5. Instagram Detection → Only saves if 99%+ confident
   ↓
6. Save as Pending → isBest: false, photoUrl: null
   ↓
7. Admin Panel → You add photo + publish
```

## Key Features

### 🎯 Smart Instagram Detection
- Counts handle mentions across multiple sources
- **99%+ confidence** (4+ mentions) → Saves automatically
- **<99% confidence** → Leaves null for manual entry

### ✅ Complete Curation Tool Output
- Same AI-generated description quality
- Editorial quotes with attribution
- 5 SEO-optimized FAQs
- Normalized cuisine categories
- All restaurant details

### 🚫 No Photos
- Skips photo download entirely
- Faster, more reliable
- You control image quality
- Upload manually from Instagram or restaurant website

### 🔄 Duplicate Prevention
- Checks if restaurant exists
- Checks if dish exists
- Skips existing dishes

### ⚡ Performance
- Rate limited (2s between restaurants)
- Error handling (continues on failures)
- Progress tracking every 10 dishes
- **~30-45 minutes** for full 100

## Running the Scrapers

### Test First (Recommended)
```bash
cd /Users/nate/Desktop/bestdish/bestdish
npx tsx scripts/scrape-manchester-5-test.ts
```
**Time:** ~5-10 minutes  
**Result:** 5 pending dishes to test workflow

### Full Run
```bash
npx tsx scripts/scrape-manchester-100-pending.ts
```
**Time:** ~30-45 minutes  
**Result:** ~70-80 pending dishes (expect some failures)

## Admin Workflow

After scraping, go to `/admin/pending-dishes`:

1. **Review** scraped content (description, quotes, FAQs)
2. **Upload photo** for each dish
3. **Add Instagram handle** (if confidence was <99%)
4. **Publish** to website → Sets `isBest: true`

### Existing Features (Already Built)
- ✅ Pending dishes list with search
- ✅ Photo upload functionality  
- ✅ Publish button
- ✅ Preview link
- ✅ Delete option
- ✅ Shows description, quotes, FAQs

## What Gets Scraped

| Data | Included | Manual |
|------|----------|--------|
| Dish Name | ✅ AI identifies | - |
| Description | ✅ 150-200 words | - |
| Restaurant Name | ✅ From search | - |
| Restaurant Address | ✅ From web | - |
| Restaurant Website | ✅ From web | - |
| Cuisine | ✅ Normalized | - |
| Editorial Quotes | ✅ With source | - |
| FAQs | ✅ 5 items | - |
| Instagram Handle | ✅ If 99% confident | ❌ Otherwise manual |
| Dish Photo | ❌ Always null | ✅ Manual upload |

## Example Output

```
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
```

## Success Metrics

### Expected Results

- **Success Rate:** 70-80% of restaurants
- **Typical Output:** 70-80 pending dishes from 100 attempts
- **Failures:** 20-30 restaurants (no content, AI errors)

### What Causes Failures

- Restaurant has minimal online presence
- AI can't identify specific dish from content
- Generic menu with no standout items
- Website/articles are too vague

## Next Steps

1. **Test with 5 dishes** first
2. **Review output** in admin panel
3. **Add photos** to test dishes
4. **Publish** a few to verify workflow
5. **Run full scraper** (100 dishes)
6. **Batch curate** - prioritize high-quality restaurants
7. **Monitor engagement** - see which dishes perform well

## Customization

### Different City

Edit script, change:
```typescript
const city = await prisma.city.findUnique({
  where: { slug: 'london' }  // Change here
})
```

### Instagram Threshold

Lower the confidence requirement:
```typescript
return { 
  handle: confidence >= 90 ? `@${bestHandle}` : null,  // Was 99
  confidence 
}
```

### More/Fewer Dishes

Change target in main script:
```typescript
return restaurants.slice(0, 200)  // Was 100
```

## Benefits

✅ **Bulk creation** - 100 dishes in one run  
✅ **High quality** - Same AI output as curation tool  
✅ **Manual control** - You choose photos  
✅ **Flexible** - Publish when ready  
✅ **SEO optimized** - FAQs, quotes, descriptions  
✅ **Smart Instagram** - Only high-confidence handles  
✅ **Fast workflow** - No manual research per dish  

## Integration with Make.com

When you publish a pending dish:
- Dish status changes to `isBest: true`
- If `MAKE_WEBHOOK_URL` is set, triggers Instagram post
- Make.com fetches dish data from `/api/instagram/post-dish`
- Auto-posts to Instagram with your caption template

Perfect for batch publishing your curated dishes! 🚀

## Maintenance

### Add More Search Queries

Edit `findTop100Restaurants()` in the main script:
```typescript
const queries = [
  'best restaurants Manchester 2024',
  'Michelin Manchester',  // Add custom queries
  'hidden gems Manchester'
]
```

### Update AI Prompts

The script uses existing AI functions:
- `analyzeDishContent()` - In `lib/scraper/ai-analyzer.ts`
- `generateFAQs()` - In `lib/scraper/ai-analyzer.ts`

Modify those files to change AI behavior globally.

---

**Ready to run?** Start with the test scraper:
```bash
npx tsx scripts/scrape-manchester-5-test.ts
```



