/**
 * Add Top London Restaurants
 */

import { prisma } from '../lib/prisma'

const LONDON_RESTAURANTS = [
  {
    name: 'Sketch',
    cuisine: 'Modern European',
    address: '9 Conduit St, London W1S 2XG',
    website: 'https://sketch.london',
    rating: 4.5
  },
  {
    name: 'Dishoom King\'s Cross',
    cuisine: 'Indian',
    address: 'Stable St, London N1C 4AB',
    website: 'https://www.dishoom.com/kings-cross',
    rating: 4.6
  },
  {
    name: 'Hawksmoor Seven Dials',
    cuisine: 'Steakhouse',
    address: '11 Langley St, London WC2H 9JG',
    website: 'https://thehawksmoor.com/locations/seven-dials',
    rating: 4.7
  },
  {
    name: 'Padella',
    cuisine: 'Italian',
    address: '6 Southwark St, London SE1 1TQ',
    website: 'https://www.padella.co',
    rating: 4.6
  },
  {
    name: 'Bao Soho',
    cuisine: 'Taiwanese',
    address: '53 Lexington St, London W1F 9AS',
    website: 'https://baolondon.com',
    rating: 4.5
  },
  {
    name: 'Hoppers',
    cuisine: 'Sri Lankan',
    address: '49 Frith St, London W1D 4SG',
    website: 'https://www.hopperslondon.com',
    rating: 4.5
  },
  {
    name: 'Barrafina',
    cuisine: 'Spanish',
    address: '26-27 Dean St, London W1D 3LL',
    website: 'https://www.barrafina.co.uk',
    rating: 4.6
  },
  {
    name: 'Smoking Goat',
    cuisine: 'Thai',
    address: '64 Shoreditch High St, London E1 6JJ',
    website: 'https://smokinggoatbar.com',
    rating: 4.5
  }
]

async function main() {
  console.log('🏙️  Adding London Restaurants')
  console.log('━'.repeat(50))
  console.log('')

  const london = await prisma.city.findUnique({
    where: { slug: 'london' }
  })

  if (!london) {
    console.error('❌ London city not found')
    process.exit(1)
  }

  let added = 0
  let skipped = 0

  for (const restaurant of LONDON_RESTAURANTS) {
    const existing = await prisma.restaurant.findFirst({
      where: {
        name: restaurant.name,
        cityId: london.id
      }
    })

    if (existing) {
      console.log(`⏭️  Skipped: ${restaurant.name} (already exists)`)
      skipped++
      continue
    }

    await prisma.restaurant.create({
      data: {
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        address: restaurant.address,
        website: restaurant.website,
        rating: restaurant.rating,
        cityId: london.id,
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


