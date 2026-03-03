/**
 * Full pipeline test: one Instagram post → dish name, photo, match check, article.
 * No manual steps. Proves we can automate: grab dish name + photo, verify they match, produce article.
 *
 * Usage:
 *   npx tsx scripts/test-full-dish-pipeline.ts <instagramPostUrl> <restaurantName> <cityName> [dishName]
 *
 * Example:
 *   npx tsx scripts/test-full-dish-pipeline.ts "https://www.instagram.com/p/ABC123/" "Canto" "Manchester"
 *   npx tsx scripts/test-full-dish-pipeline.ts "https://www.instagram.com/p/ABC123/" "Canto" "Manchester" "Patatas Bravas"
 *
 * If dishName is provided, it is used; otherwise dish name is extracted from caption or image with AI.
 * Output: dish name, image URL (or local path), full description (article), and writes a review-ready JSON file.
 */

import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { extractInstagramPostData } from '../lib/curation/instagramExtractor'
import { downloadInstagramWithInstaloader } from '../lib/curation/instaloaderExtractor'
import { generateCuratedDishContent } from '../lib/curation/aiContentGenerator'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const postUrl = process.argv[2]
const restaurantName = process.argv[3]
const cityName = process.argv[4]
const dishNameOverride = process.argv[5] || null

if (!postUrl || !restaurantName || !cityName) {
  console.log('Usage: npx tsx scripts/test-full-dish-pipeline.ts <instagramPostUrl> <restaurantName> <cityName> [dishName]')
  console.log('Example: npx tsx scripts/test-full-dish-pipeline.ts "https://www.instagram.com/p/ABC123/" "Canto" "Manchester" "Patatas Bravas"')
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

async function extractDishNameFromCaption(caption: string): Promise<string | null> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
  const prompt = `From this Instagram post caption, what is the specific dish or food item shown? Reply with ONLY the dish name (e.g. "Patatas bravas", "Lamb croquettes"), or the single word "none" if it's not about a specific dish.

Caption:
${caption.slice(0, 1500)}

Reply with only the dish name or "none".`
  const result = await model.generateContent(prompt)
  const text = result.response.text().trim().toLowerCase()
  if (text === 'none' || text.length < 2) return null
  return text.replace(/^["']|["']$/g, '').trim() || null
}

async function extractDishNameFromImage(imageBase64: { data: string; mimeType: string }): Promise<string | null> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
  const result = await model.generateContent([
    { inlineData: { mimeType: imageBase64.mimeType, data: imageBase64.data } },
    { text: 'What is the name of this dish or food item? Reply with ONLY a short dish name (e.g. "Patatas bravas"), or "none" if not clearly a single dish.' },
  ])
  const text = result.response.text().trim().toLowerCase()
  if (text === 'none' || text.length < 2) return null
  return text.replace(/^["']|["']$/g, '').trim() || null
}

async function checkImageMatchesDish(
  imageBase64: { data: string; mimeType: string },
  dishName: string,
  restaurantName: string
): Promise<boolean> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
  const prompt = `You are a strict validator. Look at this image.

1. Is this ACTUAL PREPARED FOOD as the primary subject? (Plated dish, clear, appetizing. NOT: interiors, people, logos.)
2. Does this image MATCH the dish "${dishName}"?

Answer in this exact format:
REAL_FOOD: YES or NO
MATCHES_DISH: YES or NO

If both YES, the candidate passes.`
  const result = await model.generateContent([
    { inlineData: { mimeType: imageBase64.mimeType, data: imageBase64.data } },
    { text: prompt },
  ])
  const text = result.response.text().trim().toUpperCase()
  return /REAL_FOOD:\s*YES/i.test(text) && /MATCHES_DISH:\s*YES/i.test(text)
}

async function main() {
  console.log('--- Full dish pipeline (grab name + photo → match → article) ---\n')
  console.log(`Post: ${postUrl}`)
  console.log(`Restaurant: ${restaurantName}, ${cityName}`)
  if (dishNameOverride) console.log(`Dish name (provided): ${dishNameOverride}`)
  console.log('')

  // 1. Grab image + caption from post (no manual step)
  console.log('Step 1: Grabbing image and caption from Instagram post...')
  const { imageUrl: imageUrlFromPost, caption } = await extractInstagramPostData(postUrl)
  let imageUrl: string | null = imageUrlFromPost
  let imageBase64: { data: string; mimeType: string } | null = null

  if (imageUrl) {
    console.log(`  Image URL: ${imageUrl.substring(0, 60)}...`)
    imageBase64 = await fetchImageAsBase64(imageUrl)
  }
  if (!imageBase64) {
    console.log('  Trying Instaloader fallback...')
    const base64FromInstaloader = await downloadInstagramWithInstaloader(postUrl)
    if (base64FromInstaloader) {
      imageBase64 = { data: base64FromInstaloader, mimeType: 'image/jpeg' }
      imageUrl = null
      console.log('  ✓ Image from Instaloader')
    }
  }
  console.log(`  Caption: ${caption ? caption.substring(0, 80) + (caption.length > 80 ? '...' : '') : '(none)'}\n`)

  if (!imageBase64) {
    console.log('FAIL: Could not get image from post or Instaloader.')
    process.exit(1)
  }

  // 2. Get dish name (override, caption, or image with AI)
  console.log('Step 2: Dish name...')
  let dishName: string | null = dishNameOverride?.trim() || null
  if (!dishName && caption?.trim()) {
    dishName = await extractDishNameFromCaption(caption)
    if (dishName) console.log(`  From caption: "${dishName}"`)
  }
  if (!dishName) {
    dishName = await extractDishNameFromImage(imageBase64)
    if (dishName) console.log(`  From image (AI): "${dishName}"`)
  }
  if (!dishName) {
    console.log('  Could not determine dish name. Stopping.')
    process.exit(1)
  }
  console.log('')

  // 3. Make sure image and dish name match
  console.log('Step 3: Checking image matches dish...')
  const matches = await checkImageMatchesDish(imageBase64, dishName, restaurantName)
  if (!matches) {
    console.log('  FAIL: Image did not pass match check. Pipeline stops (would not go live).')
    process.exit(1)
  }
  console.log('  PASS: Image matches dish.\n')

  // 4. Produce article (description)
  console.log('Step 4: Generating article (description)...')
  const scrapedContent = caption?.trim() || `A dish from ${restaurantName}'s Instagram.`
  const content = await generateCuratedDishContent(dishName, restaurantName, cityName, scrapedContent)
  if (!content) {
    console.log('FAIL: Could not generate article.')
    process.exit(1)
  }
  console.log('  Done.\n')

  // If image came from Instaloader, save to file so you have it for upload
  let imageUrlForOutput = imageUrl
  if (!imageUrlForOutput && imageBase64) {
    const outDir = path.join(process.cwd(), 'output')
    await mkdir(outDir, { recursive: true })
    const safeName = dishName.replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 40)
    const imagePath = path.join(outDir, `${safeName}-${Date.now()}.jpg`)
    await writeFile(imagePath, Buffer.from(imageBase64.data, 'base64'))
    imageUrlForOutput = imagePath
    console.log(`  Image saved to: ${imagePath}\n`)
  }

  // Output for review
  const output = {
    dishName,
    restaurantName,
    cityName,
    imageUrl: imageUrlForOutput,
    description: content.description,
    cuisine: content.cuisine,
    price: content.price,
    quotes: content.quotes,
    pipeline: 'test-full-dish-pipeline',
    readyForReview: true,
  }
  const outPath = path.join(process.cwd(), 'output-dish-for-review.json')
  await writeFile(outPath, JSON.stringify(output, null, 2), 'utf-8')

  console.log('--- Result (ready for you to review before go-live) ---')
  console.log(`Dish: ${output.dishName}`)
  console.log(`Image: ${output.imageUrl}`)
  console.log(`Cuisine: ${output.cuisine ?? '—'}`)
  console.log(`Price: ${output.price != null ? `£${output.price}` : '—'}`)
  console.log(`\nDescription (article):\n${output.description}`)
  console.log(`\nFull output saved to: ${outPath}`)
  console.log('\nNext: If this looks good, you can add the dish via Curated Dish Tool with this image (URL or local path) and description, or we build a review queue where you just say yes/no.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
