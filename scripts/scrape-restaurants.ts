/**
 * Restaurant Scraping Script for BestDish
 * 
 * This script scrapes restaurant data from Google Places API and populates
 * the database with cities, restaurants, and placeholder dishes.
 * 
 * Usage: npx tsx scripts/scrape-restaurants.ts
 */

import { PrismaClient } from '@prisma/client'
import { slugify } from '../lib/seo'

const prisma = new PrismaClient()

// Configuration
const TARGET_CITIES = [
  { name: 'London', country: 'UK' },
  { name: 'Manchester', country: 'UK' },
  { name: 'Birmingham', country: 'UK' },
  { name: 'Edinburgh', country: 'UK' },
  { name: 'Glasgow', country: 'UK' },
  { name: 'Bristol', country: 'UK' },
  { name: 'Leeds', country: 'UK' },
  { name: 'Liverpool', country: 'UK' }
]

const RESTAURANTS_PER_CITY = 50

interface GooglePlaceResult {
  place_id: string
  name: string
  rating?: number
  user_ratings_total?: number
  price_level?: number
  vicinity?: string
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  types?: string[]
  website?: string
  formatted_phone_number?: string
  formatted_address?: string
}

/**
 * Get Google Places API key from environment
 */
function getGoogleApiKey(): string {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY environment variable is required')
  }
  return apiKey
}

/**
 * Search for restaurants in a city using Google Places API
 */
async function searchRestaurants(cityName: string, apiKey: string): Promise<GooglePlaceResult[]> {
  const searchQuery = `restaurants in ${cityName}, UK`
  
  try {
    // Use Google Places Text Search API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&type=restaurant&key=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`)
    }
    
    return data.results || []
  } catch (error) {
    console.error(`Error searching restaurants in ${cityName}:`, error)
    return []
  }
}

/**
 * Get detailed information for a place
 */
async function getPlaceDetails(placeId: string, apiKey: string): Promise<GooglePlaceResult | null> {
  try {
    const fields = [
      'place_id',
      'name',
      'rating',
      'user_ratings_total',
      'price_level',
      'vicinity',
      'photos',
      'types',
      'website',
      'formatted_phone_number',
      'formatted_address'
    ].join(',')
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`)
    }
    
    return data.result
  } catch (error) {
    console.error(`Error getting place details for ${placeId}:`, error)
    return null
  }
}

/**
 * Get photo URL from Google Places
 */
function getPhotoUrl(photoReference: string, apiKey: string, maxWidth: number = 400): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`
}

/**
 * Extract cuisine type from Google Places types
 */
function extractCuisine(types: string[]): string | null {
  const cuisineTypes = [
    'italian', 'chinese', 'japanese', 'indian', 'mexican', 'thai', 'french',
    'mediterranean', 'american', 'british', 'spanish', 'greek', 'korean',
    'vietnamese', 'lebanese', 'turkish', 'moroccan', 'ethiopian', 'caribbean',
    'steakhouse', 'seafood', 'pizza', 'burger', 'sushi', 'ramen', 'tapas',
    'pub', 'bar', 'cafe', 'bakery', 'dessert', 'vegan', 'vegetarian'
  ]
  
  for (const type of types) {
    if (cuisineTypes.includes(type.toLowerCase())) {
      return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }
  
  return null
}

/**
 * Convert price level to string
 */
function getPriceRange(priceLevel?: number): string | null {
  if (!priceLevel) return null
  
  switch (priceLevel) {
    case 1: return '£'
    case 2: return '££'
    case 3: return '£££'
    case 4: return '££££'
    default: return null
  }
}

/**
 * Process a single city
 */
async function processCity(cityName: string, apiKey: string) {
  console.log(`\n🏙️  Processing city: ${cityName}`)
  
  // Create or find city
  const citySlug = slugify(cityName)
  let city = await prisma.city.findUnique({
    where: { slug: citySlug }
  })
  
  if (!city) {
    city = await prisma.city.create({
      data: {
        name: cityName,
        slug: citySlug,
        description: `Discover the best restaurants in ${cityName}, UK`
      }
    })
    console.log(`✅ Created city: ${cityName}`)
  } else {
    console.log(`📍 Found existing city: ${cityName}`)
  }
  
  // Search for restaurants
  console.log(`🔍 Searching for restaurants in ${cityName}...`)
  const searchResults = await searchRestaurants(cityName, apiKey)
  
  if (searchResults.length === 0) {
    console.log(`❌ No restaurants found for ${cityName}`)
    return
  }
  
  console.log(`📊 Found ${searchResults.length} restaurants`)
  
  // Process top restaurants
  const topRestaurants = searchResults
    .filter(restaurant => restaurant.rating && restaurant.rating >= 3.5) // Filter by rating
    .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Sort by rating
    .slice(0, RESTAURANTS_PER_CITY) // Take top N
  
  console.log(`🍽️  Processing top ${topRestaurants.length} restaurants...`)
  
  let processedCount = 0
  
  for (const [index, searchResult] of topRestaurants.entries()) {
    try {
      // Get detailed information
      const details = await getPlaceDetails(searchResult.place_id, apiKey)
      if (!details) continue
      
      const restaurantSlug = slugify(details.name)
      
      // Check if restaurant already exists
      const existingRestaurant = await prisma.restaurant.findUnique({
        where: { googlePlaceId: details.place_id }
      })
      
      if (existingRestaurant) {
        console.log(`⏭️  Skipping existing restaurant: ${details.name}`)
        continue
      }
      
      // Prepare restaurant data
      const restaurantData = {
        name: details.name,
        slug: restaurantSlug,
        description: `${details.name} - ${extractCuisine(details.types || []) || 'Restaurant'} in ${cityName}`,
        address: details.formatted_address || details.vicinity,
        cuisine: extractCuisine(details.types || []),
        rating: details.rating || null,
        priceRange: getPriceRange(details.price_level),
        phone: details.formatted_phone_number || null,
        website: details.website || null,
        googlePlaceId: details.place_id,
        photoUrl: details.photos?.[0] ? getPhotoUrl(details.photos[0].photo_reference, apiKey) : null,
        cityId: city.id,
        isActive: true
      }
      
      // Create restaurant
      const restaurant = await prisma.restaurant.create({
        data: restaurantData
      })
      
      // Create placeholder best dish
      await prisma.dish.create({
        data: {
          name: `Best Dish at ${restaurant.name}`,
          description: `The signature dish at ${restaurant.name}. Details coming soon!`,
          slug: slugify(`best-dish-${restaurant.name}`),
          restaurantId: restaurant.id,
          photoUrl: restaurant.photoUrl,
          isBest: true
        }
      })
      
      processedCount++
      console.log(`✅ ${index + 1}/${topRestaurants.length} - Created: ${restaurant.name} (${restaurant.cuisine})`)
      
      // Add delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`❌ Error processing restaurant ${searchResult.name}:`, error)
    }
  }
  
  console.log(`🎉 Completed ${cityName}: ${processedCount} restaurants added`)
}

/**
 * Main scraping function
 */
async function main() {
  console.log('🚀 Starting restaurant scraping...')
  
  const apiKey = getGoogleApiKey()
  console.log(`🔑 Using Google Places API key: ${apiKey.substring(0, 10)}...`)
  
  try {
    for (const city of TARGET_CITIES) {
      await processCity(city.name, apiKey)
      
      // Add delay between cities
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log('\n🎉 Scraping completed successfully!')
    
    // Print summary
    const summary = await prisma.city.findMany({
      include: {
        _count: {
          select: {
            restaurants: true
          }
        }
      }
    })
    
    console.log('\n📊 Summary:')
    for (const city of summary) {
      console.log(`  ${city.name}: ${city._count.restaurants} restaurants`)
    }
    
  } catch (error) {
    console.error('💥 Scraping failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  main()
}

export { main as scrapeRestaurants }


