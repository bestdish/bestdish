/**
 * Add Manchester restaurants and scrape to 100 published dishes
 */

import { prisma } from '../lib/prisma'
import { processRestaurants } from '../lib/scraper'
import { slugify } from '../lib/seo'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!
const TARGET_DISHES = 100

async function searchManchesterRestaurants(pageToken?: string): Promise<any> {
  const query = pageToken
    ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${GOOGLE_API_KEY}`
    : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=top+restaurants+in+Manchester+UK&type=restaurant&key=${GOOGLE_API_KEY}`
  
  const response = await fetch(query)
  const data = await response.json()
  
  return data
}

async function main() {
  console.log('🎯 Manchester Comprehensive Scrape to 100 Dishes')
  console.log('━'.repeat(60))
  console.log('')
  
  const manchester = await prisma.city.findFirst({ where: { slug: 'manchester' } })
  if (!manchester) {
    console.error('❌ Manchester not found')
    process.exit(1)
  }
  
  // STEP 1: Add restaurants from Google Places
  console.log('STEP 1: Adding Manchester Restaurants from Google Places')
  console.log('━'.repeat(60))
  console.log('')
  
  let allPlaces: any[] = []
  let nextPageToken: string | undefined = undefined
  let pageNum = 0
  
  // Fetch up to 3 pages (60 restaurants) from Google
  while (pageNum < 3) {
    console.log(`📍 Fetching page ${pageNum + 1}...`)
    const data = await searchManchesterRestaurants(nextPageToken)
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.log(`⚠️  API status: ${data.status}`)
      break
    }
    
    allPlaces = [...allPlaces, ...(data.results || [])]
    console.log(`   Found ${data.results?.length || 0} restaurants`)
    
    nextPageToken = data.next_page_token
    if (!nextPageToken) break
    
    pageNum++
    await new Promise(resolve => setTimeout(resolve, 2000)) // Required delay for next_page_token
  }
  
  console.log(`\n📊 Total found: ${allPlaces.length} restaurants`)
  
  // Filter and add to database
  const topPlaces = allPlaces
    .filter(p => p.rating && p.rating >= 4.0) // Only highly rated
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 100) // Top 100
  
  console.log(`✨ Filtered to top ${topPlaces.length} (rating >= 4.0)`)
  console.log('')
  
  let added = 0
  
  for (const place of topPlaces) {
    try {
      // Check if exists
      const existing = await prisma.restaurant.findFirst({
        where: { googlePlaceId: place.place_id }
      })
      
      if (existing) continue
      
      // Add restaurant
      const restaurant = await prisma.restaurant.create({
        data: {
          name: place.name,
          slug: slugify(place.name),
          googlePlaceId: place.place_id,
          address: place.formatted_address || place.vicinity,
          rating: place.rating,
          cityId: manchester.id,
          photoUrl: place.photos?.[0]
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
            : null,
          isActive: true
        }
      })
      
      added++
      console.log(`✅ ${added}. Added: ${restaurant.name} (${restaurant.rating}⭐)`)
      
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.log(`⚠️  Skipped ${place.name}: ${error}`)
    }
  }
  
  console.log(`\n✅ Added ${added} new Manchester restaurants`)
  console.log('')
  
  // STEP 2: Scrape best dishes for all restaurants
  console.log('━'.repeat(60))
  console.log('STEP 2: Scraping Best Dishes with AI')
  console.log('━'.repeat(60))
  console.log('')
  
  const startTime = Date.now()
  let batchNum = 0
  
  while (true) {
    const currentPublished = await prisma.dish.count({
      where: {
        isBest: true,
        photoUrl: { not: null },
        restaurant: { cityId: manchester.id }
      }
    })
    
    console.log(`\n📊 Progress: ${currentPublished}/${TARGET_DISHES} published dishes`)
    
    if (currentPublished >= TARGET_DISHES) {
      console.log('🎉 TARGET REACHED!')
      break
    }
    
    // Get restaurants without dishes
    const restaurants = await prisma.restaurant.findMany({
      where: {
        cityId: manchester.id,
        isActive: true,
        dishes: { none: {} }
      },
      select: {
        id: true,
        name: true,
        googlePlaceId: true,
        cuisine: true,
        photoUrl: true,
        website: true,
        address: true,
        city: { select: { name: true, slug: true } }
      },
      orderBy: [
        { rating: 'desc' },
        { name: 'asc' }
      ],
      take: 20
    })
    
    if (restaurants.length === 0) {
      console.log('\n⚠️  No more restaurants to process')
      break
    }
    
    batchNum++
    console.log(`\n🔄 Batch ${batchNum}: Processing ${restaurants.length} restaurants...`)
    
    const results = await processRestaurants(restaurants, TARGET_DISHES, 2000)
    const success = results.filter(r => r.success).length
    
    console.log(`   ✅ ${success}/${restaurants.length} successful`)
    
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Final summary
  const endTime = Date.now()
  const totalMinutes = Math.round((endTime - startTime) / 1000 / 60)
  
  const final = await prisma.dish.count({
    where: {
      isBest: true,
      photoUrl: { not: null },
      restaurant: { cityId: manchester.id }
    }
  })
  
  console.log('')
  console.log('━'.repeat(60))
  console.log('✅ COMPLETE')
  console.log('━'.repeat(60))
  console.log(`\n🎯 Final: ${final}/${TARGET_DISHES} published dishes`)
  console.log(`⏱️  Time: ${totalMinutes} minutes`)
  console.log(`\n🎉 View: http://localhost:3000/manchester`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())




