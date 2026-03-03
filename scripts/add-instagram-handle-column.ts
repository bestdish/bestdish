import { prisma } from '../lib/prisma'

async function addInstagramHandleColumn() {
  try {
    // Check if column exists by trying to query it
    await prisma.$queryRaw`
      SELECT instagram_handle FROM "Restaurant" LIMIT 1
    `
    console.log('✓ Column already exists')
  } catch (error) {
    // Column doesn't exist, add it
    console.log('Adding instagramHandle column...')
    await prisma.$executeRaw`
      ALTER TABLE "Restaurant" 
      ADD COLUMN IF NOT EXISTS "instagramHandle" TEXT
    `
    console.log('✓ Column added successfully')
  }
  
  await prisma.$disconnect()
}

addInstagramHandleColumn()



