# Test the “one dish from Instagram” flow

No new infrastructure—just prove we can go from **restaurant → Instagram → one post → image + quality check** with a single dish.

---

## 1. Clear the 25 pending dishes (optional)

They’re not worth keeping in current form; many would fail the new image check.

```bash
cd bestdish
npx tsx scripts/clear-pending-dishes.ts           # see count
npx tsx scripts/clear-pending-dishes.ts --confirm # delete them
```

---

## 2. Get Instagram from a restaurant website

Pick one restaurant with a website (e.g. from your DB or any place you know).

```bash
npx tsx scripts/get-instagram-from-website.ts https://example-restaurant.com
```

Use any handle it prints (e.g. `@restaurantname`).

---

## 3. Pick one Instagram post

1. Open that Instagram profile in the browser.
2. Find a post that clearly shows **one dish** and has the **dish name** (or something close) in the caption.
3. Copy the **post URL** (e.g. `https://www.instagram.com/p/ABC123xyz/`).
4. Note the **dish name** you’ll use (e.g. “House Black Daal”).

---

## 4. Run the one-dish test

Uses: post URL → image extraction → Gemini check (real plated food + matches dish name).

```bash
npx tsx scripts/test-one-dish-from-instagram.ts "https://www.instagram.com/p/PASTE_ID_HERE/" "Dish Name" "Restaurant Name"
```

Example:

```bash
npx tsx scripts/test-one-dish-from-instagram.ts "https://www.instagram.com/p/ABC123/" "House Black Daal" "Dishoom"
```

- **PASS:** Script prints the image URL. Add the dish via **Curated Dish Tool** (paste that image URL, dish name, restaurant, city).
- **FAIL:** Don’t use that image; try another post or restaurant.

---

## 5. If you’re happy with the result

Add the dish manually in the app:

1. Go to **Admin → Curated Dish Tool**.
2. Enter: Instagram handle (from step 2), dish name, city.
3. For photo: paste the **image URL** the script printed (or use “image URL” if the tool has that).
4. Submit. You now have one dish that passed the new check.

---

## Full pipeline test: grab dish name + photo → match → article (no manual steps)

One script runs the full flow: **Instagram post URL → dish name (from caption or AI) → photo → AI “does image match dish?” → generate article.** You only need to paste one post URL; no typing dish name or description by hand.

1. **Resolve restaurant to Instagram** (optional, if you don’t have a post yet):
   ```bash
   npx tsx scripts/resolve-restaurant-to-instagram.ts "Canto" "Manchester"
   ```
2. Open that Instagram profile (e.g. https://instagram.com/cantomcr), pick **one post** that clearly shows a dish, copy the **post URL** from the browser.
3. **Run the full pipeline** (post URL + restaurant + city):
   ```bash
   npx tsx scripts/test-full-dish-pipeline.ts "https://www.instagram.com/p/PASTE_ID_HERE/" "Canto" "Manchester"
   ```

The script will:

- Grab **image** and **caption** from the post (no manual step).
- **Extract dish name** from the caption (or from the image with AI if no caption).
- **Check** that the image is real plated food and matches the dish name.
- **Generate the article** (150–200 word description, cuisine, price, quotes) using your existing Curated Dish logic.
- Write **`output-dish-for-review.json`** with dish name, image URL, description, and metadata.

If the match check fails, the script exits and does not write the article (so bad pairs never get a “ready for review” file). If it passes, you get one JSON file per run that you can use to **review before go-live**. Later we can turn this into an automated platform with a queue where you only approve/reject.

---

## Env

- `GEMINI_API_KEY` in `bestdish/.env` (required for the test scripts).

No DB or new tables needed for this test.
