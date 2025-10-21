/**
 * Delete a Supabase storage bucket
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const BUCKET_NAME = 'dish-images'

async function deleteBucket() {
  console.log('🗑️  Deleting Supabase Storage Bucket')
  console.log('━'.repeat(60))
  console.log('')
  console.log(`Bucket: ${BUCKET_NAME}`)
  console.log(`Environment: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
  console.log('')

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      process.exit(1)
    }
    
    const existingBucket = buckets?.find(b => b.name === BUCKET_NAME)
    
    if (!existingBucket) {
      console.log(`✅ Bucket '${BUCKET_NAME}' does not exist (already deleted or never created)`)
      console.log('')
      return
    }
    
    // Empty the bucket first (delete all files recursively)
    console.log(`📦 Emptying bucket...`)
    
    // Delete files in root
    const { data: rootFiles, error: listRootError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000 })
    
    if (!listRootError && rootFiles && rootFiles.length > 0) {
      const rootFilePaths = rootFiles.map(f => f.name)
      await supabase.storage.from(BUCKET_NAME).remove(rootFilePaths)
      console.log(`   ✅ Deleted ${rootFilePaths.length} items from root`)
    }
    
    // Delete files in public/ folder
    const { data: publicFiles, error: listPublicError } = await supabase.storage
      .from(BUCKET_NAME)
      .list('public', { limit: 1000 })
    
    if (!listPublicError && publicFiles && publicFiles.length > 0) {
      const publicFilePaths = publicFiles.map(f => `public/${f.name}`)
      await supabase.storage.from(BUCKET_NAME).remove(publicFilePaths)
      console.log(`   ✅ Deleted ${publicFilePaths.length} files from public/`)
    }
    
    // Delete the bucket
    console.log(`🗑️  Deleting bucket: ${BUCKET_NAME}`)
    const { error } = await supabase.storage.deleteBucket(BUCKET_NAME)
    
    if (error) {
      console.error('❌ Error deleting bucket:', error)
      process.exit(1)
    }
    
    console.log(`✅ Bucket '${BUCKET_NAME}' deleted successfully!`)
    console.log('')
    console.log('🎉 Cleanup complete!')
    
  } catch (error) {
    console.error('❌ Failed:', error)
    process.exit(1)
  }
}

deleteBucket()

