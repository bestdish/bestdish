/**
 * Restore database from JSON export
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

interface ExportData {
  data: {
    cities: any[]
    reviews: any[]
  }
  counts: {
    cities: number
    restaurants: number
    dishes: number
    reviews: number
  }
}

async function restoreFromExport(filePath: string) {
  console.log('🔄 Restoring from export:', filePath)
  console.log('')

  try {
    // Read the export file
    const exportData: ExportData = JSON.parse(readFileSync(filePath, 'utf-8'))
    const data = exportData.data

    console.log('📊 Found in export:')
    console.log(`   ${exportData.counts.cities} cities`)
    console.log(`   ${exportData.counts.restaurants} restaurants`)
    console.log(`   ${exportData.counts.dishes} dishes`)
    console.log(`   ${exportData.counts.reviews} reviews`)
    console.log('')

    // Restore cities and their nested restaurants/dishes
    if (data.cities?.length > 0) {
      console.log('📍 Restoring cities...')
      let restaurantCount = 0
      let dishCount = 0
      
      for (const cityData of data.cities) {
        const { restaurants, ...city } = cityData
        
        // Restore city
        await prisma.city.upsert({
          where: { id: city.id },
          update: city,
          create: city
        })
        
        // Restore restaurants for this city
        if (restaurants?.length > 0) {
          for (const restaurantData of restaurants) {
            const { dishes, ...restaurant } = restaurantData
            
            await prisma.restaurant.upsert({
              where: { id: restaurant.id },
              update: restaurant,
              create: restaurant
            })
            restaurantCount++
            
            // Restore dishes for this restaurant
            if (dishes?.length > 0) {
              for (const dishData of dishes) {
                const { reviews, ...dish } = dishData
                await prisma.dish.upsert({
                  where: { id: dish.id },
                  update: dish,
                  create: dish
                })
                dishCount++
              }
            }
          }
        }
      }
      
      console.log(`   ✅ Restored ${data.cities.length} cities`)
      console.log(`   ✅ Restored ${restaurantCount} restaurants`)
      console.log(`   ✅ Restored ${dishCount} dishes`)
    }

    // Restore reviews
    if (data.reviews?.length > 0) {
      console.log('⭐ Restoring reviews...')
      for (const review of data.reviews) {
        await prisma.review.upsert({
          where: { id: review.id },
          update: review,
          create: review
        })
      }
      console.log(`   ✅ Restored ${data.reviews.length} reviews`)
    }

    console.log('')
    console.log('✅ RESTORE COMPLETE!')
    console.log('')

  } catch (error) {
    console.error('❌ Restore failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get file path from command line or use default
const exportFile = process.argv[2] || join(__dirname, '../exports/production-data-export-2025-10-17.json')

restoreFromExport(exportFile)

