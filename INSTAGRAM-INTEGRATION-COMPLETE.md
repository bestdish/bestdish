# Instagram Auto-Post Integration - Complete ✅

## What's Been Implemented

Your Curated Dish Tool now automatically triggers Instagram posting whenever you create a new dish!

### How It Works

```
1. You create a dish in Curated Dish Tool
   ↓
2. Dish is saved to database (isBest: true, isFeatured: optional)
   ↓
3. System sends webhook to Make.com with dishId
   ↓
4. Make.com receives webhook and fetches dish data
   ↓
5. Make.com downloads dish and restaurant photos
   ↓
6. Make.com posts carousel to Instagram
   ↓
7. Done! Your dish is live on Instagram
```

## Files Created/Updated

### 1. New API Endpoint: `/app/api/instagram/post-dish/route.ts`

**Purpose:** Provides formatted Instagram data for a specific dish

**Endpoint:** `POST https://bestdish.co.uk/api/instagram/post-dish`

**Request:**
```json
{
  "dishId": "cmgt123abc456"
}
```

**Response:**
```json
{
  "dishName": "Afternoon Tea",
  "restaurantName": "Betty's",
  "restaurantInstagram": "@bettys_yorkshire",
  "description": "The afternoon tea at Betty's transcends expectation...",
  "editorialQuote": "Betty's afternoon tea is legendary...",
  "price": 25.00,
  "dishPhotoUrl": "https://yoeguahpdrtctrvaheer.supabase.co/storage/v1/object/public/dish-photos/...",
  "restaurantPhotoUrl": "https://yoeguahpdrtctrvaheer.supabase.co/storage/v1/object/public/dish-photos/...",
  "location": {
    "name": "Betty's, York",
    "address": "1 St Helen's Square, York YO1 8QP"
  },
  "hashtags": ["#BestDish", "#BestDishUK", "#YorkFood", ...],
  "websiteUrl": "https://bestdish.co.uk/york/bettys/afternoon-tea",
  "cityName": "York",
  "cuisine": "Bakery"
}
```

### 2. Updated: `/lib/curation/dishCurator.ts`

**Added:** Webhook trigger after successful dish creation

```typescript
// Step 9: Trigger Make.com webhook for Instagram posting
if (process.env.MAKE_WEBHOOK_URL) {
  progress.push('📸 Triggering Instagram post...')
  try {
    const response = await fetch(process.env.MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dishId: dish.id })
    })
    
    if (response.ok) {
      progress.push(`✓ Instagram post queued`)
    } else {
      progress.push(`⚠ Instagram post trigger failed`)
    }
  } catch (error) {
    progress.push(`⚠ Instagram webhook error (continuing anyway)`)
  }
}
```

**Important:** Dish creation succeeds even if webhook fails - Instagram posting is optional.

### 3. New Documentation: `INSTAGRAM-MAKE-WORKFLOW.md`

Comprehensive guide for setting up Make.com, including:
- Step-by-step Make.com scenario configuration
- Webhook setup instructions
- Caption formatting examples
- Testing procedures
- Troubleshooting guide

### 4. Updated: `DATABASE-SETUP.md`

Added Instagram integration section with:
- `MAKE_WEBHOOK_URL` environment variable documentation
- Troubleshooting for webhook issues
- Quick reference for testing

## Next Steps - Setup Your Make.com Scenario

### 1. Get Your Webhook URL

1. Open your Make.com account
2. Go to your Instagram posting scenario (or create new one)
3. **Delete the Schedule trigger** (no more random daily posts)
4. Add **Webhooks → Custom Webhook** module
5. Click "Create a webhook"
6. Copy the webhook URL (looks like: `https://hook.us1.make.com/abc123xyz`)

### 2. Add to Environment Variables

Add this line to your `.env` file:

```bash
MAKE_WEBHOOK_URL=https://hook.us1.make.com/your-webhook-id-here
```

**Important:** Restart your Next.js server after adding this!

```bash
# Kill existing server
lsof -ti:3000 | xargs kill -9

# Restart
npm run dev
```

### 3. Configure Make.com Modules

**Module 1: Webhook Trigger** (already created)
- Receives `dishId` from BestDish

**Module 2: HTTP Request**
- URL: `https://bestdish.co.uk/api/instagram/post-dish`
- Method: POST
- Body: `{"dishId": "{{1.dishId}}"}`
- Parse response: Yes

**Module 3: Download Dish Photo**
- URL: `{{2.dishPhotoUrl}}`

**Module 4: Download Restaurant Photo**
- URL: `{{2.restaurantPhotoUrl}}`

**Module 5: Format Caption**
```
{{2.dishName}} @ {{2.restaurantInstagram}}

{{2.description}}

📍 {{2.location.name}}
💷 £{{2.price}}

🔗 bestdish.co.uk

{{join(2.hashtags; " ")}}
```

**Module 6: Post to Instagram**
- Type: Carousel Post
- Images: Outputs from Module 3 & 4
- Caption: Output from Module 5

### 4. Test It!

1. In Make.com: Right-click Webhook → "Run this module only"
2. In Curated Dish Tool: Create a test dish
3. Watch Make.com receive the webhook
4. Let scenario run through all steps
5. Check Instagram for your post!

## Testing Without Instagram

You can test the webhook trigger without posting to Instagram:

```bash
# Test the API endpoint
curl -X POST https://bestdish.co.uk/api/instagram/post-dish \
  -H "Content-Type: application/json" \
  -d '{"dishId": "your-dish-id-here"}'

# Should return formatted Instagram data
```

## What Changed from Before

### Before (Daily Random)
- ⏰ Posted daily at 4 PM
- 🎲 Random Manchester dish
- ❌ No control over which dish
- ❌ Might duplicate
- ❌ Might miss dishes

### After (Instant Curated)
- ⚡ Posts immediately when you create
- 🎯 Exact dish you just curated
- ✅ Full control over timing
- ✅ Never duplicates
- ✅ Never misses a dish
- ✅ Works with all cities (not just Manchester)

## Benefits

✅ **Instant:** Posts as soon as you create a dish  
✅ **Accurate:** Always posts the correct dish  
✅ **Automatic:** No manual Instagram work needed  
✅ **Consistent:** Same format for every post  
✅ **Smart hashtags:** Auto-generated based on cuisine and dish type  
✅ **Professional:** Carousel posts with dish + restaurant photo  
✅ **Reliable:** Dish creation succeeds even if Instagram fails  
✅ **Flexible:** Easy to disable by removing MAKE_WEBHOOK_URL  

## Disabling Instagram Auto-Post

If you want to create dishes without posting to Instagram:

**Temporary:**
```bash
# Comment out in .env
# MAKE_WEBHOOK_URL=https://hook.us1.make.com/...
```

**Permanent:**
- Turn OFF your Make.com scenario

Dishes will still be created normally, just won't trigger Instagram.

## Monitoring

### Check if Webhook is Enabled

Look for this in your dish creation progress:

```
✅ Dish created successfully!
   Name: Afternoon Tea
   URL: /york/bettys/afternoon-tea
📸 Triggering Instagram post...
  ✓ Instagram post queued
```

If you see `⚠ Instagram post trigger failed`, check Make.com logs.

### Debug in Make.com

1. Open your scenario
2. Click "Show execution history"
3. See each webhook received and its status
4. View detailed logs for any failed steps

## Example Instagram Caption

Here's what gets posted to Instagram:

```
Afternoon Tea @ @bettys_yorkshire

The afternoon tea at Betty's transcends expectation with delicate 
finger sandwiches, warm scones with clotted cream, and an array of 
exquisite pastries. Each element is crafted with precision, from the 
perfectly brewed tea to the final flourish of sweet treats.

📍 Betty's, York
💷 £25.00

🔗 bestdish.co.uk

#BestDish #BestDishUK #YorkFood #YorkEats #Foodie #FoodPorn 
#Instafood #UKFood #FoodLovers #Delicious #Bakery #BakeryFood 
#AfternoonTea #TeaTime
```

## Migration from Old Workflow

### Your Old Daily Script

If you had a daily scheduled post:
1. **Disable** the old Schedule trigger in Make.com
2. **Keep** all the Instagram posting modules
3. **Add** webhook trigger and HTTP request modules
4. **Use** the same Instagram posting logic

No need to rebuild everything - just change the trigger!

## Support

If you encounter issues:

1. **Check** `INSTAGRAM-MAKE-WORKFLOW.md` for detailed troubleshooting
2. **Verify** `MAKE_WEBHOOK_URL` is set in `.env`
3. **Test** the API endpoint manually with curl
4. **Check** Make.com execution logs
5. **Ensure** scenario is active (ON)

## Summary

You're all set! 🎉

- ✅ API endpoint created (`/api/instagram/post-dish`)
- ✅ Webhook trigger added to dish curator
- ✅ Documentation complete
- ✅ Environment variable documented
- ⏳ **Next:** Add `MAKE_WEBHOOK_URL` to your `.env`
- ⏳ **Next:** Configure your Make.com scenario
- ⏳ **Next:** Test by creating a dish!

---

**Created:** October 2025  
**Version:** 1.0 (Initial Implementation)

