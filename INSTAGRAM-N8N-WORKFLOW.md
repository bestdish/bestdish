# 📸 Instagram Auto-Poster - n8n Workflow Setup

## Overview
Automatically posts a daily featured dish to @bestdish.mcr at 12pm every day.

---

## 🎯 What Gets Posted

**Format:** Carousel (2 images)
1. **Image 1:** Dish photo
2. **Image 2:** Restaurant photo

**Caption Format:**
```
🍖 Shortrib Nuggets @ @hawksmoor_manchester

Melt-in-your-mouth beef short rib nuggets served with a tangy kimchi ketchup. 
These bite-sized pieces are perfectly crispy on the outside and tender inside.

📍 Hawksmoor Manchester, Manchester
💷 £8.50

🔗 Link in bio for more

#BestDish #BestDishUK #ManchesterFood #ManchesterEats #Foodie #FoodPorn 
#Instafood #UKFood #FoodLovers #Delicious #Steak #Steakhouse
```

---

## 🛠️ n8n Workflow Setup

### Step 1: Install n8n (if not already installed)

**Option A: Docker (Recommended)**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Option B: npm**
```bash
npm install -g n8n
n8n start
```

Access n8n at: http://localhost:5678

---

### Step 2: Create the Workflow

1. **Open n8n** → http://localhost:5678
2. **Create New Workflow**
3. **Add the following nodes:**

---

#### Node 1: Schedule Trigger (Cron)
- **Type:** Schedule Trigger
- **Trigger Times:** `0 12 * * *` (Every day at 12:00 PM)
- **Timezone:** `Europe/London`

---

#### Node 2: HTTP Request - Fetch Daily Dish
- **Type:** HTTP Request
- **Method:** GET
- **URL:** `http://localhost:3000/api/instagram/daily-dish`
- **Response Format:** JSON

---

#### Node 3: Set Variables
- **Type:** Set
- **Mode:** Manual Mapping
- **Values to Set:**
  ```json
  {
    "dishName": "{{ $json.dishName }}",
    "restaurantName": "{{ $json.restaurantName }}",
    "restaurantInstagram": "{{ $json.restaurantInstagram }}",
    "description": "{{ $json.description }}",
    "price": "{{ $json.price }}",
    "dishPhotoUrl": "{{ $json.dishPhotoUrl }}",
    "restaurantPhotoUrl": "{{ $json.restaurantPhotoUrl }}",
    "locationName": "{{ $json.location.name }}",
    "hashtags": "{{ $json.hashtags.join(' ') }}",
    "websiteUrl": "{{ $json.websiteUrl }}"
  }
  ```

---

#### Node 4: Download Dish Photo
- **Type:** HTTP Request
- **Method:** GET
- **URL:** `{{ $json.dishPhotoUrl }}`
- **Response Format:** File
- **Options:**
  - Download File: Yes
  - File Name: `dish.jpg`

---

#### Node 5: Download Restaurant Photo
- **Type:** HTTP Request
- **Method:** GET
- **URL:** `{{ $json.restaurantPhotoUrl }}`
- **Response Format:** File
- **Options:**
  - Download File: Yes
  - File Name: `restaurant.jpg`

---

#### Node 6: Format Caption
- **Type:** Code (JavaScript)
- **Code:**
```javascript
// Get data from previous nodes
const dishName = $input.item.json.dishName;
const restaurantName = $input.item.json.restaurantName;
const restaurantInstagram = $input.item.json.restaurantInstagram;
const description = $input.item.json.description;
const price = $input.item.json.price;
const locationName = $input.item.json.locationName;
const hashtags = $input.item.json.hashtags;
const websiteUrl = $input.item.json.websiteUrl;

// Format caption
let caption = `${dishName} @ ${restaurantInstagram}\n\n`;
caption += `${description}\n\n`;
caption += `📍 ${locationName}\n`;

if (price) {
  caption += `💷 £${price.toFixed(2)}\n`;
}

caption += `\n🔗 bestdish.co.uk/manchester\n\n`;
caption += hashtags;

return {
  caption: caption,
  dishName: dishName,
  restaurantName: restaurantName,
  locationName: locationName
};
```

---

#### Node 7: Instagram - Create Carousel Post
- **Type:** Instagram
- **Credential:** (Connect your Instagram Business account)
- **Resource:** Post
- **Operation:** Create
- **Post Type:** Carousel
- **Images:**
  - Add images from Node 4 (dish photo) and Node 5 (restaurant photo)
- **Caption:** `{{ $json.caption }}`
- **Location:** `{{ $json.locationName }}` (if supported)

---

### Step 3: Connect Instagram Business Account

**Prerequisites:**
1. Instagram Business or Creator account
2. Facebook Page linked to Instagram
3. Facebook Developer App

**To Connect:**
1. In n8n, go to **Credentials** → **Add Credential** → **Instagram**
2. Choose **OAuth2** authentication
3. Follow the prompts to connect your account
4. Grant permissions for posting

**Alternative: Use Meta Graph API**
If the native Instagram node doesn't work, use HTTP Request node with Meta Graph API:
- Endpoint: `https://graph.facebook.com/v18.0/{instagram-account-id}/media`
- Method: POST
- See: https://developers.facebook.com/docs/instagram-api/guides/content-publishing

---

### Step 4: Test the Workflow

1. **Click "Execute Workflow"** to test immediately
2. **Check:**
   - ✅ Dish data fetched successfully
   - ✅ Both images downloaded
   - ✅ Caption formatted correctly
   - ✅ Posted to Instagram

---

### Step 5: Activate the Workflow

1. **Toggle "Active"** in the top right
2. **Workflow will now run daily at 12pm**

---

## 🔧 Customization Options

### Change Post Time
Edit the **Cron** expression in Schedule Trigger:
- `0 8 * * *` - 8:00 AM
- `0 18 * * *` - 6:00 PM
- `0 12 * * 1,3,5` - 12:00 PM on Mon, Wed, Fri only

### Post to Multiple Accounts
Duplicate Node 7 (Instagram post) and connect different Instagram credentials

### Add Stories
Add another Instagram node for Stories using the same images

---

## 📊 Monitoring

**In n8n:**
- View **Executions** tab to see all runs
- Check for errors or failed posts
- View execution logs

**Suggested Improvements:**
1. Add a **Slack notification** node to alert you when posts succeed/fail
2. Add a **database log** to track which dishes have been posted
3. Add a **fallback** to retry failed posts

---

## 🔐 Required Environment Variables

Make sure these are set in your BestDish app:
```bash
NEXT_PUBLIC_URL=https://bestdish.co.uk
NEXT_PUBLIC_SUPABASE_URL=https://yoeguahpdrtctrvaheer.supabase.co
```

---

## 🚀 Go Live

Once tested and working:
1. ✅ Activate workflow in n8n
2. ✅ Keep n8n running (use Docker or systemd service)
3. ✅ Monitor first few posts
4. ✅ Adjust caption format as needed

**Your Instagram will now auto-post daily!** 📸🎉






