/**
 * Clear all dishes and restaurants from database
 * Restaurants are just metadata for dishes - if no dishes, no need for restaurants
 * Keeps cities only
 */

import { prisma } from '@/lib/prisma'

async function clearDishes() {
  console.log('🗑️  Clearing All Dishes & Restaurants')
  console.log('━'.repeat(60))
  console.log('')
  console.log('⚠️  WARNING: This will DELETE all dishes, restaurants, and reviews!')
  console.log('⚠️  Only cities will be kept.')
  console.log('')
  console.log('Waiting 5 seconds... (Ctrl+C to cancel)')
  await new Promise(resolve => setTimeout(resolve, 5000))
  console.log('')

  try {
    // Count before deletion
    const dishCount = await prisma.dish.count()
    const restaurantCount = await prisma.restaurant.count()
    const reviewCount = await prisma.review.count()
    
    console.log(`📊 Current database:`)
    console.log(`   ${dishCount} dishes`)
    console.log(`   ${restaurantCount} restaurants`)
    console.log(`   ${reviewCount} reviews`)
    console.log('')

    // Delete all reviews first (they reference dishes)
    console.log('🗑️  Deleting reviews...')
    const deletedReviews = await prisma.review.deleteMany()
    console.log(`   ✓ Deleted ${deletedReviews.count} reviews`)

    // Delete all dishes (they reference restaurants)
    console.log('🗑️  Deleting dishes...')
    const deletedDishes = await prisma.dish.deleteMany()
    console.log(`   ✓ Deleted ${deletedDishes.count} dishes`)

    // Delete all restaurants (no dishes = no need for restaurants)
    console.log('🗑️  Deleting restaurants...')
    const deletedRestaurants = await prisma.restaurant.deleteMany()
    console.log(`   ✓ Deleted ${deletedRestaurants.count} restaurants`)

    // Count what remains
    const remainingCities = await prisma.city.count()

    console.log('')
    console.log('━'.repeat(60))
    console.log('✅ DATABASE CLEARED')
    console.log('━'.repeat(60))
    console.log('')
    console.log(`📊 Remaining in database:`)
    console.log(`   ${remainingCities} cities`)
    console.log(`   0 restaurants (created automatically with dishes)`)
    console.log(`   0 dishes`)
    console.log(`   0 reviews`)
    console.log('')
    console.log('🎉 Ready for fresh curated dishes!')
    console.log('')

  } catch (error) {
    console.error('❌ Clear failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

clearDishes()

