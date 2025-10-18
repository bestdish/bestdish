/**
 * Instagram Image Extractor
 * Extracts image URL from Instagram post page
 */

/**
 * Check if URL is an Instagram post
 */
export function isInstagramUrl(url: string): boolean {
  return url.includes('instagram.com/p/') || url.includes('instagram.com/reel/')
}

/**
 * Use DownloadGram-like service to extract Instagram image
 */
async function extractViaDownloadService(postUrl: string): Promise<string | null> {
  try {
    console.log(`  🔧 Using download service to extract image...`)
    
    // Try using a downloadgram-like API endpoint
    // Many of these services expose their extraction as an API
    const serviceUrl = `https://downloadgram.org/api/download?url=${encodeURIComponent(postUrl)}`
    
    try {
      const response = await fetch(serviceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        // Different services have different response formats
        const imageUrl = data.url || data.download_url || data.image || data.media?.[0]?.url
        if (imageUrl) {
          console.log(`  ✓ Extracted via download service`)
          return imageUrl
        }
      }
    } catch (e) {
      // Service API failed, continue to manual extraction
    }
    
    return null
  } catch (error) {
    return null
  }
}

/**
 * Extract image URL from Instagram post page
 */
export async function extractInstagramImage(postUrl: string): Promise<string | null> {
  try {
    console.log(`  📸 Extracting image from Instagram post...`)
    
    // Method 1: Try using a third-party download service
    const serviceImage = await extractViaDownloadService(postUrl)
    if (serviceImage) {
      return serviceImage
    }
    
    // Method 2: Try using Instagram's oembed API (no auth required)
    try {
      const oembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(postUrl)}`
      const oembedResponse = await fetch(oembedUrl)
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json()
        if (oembedData.thumbnail_url) {
          console.log(`  ✓ Found image via Instagram oEmbed API`)
          return oembedData.thumbnail_url
        }
      }
    } catch (e) {
      // oEmbed failed, try other methods
    }
    
    // Method 2: Fetch the Instagram page and parse HTML
    const response = await fetch(postUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    })
    
    if (!response.ok) {
      console.error(`  ✗ Failed to fetch Instagram page: ${response.status}`)
      return null
    }
    
    const html = await response.text()
    
    // Method 3: Look for display_url in page source (highest quality)
    const displayUrlMatch = html.match(/"display_url":"([^"]+)"/i)
    if (displayUrlMatch && displayUrlMatch[1]) {
      // Unescape the URL
      const imageUrl = displayUrlMatch[1]
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/\\\//g, '/')
      
      // Validate it's not Instagram branding
      if (!imageUrl.includes('instagram-logo') && !imageUrl.includes('/static/')) {
        console.log(`  ✓ Found image via display_url`)
        return imageUrl
      }
    }
    
    // Method 4: Look for high-resolution Instagram post images (scontent CDN)
    // Post images are always on scontent-*.cdninstagram.com and are high-res
    const scontentMatches = html.matchAll(/(https:\/\/scontent[^"'\s]*\.cdninstagram\.com[^"'\s]*\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s]*)?)/gi)
    const scontentUrls = Array.from(scontentMatches).map(m => m[1])
    
    // Filter and sort by likely quality indicators
    const postImages = scontentUrls.filter(url => 
      !url.includes('instagram-logo') &&
      !url.includes('/static/') &&
      !url.includes('profile') &&
      !url.includes('avatar') &&
      !url.includes('150x150') &&
      !url.includes('44x44') &&
      !url.includes('32x32') &&
      !url.includes('s150x150') &&
      !url.includes('s320x320')
    ).sort((a, b) => {
      // Prioritize larger sizes mentioned in URL
      const aSize = (a.match(/(\d+)x(\d+)/) || [0, 0, 0])[1]
      const bSize = (b.match(/(\d+)x(\d+)/) || [0, 0, 0])[1]
      return parseInt(bSize as string) - parseInt(aSize as string)
    })
    
    if (postImages.length > 0) {
      console.log(`  ✓ Found ${postImages.length} scontent post images`)
      console.log(`  📸 Using: ${postImages[0].substring(0, 100)}...`)
      return postImages[0]
    }
    
    // Method 5: Try og:image (but validate it's not logo)
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
    if (ogImageMatch && ogImageMatch[1]) {
      const ogUrl = ogImageMatch[1]
      if (!ogUrl.includes('instagram-logo') && !ogUrl.includes('/static/')) {
        console.log(`  ✓ Found image via og:image tag`)
        return ogUrl
      }
    }
    
    // Method 6: Try to find image in JSON-LD data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">(.+?)<\/script>/s)
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[1])
        if (jsonData.image && !jsonData.image.includes('instagram-logo')) {
          console.log(`  ✓ Found image via JSON-LD`)
          return jsonData.image
        }
      } catch (e) {
        // JSON parse failed, continue
      }
    }
    
    console.log(`  ✗ Could not extract image from Instagram post`)
    console.log(`  💡 Tip: Try using a direct image URL instead`)
    return null
    
  } catch (error) {
    console.error(`  ✗ Instagram extraction error:`, error)
    return null
  }
}

