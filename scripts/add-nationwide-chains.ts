/**
 * Add Nationwide Chain Restaurants
 * Quick script to manually add popular UK restaurant chains
 */

import { prisma } from '../lib/prisma'

const NATIONWIDE_CHAINS = [
  {
    name: "Nando's",
    cuisine: 'Portuguese',
    address: 'Multiple Locations Nationwide',
    website: 'https://www.nandos.co.uk',
    rating: 4.3
  },
  {
    name: 'Wagamama',
    cuisine: 'Asian Fusion',
    address: 'Multiple Locations Nationwide',
    website: 'https://www.wagamama.com',
    rating: 4.4
  },
  {
    name: 'Dishoom',
    cuisine: 'Indian',
    address: 'Multiple Locations Nationwide',
    website: 'https://www.dishoom.com',
    rating: 4.6
  },
  {
    name: 'Hawksmoor',
    cuisine: 'Steakhouse',
    address: 'Multiple Locations Nationwide',
    website: 'https://thehawksmoor.com',
    rating: 4.7
  },
  {
    name: 'Côte Brasserie',
    cuisine: 'French',
    address: 'Multiple Locations Nationwide',
    website: 'https://www.cote.co.uk',
    rating: 4.3
  },
  {
    name: 'Yo! Sushi',
    cuisine: 'Japanese',
    address: 'Multiple Locations Nationwide',
    website: 'https://yosushi.com',
    rating: 4.2
  },
  {
    name: 'Bill\'s',
    cuisine: 'British',
    address: 'Multiple Locations Nationwide',
    website: 'https://bills-website.co.uk',
    rating: 4.3
  },
  {
    name: 'The Ivy',
    cuisine: 'British',
    address: 'Multiple Locations Nationwide',
    website: 'https://www.theivycollection.com',
    rating: 4.5
  },
  {
    name: 'Flat Iron',
    cuisine: 'Steakhouse',
    address: 'Multiple Locations Nationwide',
    website: 'https://flatironsteak.co.uk',
    rating: 4.6
  },
  {
    name: 'Pret A Manger',
    cuisine: 'Cafe',
    address: 'Multiple Locations Nationwide',
    website: 'https://www.pret.co.uk',
    rating: 4.1
  }
]

async function main() {
  console.log('🔗 Adding Nationwide Chain Restaurants')
  console.log('━'.repeat(50))
  console.log('')

  // Get nationwide city
  const nationwide = await prisma.city.findUnique({
    where: { slug: 'nationwide' }
  })

  if (!nationwide) {
    console.error('❌ Nationwide city not found')
    process.exit(1)
  }

  let added = 0
  let skipped = 0

  for (const chain of NATIONWIDE_CHAINS) {
    // Check if already exists
    const existing = await prisma.restaurant.findFirst({
      where: {
        name: chain.name,
        cityId: nationwide.id
      }
    })

    if (existing) {
      console.log(`⏭️  Skipped: ${chain.name} (already exists)`)
      skipped++
      continue
    }

    // Add restaurant
    await prisma.restaurant.create({
      data: {
        name: chain.name,
        cuisine: chain.cuisine,
        address: chain.address,
        website: chain.website,
        rating: chain.rating,
        cityId: nationwide.id,
        isActive: true,
        slug: chain.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }
    })

    console.log(`✅ Added: ${chain.name}`)
    added++
  }

  console.log('')
  console.log('━'.repeat(50))
  console.log(`✅ Added ${added} restaurants`)
  console.log(`⏭️  Skipped ${skipped} (already existed)`)
  console.log('')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

