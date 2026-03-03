/**
 * Shared pipeline: Instagram post URL → image, dish name, match check, article.
 * Used by the test script and by the "From Instagram post" API route.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { extractInstagramPostData } from './instagramExtractor'
import { downloadInstagramWithInstaloader } from './instaloaderExtractor'
import { generateCuratedDishContent } from './aiContentGenerator'

export interface InstagramPostPipelineOptions {
  postUrl: string
  restaurantName: string
  cityName: string
  dishNameOverride?: string | null
  /** If true, skip the "image matches dish" check (e.g. for API when user will review) */
  skipMatchCheck?: boolean
}

export interface InstagramPostPipelineResult {
  success: boolean
  /** True when we have metadata (dish name, description) but could not get image */
  extractionFailed?: boolean
  imageUrl?: string | null
  imageBase64?: string | null
  dishName?: string
  restaurantName?: string
  cityName?: string
  instagramHandle?: string
  caption?: string | null
  description?: string
  price?: number | null
  cuisine?: string | null
  quotes?: Array<{ text: string; source: string; url?: string }>
  /** Only set when skipMatchCheck is false */
  matches?: boolean
  error?: string
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
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  const genAI = new GoogleGenerativeAI(apiKey)
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
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return null
  const genAI = new GoogleGenerativeAI(apiKey)
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
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return false
  const genAI = new GoogleGenerativeAI(apiKey)
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

/**
 * Run the full pipeline: get image + caption from post, resolve dish name, optional match check, generate article.
 * When image extraction fails, returns success: true with extractionFailed: true and metadata so UI can pre-fill and ask for upload.
 */
export async function runInstagramPostPipeline(
  options: InstagramPostPipelineOptions
): Promise<InstagramPostPipelineResult> {
  const { postUrl, restaurantName, cityName, dishNameOverride, skipMatchCheck = false } = options

  // 1. Get image + caption
  const { imageUrl: imageUrlFromPost, caption } = await extractInstagramPostData(postUrl)
  let imageUrl: string | null = imageUrlFromPost
  let imageBase64: { data: string; mimeType: string } | null = null

  if (imageUrl) {
    imageBase64 = await fetchImageAsBase64(imageUrl)
  }
  if (!imageBase64) {
    const base64FromInstaloader = await downloadInstagramWithInstaloader(postUrl)
    if (base64FromInstaloader) {
      imageBase64 = { data: base64FromInstaloader, mimeType: 'image/jpeg' }
      imageUrl = null
    }
  }

  // 2. Dish name (override, caption, or image AI)
  let dishName: string | null = dishNameOverride?.trim() || null
  if (!dishName && caption?.trim()) {
    dishName = await extractDishNameFromCaption(caption)
  }
  if (!dishName && imageBase64) {
    dishName = await extractDishNameFromImage(imageBase64)
  }
  if (!dishName) {
    return {
      success: false,
      error: 'Could not determine dish name from caption or image.',
    }
  }

  // If we have no image, return metadata only so UI can ask for upload
  if (!imageBase64) {
    const scrapedContent = caption?.trim() || `A dish from ${restaurantName}'s Instagram.`
    const content = await generateCuratedDishContent(dishName, restaurantName, cityName, scrapedContent)
    return {
      success: true,
      extractionFailed: true,
      dishName,
      restaurantName,
      cityName,
      caption: caption ?? null,
      description: content?.description,
      price: content?.price ?? null,
      cuisine: content?.cuisine ?? null,
      quotes: content?.quotes,
    }
  }

  // 3. Optional match check
  if (!skipMatchCheck) {
    const matches = await checkImageMatchesDish(imageBase64, dishName, restaurantName)
    if (!matches) {
      return {
        success: false,
        error: 'Image did not pass match check (not real food or does not match dish).',
        dishName,
        restaurantName,
        cityName,
        matches: false,
      }
    }
  }

  // 4. Generate article
  const scrapedContent = caption?.trim() || `A dish from ${restaurantName}'s Instagram.`
  const content = await generateCuratedDishContent(dishName, restaurantName, cityName, scrapedContent)
  if (!content) {
    return {
      success: false,
      error: 'Could not generate article.',
      dishName,
      restaurantName,
      cityName,
    }
  }

  return {
    success: true,
    extractionFailed: false,
    imageUrl: imageUrl ?? undefined,
    imageBase64: imageUrl ? undefined : imageBase64.data,
    dishName,
    restaurantName,
    cityName,
    caption: caption ?? null,
    description: content.description,
    price: content.price ?? null,
    cuisine: content.cuisine ?? null,
    quotes: content.quotes,
    matches: skipMatchCheck ? undefined : true,
  }
}
