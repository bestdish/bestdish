/**
 * Bulk Manchester Scraper
 * Scrapes top 100 dishes in Manchester and saves as pending (no photos)
 */

import { prisma } from '../lib/prisma'
import { searchRestaurantArticles, combineContent } from '../lib/scraper/sources/web-scraper'
import { analyzeDishContent, generateFAQs } from '../lib/scraper/ai-analyzer'
import { slugify } from '../lib/seo'
import { normalizeCuisine } from '../lib/curation/cuisineMapper'
import { articlesToDescriptionSources } from '../lib/descriptionSources'

interface RestaurantLead {
  name: string
  address?: string
  placeId: string
  rating?: number
  totalRatings?: number
}

/**
 * Find top 100 Manchester restaurants from Google Places API
 */
async function findTop100Restaurants(): Promise<RestaurantLead[]> {
  console.log('🔍 Finding top 100 Manchester restaurants from Google Places...')
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY not configured')
  }
  
  let allPlaces: any[] = []
  let nextPageToken: string | undefined = undefined
  let pageNum = 0
  
  // Fetch restaurants from Google Places Text Search
  while (pageNum < 6 && allPlaces.length < 200) { // Get 200 to have enough after filtering
    const query = nextPageToken
      ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${apiKey}`
      : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=best+restaurants+in+Manchester+UK&type=restaurant&key=${apiKey}`
    
    const response = await fetch(query)
    const data = await response.json()
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.log(`  ⚠️  API status: ${data.status}`)
      break
    }
    
    allPlaces = [...allPlaces, ...(data.results || [])]
    console.log(`  Page ${pageNum + 1}: +${data.results?.length || 0} (total: ${allPlaces.length})`)
    
    nextPageToken = data.next_page_token
    if (!nextPageToken) break
    
    pageNum++
    // Google requires 2s delay between page requests
    if (nextPageToken) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  // Filter to high-rated restaurants (4.0+ stars, 50+ reviews)
  const topPlaces = allPlaces
    .filter(p => p.rating && p.rating >= 4.0 && p.user_ratings_total >= 50)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 100)
  
  console.log(`✓ Found ${topPlaces.length} highly-rated restaurants (4.0⭐+, 50+ reviews)`)
  
  return topPlaces.map(p => ({
    name: p.name,
    address: p.formatted_address || p.vicinity,
    placeId: p.place_id,
    rating: p.rating,
    totalRatings: p.user_ratings_total
  }))
}

/**
 * Get detailed place information from Google Places API
 */
async function getPlaceDetails(placeId: string, apiKey: string): Promise<any> {
  try {
    const fields = [
      'name',
      'formatted_address',
      'website',
      'formatted_phone_number',
      'url', // Google Maps URL
      'types'
    ].join(',')
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`
    )
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    if (data.status !== 'OK') {
      return null
    }
    
    return data.result
  } catch (error) {
    console.error(`Error fetching place details:`, error)
    return null
  }
}

/**
 * Extract Instagram handle with confidence from web content
 */
function extractInstagramHandle(content: string, restaurantName: string): { handle: string | null, confidence: number } {
  const instagramPatterns = [
    /@([a-zA-Z0-9._]{3,30})(?:\s|$|[^a-zA-Z0-9._])/g,
    /instagram\.com\/([a-zA-Z0-9._]{3,30})/g,
    /instagram:\s*@?([a-zA-Z0-9._]{3,30})/gi,
    /follow.*@([a-zA-Z0-9._]{3,30})/gi
  ]
  
  const handles = new Map<string, number>() // handle -> count
  
  for (const pattern of instagramPatterns) {
    const matches = content.matchAll(pattern)
    for (const match of matches) {
      const handle = match[1].toLowerCase()
      if (handle && handle.length >= 3) {
        handles.set(handle, (handles.get(handle) || 0) + 1)
      }
    }
  }
  
  if (handles.size === 0) return { handle: null, confidence: 0 }
  
  // Find most common handle
  let bestHandle = ''
  let maxCount = 0
  
  for (const [handle, count] of handles.entries()) {
    if (count > maxCount) {
      bestHandle = handle
      maxCount = count
    }
  }
  
  // Confidence = (occurrences / total_patterns) * 100
  // If handle appears 4+ times across different sources, high confidence
  const confidence = Math.min((maxCount / 4) * 100, 100)
  
  return { 
    handle: confidence >= 99 ? `@${bestHandle}` : null,
    confidence 
  }
}

/**
 * Process a single restaurant
 */
async function processRestaurant(lead: RestaurantLead, city: any, index: number, total: number, apiKey: string): Promise<boolean> {
  console.log(`\n[${index}/${total}] 📍 ${lead.name}`)
  
  try {
    // Step 1: Get detailed place info from Google Places API
    console.log(`  🏢 Fetching place details...`)
    const placeDetails = await getPlaceDetails(lead.placeId, apiKey)
    
    const website = placeDetails?.website || null
    const phone = placeDetails?.formatted_phone_number || null
    const googleMapsUrl = placeDetails?.url || null
    
    if (website) console.log(`  🌐 Website: ${website}`)
    if (phone) console.log(`  📞 Phone: ${phone}`)
    
    // Step 2: Search for restaurant info
    console.log(`  🔍 Searching web...`)
    const articles = await searchRestaurantArticles(lead.name, city.name)
    
    if (articles.length === 0) {
      console.log(`  ⚠ No articles found, skipping`)
      return false
    }
    
    console.log(`  ✓ Found ${articles.length} articles`)
    
    // Step 2: Combine content
    const combinedContent = combineContent(articles, [])
    
    if (combinedContent.length < 200) {
      console.log(`  ⚠ Insufficient content, skipping`)
      return false
    }
    
    // Step 3: Extract Instagram handle with confidence
    const instagram = extractInstagramHandle(combinedContent, lead.name)
    if (instagram.handle) {
      console.log(`  📱 Instagram: ${instagram.handle} (${instagram.confidence.toFixed(0)}% confidence)`)
    }
    
    // Step 4: AI Analysis
    console.log(`  🤖 Analyzing with AI...`)
    const analysis = await analyzeDishContent(lead.name, city.name, combinedContent)
    
    if (!analysis) {
      console.log(`  ✗ AI analysis failed`)
      return false
    }
    
    console.log(`  ✓ Identified: ${analysis.bestDish}`)
    if (analysis.price) console.log(`  💰 Price: £${analysis.price.toFixed(2)}`)
    
    // Step 5: Use Google Places data (already have address from Step 1)
    const address = lead.address || null
    // Website and phone already extracted in Step 1
    if (address) console.log(`  📍 Address: ${address.substring(0, 50)}...`)
    
    // Step 6: Normalize cuisine
    const cuisine = analysis.cuisine ? normalizeCuisine(analysis.cuisine) : null
    console.log(`  🍽️  Cuisine: ${cuisine || 'Unknown'}`)
    
    // Step 7: Generate FAQs
    console.log(`  ❓ Generating FAQs...`)
    const faqs = await generateFAQs(
      lead.name,
      analysis.bestDish,
      city.name,
      cuisine,
      analysis.price,
      website,
      address
    )
    console.log(`  ✓ Generated ${faqs.length} FAQs`)
    
    // Step 8: Check if restaurant exists
    const restaurantSlug = slugify(lead.name)
    let restaurant = await prisma.restaurant.findFirst({
      where: {
        slug: restaurantSlug,
        cityId: city.id
      }
    })
    
    // Step 9: Create or update restaurant
    if (!restaurant) {
      console.log(`  🏪 Creating restaurant...`)
      restaurant = await prisma.restaurant.create({
        data: {
          name: lead.name,
          slug: restaurantSlug,
          address: address,
          website: website,
          phone: phone,
          cuisine: cuisine,
          instagramHandle: instagram.handle,
          rating: lead.rating,
          googlePlaceId: lead.placeId,
          menuUrl: googleMapsUrl, // Store Google Maps URL in menuUrl field
          cityId: city.id,
          isActive: true
        }
      })
    } else {
      console.log(`  🏪 Updating restaurant...`)
      restaurant = await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: {
          address: address || restaurant.address,
          website: website || restaurant.website,
          phone: phone || restaurant.phone,
          cuisine: cuisine || restaurant.cuisine,
          instagramHandle: instagram.handle || restaurant.instagramHandle,
          rating: lead.rating || restaurant.rating,
          googlePlaceId: lead.placeId || restaurant.googlePlaceId,
          menuUrl: googleMapsUrl || restaurant.menuUrl
        }
      })
    }
    
    // Step 10: Check if dish already exists
    const dishOnlySlug = slugify(analysis.bestDish)
    const dishSlug = `${restaurantSlug}-${dishOnlySlug}`
    const existingDish = await prisma.dish.findFirst({
      where: {
        slug: dishSlug,
        restaurantId: restaurant.id
      }
    })
    
    if (existingDish) {
      console.log(`  ⚠ Dish already exists, skipping`)
      return false
    }
    
    // Step 11: Extract editorial quote
    const editorialQuote = analysis.quotes.length > 0 ? analysis.quotes[0] : null
    const descriptionSources = articlesToDescriptionSources(articles)

    // Step 12: Create pending dish (no photo)
    console.log(`  💾 Creating pending dish...`)
    await prisma.dish.create({
      data: {
        name: analysis.bestDish,
        slug: dishSlug,
        description: analysis.description,
        price: analysis.price,
        photoUrl: null, // No photo - manual upload required
        restaurantId: restaurant.id,
        isBest: false, // Pending state
        isFeatured: false,
        editorialQuote: editorialQuote?.text || null,
        editorialSource: editorialQuote?.source || null,
        editorialUrl: editorialQuote?.url || null,
        descriptionSources: descriptionSources.length > 0 ? descriptionSources : null,
        faqAnswers: faqs as any
      }
    })
    
    console.log(`  ✅ Created as pending dish`)
    return true
    
  } catch (error) {
    console.error(`  ❌ Error:`, error instanceof Error ? error.message : error)
    return false
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Manchester bulk scraper...\n')
  
  try {
    // Get Manchester city
    const city = await prisma.city.findUnique({
      where: { slug: 'manchester' }
    })
    
    if (!city) {
      throw new Error('Manchester city not found in database')
    }
    
    console.log(`✓ Found city: ${city.name}\n`)
    
    // Find restaurants
    const restaurants = await findTop100Restaurants()
    console.log(`\n📋 Processing ${restaurants.length} restaurants...\n`)
    
    // Get API key for place details
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY not configured')
    }
    
    let successCount = 0
    let failCount = 0
    
    // Process each restaurant
    for (let i = 0; i < restaurants.length; i++) {
      const success = await processRestaurant(restaurants[i], city, i + 1, restaurants.length, apiKey)
      
      if (success) {
        successCount++
      } else {
        failCount++
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Progress update every 10
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 Progress: ${i + 1}/${restaurants.length} | Success: ${successCount} | Failed: ${failCount}\n`)
      }
    }
    
    console.log(`\n✅ Scraping complete!`)
    console.log(`   Success: ${successCount} dishes`)
    console.log(`   Failed: ${failCount} restaurants`)
    console.log(`\n👉 View pending dishes at: /admin/pending-dishes`)
    
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

