# 🎯 Manchester 100 Dishes Plan

## Current Status

**Manchester Now:**
- 6 restaurants in database
- 6 published dishes
- **Need: 94 more dishes to reach 100**

---

## ⚠️ Blocker Found

**Google Places API Key Issue:**
- Status: `REQUEST_DENIED`
- Error: "The provided API key is invalid"
- **This blocks adding new restaurants**

### To Fix:
1. Check Google Cloud Console
2. Verify Places API is enabled
3. Check API key restrictions
4. May need to regenerate key

---

## Plan When API is Fixed

### Step 1: Add ~95 More Manchester Restaurants
Script ready: `scripts/manchester-to-100.ts`
- Fetches top-rated Manchester restaurants from Google Places
- Filters: Rating >= 4.0
- Adds up to 100 restaurants

### Step 2: Scrape Best Dishes
- AI analyzes reviews + articles
- Finds signature dishes
- Downloads & verifies photos
- **Quality filter: Only publishes with photo + description**

### Step 3: Cleanup & Verify
- Remove any incomplete entries
- Test on localhost
- Deploy to production

---

## Alternative Approach (If API Issues Persist)

### Manual Curation
Could manually add top Manchester restaurants from:
- Michelin Guide Manchester
- TimeOut Manchester
- The Guardian's Manchester restaurant guide
- Local food blogs

Then scrape their best dishes with AI (this part works - Gemini API is fine).

---

## What's Working

✅ **Development database:** Clean, 6 quality Manchester restaurants  
✅ **AI dish scraper:** Gemini API working perfectly  
✅ **Image scraper:** Google Image Search working  
✅ **Production deployment:** All fixed and live  
✅ **Quality filters:** In place (photo + description required)

❌ **Google Places API:** Needs attention

---

## When You're Back

### Fix Google Places API Key
1. **Go to:** https://console.cloud.google.com/apis/credentials
2. **Check:** Is Places API enabled for your project?
3. **Verify:** API key `AIzaSyDqDpwmGKt9uTnfOT1IFlxvvTxJFxlmZTc` has Places API access
4. **If not:** Create new key with Places API enabled
5. **Update:** `.env` and Vercel with new key

### Then Run Manchester Scraper
```bash
cd /Users/nate/Desktop/bestdish/bestdish
npx tsx scripts/manchester-to-100.ts
```

This will:
- Add ~95 new Manchester restaurants from Google
- Scrape their best dishes with AI
- Target 100 published dishes
- Estimated time: 45-90 minutes

---

## 🎉 What IS Working Right Now

✅ **Production:** https://bestdish.co.uk - LIVE!  
✅ **Development:** http://localhost:3000 - Ready!  
✅ **Database:** Fresh Supabase setup complete  
✅ **Images:** All migrated (28 images)  
✅ **Quality:** Only complete restaurants shown (26 total)  
✅ **UX:** Hero banners, black footer, all fixes applied

**Just need to fix Google API key to add more restaurants!** 🚀

