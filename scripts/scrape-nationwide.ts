/**
 * AI Scraper - Nationwide Chains
 */

import * as dotenv from 'dotenv'
import { prisma } from '../lib/prisma'
import { processRestaurants } from '../lib/scraper'

// Load environment variables
dotenv.config()

async function main() {
  console.log('🍽️  BestDish AI Scraper - Nationwide Chains')
  console.log('━'.repeat(50))
  console.log('')
  
  try {
    // Fetch Nationwide city
    const nationwide = await prisma.city.findFirst({
      where: {
        slug: 'nationwide'
      }
    })
    
    if (!nationwide) {
      console.error('❌ Nationwide not found in database')
      process.exit(1)
    }
    
    // Fetch nationwide restaurants without a best dish
    const restaurants = await prisma.restaurant.findMany({
      where: {
        cityId: nationwide.id,
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
      ]
    })
    
    console.log(`📊 Found ${restaurants.length} nationwide restaurants to process`)
    console.log(`   (Excluding restaurants that already have a best dish)`)
    console.log('')
    
    if (restaurants.length === 0) {
      console.log('ℹ️  No restaurants to process. All may already have dishes.')
      await prisma.$disconnect()
      process.exit(0)
    }
    
    // Confirm before proceeding
    console.log(`🚀 About to process ${restaurants.length} restaurants`)
    console.log(`   Estimated time: ${Math.ceil(restaurants.length * 3)}–${Math.ceil(restaurants.length * 5)} minutes`)
    console.log(`   Gemini API calls: ~${restaurants.length} requests`)
    console.log('')
    console.log('Starting in 3 seconds...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    console.log('')
    
    // Process restaurants
    const startTime = Date.now()
    const results = await processRestaurants(restaurants, restaurants.length, 2000) // Process all, 2 second delay
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
    
    console.log('🎉 Done! Check the homepage to see the new dishes.')
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

