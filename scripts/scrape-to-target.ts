/**
 * Smart Scraper - Continues until target number of PUBLISHED dishes is reached
 */

import { prisma } from '@/lib/prisma'
import { processRestaurants } from '@/lib/scraper'

async function main() {
  const TARGET_PUBLISHED = 50
  const BATCH_SIZE = 30
  const citySlug = process.argv[2] || 'london'
  
  console.log('🎯 BestDish Smart Scraper - Target-Based')
  console.log('━'.repeat(50))
  console.log('')
  console.log(`📍 City: ${citySlug}`)
  console.log(`🎯 Target: ${TARGET_PUBLISHED} PUBLISHED dishes (with verified photos)`)
  console.log(`📦 Batch size: ${BATCH_SIZE} restaurants per batch`)
  console.log('')
  
  try {
    // Get city
    const city = await prisma.city.findFirst({
      where: { slug: citySlug }
    })
    
    if (!city) {
      console.error(`❌ City "${citySlug}" not found`)
      console.log('\nAvailable cities: manchester, london, birmingham, nationwide')
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
          restaurant: {
            cityId: city.id
          }
        }
      })
      
      const currentDrafts = await prisma.dish.count({
        where: {
          isBest: false,
          description: { not: null },
          restaurant: {
            cityId: city.id
          }
        }
      })
      
      console.log('')
      console.log('━'.repeat(50))
      console.log('📊 CURRENT PROGRESS')
      console.log('━'.repeat(50))
      console.log(`✅ Published: ${currentPublished}/${TARGET_PUBLISHED}`)
      console.log(`📝 Drafts (awaiting photos): ${currentDrafts}`)
      console.log(`🔄 Total dishes created: ${currentPublished + currentDrafts}`)
      console.log('')
      
      if (currentPublished >= TARGET_PUBLISHED) {
        console.log('━'.repeat(50))
        console.log('🎉 TARGET REACHED!')
        console.log('━'.repeat(50))
        break
      }
      
      const remaining = TARGET_PUBLISHED - currentPublished
      console.log(`📌 Need ${remaining} more published dishes`)
      console.log('')
      
      // Fetch next batch of restaurants
      batchNumber++
      console.log(`🔄 Fetching batch ${batchNumber}...`)
      
      const restaurants = await prisma.restaurant.findMany({
        where: {
          cityId: city.id,
          isActive: true,
          dishes: {
            none: {} // No dishes at all
          }
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
            select: {
              name: true,
              slug: true
            }
          }
        },
        orderBy: [
          { rating: 'desc' },
          { name: 'asc' }
        ],
        take: BATCH_SIZE
      })
      
      if (restaurants.length === 0) {
        console.log('')
        console.log('⚠️  No more restaurants available to scrape!')
        console.log(`📊 Final count: ${currentPublished} published, ${currentDrafts} drafts`)
        console.log('')
        console.log('💡 Options:')
        console.log('   1. Review drafts in Admin → Pending Dishes')
        console.log('   2. Upload photos manually to reach target')
        console.log('   3. Expand to another city')
        break
      }
      
      console.log(`📍 Found ${restaurants.length} restaurants in batch ${batchNumber}`)
      console.log(`   Processing with 2s delay between each...`)
      console.log('')
      
      // Process this batch
      const batchResults = await processRestaurants(
        restaurants,
        TARGET_PUBLISHED, // Target (will stop when reached)
        2000 // 2 second delay
      )
      
      allResults = [...allResults, ...batchResults]
      totalProcessed += restaurants.length
      
      const batchSuccess = batchResults.filter(r => r.success).length
      console.log(`   Batch ${batchNumber} complete: ${batchSuccess}/${restaurants.length} successful`)
      
      // Small delay before checking progress again
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    // Final summary
    const endTime = Date.now()
    const totalMinutes = Math.round((endTime - startTime) / 1000 / 60)
    
    const finalPublished = await prisma.dish.count({
      where: {
        isBest: true,
        restaurant: { cityId: city.id }
      }
    })
    
    const finalDrafts = await prisma.dish.count({
      where: {
        isBest: false,
        description: { not: null },
        restaurant: { cityId: city.id }
      }
    })
    
    // Get dishes with photos
    const dishesWithPhotos = await prisma.dish.findMany({
      where: {
        isBest: true,
        photoUrl: { not: null },
        restaurant: { cityId: city.id }
      },
      include: {
        restaurant: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    console.log('')
    console.log('━'.repeat(50))
    console.log('✅ SCRAPING COMPLETE')
    console.log('━'.repeat(50))
    console.log('')
    console.log(`🎯 Published dishes: ${finalPublished}/${TARGET_PUBLISHED}`)
    console.log(`📝 Draft dishes: ${finalDrafts}`)
    console.log(`📊 Total restaurants processed: ${totalProcessed}`)
    console.log(`⏱️  Total time: ${totalMinutes} minutes`)
    console.log(`📈 Success rate: ${Math.round((finalPublished / (finalPublished + finalDrafts)) * 100)}%`)
    console.log('')
    
    if (dishesWithPhotos.length > 0) {
      console.log('🖼️  Recent published dishes with photos:')
      dishesWithPhotos.slice(0, 5).forEach(d => {
        console.log(`   ✅ ${d.restaurant.name} → ${d.name}`)
      })
      console.log('')
    }
    
    if (finalDrafts > 0) {
      console.log(`📋 ${finalDrafts} drafts awaiting photos in: http://localhost:3000/admin/pending-dishes`)
      console.log('')
    }
    
    console.log(`🎉 View published dishes: http://localhost:3000/${citySlug}`)
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

