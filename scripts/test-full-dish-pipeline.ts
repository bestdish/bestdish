/**
 * Full pipeline test: one Instagram post → dish name, photo, match check, article.
 * Uses the shared runInstagramPostPipeline from lib/curation/instagramPostPipeline.
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
import { runInstagramPostPipeline } from '../lib/curation/instagramPostPipeline'
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

async function main() {
  console.log('--- Full dish pipeline (grab name + photo → match → article) ---\n')
  console.log(`Post: ${postUrl}`)
  console.log(`Restaurant: ${restaurantName}, ${cityName}`)
  if (dishNameOverride) console.log(`Dish name (provided): ${dishNameOverride}`)
  console.log('')

  console.log('Step 1: Grabbing image and caption from Instagram post...')
  const result = await runInstagramPostPipeline({
    postUrl,
    restaurantName,
    cityName,
    dishNameOverride: dishNameOverride || undefined,
    skipMatchCheck: false,
  })

  if (!result.success) {
    console.log(`FAIL: ${result.error}`)
    process.exit(1)
  }

  if (result.extractionFailed) {
    console.log('Image could not be fetched; pipeline returned metadata only.')
    console.log(`Dish name: ${result.dishName}`)
    process.exit(1)
  }

  console.log(`  Dish: ${result.dishName}`)
  console.log(`  Image: ${result.imageUrl ? result.imageUrl.substring(0, 60) + '...' : 'from Instaloader'}`)
  console.log('  Match check: passed')
  console.log('  Article: generated\n')

  // If image came from Instaloader (no URL), save to file for upload
  let imageUrlForOutput = result.imageUrl ?? null
  if (!imageUrlForOutput && result.imageBase64 && result.dishName) {
    const outDir = path.join(process.cwd(), 'output')
    await mkdir(outDir, { recursive: true })
    const safeName = result.dishName.replace(/[^a-z0-9-]/gi, '-').toLowerCase().slice(0, 40)
    const imagePath = path.join(outDir, `${safeName}-${Date.now()}.jpg`)
    await writeFile(imagePath, Buffer.from(result.imageBase64, 'base64'))
    imageUrlForOutput = imagePath
    console.log(`  Image saved to: ${imagePath}\n`)
  }

  const output = {
    dishName: result.dishName,
    restaurantName: result.restaurantName,
    cityName: result.cityName,
    imageUrl: imageUrlForOutput,
    description: result.description,
    cuisine: result.cuisine,
    price: result.price,
    quotes: result.quotes,
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
  console.log('\nNext: If this looks good, you can add the dish via Curated Dish Tool with this image (URL or local path) and description, or use the "From Instagram post" tab.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
