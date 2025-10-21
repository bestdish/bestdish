# 📸 Instagram Daily Poster - Quick Setup Guide

## ✅ What's Ready:
1. **API Endpoint:** http://localhost:3000/api/instagram/daily-dish ✅
2. **n8n Platform:** http://localhost:5678 ✅
3. **Manchester Scraper:** Running in background (21/100 dishes so far)

---

## 🚀 Setup Steps (10 minutes)

### Step 1: Create n8n Account
1. Open: http://localhost:5678
2. Create your account (email + password)
3. You'll see the n8n dashboard

---

### Step 2: Create the Workflow

1. **Click "Add workflow" button**
2. **Click the + icon** to add your first node

---

### Step 3: Add Schedule Trigger

1. **Search:** "Schedule Trigger"
2. **Click** it to add
3. **Configure:**
   - Trigger Interval: `Days`
   - Days Between Triggers: `1`
   - Trigger at Hour: `12` (noon)
   - Trigger at Minute: `0`
4. **Click "Execute Node"** to test (should show current time)

---

### Step 4: Add HTTP Request (Fetch Dish)

1. **Click the + icon** after the Schedule Trigger
2. **Search:** "HTTP Request"
3. **Configure:**
   - Method: `GET`
   - URL: `http://localhost:3000/api/instagram/daily-dish`
4. **Click "Execute Node"** - You should see JSON with dish data!

---

### Step 5: Add Code Node (Format Caption)

1. **Click + icon** after HTTP Request
2. **Search:** "Code"
3. **Paste this code:**

```javascript
const data = $input.first().json;

// Format the Instagram caption
let caption = `${data.dishName} @ ${data.restaurantInstagram}\n\n`;
caption += `${data.description.substring(0, 200)}...\n\n`;
caption += `📍 ${data.location.name}\n`;
if (data.price) {
  caption += `💷 £${data.price.toFixed(2)}\n`;
}
caption += `\n🔗 bestdish.co.uk/manchester\n\n`;
caption += data.hashtags.join(' ');

return {
  caption: caption,
  dishPhotoUrl: data.dishPhotoUrl,
  restaurantPhotoUrl: data.restaurantPhotoUrl
};
```

4. **Click "Execute Node"** - Should show formatted caption!

---

### Step 6: Connect Instagram (IMPORTANT)

**Before you can post, you need:**
1. ✅ Instagram Business or Creator account
2. ✅ Facebook Page linked to Instagram
3. ✅ Instagram credentials in n8n

**To connect Instagram:**

#### Option A: Meta Graph API (Recommended)
1. Go to: https://developers.facebook.com/apps/
2. Create a new app → "Business"
3. Add Instagram Basic Display
4. Get your:
   - Instagram Account ID
   - Access Token

#### Option B: Use n8n Community Node
1. In n8n, go to **Settings** → **Community Nodes**
2. Install `n8n-nodes-instagram-graph-api`
3. Restart n8n

---

### Step 7: Add Instagram Post Node

**Using HTTP Request (Easier for now):**

1. **Click + icon** after Code node
2. **Add another "HTTP Request"**
3. **Configure:**
   - Method: `POST`
   - URL: `https://graph.facebook.com/v18.0/{YOUR_INSTAGRAM_ACCOUNT_ID}/media`
   - Send Body: Yes
   - Body Content Type: `JSON`
   - Specify Body: JSON
   - JSON Body:
   ```json
   {
     "image_url": "{{ $json.dishPhotoUrl }}",
     "caption": "{{ $json.caption }}",
     "access_token": "YOUR_ACCESS_TOKEN_HERE"
   }
   ```
4. **Add another HTTP Request** to publish:
   - Method: `POST`
   - URL: `https://graph.facebook.com/v18.0/{YOUR_INSTAGRAM_ACCOUNT_ID}/media_publish`
   - Body: `{ "creation_id": "{{ $json.id }}", "access_token": "YOUR_TOKEN" }`

---

## 🔐 Getting Instagram Credentials

### Quick Method:
1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app
3. Add permissions: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`
4. Generate Access Token
5. Get Instagram Business Account ID

### Full Guide:
- https://developers.facebook.com/docs/instagram-api/getting-started

---

## ✅ Test the Workflow

1. **Click "Execute Workflow"** button (top right)
2. **Check each node** - all should be green ✅
3. **Verify:**
   - Dish data fetched
   - Caption formatted
   - (Instagram post created - when connected)

---

## 🚀 Activate Daily Posting

1. **Toggle "Active" switch** (top right)
2. **Workflow will now run daily at 12pm!**

---

## 📊 Monitor Your Posts

- **Executions:** Click "Executions" tab to see all runs
- **Errors:** Red nodes show what failed
- **Success:** Green nodes = posted successfully

---

## 🎨 Customize

### Change Post Time:
Edit the Schedule Trigger:
- Hour: `18` (6pm)
- Hour: `8` (8am)

### Change Caption Format:
Edit the Code node to adjust text

### Post Multiple Times:
Duplicate the workflow, change the trigger time

---

## ⚠️ Important Notes

1. **Instagram Business Account Required** - Personal accounts can't use the API
2. **Facebook Page Required** - Must be linked to your Instagram
3. **Access Token Expires** - You'll need to refresh it periodically (60 days)
4. **Rate Limits** - Instagram allows ~25 posts per day

---

## 🆘 Troubleshooting

**"Instagram credentials invalid"**
→ Regenerate access token in Facebook Developer Console

**"No dish data returned"**
→ Make sure your Next.js dev server is running on port 3000

**"Access token expired"**
→ Generate a new one from Facebook Graph API Explorer

---

## 🎉 You're All Set!

Once connected, your Instagram will automatically post:
- **Daily at 12pm**
- **Best dish from Manchester**
- **Carousel with 2 photos**
- **Professional caption with hashtags**

**Questions?** Check the full guide in `INSTAGRAM-N8N-WORKFLOW.md`

