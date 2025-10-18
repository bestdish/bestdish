/**
 * Instaloader Integration
 * Uses Instaloader Python library to extract Instagram post images
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { readdir, unlink, readFile } from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

/**
 * Extract shortcode from Instagram URL
 * e.g., https://www.instagram.com/p/ABC123xyz/ -> ABC123xyz
 */
function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

/**
 * Download Instagram post image using Instaloader
 */
export async function downloadInstagramWithInstaloader(postUrl: string): Promise<string | null> {
  const shortcode = extractShortcode(postUrl)
  if (!shortcode) {
    console.log(`  ✗ Invalid Instagram URL format`)
    return null
  }
  
  const tempDir = path.join(process.cwd(), 'temp-instagram')
  
  try {
    console.log(`  🐍 Using Instaloader to download post...`)
    
    // Create temp directory
    await execAsync(`mkdir -p "${tempDir}"`)
    
    // Download using Instaloader (use full path since it's not on PATH)
    // --no-metadata-json: Don't save JSON metadata
    // --no-captions: Don't save captions
    // --no-video-thumbnails: Only get the actual image
    // --dirname-pattern: Save to our temp directory
    const instaloaderPath = '/Users/nate/Library/Python/3.9/bin/instaloader'
    const command = `${instaloaderPath} --no-metadata-json --no-captions --no-video-thumbnails --dirname-pattern="${tempDir}" -- -${shortcode}`
    
    console.log(`  📥 Downloading post ${shortcode}...`)
    
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 30000 })
      if (stderr && stderr.includes('403')) {
        console.log(`  ✗ Instagram blocked request (403 Forbidden)`)
        console.log(`  💡 Try: 1) Wait a few minutes, or 2) Use Upload tab instead`)
        await cleanup(tempDir)
        return null
      }
    } catch (execError: any) {
      console.log(`  ✗ Instaloader failed:`, execError.message)
      if (execError.message.includes('403') || execError.message.includes('Forbidden')) {
        console.log(`  💡 Instagram is blocking - please use Upload tab`)
      }
      await cleanup(tempDir)
      return null
    }
    
    // Find the downloaded image file
    const files = await readdir(tempDir)
    const imageFile = files.find(f => 
      f.endsWith('.jpg') || 
      f.endsWith('.png') || 
      f.endsWith('.jpeg') ||
      f.endsWith('.webp')
    )
    
    if (!imageFile) {
      console.log(`  ✗ No image file found in download`)
      console.log(`  💡 Instagram may have blocked the download - try Upload tab`)
      await cleanup(tempDir)
      return null
    }
    
    const imagePath = path.join(tempDir, imageFile)
    console.log(`  ✓ Downloaded: ${imageFile}`)
    
    // Read the file as buffer
    const imageBuffer = await readFile(imagePath)
    
    // Cleanup temp directory
    await cleanup(tempDir)
    
    // Return the buffer so it can be uploaded
    return imageBuffer.toString('base64')
    
  } catch (error) {
    console.error(`  ✗ Instaloader error:`, error)
    await cleanup(tempDir)
    return null
  }
}

/**
 * Cleanup temp directory
 */
async function cleanup(dir: string) {
  try {
    await execAsync(`rm -rf "${dir}"`)
  } catch (e) {
    // Ignore cleanup errors
  }
}

/**
 * Check if Instaloader is installed
 */
export async function checkInstaloaderInstalled(): Promise<boolean> {
  try {
    const instaloaderPath = '/Users/nate/Library/Python/3.9/bin/instaloader'
    await execAsync(`${instaloaderPath} --version`)
    return true
  } catch (error) {
    return false
  }
}

