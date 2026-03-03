/**
 * Create Supabase storage bucket for images
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const BUCKET_NAME = 'dish-images'

async function createBucket() {
  console.log('🪣 Creating Supabase Storage Bucket')
  console.log('━'.repeat(60))
  console.log('')

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      process.exit(1)
    }
    
    const existingBucket = buckets?.find(b => b.name === BUCKET_NAME)
    
    if (existingBucket) {
      console.log(`✅ Bucket '${BUCKET_NAME}' already exists!`)
      console.log('')
      return
    }
    
    // Create the bucket
    console.log(`📦 Creating bucket: ${BUCKET_NAME}`)
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    })
    
    if (error) {
      console.error('❌ Error creating bucket:', error)
      process.exit(1)
    }
    
    console.log(`✅ Bucket '${BUCKET_NAME}' created successfully!`)
    console.log('')
    console.log('🎉 You can now upload images to this bucket!')
    
  } catch (error) {
    console.error('❌ Failed:', error)
    process.exit(1)
  }
}

createBucket()





