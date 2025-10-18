/**
 * Dish Curator
 * Orchestrates the curated dish creation process
 */

import { prisma } from '@/lib/prisma'
import { enrichRestaurantData } from './webEnricher'
import { matchRestaurant, generateRestaurantSlug } from './restaurantMatcher'
import { generateCuratedDishContent } from './aiContentGenerator'
import { generateFAQs } from '@/lib/scraper/ai-analyzer'
import { downloadInstagramWithInstaloader } from './instaloaderExtractor'
import { normalizeCuisine } from './cuisineMapper'
import { slugify } from '@/lib/seo'
import { createAdminClient } from '@/lib/supabaseAdmin'
import sharp from 'sharp'
import axios from 'axios'

export interface CurateDishInput {
  instagramHandle: string
  dishName: string
  citySlug: string
  isFeatured: boolean
  photoFile?: File
  photoUrl?: string
  restaurantNameOverride?: string
}

export interface CurateDishResult {
  success: boolean
  dishId?: string
  dishSlug?: string
  restaurantId?: string
  restaurantName?: string
  citySlug?: string
  progress: string[]
  error?: string
}

/**
 * Main curation function
 */
export async function curateDish(input: CurateDishInput): Promise<CurateDishResult> {
  const progress: string[] = []
  
  try {
    // Step 1: Validate city exists
    progress.push('🌍 Validating city...')
    const city = await prisma.city.findUnique({
      where: { slug: input.citySlug }
    })
    
    if (!city) {
      return {
        success: false,
        error: `City not found: ${input.citySlug}`,
        progress
      }
    }
    
    progress.push(`  ✓ City: ${city.name}`)
    
    // Step 2: Enrich restaurant data from web
    progress.push('🔍 Searching web for restaurant data...')
    const restaurantData = await enrichRestaurantData(
      input.instagramHandle,
      city.name,
      input.restaurantNameOverride
    )
    
    progress.push(`  ✓ Found restaurant: ${restaurantData.name}`)
    if (restaurantData.address) progress.push(`  Address: ${restaurantData.address}`)
    if (restaurantData.website) progress.push(`  Website: ${restaurantData.website}`)
    if (restaurantData.cuisine) progress.push(`  Cuisine: ${restaurantData.cuisine}`)
    
    // Step 3: Match or create restaurant
    progress.push('🏪 Matching restaurant in database...')
    const match = await matchRestaurant(
      restaurantData.name,
      input.citySlug,
      restaurantData.address || undefined
    )
    
    let restaurantId: string
    
    if (match.exists && match.restaurant) {
      progress.push(`  ✓ Found existing restaurant`)
      restaurantId = match.restaurant.id
      
      // Update restaurant with new data (overwrite as per requirements)
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          address: restaurantData.address,
          website: restaurantData.website,
          cuisine: restaurantData.cuisine,
          instagramHandle: input.instagramHandle,
          isActive: true
        }
      })
      progress.push(`  ✓ Updated restaurant details`)
    } else {
      progress.push(`  Creating new restaurant...`)
      const restaurantSlug = generateRestaurantSlug(restaurantData.name)
      
      const restaurant = await prisma.restaurant.create({
        data: {
          name: restaurantData.name,
          slug: restaurantSlug,
          address: restaurantData.address,
          website: restaurantData.website,
          cuisine: restaurantData.cuisine,
          instagramHandle: input.instagramHandle,
          cityId: city.id,
          isActive: true
        }
      })
      
      restaurantId = restaurant.id
      progress.push(`  ✓ Created restaurant`)
    }
    
    // Step 4: Handle photo upload/download
    progress.push('📸 Processing photo...')
    let photoPath: string | null = null
    
    if (input.photoFile) {
      // Upload from file
      progress.push('  Uploading from file...')
      photoPath = await uploadPhotoFromFile(input.photoFile, input.dishName)
      if (photoPath) {
        progress.push(`  ✓ Photo uploaded`)
      } else {
        progress.push(`  ⚠ Photo upload failed`)
      }
    } else if (input.photoUrl) {
      // Check if it's an Instagram URL
      if (input.photoUrl.includes('instagram.com')) {
        progress.push('  Extracting image from Instagram post...')
        const base64Image = await downloadInstagramWithInstaloader(input.photoUrl)
        
        if (base64Image) {
          photoPath = await uploadPhotoFromBase64(base64Image, input.dishName)
          if (photoPath) {
            progress.push(`  ✓ Instagram photo uploaded`)
          } else {
            progress.push(`  ⚠ Photo upload failed`)
          }
        } else {
          progress.push(`  ⚠ Could not extract Instagram image`)
          progress.push(`  💡 Try using Upload tab instead`)
        }
      } else {
        // Regular URL download
        progress.push('  Downloading from URL...')
        photoPath = await downloadAndUploadPhotoUrl(input.photoUrl, input.dishName)
        if (photoPath) {
          progress.push(`  ✓ Photo downloaded and uploaded`)
        } else {
          progress.push(`  ⚠ Photo download failed`)
        }
      }
    }
    
    if (!photoPath) {
      progress.push('  ⚠ Dish will be created without image')
      progress.push('  💡 You can upload a photo later in "Pending Dishes"')
    }
    
    // Step 5: Generate AI content for the SPECIFIC dish user requested
    progress.push(`🤖 Generating AI content for "${input.dishName}"...`)
    const aiContent = await generateCuratedDishContent(
      input.dishName,
      restaurantData.name,
      city.name,
      restaurantData.scrapedContent
    )
    
    if (!aiContent) {
      return {
        success: false,
        error: 'Failed to generate AI content',
        progress
      }
    }
    
    progress.push(`  ✓ Generated description (${aiContent.description.split(' ').length} words)`)
    progress.push(`  ✓ Found ${aiContent.quotes.length} quotes`)
    
    // Normalize and save cuisine
    const detectedCuisine = restaurantData.cuisine || aiContent.cuisine
    const normalizedCuisine = detectedCuisine ? normalizeCuisine(detectedCuisine) : null
    
    if (normalizedCuisine) {
      progress.push(`  Cuisine: ${normalizedCuisine}`)
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { cuisine: normalizedCuisine }
      })
    }
    
    // Step 6: Generate FAQs
    progress.push('❓ Generating FAQs...')
    const faqs = await generateFAQs(
      restaurantData.name,
      input.dishName,
      city.name,
      normalizedCuisine || null,
      aiContent.price || null,
      restaurantData.website || null,
      restaurantData.address || null
    )
    progress.push(`  ✓ Generated ${faqs.length} FAQ items`)
    
    // Step 7: Select best editorial quote
    const editorialQuote = aiContent.quotes.length > 0 ? aiContent.quotes[0] : null
    
    // Step 8: Create or update dish
    progress.push('💾 Creating dish in database...')
    const dishSlug = slugify(input.dishName)
    
    // Check if dish already exists for this restaurant
    const existingDish = await prisma.dish.findFirst({
      where: {
        slug: dishSlug,
        restaurantId: restaurantId
      }
    })
    
    const dishData = {
      name: input.dishName,
      slug: dishSlug,
      description: aiContent.description,
      price: aiContent.price,
      photoUrl: photoPath,
      restaurantId: restaurantId,
      isBest: true,
      isFeatured: input.isFeatured,
      editorialQuote: editorialQuote?.text || null,
      editorialSource: editorialQuote?.source || null,
      editorialUrl: editorialQuote?.url || null,
      faqAnswers: faqs as any
    }
    
    let dish
    if (existingDish) {
      progress.push('  Dish already exists - updating with new data...')
      dish = await prisma.dish.update({
        where: { id: existingDish.id },
        data: dishData
      })
      progress.push(`  ✓ Updated existing dish`)
    } else {
      dish = await prisma.dish.create({
        data: dishData
      })
      progress.push(`  ✓ Created new dish`)
    }
    
    progress.push(`✅ Dish created successfully!`)
    progress.push(`   Name: ${dish.name}`)
    progress.push(`   URL: /${input.citySlug}/${generateRestaurantSlug(restaurantData.name)}/${dish.slug}`)
    
    // Step 9: Trigger Make.com webhook for Instagram posting
    if (process.env.MAKE_WEBHOOK_URL) {
      progress.push('📸 Triggering Instagram post...')
      try {
        const response = await fetch(process.env.MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dishId: dish.id })
        })
        
        if (response.ok) {
          progress.push(`  ✓ Instagram post queued`)
        } else {
          progress.push(`  ⚠ Instagram post trigger failed`)
        }
      } catch (error) {
        progress.push(`  ⚠ Instagram webhook error (continuing anyway)`)
      }
    }
    
    return {
      success: true,
      dishId: dish.id,
      dishSlug: dish.slug,
      restaurantId,
      restaurantName: restaurantData.name,
      citySlug: input.citySlug,
      progress
    }
    
  } catch (error) {
    console.error('Curation error:', error)
    progress.push(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      progress
    }
  }
}

/**
 * Upload photo from File object
 */
async function uploadPhotoFromFile(file: File, dishName: string): Promise<string | null> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    return await uploadPhotoToSupabase(buffer, dishName)
  } catch (error) {
    console.error('File upload error:', error)
    return null
  }
}

/**
 * Upload photo from base64 string
 */
async function uploadPhotoFromBase64(base64: string, dishName: string): Promise<string | null> {
  try {
    const buffer = Buffer.from(base64, 'base64')
    return await uploadPhotoToSupabase(buffer, dishName)
  } catch (error) {
    console.error('Base64 upload error:', error)
    return null
  }
}

/**
 * Download and upload photo from URL
 */
async function downloadAndUploadPhotoUrl(url: string, dishName: string): Promise<string | null> {
  try {
    // Download image with proper headers
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    // Validate content type
    const contentType = response.headers['content-type']
    if (!contentType || !contentType.startsWith('image/')) {
      console.error('Invalid content type:', contentType)
      return null
    }
    
    const buffer = Buffer.from(response.data)
    
    // Check for empty buffer
    if (buffer.length === 0) {
      console.error('Empty image buffer')
      return null
    }
    
    return await uploadPhotoToSupabase(buffer, dishName)
  } catch (error) {
    console.error('URL download error:', error)
    return null
  }
}

/**
 * Upload photo buffer to Supabase with optimization
 */
async function uploadPhotoToSupabase(buffer: Buffer, dishName: string): Promise<string | null> {
  try {
    // Optimize with Sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(1200, 900, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toBuffer()
    
    // Generate unique filename
    const timestamp = Date.now()
    const slug = slugify(dishName)
    const filename = `${timestamp}-${slug}.jpg`
    
    // Upload to Supabase
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
    
    return filename
  } catch (error) {
    console.error('Photo optimization/upload error:', error)
    return null
  }
}

