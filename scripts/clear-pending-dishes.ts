/**
 * Clear the pending-dishes queue (same dishes shown in /admin/pending-dishes).
 * These are Dish records with isBest: false and a description (scraper output).
 * Re-evaluate: many would fail our new image-quality check; clearing lets you start fresh.
 *
 * Usage:
 *   npx tsx scripts/clear-pending-dishes.ts           # Show count only
 *   npx tsx scripts/clear-pending-dishes.ts --confirm # Delete them
 */

import { prisma } from '../lib/prisma'

const where = {
  isBest: false,
  description: { not: null },
}

async function main() {
  const count = await prisma.dish.count({ where })
  console.log(`Pending dishes (isBest: false, has description): ${count}`)

  if (process.argv.includes('--confirm')) {
    const result = await prisma.dish.deleteMany({ where })
    console.log(`Deleted ${result.count} pending dishes.`)
  } else {
    console.log('Run with --confirm to delete them.')
  }
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
