/**
 * AI Scraper - All Cities
 * Process top 20 restaurants per city
 */

import * as dotenv from 'dotenv'
import { prisma } from '../lib/prisma'
import { processRestaurants } from '../lib/scraper'

dotenv.config()

async function main() {
  console.log('🍽️  BestDish AI Scraper - All Cities')
  console.log('━'.repeat(50))
  console.log('')
  
  try {
    // Fetch all cities with restaurants
    const cities = await prisma.city.findMany({
      where: {
        restaurants: {
          some: {
            isActive: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log(`📍 Found ${cities.length} cities to process\n`)
    
    let totalSuccess = 0
    let totalFailed = 0
    const cityResults: Record<string, { success: number; failed: number }> = {}
    
    // Process each city
    for (const city of cities) {
      console.log(`\n${'='.repeat(50)}`)
      console.log(`📍 ${city.name.toUpperCase()}`)
      console.log('='.repeat(50))
      
      // Fetch top restaurants for this city (30 to account for skips)
      const restaurants = await prisma.restaurant.findMany({
        where: {
          cityId: city.id,
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
        take: 30
      })
      
      if (restaurants.length === 0) {
        console.log(`  ℹ️  No restaurants to process (all have dishes already)\n`)
        cityResults[city.name] = { success: 0, failed: 0 }
        continue
      }
      
      console.log(`  📊 Found ${restaurants.length} restaurants`)
      console.log(`  🎯 Target: 20 successful dishes\n`)
      
      // Process with target of 20 successes
      const results = await processRestaurants(restaurants, 20, 2000)
      
      const citySuccess = results.filter(r => r.success).length
      const cityFailed = results.filter(r => !r.success).length
      
      totalSuccess += citySuccess
      totalFailed += cityFailed
      cityResults[city.name] = { success: citySuccess, failed: cityFailed }
      
      console.log(`\n  ✅ ${city.name}: ${citySuccess} published, ${cityFailed} skipped`)
      
      // Delay between cities
      if (cities.indexOf(city) < cities.length - 1) {
        console.log(`\n  ⏸️  Pausing 5s before next city...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    
    // Final Summary
    console.log('\n\n')
    console.log('━'.repeat(50))
    console.log('🎊 ALL CITIES COMPLETE')
    console.log('━'.repeat(50))
    console.log('')
    console.log(`✅ Total Published: ${totalSuccess}`)
    console.log(`❌ Total Skipped: ${totalFailed}`)
    console.log('')
    console.log('📊 Breakdown by City:')
    Object.entries(cityResults).forEach(([cityName, stats]) => {
      if (stats.success > 0 || stats.failed > 0) {
        console.log(`  ${cityName}: ${stats.success} ✓  ${stats.failed} ✗`)
      }
    })
    console.log('')
    console.log('🎉 Done! Check your site to see all new dishes.')
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

