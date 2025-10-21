/**
 * Google Image finder with AI verification
 */

import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ImageSearchResult {
  url: string
  width: number
  height: number
  thumbnail: string
  contextLink?: string  // URL of the page containing the image
}

/**
 * Search Google Images for dish photos
 * Returns images sorted by size (largest first)
 */
export async function searchDishImages(
  dishName: string,
  restaurantName: string
): Promise<ImageSearchResult[]> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID
  
  if (!apiKey || !searchEngineId) {
    console.log('    ⚠️  Google Custom Search not configured')
    return []
  }
  
  try {
    // Simplified search query: just restaurant name + dish name
    const query = `${restaurantName} ${dishName}`
    // Removed imgSize filter - let our pixel filter handle quality
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&searchType=image&num=10&safe=active`
    
    console.log(`    🔍 Searching: "${query}"`)
    const response = await axios.get(url, { timeout: 10000 })
    
    if (!response.data.items || response.data.items.length === 0) {
      console.log('    ⚠️  No images found in search results')
      return []
    }
    
    console.log(`    ✓ Found ${response.data.items.length} total images`)
    
    // Map all images with their source page context
    const allImages: ImageSearchResult[] = response.data.items
      .map((item: any) => ({
        url: item.link,
        width: parseInt(item.image?.width || '0'),
        height: parseInt(item.image?.height || '0'),
        thumbnail: item.image?.thumbnailLink || item.link,
        contextLink: item.image?.contextLink || item.link // Source page URL
      }))
    
    // Sort by total pixel count (largest first)
    const sortedImages = allImages
      .sort((a, b) => (b.width * b.height) - (a.width * a.height))
    
    // Log sizes for debugging
    console.log(`    Image sizes (sorted):`, sortedImages.map(img => `${img.width}x${img.height} (${(img.width * img.height / 1000000).toFixed(1)}MP)`).join(', '))
    
    // Filter for web-quality images optimized for 13" screens and mobile
    // Allows smaller images since they look great on modern displays with good scaling
    const MIN_DIMENSION = 400 // At least one side should be 400px for hero images
    const MIN_PIXELS = 120000 // 0.12MP (e.g., 300×400px or 346×346px square)
    
    const images = sortedImages
      .filter((item) => {
        const totalPixels = item.width * item.height
        const hasDecentDimension = item.width >= MIN_DIMENSION || item.height >= MIN_DIMENSION
        const hasDecentPixels = totalPixels >= MIN_PIXELS
        return hasDecentDimension || hasDecentPixels
      })
      .slice(0, 10)
    
    console.log(`    ✓ Found ${images.length} web-quality images (400px+ dimension or 0.12MP+)`)
    return images
  } catch (error: any) {
    console.log(`    ❌ Image search failed: ${error.response?.data?.error?.message || error.message}`)
    return []
  }
}

/**
 * Extract text content from HTML
 */
function extractTextFromHTML(html: string): string {
  try {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ')
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
    text = text.replace(/&amp;/g, '&')
    text = text.replace(/&lt;/g, '<')
    text = text.replace(/&gt;/g, '>')
    text = text.replace(/&quot;/g, '"')
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim()
    
    // Limit to first 5000 characters for analysis
    return text.substring(0, 5000)
  } catch (error) {
    return ''
  }
}

/**
 * Analyze source page context to verify image is from the specific restaurant
 */
async function analyzeSourcePageContext(
  contextLink: string,
  restaurantName: string,
  dishName: string
): Promise<{ confidence: 'high' | 'medium' | 'low', restaurantMentions: number, dishMentions: number }> {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey || !contextLink) {
    return { confidence: 'low', restaurantMentions: 0, dishMentions: 0 }
  }
  
  try {
    // Fetch the source page HTML
    console.log(`      📄 Analyzing page: ${contextLink.substring(0, 60)}...`)
    const response = await axios.get(contextLink, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      maxContentLength: 500000 // Limit to 500KB
    })
    
    const pageText = extractTextFromHTML(response.data)
    
    if (!pageText || pageText.length < 50) {
      console.log(`      ⚠️  Could not extract text from page`)
      return { confidence: 'low', restaurantMentions: 0, dishMentions: 0 }
    }
    
    // Use Gemini to analyze the text
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    const prompt = `Analyze this webpage text and count mentions of the restaurant and dish.

RESTAURANT NAME: "${restaurantName}"
DISH NAME: "${dishName}"

WEBPAGE TEXT:
${pageText}

TASK: Count how many times the restaurant name and dish name appear (or close variations).
- Look for exact matches and reasonable variations (e.g., "Vincenzo's" matches "Vincenzo Trattoria")
- Case insensitive matching
- Return confidence based on mentions

OUTPUT: Return ONLY valid JSON in this format:
{
  "restaurantMentions": <number>,
  "dishMentions": <number>,
  "confidence": "high" | "medium" | "low"
}

CONFIDENCE RULES:
- "high": Both restaurant AND dish mentioned (at least 1 each)
- "medium": Only dish mentioned OR only restaurant mentioned
- "low": Neither mentioned clearly

Return ONLY the JSON, nothing else.`
    
    const result = await model.generateContent(prompt)
    const resultText = result.response.text().trim()
    
    // Extract JSON from response
    const jsonMatch = resultText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.log(`      ⚠️  Could not parse AI response`)
      return { confidence: 'low', restaurantMentions: 0, dishMentions: 0 }
    }
    
    const analysis = JSON.parse(jsonMatch[0])
    console.log(`      ✓ Page analysis: ${analysis.restaurantMentions} restaurant mentions, ${analysis.dishMentions} dish mentions (${analysis.confidence} confidence)`)
    
    return analysis
  } catch (error: any) {
    console.log(`      ⚠️  Page analysis failed: ${error.message}`)
    return { confidence: 'low', restaurantMentions: 0, dishMentions: 0 }
  }
}

/**
 * Verify a single image is a high-quality photo of the dish
 */
async function verifySingleImage(
  imageUrl: string,
  dishName: string,
  restaurantName: string
): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    return false
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })
    
    const prompt = `You are a strict food photography validator. Analyze this image URL and determine if it shows ACTUAL PREPARED FOOD as the primary subject.

IMAGE URL: ${imageUrl}

REQUIRED FOR YES (ALL must be true):
1. Image shows PLATED FOOD or PREPARED DISH as 80%+ of the frame
2. Food is clearly visible, in focus, well-lit, and looks appetizing
3. Food is on a plate, bowl, or serving vessel (not raw ingredients alone)

AUTOMATIC NO IF IMAGE SHOWS:
❌ Restaurant buildings, exteriors, or storefronts
❌ Restaurant interiors (tables, chairs, empty dining rooms)
❌ Signs, logos, or text-heavy images
❌ People eating, hands holding food, or diners
❌ Menus, wine lists, or promotional materials
❌ Bar interiors or empty cocktail glasses (unless drink IS the main dish)
❌ Kitchen equipment or appliances
❌ Raw ingredients before cooking (unless that IS the dish presentation)
❌ Blurry, dark, or unclear images where food isn't recognizable
❌ Stock photos or generic food (not restaurant-specific)

STRICT RULE: If you have ANY doubt, answer NO.

Respond with ONLY:
"YES" - if it's definitely a high-quality photo of PREPARED FOOD as the main subject
"NO" - for everything else (interiors, signs, people, unclear images, etc.)`
    
    const result = await model.generateContent(prompt)
    const response = result.response.text().trim().toUpperCase()
    
    const isValid = response.includes('YES')
    console.log(`      ${isValid ? '✓' : '✗'} Image verification: ${response}`)
    
    return isValid
  } catch (error: any) {
    console.log(`      ❌ Image verification failed: ${error.message}`)
    return false
  }
}

/**
 * Main function: Search and verify dish photo with context analysis
 */
export async function findVerifiedDishPhoto(
  dishName: string,
  restaurantName: string
): Promise<string | null> {
  console.log(`    🔍 Searching for: ${restaurantName} - ${dishName}`)
  
  const images = await searchDishImages(dishName, restaurantName)
  
  if (images.length === 0) {
    console.log(`    ❌ No images found`)
    return null
  }
  
  console.log(`    🤖 Verifying images sequentially...`)
  
  // Try each image in order (largest first)
  for (let i = 0; i < images.length; i++) {
    const image = images[i]
    console.log(`    \n    📸 Checking image ${i + 1}/${images.length} (${image.width}x${image.height})`)
    console.log(`      URL: ${image.url.substring(0, 70)}...`)
    
    // Step 1: Analyze source page context (if available)
    if (image.contextLink) {
      const pageAnalysis = await analyzeSourcePageContext(
        image.contextLink,
        restaurantName,
        dishName
      )
      
      // Only proceed if page has high confidence (mentions both restaurant and dish)
      if (pageAnalysis.confidence !== 'high') {
        console.log(`      ✗ Skipping - page confidence too low (${pageAnalysis.confidence})`)
        continue
      }
    } else {
      console.log(`      ⚠️  No context link available, skipping page analysis`)
    }
    
    // Step 2: Verify the image itself
    const isValid = await verifySingleImage(image.url, dishName, restaurantName)
    
    if (isValid) {
      console.log(`    \n    ✅ Found suitable image!`)
      return image.url
    }
    
    console.log(`      ✗ Image not suitable, trying next...`)
  }
  
  console.log(`    \n    ❌ No suitable images found after checking ${images.length} candidates`)
  return null
}

