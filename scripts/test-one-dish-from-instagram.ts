/**
 * Test the "one dish from Instagram" flow without building infra.
 * 1. Get image from Instagram post URL
 * 2. Gemini: Is this real plated food AND does it match the dish name?
 * 3. If pass, optionally print a suggestion to add via Curated Dish Tool
 *
 * Usage:
 *   npx tsx scripts/test-one-dish-from-instagram.ts <instagramPostUrl> <dishName> [restaurantName]
 *
 * Example:
 *   npx tsx scripts/test-one-dish-from-instagram.ts "https://www.instagram.com/p/ABC123/" "House Black Daal" "Dishoom"
 *
 * You can get the post URL by opening the post on Instagram and copying the URL from the browser.
 * You can get the dish name from the post caption.
 */

import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { extractInstagramImage } from '../lib/curation/instagramExtractor'

const postUrl = process.argv[2]
const dishName = process.argv[3]
const restaurantName = process.argv[4] || 'Restaurant'

if (!postUrl || !dishName) {
  console.log('Usage: npx tsx scripts/test-one-dish-from-instagram.ts <instagramPostUrl> <dishName> [restaurantName]')
  console.log('Example: npx tsx scripts/test-one-dish-from-instagram.ts "https://www.instagram.com/p/ABC123/" "House Black Daal" "Dishoom"')
  process.exit(1)
}

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set in .env')
  process.exit(1)
}

async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string } | null> {
  const res = await fetch(imageUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
  })
  if (!res.ok) return null
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const mimeType = contentType.split(';')[0].trim()
  const buf = Buffer.from(await res.arrayBuffer())
  return { data: buf.toString('base64'), mimeType }
}

async function checkImageWithGemini(
  imageBase64: { data: string; mimeType: string },
  dishName: string,
  restaurantName: string
): Promise<{ pass: boolean; reason?: string }> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

  const prompt = `You are a strict food photography validator.

TASK: Look at this image and answer TWO questions:

1. Is this ACTUAL PREPARED FOOD as the primary subject? (Plated dish, clearly visible, well-lit, appetizing. NOT: interiors, people, logos, menus, raw ingredients, blurry.)
2. Does this image MATCH the dish described below? (The food in the image should reasonably match what the dish name suggests.)

DISH NAME: "${dishName}"
RESTAURANT: "${restaurantName}"

Answer in this exact format:
REAL_FOOD: YES or NO
MATCHES_DISH: YES or NO
REASON: (one short sentence)

If both are YES, the candidate passes. Otherwise it fails.`

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: imageBase64.mimeType,
        data: imageBase64.data,
      },
    },
    { text: prompt },
  ])
  const text = result.response.text().trim()
  const realFood = /REAL_FOOD:\s*(YES|NO)/i.exec(text)?.[1]?.toUpperCase() === 'YES'
  const matchesDish = /MATCHES_DISH:\s*(YES|NO)/i.exec(text)?.[1]?.toUpperCase() === 'YES'
  const reason = /REASON:\s*(.+?)(?=\n|$)/is.exec(text)?.[1]?.trim()
  const pass = realFood && matchesDish
  return { pass, reason }
}

async function main() {
  console.log('--- Test one dish from Instagram ---\n')
  console.log(`Post URL: ${postUrl}`)
  console.log(`Dish: ${dishName}`)
  console.log(`Restaurant: ${restaurantName}\n`)

  // Step 1: Get image URL from post
  console.log('Step 1: Extracting image from Instagram post...')
  const imageUrl = await extractInstagramImage(postUrl)
  if (!imageUrl) {
    console.log('FAIL: Could not get image from post. Try pasting a direct image URL into Curated Dish Tool instead.')
    process.exit(1)
  }
  console.log(`  Image URL: ${imageUrl.substring(0, 80)}...\n`)

  // Step 2: Fetch image and run Gemini check
  console.log('Step 2: Checking image with Gemini (real food + matches dish)...')
  const imageBase64 = await fetchImageAsBase64(imageUrl)
  if (!imageBase64) {
    console.log('FAIL: Could not download image.')
    process.exit(1)
  }
  const { pass, reason } = await checkImageWithGemini(imageBase64, dishName, restaurantName)
  console.log(`  ${reason || ''}`)
  console.log('')

  if (pass) {
    console.log('PASS: Image is real plated food and matches the dish. You can add this dish via Curated Dish Tool.')
    console.log('  Use this image URL when adding:')
    console.log(`  ${imageUrl}`)
    console.log('  Dish name:', dishName)
    console.log('  Restaurant (Instagram):', restaurantName)
  } else {
    console.log('FAIL: Image did not pass the check. Do not use for a dish.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
