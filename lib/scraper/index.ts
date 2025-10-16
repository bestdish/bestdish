/**
 * Main scraper orchestrator
 */

import { fetchGoogleReviews } from '@/lib/scraper/sources/google-reviews'
import { searchRestaurantArticles, combineContent } from '@/lib/scraper/sources/web-scraper'
import { analyzeDishContent, generateFallbackDescription, selectBestQuote, generateFAQs } from '@/lib/scraper/ai-analyzer'
import { findVerifiedDishPhoto } from '@/lib/scraper/google-image-finder'
import { downloadAndUploadPhoto } from '@/lib/scraper/photo-finder'
import { publishDish, updateRestaurantCuisine } from '@/lib/scraper/publisher'

export interface Restaurant {
  id: string
  name: string
  googlePlaceId: string | null
  cuisine: string | null
  photoUrl: string | null
  website: string | null
  address: string | null
  city: {
    name: string
    slug: string
  }
}

export interface ScraperResult {
  restaurantId: string
  restaurantName: string
  success: boolean
  dishName?: string
  confidence?: string
  error?: string
}

/**
 * Process a single restaurant
 */
export async function processRestaurant(restaurant: Restaurant): Promise<ScraperResult> {
  console.log(`\n📍 Processing: ${restaurant.name}`)
  
  try {
    // Step 1: Scrape Google Reviews
    console.log(`  🔍 Fetching Google reviews...`)
    let reviewText = ''
    
    if (restaurant.googlePlaceId) {
      const { reviews, error } = await fetchGoogleReviews(restaurant.googlePlaceId)
      if (!error && reviews.length > 0) {
        console.log(`  ✓ Found ${reviews.length} reviews`)
        reviewText = reviews.map(r => r.text).join('\n\n')
      } else {
        console.log(`  ⚠ No reviews found`)
      }
    } else {
      console.log(`  ⚠ No Google Place ID, skipping reviews`)
    }
    
    // Step 2: Scrape food blog articles
    console.log(`  📰 Searching food blogs...`)
    const articles = await searchRestaurantArticles(restaurant.name, restaurant.city.name)
    console.log(`  ✓ Found ${articles.length} articles`)
    
    // Step 3: Combine all content
    const combinedContent = combineContent(
      articles,
      reviewText ? [{ text: reviewText }] : []
    )
    
    if (combinedContent.length < 200) {
      console.log(`  ⚠ Insufficient content (${combinedContent.length} chars), skipping`)
      return {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        success: false,
        error: 'Insufficient scraped content'
      }
    }
    
    // Step 4: AI Analysis
    console.log(`  🤖 Analyzing with Gemini AI...`)
    const analysis = await analyzeDishContent(
      restaurant.name,
      restaurant.city.name,
      combinedContent
    )
    
    if (!analysis) {
      console.log(`  ✗ AI analysis failed`)
      return {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        success: false,
        error: 'AI analysis failed'
      }
    }
    
    console.log(`  ✓ Identified: ${analysis.bestDish} (${analysis.confidence} confidence)`)
    if (analysis.price) console.log(`  💰 Price: £${analysis.price.toFixed(2)}`)
    
    // Step 5: Select editorial quote
    console.log(`  📰 Selecting editorial quote...`)
    const editorialQuote = selectBestQuote(analysis.quotes, articles)
    if (editorialQuote) {
      console.log(`  ✓ Found quote from: ${editorialQuote.source}`)
    } else {
      console.log(`  ⚠ No suitable editorial quote found`)
    }
    
    // Step 6: Generate FAQs
    console.log(`  ❓ Generating FAQs...`)
    const faqs = await generateFAQs(
      restaurant.name,
      analysis.bestDish,
      restaurant.city.name,
      analysis.cuisine || restaurant.cuisine,
      analysis.price,
      restaurant.website,
      restaurant.address
    )
    console.log(`  ✓ Generated ${faqs.length} FAQ items`)
    
    // Step 7: Find dish photo with Google Image Search + AI verification
    console.log(`  🖼️  Finding dish photo...`)
    const verifiedImageUrl = await findVerifiedDishPhoto(
      analysis.bestDish,
      restaurant.name
    )
    
    let uploadedPhotoPath: string | null = null
    
    if (verifiedImageUrl) {
      // Download and upload to Supabase
      uploadedPhotoPath = await downloadAndUploadPhoto(verifiedImageUrl, analysis.bestDish)
      
      if (!uploadedPhotoPath) {
        console.log(`  ⚠ Photo upload failed, using original URL`)
        uploadedPhotoPath = verifiedImageUrl
      } else {
        console.log(`  ✓ Photo uploaded: ${uploadedPhotoPath}`)
      }
    } else {
      console.log(`  ⚠ No suitable photo found - will need manual upload`)
      // Continue without photo - can be added manually later
    }
    
    // Step 8: Publish to database with editorial data
    console.log(`  💾 Publishing to database...`)
    const publishResult = await publishDish(
      restaurant.id,
      analysis,
      uploadedPhotoPath,
      editorialQuote?.quote || null,
      editorialQuote?.source || null,
      editorialQuote?.url || null,
      faqs
    )
    
    if (!publishResult.success) {
      console.log(`  ✗ Publish failed: ${publishResult.error}`)
      return {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        success: false,
        error: publishResult.error
      }
    }
    
    // Step 9: Update cuisine if detected
    if (analysis.cuisine) {
      await updateRestaurantCuisine(restaurant.id, analysis.cuisine)
    }
    
    if (uploadedPhotoPath) {
      console.log(`  ✅ PUBLISHED: ${analysis.bestDish}`)
    } else {
      console.log(`  ✅ DRAFT SAVED: ${analysis.bestDish}`)
      console.log(`  📋 Ready for review in Admin → Pending Dishes`)
    }
    if (editorialQuote) console.log(`  📰 With editorial quote from ${editorialQuote.source}`)
    console.log(`  ❓ With ${faqs.length} FAQ items`)
    
    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      success: true,
      dishName: analysis.bestDish,
      confidence: analysis.confidence
    }
  } catch (error) {
    console.error(`  ✗ Error processing ${restaurant.name}:`, error)
    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Process multiple restaurants with delay between each
 * Stops after targetCount successes
 */
export async function processRestaurants(
  restaurants: Restaurant[],
  targetCount: number = 20,
  delayMs: number = 2000
): Promise<ScraperResult[]> {
  const results: ScraperResult[] = []
  let successCount = 0
  
  for (let i = 0; i < restaurants.length && successCount < targetCount; i++) {
    const restaurant = restaurants[i]
    console.log(`\n[${i + 1}/${restaurants.length}] Success: ${successCount}/${targetCount}`)
    
    const result = await processRestaurant(restaurant)
    results.push(result)
    
    if (result.success) {
      successCount++
      console.log(`  🎯 Success count: ${successCount}/${targetCount}`)
    }
    
    // Stop if we've hit our target
    if (successCount >= targetCount) {
      console.log(`\n🎉 Target reached! Processed ${successCount} successful dishes.`)
      break
    }
    
    // Delay between requests to be polite
    if (i < restaurants.length - 1) {
      console.log(`  ⏳ Waiting ${delayMs/1000}s before next...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  return results
}

