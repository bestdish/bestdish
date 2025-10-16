/**
 * AI Scraper - Newcastle Test Run
 */

import { prisma } from '@/lib/prisma'
import { processRestaurants } from '@/lib/scraper'

async function main() {
  console.log('🍽️  BestDish AI Scraper - Newcastle Test')
  console.log('━'.repeat(50))
  console.log('')
  
  try {
    // Fetch Newcastle city
    const newcastle = await prisma.city.findFirst({
      where: {
        slug: 'newcastle'
      }
    })
    
    if (!newcastle) {
      console.error('❌ Newcastle not found in database')
      process.exit(1)
    }
    
    // Fetch Newcastle restaurants by rating
    // Exclude chains and restaurants that already have a best dish
    const restaurants = await prisma.restaurant.findMany({
      where: {
        cityId: newcastle.id,
        isActive: true,
        dishes: {
          none: {
            isBest: true
          }
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
      take: 30 // Fetch extra to account for skips
    })
    
    console.log(`📊 Found ${restaurants.length} Newcastle restaurants to process`)
    console.log(`   (Excluding restaurants that already have a best dish)`)
    console.log('')
    
    if (restaurants.length === 0) {
      console.log('ℹ️  No restaurants to process. All may already have dishes.')
      console.log('   To re-process, manually delete existing best dishes first.')
      await prisma.$disconnect()
      process.exit(0)
    }
    
    // Confirm before proceeding
    console.log(`🚀 About to process ${restaurants.length} restaurants`)
    console.log(`   Target: 10 successful dishes`)
    console.log(`   Estimated time: ${Math.ceil(restaurants.length * 2)}–${Math.ceil(restaurants.length * 4)} minutes`)
    console.log(`   Features: Improved photo search with context analysis`)
    console.log('')
    console.log('Starting in 3 seconds...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    console.log('')
    
    // Process restaurants (target 10 successes for testing)
    const startTime = Date.now()
    const results = await processRestaurants(restaurants, 10, 2000) // Target 10, 2 second delay
    const endTime = Date.now()
    
    // Summary
    console.log('')
    console.log('━'.repeat(50))
    console.log('✅ SCRAPING COMPLETE')
    console.log('━'.repeat(50))
    console.log('')
    
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    
    console.log(`✅ Successful: ${successful.length}/${restaurants.length}`)
    console.log(`❌ Failed: ${failed.length}/${restaurants.length}`)
    console.log(`⏱️  Total time: ${Math.round((endTime - startTime) / 1000 / 60)} minutes`)
    console.log('')
    
    if (successful.length > 0) {
      console.log('📝 Published dishes:')
      successful.forEach(r => {
        console.log(`   ✓ ${r.restaurantName} → ${r.dishName} [${r.confidence?.toUpperCase()}]`)
      })
      console.log('')
    }
    
    if (failed.length > 0) {
      console.log('⚠️  Failed restaurants:')
      failed.forEach(r => {
        console.log(`   ✗ ${r.restaurantName}: ${r.error}`)
      })
      console.log('')
    }
    
    console.log('🎉 Done! Check http://localhost:3000/newcastle to see the new dishes.')
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

