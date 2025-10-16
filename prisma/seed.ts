import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a city
  const london = await prisma.city.create({
    data: {
      name: 'London',
      slug: 'london',
    },
  })

  // Create a restaurant in that city
  const dishoom = await prisma.restaurant.create({
    data: {
      name: 'Dishoom',
      slug: 'dishoom',
      cityId: london.id,
      photoUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90',
    },
  })

  // Create a dish for that restaurant
  await prisma.dish.create({
    data: {
      name: 'House Black Daal',
      restaurantId: dishoom.id,
      isBest: true,
      photoUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90',
    },
  })
}

main()
  .then(() => console.log('Seeded ✅'))
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
