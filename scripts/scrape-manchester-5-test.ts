/**
 * Test Version - Bulk Manchester Scraper
 * Scrapes only 5 dishes for quick testing
 */

import { prisma } from '../lib/prisma'
import { searchRestaurantArticles, combineContent } from '../lib/scraper/sources/web-scraper'
import { analyzeDishContent, generateFAQs } from '../lib/scraper/ai-analyzer'
import { slugify } from '../lib/seo'
import { normalizeCuisine } from '../lib/curation/cuisineMapper'

interface RestaurantLead {
  name: string
  address?: string
}

/**
 * Find top restaurants from Google Places (test version - 5 only)
 */
async function findTop5Restaurants(): Promise<RestaurantLead[]> {
  console.log('🔍 Finding top Manchester restaurants from Google Places (test: 5 only)...')
  
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY not configured')
  }
  
  // Just get first page (20 results)
  const query = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=best+restaurants+in+Manchester+UK&type=restaurant&key=${apiKey}`
  
  const response = await fetch(query)
  const data = await response.json()
  
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.log(`  ⚠️  API status: ${data.status}`)
    if (data.error_message) {
      console.log(`  Error: ${data.error_message}`)
    }
    throw new Error(`Google Places API error: ${data.status}`)
  }
  
  const allPlaces = data.results || []
  console.log(`  ✓ Got ${allPlaces.length} results from Google Places`)
  
  // Filter to high-rated restaurants and take top 5
  const topPlaces = allPlaces
    .filter((p: any) => p.rating && p.rating >= 4.0 && p.user_ratings_total >= 50)
    .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 5)
  
  console.log(`✓ Filtered to ${topPlaces.length} highly-rated restaurants (4.0⭐+, 50+ reviews)`)
  
  return topPlaces.map((p: any) => ({
    name: p.name,
    address: p.formatted_address || p.vicinity
  }))
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
  
  const handles = new Map<string, number>()
  
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
  
  let bestHandle = ''
  let maxCount = 0
  
  for (const [handle, count] of handles.entries()) {
    if (count > maxCount) {
      bestHandle = handle
      maxCount = count
    }
  }
  
  const confidence = Math.min((maxCount / 4) * 100, 100)
  
  return { 
    handle: confidence >= 99 ? `@${bestHandle}` : null,
    confidence 
  }
}

/**
 * Process a single restaurant
 */
async function processRestaurant(lead: RestaurantLead, city: any, index: number, total: number): Promise<boolean> {
  console.log(`\n[${index}/${total}] 📍 ${lead.name}`)
  
  try {
    console.log(`  🔍 Searching web...`)
    const articles = await searchRestaurantArticles(lead.name, city.name)
    
    if (articles.length === 0) {
      console.log(`  ⚠ No articles found, skipping`)
      return false
    }
    
    console.log(`  ✓ Found ${articles.length} articles`)
    
    const combinedContent = combineContent(articles, [])
    
    if (combinedContent.length < 200) {
      console.log(`  ⚠ Insufficient content, skipping`)
      return false
    }
    
    const instagram = extractInstagramHandle(combinedContent, lead.name)
    if (instagram.handle) {
      console.log(`  📱 Instagram: ${instagram.handle} (${instagram.confidence.toFixed(0)}% confidence)`)
    }
    
    console.log(`  🤖 Analyzing with AI...`)
    const analysis = await analyzeDishContent(lead.name, city.name, combinedContent)
    
    if (!analysis) {
      console.log(`  ✗ AI analysis failed`)
      return false
    }
    
    console.log(`  ✓ Identified: ${analysis.bestDish}`)
    if (analysis.price) console.log(`  💰 Price: £${analysis.price.toFixed(2)}`)
    
    const addressMatch = combinedContent.match(/\d+\s+[A-Z][a-zA-Z\s]+,\s*Manchester[^,]*M\d+\s*\d[A-Z]{2}/i)
    const address = addressMatch ? addressMatch[0] : null
    
    const websiteMatch = combinedContent.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i)
    let website = websiteMatch ? websiteMatch[0] : null
    if (website && (website.includes('google') || website.includes('facebook') || website.includes('instagram'))) {
      website = null
    }
    
    const cuisine = analysis.cuisine ? normalizeCuisine(analysis.cuisine) : null
    console.log(`  🍽️  Cuisine: ${cuisine || 'Unknown'}`)
    
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
    
    const restaurantSlug = slugify(lead.name)
    let restaurant = await prisma.restaurant.findFirst({
      where: {
        slug: restaurantSlug,
        cityId: city.id
      }
    })
    
    if (!restaurant) {
      console.log(`  🏪 Creating restaurant...`)
      restaurant = await prisma.restaurant.create({
        data: {
          name: lead.name,
          slug: restaurantSlug,
          address: address,
          website: website,
          cuisine: cuisine,
          instagramHandle: instagram.handle,
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
          cuisine: cuisine || restaurant.cuisine,
          instagramHandle: instagram.handle || restaurant.instagramHandle
        }
      })
    }
    
    const dishSlug = slugify(analysis.bestDish)
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
    
    const editorialQuote = analysis.quotes.length > 0 ? analysis.quotes[0] : null
    
    console.log(`  💾 Creating pending dish...`)
    await prisma.dish.create({
      data: {
        name: analysis.bestDish,
        slug: dishSlug,
        description: analysis.description,
        price: analysis.price,
        photoUrl: null,
        restaurantId: restaurant.id,
        isBest: false,
        isFeatured: false,
        editorialQuote: editorialQuote?.text || null,
        editorialSource: editorialQuote?.source || null,
        editorialUrl: editorialQuote?.url || null,
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
  console.log('🚀 Starting Manchester TEST scraper (5 dishes only)...\n')
  
  try {
    const city = await prisma.city.findUnique({
      where: { slug: 'manchester' }
    })
    
    if (!city) {
      throw new Error('Manchester city not found in database')
    }
    
    console.log(`✓ Found city: ${city.name}\n`)
    
    const restaurants = await findTop5Restaurants()
    console.log(`\n📋 Processing ${restaurants.length} restaurants...\n`)
    
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < restaurants.length; i++) {
      const success = await processRestaurant(restaurants[i], city, i + 1, restaurants.length)
      
      if (success) {
        successCount++
      } else {
        failCount++
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    console.log(`\n✅ Test scraping complete!`)
    console.log(`   Success: ${successCount} dishes`)
    console.log(`   Failed: ${failCount} restaurants`)
    console.log(`\n👉 View pending dishes at: /admin/pending-dishes`)
    console.log(`\n💡 To run full scraper (100 dishes): npx tsx scripts/scrape-manchester-100-pending.ts`)
    
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

