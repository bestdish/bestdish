/**
 * Bulk Manchester Scraper
 * Scrapes top 100 dishes in Manchester and saves as pending (no photos)
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
 * Find top 100 Manchester restaurants from Google
 */
async function findTop100Restaurants(): Promise<RestaurantLead[]> {
  console.log('🔍 Finding top 100 Manchester restaurants...')
  
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID
  
  if (!apiKey || !searchEngineId) {
    throw new Error('Google Custom Search not configured')
  }
  
  const restaurants: RestaurantLead[] = []
  const queries = [
    'best restaurants Manchester 2024',
    'top rated restaurants Manchester',
    'must try restaurants Manchester',
    'Manchester fine dining',
    'Manchester food guide best dishes',
    'Manchester restaurants awards',
    'best places to eat Manchester',
    'Manchester restaurant guide',
    'top 50 restaurants Manchester',
    'Manchester food scene best'
  ]
  
  for (const query of queries) {
    console.log(`  Searching: "${query}"`)
    
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=10`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.items) {
        for (const item of data.items) {
          const text = `${item.title} ${item.snippet}`
          
          // Extract restaurant names from text
          const matches = text.match(/([A-Z][a-zA-Z\s&'-]+?)(?=\s(?:Restaurant|Cafe|Bar|Kitchen|House|Room|Grill|Bistro|Brasserie|Eatery|\d|,|in|on|at|-|is|has|serves|offers|known))/g)
          
          if (matches) {
            for (const match of matches) {
              const name = match.trim()
              if (name.length > 3 && name.length < 50 && !restaurants.some(r => r.name.toLowerCase() === name.toLowerCase())) {
                restaurants.push({ name })
              }
            }
          }
        }
      }
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`  Error searching "${query}":`, error)
    }
    
    if (restaurants.length >= 100) break
  }
  
  console.log(`✓ Found ${restaurants.length} unique restaurants`)
  return restaurants.slice(0, 100)
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
async function processRestaurant(lead: RestaurantLead, city: any, index: number, total: number): Promise<boolean> {
  console.log(`\n[${index}/${total}] 📍 ${lead.name}`)
  
  try {
    // Step 1: Search for restaurant info
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
    
    // Step 5: Extract restaurant details from content
    const addressMatch = combinedContent.match(/\d+\s+[A-Z][a-zA-Z\s]+,\s*Manchester[^,]*M\d+\s*\d[A-Z]{2}/i)
    const address = addressMatch ? addressMatch[0] : null
    
    const websiteMatch = combinedContent.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i)
    let website = websiteMatch ? websiteMatch[0] : null
    if (website && (website.includes('google') || website.includes('facebook') || website.includes('instagram'))) {
      website = null
    }
    
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
    
    // Step 10: Check if dish already exists
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
    
    // Step 11: Extract editorial quote
    const editorialQuote = analysis.quotes.length > 0 ? analysis.quotes[0] : null
    
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
    
    let successCount = 0
    let failCount = 0
    
    // Process each restaurant
    for (let i = 0; i < restaurants.length; i++) {
      const success = await processRestaurant(restaurants[i], city, i + 1, restaurants.length)
      
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

