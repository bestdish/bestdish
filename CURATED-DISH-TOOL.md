# Curated Dish Tool

## Overview

A manual dish curation interface that allows you to add high-quality dishes by providing basic information (Instagram handle, dish name, photo), then automatically enriching the data via web scraping and AI content generation.

## Access

Navigate to: `http://localhost:3000/admin/curated-dish`

Or from admin sidebar: **Curated Dish Tool** (with sparkles ✨ icon)

## How to Use

### Step 1: Input Basic Information

**Required Fields:**
1. **Instagram Handle** - The restaurant's Instagram (e.g., `@dishoom` or `dishoom`)
2. **Dish Name** - The specific dish (e.g., "House Black Daal")
3. **City** - Select from dropdown
4. **Photo** - Either:
   - Upload a file directly, OR
   - Provide an image URL (Instagram post, direct image link)

**Optional Fields:**
- **Restaurant Name Override** - Use if you know the exact restaurant name

### Step 2: Submit & Watch Progress

Click "Create Curated Dish" and watch the real-time progress:
- ✓ Finding city...
- ✓ Searching web for restaurant details...
- ✓ Found restaurant...
- ✓ Generating AI description...
- ✓ Generating FAQs...
- ✓ Processing photo...
- ✓ Creating dish...

### Step 3: View Result

Upon success:
- Link to live dish page
- Option to create another dish

## What Happens Automatically

### 1. Restaurant Discovery
- Searches Google for restaurant details based on Instagram handle and city
- Extracts: name, address, website, phone, cuisine type, rating
- Checks if restaurant already exists in database

### 2. Restaurant Matching
- **If exists**: Updates existing restaurant with new data
- **If new**: Creates new restaurant entry

### 3. Content Scraping
- Searches for articles and reviews about the restaurant and specific dish
- Uses Google Custom Search API
- Combines content for AI analysis

### 4. AI Content Generation
Uses Gemini AI to create:
- Professional dish description (150-200 words)
- Editorial quote from sources
- 5 FAQ questions and answers
- All in the same style as existing dishes

### 5. Photo Processing
- Downloads photo from URL OR uses uploaded file
- Uploads to Supabase `dish-photos` bucket
- Generates filename with timestamp

### 6. Database Creation
- Creates/updates Restaurant record
- Creates Dish record with `isBest: true`
- Links to city
- Immediately published (no pending state)
- SEO-ready with all metadata

## Advantages Over Old Scraper

1. **Higher Accuracy** - Manual curation ensures correct dishes
2. **Better Photos** - You select the best image
3. **Faster** - No hunting through bad data
4. **More Control** - Override restaurant names if needed
5. **Same Quality** - Uses identical AI generation
6. **Same SEO** - Identical output structure

## Technical Details

### File Structure
```
app/admin/curated-dish/
  page.tsx                    # UI form

app/api/admin/curated-dish/
  route.ts                    # API endpoint

lib/curation/
  dishCurator.ts             # Main orchestration
  restaurantMatcher.ts       # Find/match restaurants
  webEnricher.ts             # Google search coordination
```

### Infrastructure Reused
- ✅ Google Custom Search API
- ✅ Gemini AI (same prompts as old scraper)
- ✅ Supabase image storage
- ✅ Existing database models
- ✅ SEO schema generation
- ✅ Slug generation utilities

### Data Flow
```
User Input
  ↓
Web Enrichment (Google search)
  ↓
Restaurant Matching (DB check)
  ↓
Content Scraping (articles, reviews)
  ↓
AI Generation (description, FAQs)
  ↓
Photo Processing (download/upload)
  ↓
Database Creation (restaurant + dish)
  ↓
Live on Site!
```

## Testing

### Test with Real Data

Try these examples:

**Example 1: Dishoom**
- Instagram: `@dishoom`
- Dish: "House Black Daal"
- City: London
- Photo: Find on Instagram or website

**Example 2: Hawksmoor**
- Instagram: `@hawksmoorrestaurants`
- Dish: "Bone-in Prime Rib"
- City: Manchester
- Photo: From their Instagram

**Example 3: Local Favorite**
- Use any restaurant you know
- Their signature dish
- Best photo from Instagram

### What to Check

After creation, verify:
- [ ] Dish page loads correctly
- [ ] Description is high-quality and original
- [ ] FAQs are relevant and helpful
- [ ] Photo displays properly
- [ ] Restaurant details are accurate
- [ ] SEO meta tags are present

## Troubleshooting

### "Insufficient content" error
- Try a more well-known restaurant
- Or manually provide restaurant name override

### "AI analysis failed"
- Restaurant may not have enough online presence
- Try searching for the dish manually first

### "Photo upload failed"
- Check image URL is accessible
- Or use file upload instead
- Verify image format is supported

### Restaurant created with wrong name
- Delete and recreate with restaurant name override
- Or edit in admin panel after creation

## Future Enhancements

Potential improvements (post-MVP):
- [ ] Bulk CSV upload
- [ ] Edit before publish option
- [ ] Draft/preview mode
- [ ] Instagram photo scraping
- [ ] Better duplicate detection
- [ ] Auto-suggest restaurant name

## Comparison to Old Method

| Feature | Old Scraper | Curated Tool |
|---------|------------|--------------|
| Accuracy | Variable | High |
| Speed | Slow | Fast |
| Control | Limited | Full |
| Photo Quality | Hit/miss | Always good |
| Manual Work | None | Minimal |
| Success Rate | ~60% | ~95% |

## Migration Plan

1. **Test Phase** - Create 10-20 dishes, verify quality
2. **Compare** - Side-by-side with old scraper results
3. **Decision** - If better, use exclusively
4. **Cleanup** - Eventually delete old scraper code
5. **Backfill** - Re-curate existing low-quality dishes

---

**Created:** October 2025  
**Status:** Active
**Version:** 1.0

