/**
 * Manchester Scraper V2 - With Working Google Reviews
 * Target: 100 published dishes with photos + descriptions
 */

import { prisma } from '../lib/prisma'
import { processRestaurants } from '../lib/scraper'
import { slugify } from '../lib/seo'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!
const TARGET_DISHES = 100

async function addManchesterRestaurants(needed: number) {
  console.log(`\n📍 Adding ~${needed} Manchester restaurants from Google Places...`)
  
  let allPlaces: any[] = []
  let nextPageToken: string | undefined = undefined
  let pageNum = 0
  
  // Fetch restaurants from Google Places
  while (pageNum < 3 && allPlaces.length < needed * 2) {
    const query = nextPageToken
      ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${nextPageToken}&key=${GOOGLE_API_KEY}`
      : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=best+restaurants+in+Manchester+UK&type=restaurant&key=${GOOGLE_API_KEY}`
    
    const response = await fetch(query)
    const data = await response.json()
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.log(`⚠️  API status: ${data.status}`)
      break
    }
    
    allPlaces = [...allPlaces, ...(data.results || [])]
    console.log(`  Page ${pageNum + 1}: +${data.results?.length || 0} (total: ${allPlaces.length})`)
    
    nextPageToken = data.next_page_token
    if (!nextPageToken) break
    
    pageNum++
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // Filter to high-rated restaurants only
  const topPlaces = allPlaces
    .filter(p => p.rating && p.rating >= 4.2 && p.user_ratings_total >= 50)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, needed * 2) // Get 2x what we need (some will fail)
  
  console.log(`  ✨ Filtered to ${topPlaces.length} highly-rated (4.2⭐+, 50+ reviews)`)
  
  const manchester = await prisma.city.findFirst({ where: { slug: 'manchester' } })
  if (!manchester) throw new Error('Manchester city not found')
  
  let added = 0
  for (const place of topPlaces) {
    try {
      const existing = await prisma.restaurant.findFirst({
        where: { googlePlaceId: place.place_id }
      })
      if (existing) continue
      
      await prisma.restaurant.create({
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
      if (added >= needed) break
      
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      // Skip duplicates
      continue
    }
  }
  
  console.log(`  ✅ Added ${added} new restaurants\n`)
  return added
}

async function main() {
  console.log('🎯 Manchester Scraper V2 - With Working Google Reviews')
  console.log('━'.repeat(60))
  console.log('')
  
  const manchester = await prisma.city.findFirst({ where: { slug: 'manchester' } })
  if (!manchester) throw new Error('Manchester not found')
  
  const startTime = Date.now()
  let batchNum = 0
  
  while (true) {
    // Check progress
    const currentPublished = await prisma.dish.count({
      where: {
        isBest: true,
        photoUrl: { not: null },
        restaurant: { cityId: manchester.id }
      }
    })
    
    console.log('')
    console.log('━'.repeat(60))
    console.log(`📊 PROGRESS: ${currentPublished}/${TARGET_DISHES} dishes`)
    console.log('━'.repeat(60))
    
    if (currentPublished >= TARGET_DISHES) {
      console.log('🎉 TARGET REACHED!')
      break
    }
    
    const remaining = TARGET_DISHES - currentPublished
    console.log(`📌 Need ${remaining} more dishes\n`)
    
    // Get restaurants without dishes
    let restaurants = await prisma.restaurant.findMany({
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
      orderBy: [{ rating: 'desc' }, { name: 'asc' }],
      take: 20
    })
    
    // If not enough restaurants, add more
    if (restaurants.length < 10) {
      console.log(`⚠️  Only ${restaurants.length} restaurants available`)
      const added = await addManchesterRestaurants(20)
      
      if (added === 0) {
        console.log('⚠️  Could not add more restaurants')
        break
      }
      
      // Re-fetch restaurants
      restaurants = await prisma.restaurant.findMany({
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
        orderBy: [{ rating: 'desc' }, { name: 'asc' }],
        take: 20
      })
    }
    
    batchNum++
    console.log(`🔄 Batch ${batchNum}: Processing ${restaurants.length} restaurants...\n`)
    
    const results = await processRestaurants(restaurants, TARGET_DISHES, 3000) // 3s delay
    const success = results.filter(r => r.success).length
    
    console.log(`   ✅ ${success}/${restaurants.length} successful`)
    
    if (success === 0) {
      console.log(`   ⚠️  No successes in this batch, waiting 10s...`)
      await new Promise(resolve => setTimeout(resolve, 10000))
    } else {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
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
  console.log('✅ SCRAPING COMPLETE')
  console.log('━'.repeat(60))
  console.log(`\n🎯 Final: ${final}/${TARGET_DISHES} published dishes`)
  console.log(`⏱️  Time: ${totalMinutes} minutes`)
  console.log(`\n🎉 View: http://localhost:3000/manchester`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())




