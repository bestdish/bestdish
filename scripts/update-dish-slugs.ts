/**
 * Update dish slugs to include restaurant name
 * New format: {restaurant-slug}-{dish-slug}
 */

import { prisma } from '../lib/prisma'
import { slugify } from '../lib/seo'

async function updateDishSlugs() {
  console.log('🔄 Updating dish slugs to include restaurant name...\n')
  
  const dishes = await prisma.dish.findMany({
    include: {
      restaurant: true
    }
  })
  
  console.log(`Found ${dishes.length} dishes to update\n`)
  
  let updated = 0
  let skipped = 0
  
  for (const dish of dishes) {
    const restaurantSlug = slugify(dish.restaurant.name)
    const dishSlug = slugify(dish.name)
    const newSlug = `${restaurantSlug}-${dishSlug}`
    
    if (dish.slug === newSlug) {
      console.log(`✓ ${dish.name} - already has correct slug`)
      skipped++
      continue
    }
    
    try {
      await prisma.dish.update({
        where: { id: dish.id },
        data: { slug: newSlug }
      })
      
      console.log(`✓ Updated: ${dish.name}`)
      console.log(`  Old: ${dish.slug}`)
      console.log(`  New: ${newSlug}`)
      console.log()
      updated++
    } catch (error) {
      console.error(`✗ Failed to update ${dish.name}:`, error)
    }
  }
  
  console.log(`\n✅ Complete!`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total: ${dishes.length}`)
  
  await prisma.$disconnect()
}

updateDishSlugs()



