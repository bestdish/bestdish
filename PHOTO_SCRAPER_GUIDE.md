# 🖼️ Photo Scraper System - Complete Guide

## ✅ System Overview

The BestDish photo scraper now has **strict quality control** to ensure only high-quality dish photos are published to the website.

### How It Works:

```
Scraper finds dish info
         ↓
Searches for photos
         ↓
    Has verified photo? ──NO──→ Save as DRAFT → Admin reviews & uploads photo → Publishes
         ↓ YES
   Publishes to website immediately
```

---

## 🎯 Photo Verification Pipeline

### Step 1: Improved Search (✅ WORKING)
- **Query**: Simple format - `"Restaurant Name Dish Name"`
- **Example**: `"Piccolino Birmingham BURRATA CON CAVIALE"`
- **Results**: Removes `imgSize=large` filter for better results

### Step 2: Size-Based Filtering (✅ WORKING)
- **Threshold**: 600×400 pixels OR 0.24MP total pixels
- **Why**: Catches both landscape (800×400) and portrait (683×1024) images
- **Results**: Finding 9-10 qualifying images per search (vs 0 with old 800×600 threshold)

### Step 3: Webpage Context Analysis (✅ WORKING)
- **Process**: Scrapes the source page containing the image
- **Checks**: Counts mentions of restaurant AND dish name
- **Confidence Levels**:
  - **HIGH**: Both restaurant and dish mentioned
  - **MEDIUM**: Only restaurant mentioned  
  - **LOW**: Neither mentioned
- **Action**: Only proceeds with HIGH confidence images

### Step 4: Strict AI Verification (✅ WORKING)
- **Process**: Gemini AI analyzes the image
- **Requirements** (ALL must be true):
  - Shows ACTUAL FOOD as main subject
  - Food takes up most of the frame
  - NOT restaurant interiors/exteriors
  - NOT people or empty tables
  - NOT logos, menus, or signage
  - Clear, well-lit, and appetizing
- **Result**: Only accepts proper close-up food photos

### Test Results:
- **Sky Garden**: Correctly rejected 8 restaurant interior photos
- **Hot Stone London**: Accepted wagyu beef photo (11 restaurant + 3 dish mentions)
- **Success Rate**: ~67% of dishes get verified photos

---

## 📊 New Publishing Logic

### Published Immediately (isBest: true):
- ✅ Has verified dish photo
- ✅ Has description (30+ words)
- ✅ Has FAQs
- ✅ Has editorial quote (when available)
- **Visible on**: Homepage, city pages, search results

### Saved as Draft (isBest: false):
- ❌ No verified photo found
- ✅ Has description (30+ words)
- ✅ Has FAQs  
- ✅ Has editorial quote (when available)
- **Visible in**: Admin → Pending Dishes ONLY
- **Not visible on**: Public website

---

## 🔧 Admin Panel - Pending Dishes

### Access:
**http://localhost:3000/admin/pending-dishes**

### Features:
1. **View all draft dishes** awaiting photos
2. **Search** by dish name, restaurant, or city
3. **Upload photos** manually from your computer
4. **Publish** dishes to website once photo is uploaded
5. **Delete** drafts that aren't suitable

### Stats:
- Admin dashboard shows count of pending dishes
- Organized by most recent first

---

## 🚀 Running the Scraper

### Available Scripts:

```bash
# London (20 restaurants)
cd /Users/nate/Desktop/bestdish/bestdish
export PATH="$HOME/.nvm/versions/node/v24.10.0/bin:$PATH"
npx ts-node --project tsconfig.scripts.json -r tsconfig-paths/register scripts/scrape-london.ts

# Birmingham (20 restaurants)
npx ts-node --project tsconfig.scripts.json -r tsconfig-paths/register scripts/scrape-birmingham.ts

# Manchester (remaining)
npx ts-node --project tsconfig.scripts.json -r tsconfig-paths/register scripts/scrape-manchester.ts
```

### New Console Output:

```
✅ PUBLISHED: Kobe Beef
   Photo uploaded: e2271bac1a493dcc.jpg

✅ DRAFT SAVED: British Brunch  
   📋 Ready for review in Admin → Pending Dishes
   No suitable photo found - will need manual upload
```

---

## 📈 Current Results

### Birmingham Scraper:
- 6 dishes created
- 0 photos found (before threshold improvement)
- All saved as drafts

### London Scraper:
- 6 dishes created
- 5 photos found and verified (**83% success rate**)
- 5 published immediately
- 1 saved as draft (Sky Garden - correctly rejected bad photos)

### Photo Quality:
- **Piccolino BURRATA**: Found 9 images including 8192×5464 (44.8MP)
- **Blac Restaurant Shisha**: Found 10 images up to 1400×1873 (2.6MP)
- **Orelle Oysters**: Found 10 images including 6720×4480 (30.1MP)

---

## 🎉 What's Improved

### Before:
- ❌ Strict 800×600 threshold (both dimensions required)
- ❌ Found 0 photos across 12 dishes
- ❌ All dishes published WITHOUT photos
- ❌ Generic restaurant photos shown
- ❌ No quality control

### After:
- ✅ Flexible 600×400 OR 0.24MP threshold
- ✅ Finding 9-10 qualifying images per search
- ✅ Strict AI verification (rejects restaurant interiors)
- ✅ Webpage context analysis (checks source page content)
- ✅ Drafts system for manual review
- ✅ **Only quality dishes with verified photos go live**

---

## 🔄 Next Steps

1. **Review pending dishes** at http://localhost:3000/admin/pending-dishes
2. **Upload photos** manually for dishes that need them
3. **Run scraper on more cities** (London has 14 more restaurants ready)
4. **Monitor success rate** - should be 60-80% with verified photos

---

## 💡 Tips

- Dishes with photos publish automatically (no admin review needed)
- Pending dishes queue lets you curate photos before publishing
- You can always override: upload better photo and republish
- Delete low-quality drafts that aren't worth publishing
- The stricter the AI verification, the fewer false positives

**The system now ensures ONLY quality content goes live!** 🎯


