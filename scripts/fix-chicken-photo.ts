import { prisma } from '@/lib/prisma'

async function fixPhoto() {
  const dish = await prisma.dish.findFirst({
    where: { slug: 'chicken-ruby-murray' }
  })
  
  if (dish) {
    console.log('Current photoUrl:', dish.photoUrl)
    
    // Update with the correct photo
    await prisma.dish.update({
      where: { id: dish.id },
      data: { photoUrl: '1760788491326-chicken-ruby-murray.png' }
    })
    
    console.log('✅ Updated to: 1760788491326-chicken-ruby-murray.png')
  } else {
    console.log('Dish not found')
  }
  
  await prisma.$disconnect()
}

fixPhoto()

