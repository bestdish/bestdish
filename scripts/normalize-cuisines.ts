/**
 * Normalize existing restaurant cuisines to top-level categories
 */

import { prisma } from '@/lib/prisma'
import { normalizeCuisine } from '@/lib/curation/cuisineMapper'

async function normalizeCuisines() {
  console.log('🍽️  Normalizing Restaurant Cuisines')
  console.log('━'.repeat(60))
  console.log('')

  try {
    // Get all restaurants with cuisines
    const restaurants = await prisma.restaurant.findMany({
      where: {
        cuisine: { not: null }
      },
      select: {
        id: true,
        name: true,
        cuisine: true
      }
    })

    console.log(`Found ${restaurants.length} restaurants with cuisine data`)
    console.log('')

    let updated = 0
    let unchanged = 0
    let cleared = 0

    for (const restaurant of restaurants) {
      const currentCuisine = restaurant.cuisine!
      const normalized = normalizeCuisine(currentCuisine)

      if (normalized && normalized !== currentCuisine) {
        // Update to normalized cuisine
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: { cuisine: normalized }
        })
        console.log(`✓ ${restaurant.name}: "${currentCuisine}" → "${normalized}"`)
        updated++
      } else if (!normalized) {
        // Couldn't normalize - log it
        console.log(`⚠ ${restaurant.name}: "${currentCuisine}" (no mapping found)`)
        cleared++
      } else {
        // Already normalized
        unchanged++
      }
    }

    console.log('')
    console.log('━'.repeat(60))
    console.log('✅ NORMALIZATION COMPLETE')
    console.log('━'.repeat(60))
    console.log('')
    console.log(`📊 Results:`)
    console.log(`   ${updated} cuisines normalized`)
    console.log(`   ${unchanged} already correct`)
    console.log(`   ${cleared} couldn't be mapped`)
    console.log('')

  } catch (error) {
    console.error('❌ Normalization failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

normalizeCuisines()



