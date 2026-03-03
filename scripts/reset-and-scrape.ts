/**
 * Reset existing dishes and run AI scraper
 */

import * as dotenv from 'dotenv'
import { prisma } from '../lib/prisma'
import { processRestaurants } from '../lib/scraper'

dotenv.config()

async function main() {
  console.log('🔄 Reset & AI Scrape - All Cities\n')
  
  try {
    // Step 1: Delete existing best dishes
    console.log('🗑️  Deleting existing best dishes...')
    const deleted = await prisma.dish.deleteMany({
      where: { isBest: true }
    })
    console.log(`✅ Deleted ${deleted.count} dishes\n`)
    
    // Step 2: Fetch all cities
    const cities = await prisma.city.findMany({
      where: {
        restaurants: {
          some: {
            isActive: true,
            isChain: false
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    console.log(`📍 Processing ${cities.length} cities\n`)
    
    let totalSuccess = 0
    let totalFailed = 0
    const cityResults: Record<string, { success: number; failed: number }> = {}
    
    // Process each city
    for (const city of cities) {
      console.log(`\n${'='.repeat(50)}`)
      console.log(`📍 ${city.name.toUpperCase()}`)
      console.log('='.repeat(50))
      
      // Fetch top 30 restaurants (to account for photo skips)
      const restaurants = await prisma.restaurant.findMany({
        where: {
          cityId: city.id,
          isActive: true,
          isChain: false
        },
        select: {
          id: true,
          name: true,
          googlePlaceId: true,
          cuisine: true,
          photoUrl: true,
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
        console.log(`  ℹ️  No restaurants found\n`)
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
    console.log('🎊 SCRAPING COMPLETE')
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
    console.log('🎉 Done! Start your dev server to see the results.')
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()








