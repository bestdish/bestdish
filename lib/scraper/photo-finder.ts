/**
 * Photo discovery and download
 */

import axios from 'axios'
import sharp from 'sharp'
import { createAdminClient } from '../supabaseAdmin'
import fs from 'fs/promises'
import path from 'path'
import { randomBytes } from 'crypto'

/**
 * Find photo URL for a dish
 * For MVP: Uses Google Places restaurant photo (can be replaced manually later)
 */
export async function findDishPhoto(
  restaurantName: string,
  dishName: string,
  keywords: string[],
  restaurantPhotoUrl: string | null = null
): Promise<string | null> {
  try {
    // For MVP, use restaurant's Google Places photo
    // These are high-quality and reliable
    // User can manually replace with actual dish photos later via admin UI
    if (restaurantPhotoUrl) {
      console.log(`  📸 Using Google Places photo (replace manually with dish photo later)`)
      return restaurantPhotoUrl
    }
    
    console.log(`  ⚠️  No photo available`)
    return null
  } catch (error) {
    console.error('Photo search failed:', error)
    return null
  }
}

/**
 * Download photo and upload to Supabase storage
 */
export async function downloadAndUploadPhoto(
  photoUrl: string,
  dishName: string
): Promise<string | null> {
  if (!photoUrl) return null
  
  let tempFilePath: string | null = null
  
  try {
    // Generate unique filename
    const randomId = randomBytes(8).toString('hex')
    const ext = '.jpg'
    const filename = `${randomId}${ext}`
    tempFilePath = path.join('/tmp', filename)
    
    // Download image
    console.log(`  📥 Downloading photo...`)
    const response = await axios.get(photoUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'BestDish/1.0'
      }
    })
    
    // Optimize with Sharp
    console.log(`  🖼️  Optimizing image...`)
    const optimizedBuffer = await sharp(response.data)
      .resize(1200, 900, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toBuffer()
    
    // Write to temp file
    await fs.writeFile(tempFilePath, optimizedBuffer)
    
    // Upload to Supabase
    console.log(`  ☁️  Uploading to Supabase...`)
    const supabase = createAdminClient()
    
    const { data, error } = await supabase.storage
      .from('dish-photos')
      .upload(filename, optimizedBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000', // 1 year
        upsert: false
      })
    
    if (error) {
      console.error('Supabase upload error:', error)
      return null
    }
    
    // Clean up temp file
    await fs.unlink(tempFilePath)
    
    return filename // Return just the filename (path in Supabase)
  } catch (error) {
    console.error('Photo download/upload failed:', error)
    
    // Clean up temp file if it exists
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath)
      } catch {}
    }
    
    return null
  }
}

/**
 * Validate that a URL points to an actual image
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, {
      timeout: 5000
    })
    
    const contentType = response.headers['content-type']
    return contentType?.startsWith('image/') || false
  } catch {
    return false
  }
}

