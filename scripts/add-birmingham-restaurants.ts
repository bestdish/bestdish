/**
 * Add Top Birmingham Restaurants
 */

import { prisma } from '../lib/prisma'

const BIRMINGHAM_RESTAURANTS = [
  {
    name: 'Adam\'s',
    cuisine: 'Modern British',
    address: '16 Waterloo St, Birmingham B2 5UG',
    website: 'https://adamsrestaurant.co.uk',
    rating: 4.8
  },
  {
    name: 'Opheem',
    cuisine: 'Indian',
    address: '98-100 Broad St, Birmingham B15 1AU',
    website: 'https://www.opheemrestaurant.com',
    rating: 4.6
  },
  {
    name: 'Simpsons',
    cuisine: 'Modern British',
    address: '20 Highfield Rd, Edgbaston, Birmingham B15 3DU',
    website: 'https://www.simpsonsrestaurant.co.uk',
    rating: 4.7
  },
  {
    name: 'Carters of Moseley',
    cuisine: 'Modern British',
    address: '2c Wake Green Rd, Moseley, Birmingham B13 9EZ',
    website: 'https://cartersofmoseley.co.uk',
    rating: 4.8
  },
  {
    name: 'Purnell\'s',
    cuisine: 'Modern British',
    address: '55 Cornwall St, Birmingham B3 2DH',
    website: 'https://purnellsrestaurant.com',
    rating: 4.6
  },
  {
    name: 'The Wilderness',
    cuisine: 'Modern British',
    address: '27 Warstone Ln, Birmingham B18 6JQ',
    website: 'https://thewildernessbirmingham.co.uk',
    rating: 4.7
  },
  {
    name: 'Lasan',
    cuisine: 'Indian',
    address: '3-4 Dakota Buildings, James St, Birmingham B3 1SD',
    website: 'https://www.lasan.co.uk',
    rating: 4.5
  },
  {
    name: 'Asha\'s',
    cuisine: 'Indian',
    address: '12-22 Newhall St, Birmingham B3 3LX',
    website: 'https://www.ashasrestaurants.com/birmingham',
    rating: 4.4
  }
]

async function main() {
  console.log('🏙️  Adding Birmingham Restaurants')
  console.log('━'.repeat(50))
  console.log('')

  const birmingham = await prisma.city.findUnique({
    where: { slug: 'birmingham' }
  })

  if (!birmingham) {
    console.error('❌ Birmingham city not found')
    process.exit(1)
  }

  let added = 0
  let skipped = 0

  for (const restaurant of BIRMINGHAM_RESTAURANTS) {
    const existing = await prisma.restaurant.findFirst({
      where: {
        name: restaurant.name,
        cityId: birmingham.id
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
        cityId: birmingham.id,
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

