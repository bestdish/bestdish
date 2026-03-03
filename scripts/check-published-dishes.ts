import { prisma } from '../lib/prisma'

async function checkPublishedDishes() {
  const dishes = await prisma.dish.findMany({
    where: { isBest: true },
    include: {
      restaurant: {
        include: {
          city: true
        }
      }
    }
  })
  
  console.log('=== PUBLISHED DISHES ===\n')
  
  for (const dish of dishes) {
    console.log(`${dish.name} at ${dish.restaurant.name} (${dish.restaurant.city.name})`)
    console.log(`  Photo: ${dish.photoUrl ? 'YES' : 'NO'}`)
    console.log(`  URL: /${dish.restaurant.city.slug}/${dish.restaurant.slug}/${dish.slug}`)
    console.log()
  }
  
  await prisma.$disconnect()
}

checkPublishedDishes()



