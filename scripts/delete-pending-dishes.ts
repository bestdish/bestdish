import { prisma } from '../lib/prisma'

async function deletePending() {
  const result = await prisma.dish.deleteMany({
    where: { isBest: false }
  })
  console.log(`✅ Deleted ${result.count} pending dishes`)
  await prisma.$disconnect()
}

deletePending()

