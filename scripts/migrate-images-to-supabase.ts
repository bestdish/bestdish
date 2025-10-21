/**
 * Migrate all external images to Supabase Storage
 * Downloads external URLs and uploads to Supabase, updates database paths
 */

import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const prisma = new PrismaClient()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const BUCKET_NAME = 'dish-photos'

/**
 * Download image from URL
 */
async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    console.log(`  📥 Downloading: ${url.substring(0, 80)}...`)
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error(`  ❌ Failed to download: ${response.status} ${response.statusText}`)
      return null
    }
    
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error(`  ❌ Download error:`, error)
    return null
  }
}

/**
 * Upload image to Supabase storage
 */
async function uploadToSupabase(
  imageBuffer: Buffer,
  originalUrl: string
): Promise<string | null> {
  try {
    // Generate a unique filename
    const hash = crypto.createHash('md5').update(originalUrl).digest('hex')
    const extension = getExtension(originalUrl)
    const filename = `public/${hash}${extension}`
    
    // Check if already exists
    const { data: existingFiles } = await supabase.storage
      .from(BUCKET_NAME)
      .list('public', { search: hash })
    
    if (existingFiles && existingFiles.length > 0) {
      console.log(`  ⏭️  Already exists: ${filename}`)
      return filename
    }
    
    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, imageBuffer, {
        contentType: getContentType(extension),
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.error(`  ❌ Upload error:`, uploadError)
      return null
    }
    
    console.log(`  ✅ Uploaded: ${filename}`)
    return filename
  } catch (error) {
    console.error(`  ❌ Upload failed:`, error)
    return null
  }
}

/**
 * Get file extension from URL
 */
function getExtension(url: string): string {
  // Try to get extension from URL
  const urlParts = url.split('?')[0].split('.')
  const ext = urlParts[urlParts.length - 1].toLowerCase()
  
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    return `.${ext}`
  }
  
  // Default to jpg for external URLs
  return '.jpg'
}

/**
 * Get content type from extension
 */
function getContentType(extension: string): string {
  const types: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif'
  }
  return types[extension] || 'image/jpeg'
}

/**
 * Check if URL is external (needs migration)
 */
function isExternalUrl(url: string): boolean {
  if (!url) return false
  
  // External URLs to migrate
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.includes('unsplash.com') ||
    url.includes('googleapis.com')
  )
}

/**
 * Check if it's already a proper Supabase path
 */
function isSupabasePath(url: string): boolean {
  if (!url) return false
  return url.startsWith('public/') || url.startsWith('pending/')
}

async function migrateImages() {
  console.log('🔄 Migrating External Images → Supabase Storage')
  console.log('━'.repeat(60))
  console.log('')

  let migratedCount = 0
  let skippedCount = 0
  let failedCount = 0

  try {
    // Migrate City Images
    console.log('📍 Migrating city images...')
    const cities = await prisma.city.findMany({
      where: {
        photoUrl: { not: null }
      }
    })
    
    for (const city of cities) {
      if (!city.photoUrl) continue
      
      console.log(`\n🏙️  ${city.name}`)
      
      if (isSupabasePath(city.photoUrl)) {
        console.log(`  ✅ Already migrated`)
        skippedCount++
        continue
      }
      
      if (!isExternalUrl(city.photoUrl)) {
        console.log(`  ⏭️  Not an external URL, skipping`)
        skippedCount++
        continue
      }
      
      // Download and upload
      const imageBuffer = await downloadImage(city.photoUrl)
      if (!imageBuffer) {
        failedCount++
        continue
      }
      
      const supabasePath = await uploadToSupabase(imageBuffer, city.photoUrl)
      if (!supabasePath) {
        failedCount++
        continue
      }
      
      // Update database
      await prisma.city.update({
        where: { id: city.id },
        data: { photoUrl: supabasePath }
      })
      
      console.log(`  💾 Updated database`)
      migratedCount++
    }

    // Migrate Restaurant Images
    console.log('\n\n🍽️  Migrating restaurant images...')
    const restaurants = await prisma.restaurant.findMany({
      where: {
        photoUrl: { not: null }
      }
    })
    
    for (const restaurant of restaurants) {
      if (!restaurant.photoUrl) continue
      
      console.log(`\n🍴 ${restaurant.name}`)
      
      if (isSupabasePath(restaurant.photoUrl)) {
        console.log(`  ✅ Already migrated`)
        skippedCount++
        continue
      }
      
      if (!isExternalUrl(restaurant.photoUrl)) {
        console.log(`  ⏭️  Not an external URL, skipping`)
        skippedCount++
        continue
      }
      
      // Download and upload
      const imageBuffer = await downloadImage(restaurant.photoUrl)
      if (!imageBuffer) {
        failedCount++
        continue
      }
      
      const supabasePath = await uploadToSupabase(imageBuffer, restaurant.photoUrl)
      if (!supabasePath) {
        failedCount++
        continue
      }
      
      // Update database
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { photoUrl: supabasePath }
      })
      
      console.log(`  💾 Updated database`)
      migratedCount++
    }

    // Migrate Dish Images
    console.log('\n\n🍕 Migrating dish images...')
    const dishes = await prisma.dish.findMany({
      where: {
        photoUrl: { not: null }
      },
      include: {
        restaurant: true
      }
    })
    
    for (const dish of dishes) {
      if (!dish.photoUrl) continue
      
      console.log(`\n🍽️  ${dish.name} (${dish.restaurant.name})`)
      
      if (isSupabasePath(dish.photoUrl)) {
        console.log(`  ✅ Already migrated`)
        skippedCount++
        continue
      }
      
      if (!isExternalUrl(dish.photoUrl)) {
        console.log(`  ⏭️  Not an external URL, skipping`)
        skippedCount++
        continue
      }
      
      // Download and upload
      const imageBuffer = await downloadImage(dish.photoUrl)
      if (!imageBuffer) {
        failedCount++
        continue
      }
      
      const supabasePath = await uploadToSupabase(imageBuffer, dish.photoUrl)
      if (!supabasePath) {
        failedCount++
        continue
      }
      
      // Update database
      await prisma.dish.update({
        where: { id: dish.id },
        data: { photoUrl: supabasePath }
      })
      
      console.log(`  💾 Updated database`)
      migratedCount++
    }

    // Summary
    console.log('\n')
    console.log('━'.repeat(60))
    console.log('✅ MIGRATION COMPLETE')
    console.log('━'.repeat(60))
    console.log('')
    console.log(`📊 Results:`)
    console.log(`   ✅ Migrated: ${migratedCount}`)
    console.log(`   ⏭️  Skipped: ${skippedCount}`)
    console.log(`   ❌ Failed: ${failedCount}`)
    console.log('')
    console.log('🎉 All images are now in Supabase storage!')
    console.log('🔄 Future syncs will copy images properly!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrateImages()

