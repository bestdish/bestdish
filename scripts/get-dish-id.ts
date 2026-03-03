import { prisma } from '../lib/prisma'

async function getDishId() {
  const dish = await prisma.dish.findFirst({
    where: { isBest: true },
    select: { id: true, name: true }
  })
  
  console.log('DishId:', dish?.id)
  console.log('Name:', dish?.name)
  process.exit(0)
}

getDishId()



