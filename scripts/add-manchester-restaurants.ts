/**
 * Add Top Manchester Restaurants
 */

import { prisma } from '../lib/prisma'

// Curated list of top Manchester restaurants known for specific dishes
const MANCHESTER_RESTAURANTS = [
  {
    name: 'Hawksmoor Manchester',
    cuisine: 'Steakhouse',
    address: '184-186 Deansgate, Manchester M3 3WB',
    website: 'https://thehawksmoor.com/locations/manchester',
    rating: 4.6
  },
  {
    name: 'Dishoom Manchester',
    cuisine: 'Indian',
    address: '32 Bridge St, Manchester M3 3BT',
    website: 'https://www.dishoom.com/manchester/',
    rating: 4.6
  },
  {
    name: 'Tattu Manchester',
    cuisine: 'Chinese',
    address: '3 Hardman Square, Spinningfields, Manchester M3 3EB',
    website: 'https://tattu.co.uk/manchester/',
    rating: 4.5
  },
  {
    name: 'Australasia',
    cuisine: 'Asian Fusion',
    address: '1 The Avenue, Spinningfields, Manchester M3 3AP',
    website: 'https://www.individualrestaurants.com/australasia',
    rating: 4.4
  },
  {
    name: 'El Gato Negro',
    cuisine: 'Spanish',
    address: '52 King St, Manchester M2 4LY',
    website: 'https://elgatonegrotapas.com',
    rating: 4.5
  },
  {
    name: 'Bundobust Manchester',
    cuisine: 'Indian',
    address: '61 Piccadilly, Manchester M1 2AG',
    website: 'https://bundobust.com/manchester',
    rating: 4.6
  },
  {
    name: 'Mowgli Street Food Manchester',
    cuisine: 'Indian',
    address: '3-7 Water St, Manchester M3 4JQ',
    website: 'https://mowglistreetfood.com',
    rating: 4.5
  },
  {
    name: 'Adam Reid at The French',
    cuisine: 'Modern British',
    address: 'Peter St, Manchester M60 2DS',
    website: 'https://the-french.co.uk',
    rating: 4.7
  },
  {
    name: 'Rudy\'s Neapolitan Pizza',
    cuisine: 'Italian',
    address: '9 Cotton St, Manchester M4 5BF',
    website: 'https://rudyspizza.co.uk',
    rating: 4.7
  },
  {
    name: 'Blacklock Manchester',
    cuisine: 'Steakhouse',
    address: 'Barton Arcade, Deansgate, Manchester M3 2BH',
    website: 'https://www.theblacklock.com/locations/manchester',
    rating: 4.6
  }
]

async function main() {
  console.log('🏙️  Adding Manchester Restaurants')
  console.log('━'.repeat(50))
  console.log('')

  // Get Manchester city
  const manchester = await prisma.city.findUnique({
    where: { slug: 'manchester' }
  })

  if (!manchester) {
    console.error('❌ Manchester city not found')
    process.exit(1)
  }

  let added = 0
  let skipped = 0

  for (const restaurant of MANCHESTER_RESTAURANTS) {
    // Check if already exists
    const existing = await prisma.restaurant.findFirst({
      where: {
        name: restaurant.name,
        cityId: manchester.id
      }
    })

    if (existing) {
      console.log(`⏭️  Skipped: ${restaurant.name} (already exists)`)
      skipped++
      continue
    }

    // Add restaurant
    await prisma.restaurant.create({
      data: {
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        address: restaurant.address,
        website: restaurant.website,
        rating: restaurant.rating,
        cityId: manchester.id,
        isActive: true,
        slug: restaurant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }
    })

    console.log(`✅ Added: ${restaurant.name}`)
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


