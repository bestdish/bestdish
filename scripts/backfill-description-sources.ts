/**
 * Backfill descriptionSources for existing dishes
 *
 * Re-scrapes article links for each dish's restaurant and updates
 * the dish with source links. Only processes dishes that have a
 * description but no descriptionSources.
 *
 * Requires: SERPER_API_KEY (get one at https://serper.dev/api-key)
 *
 * Usage:
 *   npx tsx scripts/backfill-description-sources.ts           # Dry run (preview only)
 *   npx tsx scripts/backfill-description-sources.ts --confirm # Apply updates
 */

import 'dotenv/config'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { searchRestaurantArticles } from '../lib/scraper/sources/web-scraper'
import { articlesToDescriptionSources } from '../lib/descriptionSources'

const DELAY_MS = 3000 // Rate limit for Serper API

async function main() {
  const isConfirm = process.argv.includes('--confirm')

  if (!isConfirm) {
    console.log('🔍 DRY RUN – no changes will be made. Add --confirm to apply updates.\n')
  }

  // Check API config
  if (!process.env.SERPER_API_KEY) {
    console.error('❌ Missing SERPER_API_KEY in .env (get one at https://serper.dev/api-key)')
    process.exit(1)
  }

  // Get dishes with description but no descriptionSources
  const allWithDescription = await prisma.dish.findMany({
    where: { description: { not: null } },
    include: {
      restaurant: {
        include: { city: true },
      },
    },
  })

  const dishes = allWithDescription.filter((d) => {
    const src = d.descriptionSources
    return !src || (Array.isArray(src) && src.length === 0)
  })

  console.log(`📋 Found ${dishes.length} dishes to backfill (of ${allWithDescription.length} with descriptions)\n`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i]
    const restaurantName = dish.restaurant.name
    const cityName = dish.restaurant.city.name

    console.log(`[${i + 1}/${dishes.length}] ${dish.name} @ ${restaurantName}`)

    try {
      const articles = await searchRestaurantArticles(restaurantName, cityName)
      const descriptionSources = articlesToDescriptionSources(articles)

      if (descriptionSources.length === 0) {
        console.log(`   ⚠️  No articles found – skipping`)
        skipped++
      } else {
        console.log(`   ✓ Found ${descriptionSources.length} sources: ${descriptionSources.map(s => s.name).join(', ')}`)

        if (isConfirm) {
          await prisma.dish.update({
            where: { id: dish.id },
            data: {
              descriptionSources: descriptionSources as unknown as Prisma.InputJsonValue,
            },
          })
          console.log(`   ✓ Updated`)
          updated++
        } else {
          console.log(`   (dry run – not updated)`)
          updated++
        }
      }
    } catch (error) {
      console.error(`   ❌ Error:`, error instanceof Error ? error.message : error)
      failed++
    }

    // Rate limit
    if (i < dishes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }
  }

  console.log('\n' + '─'.repeat(50))
  console.log(`✅ Backfill complete`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped (no articles): ${skipped}`)
  console.log(`   Failed: ${failed}`)
  if (!isConfirm && updated > 0) {
    console.log('\n💡 Run with --confirm to apply these updates')
  }
}

main()
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
