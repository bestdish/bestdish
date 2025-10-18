# Instagram Auto-Post via Make.com

## Overview

When you create a dish via the Curated Dish Tool, it automatically triggers your Make.com scenario to post the dish to Instagram immediately.

## How It Works

```
1. You create dish in Curated Dish Tool
   ↓
2. Dish saved to database
   ↓  
3. Webhook sent to Make.com (with dishId)
   ↓
4. Make fetches dish data from /api/instagram/post-dish
   ↓
5. Make downloads both images (dish + restaurant)
   ↓
6. Make posts carousel to Instagram
   ↓
7. Done! Dish is live on Instagram immediately
```

## Make.com Setup Instructions

### 1. Create Webhook Trigger

1. Open your Make.com account
2. Go to your existing Instagram scenario (or create a new one)
3. **Delete the Schedule trigger** (to prevent duplicate posts)
4. Add **Webhooks → Custom Webhook** module
5. Click "Create a webhook"
6. Copy the webhook URL (e.g., `https://hook.us1.make.com/abc123xyz`)
7. Save this URL - you'll add it to `.env`

### 2. Add HTTP Request Module

After the webhook module, add an **HTTP → Make a Request** module:

**Settings:**
- **URL:** `https://bestdish.co.uk/api/instagram/post-dish`
- **Method:** POST
- **Headers:**
  - `Content-Type`: `application/json`
- **Body Type:** Raw
- **Request content:**
  ```json
  {
    "dishId": "{{1.dishId}}"
  }
  ```
- **Parse response:** Yes

### 3. Add Image Download Modules

Add two **HTTP → Get a File** modules (one for each image):

**Module 1 - Dish Photo:**
- **URL:** `{{2.dishPhotoUrl}}`

**Module 2 - Restaurant Photo:**
- **URL:** `{{2.restaurantPhotoUrl}}`

### 4. Format Caption

Add a **Tools → Text Aggregator** or use a simple text composition:

```
{{2.dishName}} @ {{2.restaurantInstagram}}

{{2.description}}

📍 {{2.location.name}}
💷 £{{2.price}}

🔗 bestdish.co.uk

{{join(2.hashtags; " ")}}
```

**Note:** Adjust the formatting to match your style. You can also include the editorial quote if you want:

```
"{{2.editorialQuote}}"

```

### 5. Post to Instagram

Add your **Instagram → Create a Carousel Post** module:

**Settings:**
- **Images:** Use outputs from steps 3 and 4 (both photos)
- **Caption:** Use the formatted caption from step 4
- **Location:** Optional - use `{{2.location.name}}`

### 6. Activate Scenario

1. Save all modules
2. Turn ON your scenario
3. Test it by creating a dish in the Curated Dish Tool

## Environment Variable Setup

Add the webhook URL to your `.env` file:

```bash
# Make.com Instagram Webhook
MAKE_WEBHOOK_URL=https://hook.us1.make.com/your-webhook-id-here
```

Once this is set, every dish you create will automatically trigger Instagram posting.

## API Endpoint Reference

### POST /api/instagram/post-dish

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
  "restaurantInstagram": "@bettysyorkshire",
  "description": "The afternoon tea at Betty's transcends expectation...",
  "editorialQuote": "Betty's afternoon tea is legendary...",
  "price": 25.00,
  "dishPhotoUrl": "https://yoeguahpdrtctrvaheer.supabase.co/storage/v1/object/public/dish-photos/1234567890-afternoon-tea.jpg",
  "restaurantPhotoUrl": "https://yoeguahpdrtctrvaheer.supabase.co/storage/v1/object/public/dish-photos/bettys-exterior.jpg",
  "location": {
    "name": "Betty's, York",
    "address": "1 St Helen's Square, York YO1 8QP"
  },
  "hashtags": [
    "#BestDish",
    "#BestDishUK",
    "#YorkFood",
    "#YorkEats",
    "#Foodie",
    "#FoodPorn",
    "#Instafood",
    "#UKFood",
    "#FoodLovers",
    "#Delicious",
    "#Bakery",
    "#BakeryFood",
    "#AfternoonTea",
    "#TeaTime"
  ],
  "websiteUrl": "https://bestdish.co.uk/york/bettys/afternoon-tea",
  "cityName": "York",
  "cuisine": "Bakery"
}
```

## Testing

### Test the API Endpoint

You can test the API endpoint manually:

```bash
curl -X POST https://bestdish.co.uk/api/instagram/post-dish \
  -H "Content-Type: application/json" \
  -d '{"dishId": "your-dish-id-here"}'
```

### Test the Full Workflow

1. In Make.com, open your scenario
2. Right-click the Webhook module → "Run this module only"
3. In your Curated Dish Tool, create a test dish
4. Check Make.com - it should receive the webhook with dishId
5. Let the scenario run through all steps
6. Verify the post appears on Instagram

### Debug Mode

In Make.com:
1. Turn on "Show advanced settings"
2. Enable "Log all executed operations"
3. Create a test dish
4. Review the execution log to see each step

## Caption Examples

### Simple Format

```
Afternoon Tea @ @bettysyorkshire

The afternoon tea at Betty's transcends expectation with delicate finger sandwiches, warm scones with clotted cream, and an array of exquisite pastries.

📍 Betty's, York
💷 £25.00

🔗 bestdish.co.uk

#BestDish #BestDishUK #YorkFood #AfternoonTea #TeaTime
```

### With Editorial Quote

```
Afternoon Tea @ @bettysyorkshire

"Betty's afternoon tea is legendary in Yorkshire, and for good reason."

The afternoon tea at Betty's transcends expectation with delicate finger sandwiches, warm scones with clotted cream, and an array of exquisite pastries.

📍 Betty's, York
💷 £25.00

🔗 bestdish.co.uk

#BestDish #BestDishUK #YorkFood #AfternoonTea #TeaTime
```

## Troubleshooting

### Webhook Not Firing

**Problem:** Dish is created but Make.com doesn't receive webhook

**Solutions:**
- Check `MAKE_WEBHOOK_URL` is set in `.env`
- Verify webhook URL is correct (no trailing slash)
- Restart your Next.js server after adding the env variable
- Check Make.com scenario is active (ON)

### API Returns 404

**Problem:** `/api/instagram/post-dish` returns "Dish not found"

**Solutions:**
- Verify the dish was actually saved to database
- Check the dishId being sent is correct
- Ensure dish has `isBest: true` (published)

### Photos Not Downloading

**Problem:** Make.com can't download images

**Solutions:**
- Check if `dishPhotoUrl` and `restaurantPhotoUrl` are valid URLs
- Verify Supabase bucket is public
- Check image files actually exist in Supabase storage

### Instagram Post Fails

**Problem:** Make.com can't post to Instagram

**Solutions:**
- Check Instagram API connection in Make.com
- Verify caption length (Instagram has limits)
- Check image format/size (Instagram has requirements)
- Try posting manually to isolate the issue

## Benefits

✅ **Instant posting** when you publish a dish  
✅ **Consistent formatting** across all posts  
✅ **Automatic hashtag generation** based on cuisine and dish type  
✅ **Always posts the correct dish** (no more random selection)  
✅ **Control** over what gets posted and when  
✅ **Easy to disable** (just remove `MAKE_WEBHOOK_URL` from `.env`)  
✅ **Professional look** with carousel posts (dish + restaurant photo)  

## Migration from Old Flow

### Before

- ⏰ Scheduled daily at 4 PM
- 🎲 Posted random Manchester dish
- ❌ Couldn't control which dish posted
- ❌ Might post same dish twice
- ❌ Manual intervention needed

### After

- ⚡ Posts immediately when you create a dish
- 🎯 Posts the exact dish you just created
- ✅ Full control over content and timing
- ✅ Never duplicates (each dish posts once)
- ✅ Fully automated from creation to Instagram

## Disabling Instagram Auto-Post

If you want to disable automatic Instagram posting:

1. **Temporary:** Remove or comment out `MAKE_WEBHOOK_URL` in `.env`
2. **Permanent:** Turn OFF your Make.com scenario

The Curated Dish Tool will continue to work normally, it just won't trigger Instagram posting.

