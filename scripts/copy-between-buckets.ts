/**
 * Copy images from dish-images bucket to dish-photos bucket
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function copyImages() {
  console.log('📦 Copying images from dish-images → dish-photos')
  console.log('━'.repeat(60))
  console.log('')

  try {
    // List all files in dish-images bucket
    const { data: files, error: listError } = await supabase.storage
      .from('dish-images')
      .list('public', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (listError) {
      console.error('❌ Error listing files:', listError)
      process.exit(1)
    }

    if (!files || files.length === 0) {
      console.log('✅ No files to copy from dish-images')
      return
    }

    console.log(`Found ${files.length} files to copy\n`)

    let copied = 0
    let failed = 0

    for (const file of files) {
      const filePath = `public/${file.name}`
      
      try {
        // Download from dish-images
        const { data: imageData, error: downloadError } = await supabase.storage
          .from('dish-images')
          .download(filePath)

        if (downloadError) {
          console.error(`❌ Failed to download ${filePath}:`, downloadError.message)
          failed++
          continue
        }

        // Upload to dish-photos
        const { error: uploadError } = await supabase.storage
          .from('dish-photos')
          .upload(filePath, imageData, {
            contentType: file.metadata?.mimetype || 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) {
          console.error(`❌ Failed to upload ${filePath}:`, uploadError.message)
          failed++
          continue
        }

        console.log(`✅ Copied: ${filePath}`)
        copied++

      } catch (error) {
        console.error(`❌ Error copying ${filePath}:`, error)
        failed++
      }
    }

    console.log('')
    console.log('━'.repeat(60))
    console.log('✅ COPY COMPLETE')
    console.log('━'.repeat(60))
    console.log('')
    console.log(`📊 Results:`)
    console.log(`   ✅ Copied: ${copied}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log('')
    console.log('🎉 All images are now in dish-photos bucket!')

  } catch (error) {
    console.error('❌ Copy failed:', error)
    process.exit(1)
  }
}

copyImages()





