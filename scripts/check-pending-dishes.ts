import { prisma } from '../lib/prisma'

async function checkPendingDishes() {
  const dishes = await prisma.dish.findMany({
    where: { isBest: false },
    include: {
      restaurant: {
        include: {
          city: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 3
  })
  
  console.log('=== PENDING DISHES ===\n')
  
  for (const dish of dishes) {
    console.log(`Dish: ${dish.name}`)
    console.log(`  Slug: ${dish.slug}`)
    console.log(`  Description: ${dish.description ? dish.description.substring(0, 100) + '...' : 'NULL'}`)
    console.log(`  Price: ${dish.price || 'NULL'}`)
    console.log(`  Photo: ${dish.photoUrl || 'NULL'}`)
    console.log(`  Editorial Quote: ${dish.editorialQuote ? dish.editorialQuote.substring(0, 50) + '...' : 'NULL'}`)
    console.log(`  FAQs: ${dish.faqAnswers ? 'YES' : 'NULL'}`)
    console.log(`\nRestaurant: ${dish.restaurant.name}`)
    console.log(`  Address: ${dish.restaurant.address || 'NULL'}`)
    console.log(`  Website: ${dish.restaurant.website || 'NULL'}`)
    console.log(`  Cuisine: ${dish.restaurant.cuisine || 'NULL'}`)
    console.log(`  Instagram: ${dish.restaurant.instagramHandle || 'NULL'}`)
    console.log(`  City: ${dish.restaurant.city.name}`)
    console.log('\n---\n')
  }
  
  await prisma.$disconnect()
}

checkPendingDishes()

