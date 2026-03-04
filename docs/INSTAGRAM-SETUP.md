# Instagram API setup – one clear path

You only need **two values** in `.env` and Vercel. Get both from the same place: your app’s **“API setup with Instagram login”** screen (the one with “Generate access tokens” and the list of Instagram accounts).

---

## What goes in `.env`

| Variable | Where to get it | Example |
|----------|-----------------|--------|
| `INSTAGRAM_GRAPH_ACCESS_TOKEN` | Token from **“Generate token”** next to the account you want to post to (bestdish.mcr) | Long string starting with `IG` or `EAA` |
| `INSTAGRAM_IG_USER_ID` | The **Instagram account ID** shown on that same row (e.g. under “bestdish.mar”) | `1784147794309541` |

Use the **same** Instagram account for both: the one you want posts to go to (bestdish.mcr).

---

## Step-by-step (use this screen only)

1. **Open the right screen**  
   Meta for Developers → your app (BestDish-IG) → **Instagram** → **“API setup with Instagram login”** (under “Customize use case”). You should see a list of Instagram accounts (e.g. s33ni and bestdish.mar).

2. **Pick the account you post to**  
   You want posts to go to **bestdish.mcr** (shown as “bestdish.mar” on the screen).  
   - **Instagram account ID** on that row → that number is `INSTAGRAM_IG_USER_ID`.  
     From your screenshot, for bestdish.mar that ID is **`1784147794309541`**.  
   - Put that in `.env`:  
     `INSTAGRAM_IG_USER_ID=1784147794309541`

3. **Get the token for that account only**  
   On the **same row** as bestdish.mar, click **“Generate token”**.  
   Complete the flow; Meta will give you a token.  
   - That token is for **bestdish.mcr** only.  
   - Put it in `.env`:  
     `INSTAGRAM_GRAPH_ACCESS_TOKEN=the_token_you_got`  
   - Do **not** use a token generated for s33ni if you want to post to bestdish.mcr.

4. **Long-lived token (recommended)**  
   The token from “Generate token” is often short-lived. To get a long-lived one, exchange it (e.g. in a browser or with curl):  
   `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=YOUR_APP_SECRET&access_token=SHORT_LIVED_TOKEN`  
   Use the **Instagram app secret** from the same page (BestDish-IG). Put the **long-lived** `access_token` from the response into `INSTAGRAM_GRAPH_ACCESS_TOKEN`.

5. **Copy to Vercel**  
   In Vercel → Project → Settings → Environment Variables, add the same two:  
   `INSTAGRAM_IG_USER_ID` and `INSTAGRAM_GRAPH_ACCESS_TOKEN` (both from steps 2 and 3/4). Then redeploy.

---

## Summary

- **One screen:** “API setup with Instagram login” with the list of accounts.  
- **One account for posting:** bestdish.mcr (bestdish.mar on the screen).  
- **Two env vars:**  
  - `INSTAGRAM_IG_USER_ID` = the numeric ID next to that account (e.g. `1784147794309541`).  
  - `INSTAGRAM_GRAPH_ACCESS_TOKEN` = the token from “Generate token” for **that same account** (then exchanged for long-lived if you did step 4).  

You can ignore Graph API Explorer for this flow; the “Generate token” button next to bestdish.mar is the right way to get the token for posting to bestdish.mcr.
