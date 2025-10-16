/**
 * Helper functions for building Supabase storage URLs
 */

/**
 * Build public URL for Supabase storage object
 */
export function getPublicImageUrl(bucket: string, path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

/**
 * Generate temporary signed URL for private bucket access
 */
export async function getSignedImageUrl(
  bucket: string, 
  path: string, 
  expiresIn: number = 60
): Promise<string | null> {
  try {
    const { createAdminClient } = await import('./supabaseAdmin')
    const supabase = createAdminClient()
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)
    
    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }
    
    return data.signedUrl
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return null
  }
}

/**
 * Move file from pending to public folder in storage
 */
export async function moveImageToPublic(
  bucket: string,
  pendingPath: string
): Promise<string | null> {
  try {
    const { createAdminClient } = await import('./supabaseAdmin')
    const supabase = createAdminClient()
    
    // Extract filename from pending path
    const filename = pendingPath.split('/').pop()
    if (!filename) {
      throw new Error('Invalid pending path')
    }
    
    const publicPath = `public/${filename}`
    
    // Try to move the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .move(pendingPath, publicPath)
    
    if (error) {
      console.error('Error moving file:', error)
      // Fallback: download, upload, delete
      return await fallbackMoveImage(bucket, pendingPath, publicPath)
    }
    
    return publicPath
  } catch (error) {
    console.error('Error moving image to public:', error)
    return null
  }
}

/**
 * Fallback method: download, upload to new location, delete old file
 */
async function fallbackMoveImage(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<string | null> {
  try {
    const { createAdminClient } = await import('./supabaseAdmin')
    const supabase = createAdminClient()
    
    // Download the file
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(fromPath)
    
    if (downloadError) {
      throw downloadError
    }
    
    // Upload to new location
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(toPath, downloadData, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      throw uploadError
    }
    
    // Delete old file
    await supabase.storage
      .from(bucket)
      .remove([fromPath])
    
    return toPath
  } catch (error) {
    console.error('Fallback move failed:', error)
    return null
  }
}

/**
 * Delete image from storage
 */
export async function deleteImage(bucket: string, path: string): Promise<boolean> {
  try {
    const { createAdminClient } = await import('./supabaseAdmin')
    const supabase = createAdminClient()
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) {
      console.error('Error deleting image:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    return false
  }
}


