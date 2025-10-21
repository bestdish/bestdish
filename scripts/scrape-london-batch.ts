/**
 * AI Scraper - London Batch (5 at a time)
 */

import * as dotenv from 'dotenv'
import { prisma } from '../lib/prisma'
import { processRestaurants } from '../lib/scraper'

dotenv.config()

async function main() {
  console.log('🍽️  BestDish AI Scraper - London Batch')
  console.log('━'.repeat(50))
  console.log('')
  
  try {
    const london = await prisma.city.findFirst({
      where: { slug: 'london' }
    })
    
    if (!london) {
      console.error('❌ London not found')
      process.exit(1)
    }
    
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
      take: 5
    })
    
    console.log(`📊 Found ${restaurants.length} London restaurants (batch of 5)`)
    console.log('')
    
    if (restaurants.length === 0) {
      console.log('ℹ️  No restaurants to process')
      await prisma.$disconnect()
      process.exit(0)
    }
    
    console.log(`🚀 Processing ${restaurants.length} restaurants`)
    console.log('Starting in 3 seconds...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    console.log('')
    
    const startTime = Date.now()
    const results = await processRestaurants(restaurants, restaurants.length, 3000)
    const endTime = Date.now()
    
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
        console.log(`   ✓ ${r.restaurantName} → ${r.dishName}`)
      })
      console.log('')
    }
    
    if (failed.length > 0) {
      console.log('⚠️  Failed:')
      failed.forEach(r => {
        console.log(`   ✗ ${r.restaurantName}: ${r.error}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()


