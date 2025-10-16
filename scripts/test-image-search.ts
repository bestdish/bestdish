/**
 * Test Google Image Search API
 */

import { searchDishImages } from '@/lib/scraper/google-image-finder'

async function main() {
  console.log('🔍 Testing Google Image Search API')
  console.log('━'.repeat(50))
  console.log('')
  
  const restaurantName = 'Piccolino Birmingham'
  const dishName = 'BURRATA CON CAVIALE'
  
  console.log(`Testing: ${restaurantName} - ${dishName}`)
  console.log('')
  
  const images = await searchDishImages(dishName, restaurantName)
  
  console.log('')
  console.log(`✅ Found ${images.length} images after filtering`)
  console.log('')
  
  if (images.length > 0) {
    console.log('Top 3 images:')
    images.slice(0, 3).forEach((img, i) => {
      const mp = (img.width * img.height / 1000000).toFixed(2)
      console.log(`  ${i + 1}. ${img.width}×${img.height} (${mp}MP)`)
      console.log(`     URL: ${img.url}`)
      console.log(`     Context: ${img.contextLink}`)
      console.log('')
    })
  } else {
    console.log('❌ No images found!')
  }
}

main()

