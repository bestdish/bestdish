/**
 * Export Production Database
 * Creates a complete backup of all data
 */

import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'fs'
import { join } from 'path'

// Use PROD_DATABASE_URL if available, otherwise use DATABASE_URL
const databaseUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

async function exportProduction() {
  console.log('📦 Exporting Production Database')
  console.log('━'.repeat(60))
  console.log('')

  try {
    // Fetch all data
    console.log('📍 Fetching cities...')
    const cities = await prisma.city.findMany({
      include: {
        restaurants: {
          include: {
            dishes: {
              include: {
                reviews: true
              }
            }
          }
        }
      }
    })

    console.log('⭐ Fetching standalone reviews...')
    const allReviews = await prisma.review.findMany()

    // Create export object
    const timestamp = new Date().toISOString()
    const exportData = {
      exportedAt: timestamp,
      databaseUrl: databaseUrl?.replace(/:[^:]*@/, ':***@'), // Hide password
      counts: {
        cities: cities.length,
        restaurants: cities.reduce((sum, c) => sum + c.restaurants.length, 0),
        dishes: cities.reduce((sum, c) => 
          sum + c.restaurants.reduce((s, r) => s + r.dishes.length, 0), 0
        ),
        reviews: allReviews.length,
        users: 0
      },
      data: {
        cities,
        reviews: allReviews
      }
    }

    // Save to file
    const fileName = `production-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`
    const filePath = join(process.cwd(), 'exports', fileName)
    
    writeFileSync(filePath, JSON.stringify(exportData, null, 2))

    console.log('')
    console.log('━'.repeat(60))
    console.log('✅ EXPORT COMPLETE')
    console.log('━'.repeat(60))
    console.log('')
    console.log(`📊 Exported:`)
    console.log(`   ${exportData.counts.cities} cities`)
    console.log(`   ${exportData.counts.restaurants} restaurants`)
    console.log(`   ${exportData.counts.dishes} dishes`)
    console.log(`   ${exportData.counts.reviews} reviews`)
    console.log('')
    console.log(`💾 Saved to: ${filePath}`)
    console.log('')

  } catch (error) {
    console.error('❌ Export failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

exportProduction()

