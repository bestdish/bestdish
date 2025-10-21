/**
 * Clear all dish data - Fresh start
 */

import { prisma } from '@/lib/prisma'

async function main() {
  console.log('🗑️  Clearing All Dish Data')
  console.log('━'.repeat(50))
  console.log('')
  
  try {
    // Count before deletion
    const publishedCount = await prisma.dish.count({ where: { isBest: true } })
    const draftCount = await prisma.dish.count({ where: { isBest: false } })
    const total = publishedCount + draftCount
    
    console.log(`📊 Current data:`)
    console.log(`   Published dishes: ${publishedCount}`)
    console.log(`   Draft dishes: ${draftCount}`)
    console.log(`   Total: ${total}`)
    console.log('')
    
    if (total === 0) {
      console.log('✅ No dishes to delete - already clean!')
      await prisma.$disconnect()
      return
    }
    
    console.log('⚠️  This will DELETE ALL dishes (published and drafts)')
    console.log('   Waiting 3 seconds...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    console.log('')
    
    // Delete all dishes
    const result = await prisma.dish.deleteMany({})
    
    console.log(`✅ Deleted ${result.count} dishes`)
    console.log('')
    console.log('🎯 Database is now clean and ready for fresh scraping!')
    
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()


