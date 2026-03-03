/**
 * Scrape Manchester to reach 100 published dishes
 */

import { prisma } from '../lib/prisma'
import { processRestaurants } from '../lib/scraper'

async function main() {
  const TARGET_PUBLISHED = 100
  const BATCH_SIZE = 30
  const citySlug = 'manchester'
  
  console.log('🎯 BestDish Smart Scraper - Manchester to 100 Dishes')
  console.log('━'.repeat(50))
  console.log('')
  console.log(`📍 City: Manchester`)
  console.log(`🎯 Target: ${TARGET_PUBLISHED} published dishes`)
  console.log(`📦 Batch size: ${BATCH_SIZE}`)
  console.log('⚠️  Quality filter: Photo + Best dish + Description required')
  console.log('')
  
  try {
    const city = await prisma.city.findFirst({
      where: { slug: citySlug }
    })
    
    if (!city) {
      console.error(`❌ Manchester not found`)
      process.exit(1)
    }
    
    const startTime = Date.now()
    let batchNumber = 0
    let totalProcessed = 0
    let allResults: any[] = []
    
    while (true) {
      // Check current progress
      const currentPublished = await prisma.dish.count({
        where: {
          isBest: true,
          photoUrl: { not: null }, // Only count dishes with photos
          restaurant: { cityId: city.id }
        }
      })
      
      console.log('')
      console.log('━'.repeat(50))
      console.log('📊 CURRENT PROGRESS')
      console.log('━'.repeat(50))
      console.log(`✅ Published: ${currentPublished}/${TARGET_PUBLISHED}`)
      console.log('')
      
      if (currentPublished >= TARGET_PUBLISHED) {
        console.log('🎉 TARGET REACHED!')
        break
      }
      
      const remaining = TARGET_PUBLISHED - currentPublished
      console.log(`📌 Need ${remaining} more published dishes`)
      console.log('')
      
      // Fetch next batch - restaurants without ANY dishes
      batchNumber++
      console.log(`🔄 Batch ${batchNumber}: Fetching restaurants...`)
      
      const restaurants = await prisma.restaurant.findMany({
        where: {
          cityId: city.id,
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
          city: {
            select: { name: true, slug: true }
          }
        },
        orderBy: [
          { rating: 'desc' },
          { name: 'asc' }
        ],
        take: BATCH_SIZE
      })
      
      if (restaurants.length === 0) {
        console.log('⚠️  No more restaurants to scrape!')
        console.log(`📊 Final: ${currentPublished} dishes`)
        break
      }
      
      console.log(`📍 Found ${restaurants.length} restaurants`)
      console.log(`   Processing with 2s delay...`)
      console.log('')
      
      // Process batch
      const batchResults = await processRestaurants(
        restaurants,
        TARGET_PUBLISHED,
        2000
      )
      
      allResults = [...allResults, ...batchResults]
      totalProcessed += restaurants.length
      
      const batchSuccess = batchResults.filter(r => r.success).length
      console.log(`   ✅ Batch ${batchNumber}: ${batchSuccess}/${restaurants.length} successful`)
      
      // Delay before next batch
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Final summary
    const endTime = Date.now()
    const totalMinutes = Math.round((endTime - startTime) / 1000 / 60)
    
    const finalPublished = await prisma.dish.count({
      where: {
        isBest: true,
        photoUrl: { not: null },
        restaurant: { cityId: city.id }
      }
    })
    
    console.log('')
    console.log('━'.repeat(50))
    console.log('✅ SCRAPING COMPLETE')
    console.log('━'.repeat(50))
    console.log('')
    console.log(`🎯 Published dishes: ${finalPublished}/${TARGET_PUBLISHED}`)
    console.log(`📊 Restaurants processed: ${totalProcessed}`)
    console.log(`⏱️  Total time: ${totalMinutes} minutes`)
    console.log('')
    console.log(`🎉 View: http://localhost:3000/manchester`)
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()






