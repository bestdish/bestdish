/**
 * AI Scraper - London Test Run
 */

import { prisma } from '@/lib/prisma'
import { processRestaurants } from '@/lib/scraper'

async function main() {
  console.log('🍽️  BestDish AI Scraper - London Test')
  console.log('━'.repeat(50))
  console.log('')
  
  try {
    // Fetch London city
    const london = await prisma.city.findFirst({
      where: {
        slug: 'london'
      }
    })
    
    if (!london) {
      console.error('❌ London not found in database')
      process.exit(1)
    }
    
    // Fetch London restaurants by rating
    // Exclude chains and restaurants that already have a best dish
    const restaurants = await prisma.restaurant.findMany({
      where: {
        cityId: london.id,
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
      take: 25
    })
    
    console.log(`📊 Found ${restaurants.length} London restaurants to process`)
    console.log(`   (Excluding restaurants that already have a best dish)`)
    console.log('')
    
    if (restaurants.length === 0) {
      console.log('ℹ️  No restaurants to process. All may already have dishes.')
      await prisma.$disconnect()
      process.exit(0)
    }
    
    // Confirm before proceeding
    console.log(`🚀 About to process ${restaurants.length} restaurants`)
    console.log(`   Target: 10 successful dishes`)
    console.log(`   ✨ NEW FEATURES:`)
    console.log(`     ✓ Improved threshold: 600×400 OR 0.24MP`)
    console.log(`     ✓ Catches portrait images (e.g., 683×1024)`)
    console.log(`     ✓ Webpage context analysis`)
    console.log(`     ✓ Sequential AI verification`)
    console.log('')
    console.log('Starting in 3 seconds...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    console.log('')
    
    // Process restaurants (target 10 successes)
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
    
    console.log(`✅ Successful: ${successful.length}`)
    console.log(`❌ Failed: ${failed.length}`)
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
      console.log('⚠️  Failed restaurants (first 10):')
      failed.slice(0, 10).forEach(r => {
        console.log(`   ✗ ${r.restaurantName}: ${r.error}`)
      })
      console.log('')
    }
    
    console.log('🎉 Done! Check http://localhost:3000/london to see the new dishes.')
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

