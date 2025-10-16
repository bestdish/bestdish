/**
 * Seed Cities Script for BestDish
 * 
 * This script creates the initial cities for the BestDish platform
 * Run with: npx tsx scripts/seed-cities.ts
 */

import { PrismaClient } from '@prisma/client'
import { slugify } from '../lib/seo'

const prisma = new PrismaClient()

const UK_CITIES = [
  {
    name: 'London',
    description: 'Discover the best restaurants and dishes in the capital city. From Michelin-starred establishments to hidden gems, London\'s food scene is world-renowned.'
  },
  {
    name: 'Manchester',
    description: 'Explore Manchester\'s vibrant food culture. From traditional British fare to international cuisine, find the best dishes in this dynamic northern city.'
  },
  {
    name: 'Birmingham',
    description: 'Birmingham\'s diverse culinary landscape offers everything from authentic Balti to modern fine dining. Discover the best dishes in the UK\'s second city.'
  },
  {
    name: 'Edinburgh',
    description: 'Experience Edinburgh\'s rich food heritage. From traditional Scottish dishes to contemporary cuisine, find the best restaurants in Scotland\'s capital.'
  },
  {
    name: 'Glasgow',
    description: 'Glasgow\'s food scene combines traditional Scottish flavors with innovative modern cooking. Discover the best dishes in Scotland\'s largest city.'
  },
  {
    name: 'Bristol',
    description: 'Bristol\'s independent food culture shines with local produce and creative cooking. Find the best restaurants and dishes in this creative city.'
  },
  {
    name: 'Leeds',
    description: 'Leeds offers a diverse food scene from traditional Yorkshire fare to international cuisine. Discover the best dishes in this vibrant northern city.'
  },
  {
    name: 'Liverpool',
    description: 'Liverpool\'s food culture reflects its maritime heritage and modern creativity. Find the best restaurants and dishes in this historic port city.'
  },
  {
    name: 'Newcastle',
    description: 'Newcastle\'s food scene combines traditional Geordie flavors with contemporary dining. Discover the best dishes in the heart of the North East.'
  },
  {
    name: 'Cardiff',
    description: 'Cardiff\'s culinary scene showcases Welsh traditions alongside international influences. Find the best restaurants in Wales\' capital city.'
  }
]

async function main() {
  console.log('🌱 Starting city seeding...')
  
  try {
    for (const cityData of UK_CITIES) {
      const citySlug = slugify(cityData.name)
      
      // Check if city already exists
      const existingCity = await prisma.city.findUnique({
        where: { slug: citySlug }
      })
      
      if (existingCity) {
        console.log(`⏭️  Skipping existing city: ${cityData.name}`)
        continue
      }
      
      // Create city
      const city = await prisma.city.create({
        data: {
          name: cityData.name,
          slug: citySlug,
          description: cityData.description
        }
      })
      
      console.log(`✅ Created city: ${city.name}`)
    }
    
    console.log('\n🎉 City seeding completed successfully!')
    
    // Print summary
    const cities = await prisma.city.findMany({
      orderBy: { name: 'asc' }
    })
    
    console.log('\n📊 Cities in database:')
    cities.forEach(city => {
      console.log(`  • ${city.name}`)
    })
    
  } catch (error) {
    console.error('💥 City seeding failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  main()
}

export { main as seedCities }



