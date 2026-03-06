/**
 * Sync production database to development (prod → dev).
 * Used by GitHub Actions daily at 3 AM UTC. Requires:
 *   PROD_DATABASE_URL, DEV_DATABASE_URL
 * Writes log to logs/sync-prod-to-dev-<timestamp>.log
 */

import { PrismaClient } from '@prisma/client'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const PROD_URL = process.env.PROD_DATABASE_URL
const DEV_URL = process.env.DEV_DATABASE_URL

if (!PROD_URL || !DEV_URL) {
  console.error('❌ Missing PROD_DATABASE_URL or DEV_DATABASE_URL')
  process.exit(1)
}

const prodPrisma = new PrismaClient({
  datasources: { db: { url: PROD_URL } }
})
const devPrisma = new PrismaClient({
  datasources: { db: { url: DEV_URL } }
})

const logLines: string[] = []
function log(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`
  logLines.push(line)
  console.log(msg)
}

interface ExportData {
  data: { cities: any[]; reviews: any[] }
  counts: { cities: number; restaurants: number; dishes: number; reviews: number }
}

async function run() {
  const logDir = join(process.cwd(), 'logs')
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true })
  const logPath = join(logDir, `sync-prod-to-dev-${Date.now()}.log`)

  try {
    log('Starting sync: production → development')
    log('')

    // 1. Export from production
    log('📍 Fetching from production...')
    const cities = await prodPrisma.city.findMany({
      include: {
        restaurants: {
          include: {
            dishes: {
              include: { reviews: true }
            }
          }
        }
      }
    })
    const allReviews = await prodPrisma.review.findMany()
    await prodPrisma.$disconnect()

    const exportData: ExportData = {
      counts: {
        cities: cities.length,
        restaurants: cities.reduce((s, c) => s + c.restaurants.length, 0),
        dishes: cities.reduce((s, c) =>
          s + c.restaurants.reduce((r, rest) => r + rest.dishes.length, 0), 0),
        reviews: allReviews.length
      },
      data: { cities, reviews: allReviews }
    }
    log(`   ${exportData.counts.cities} cities, ${exportData.counts.restaurants} restaurants, ${exportData.counts.dishes} dishes, ${exportData.counts.reviews} reviews`)
    log('')

    // 2. Restore into development
    log('🔄 Restoring into development...')
    const { data } = exportData

    if (data.cities?.length > 0) {
      for (const cityData of data.cities) {
        const { restaurants, ...city } = cityData
        await devPrisma.city.upsert({
          where: { id: city.id },
          update: city,
          create: city
        })
        if (restaurants?.length) {
          for (const restaurantData of restaurants) {
            const { dishes, ...restaurant } = restaurantData
            await devPrisma.restaurant.upsert({
              where: { id: restaurant.id },
              update: restaurant,
              create: restaurant
            })
            if (dishes?.length) {
              for (const dishData of dishes) {
                const { reviews: _, ...dish } = dishData
                await devPrisma.dish.upsert({
                  where: { id: dish.id },
                  update: dish,
                  create: dish
                })
              }
            }
          }
        }
      }
      log(`   ✅ Cities, restaurants, dishes restored`)
    }

    if (data.reviews?.length > 0) {
      for (const review of data.reviews) {
        await devPrisma.review.upsert({
          where: { id: review.id },
          update: review,
          create: review
        })
      }
      log(`   ✅ ${data.reviews.length} reviews restored`)
    }

    await devPrisma.$disconnect()
    log('')
    log('✅ Sync completed successfully')
  } catch (err) {
    log('')
    log(`❌ Sync failed: ${err instanceof Error ? err.message : err}`)
    if (err instanceof Error && err.stack) log(err.stack)
    await prodPrisma.$disconnect().catch(() => {})
    await devPrisma.$disconnect().catch(() => {})
    writeFileSync(logPath, logLines.join('\n')) // Must write before exit - process.exit skips finally
    process.exit(1)
  } finally {
    writeFileSync(logPath, logLines.join('\n'))
  }
}

run()
