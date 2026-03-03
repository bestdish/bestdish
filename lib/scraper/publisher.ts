/**
 * Auto-publish dish data to database
 */

import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { slugify } from '../seo'
import type { AIAnalysisResult } from './ai-analyzer'

export interface PublishResult {
  success: boolean
  dishId?: string
  error?: string
}

/**
 * Validate dish data before publishing
 */
function validateDishData(analysis: AIAnalysisResult): { valid: boolean; error?: string } {
  // Dish name validation
  if (!analysis.bestDish || analysis.bestDish.length < 3 || analysis.bestDish.length > 100) {
    return { valid: false, error: 'Invalid dish name length' }
  }
  
  // Description validation
  const wordCount = analysis.description.split(/\s+/).length
  if (wordCount < 30) {
    return { valid: false, error: 'Description too short (minimum 30 words)' }
  }
  
  // Price validation
  if (analysis.price !== null && (analysis.price < 0.01 || analysis.price > 500)) {
    return { valid: false, error: 'Price out of valid range' }
  }
  
  return { valid: true }
}

/**
 * Publish dish to database with editorial data
 */
export type DescriptionSource = { name: string; url: string }

export async function publishDish(
  restaurantId: string,
  analysis: AIAnalysisResult,
  photoPath: string | null,
  editorialQuote?: string | null,
  editorialSource?: string | null,
  editorialUrl?: string | null,
  faqAnswers?: any,
  descriptionSources?: DescriptionSource[] | null
): Promise<PublishResult> {
  try {
    // Validate data
    const validation = validateDishData(analysis)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }
    
    const slug = slugify(analysis.bestDish)
    
    // Check if dish already exists
    const existing = await prisma.dish.findFirst({
      where: {
        restaurantId,
        slug
      }
    })
    
    // Only publish (isBest: true) if we have a verified photo
    // Otherwise, save as draft for admin review
    const dishData = {
      name: analysis.bestDish,
      description: analysis.description,
      price: analysis.price,
      photoUrl: photoPath,
      isBest: photoPath ? true : false, // Only publish if we have a photo
      editorialQuote: editorialQuote || null,
      editorialSource: editorialSource || null,
      editorialUrl: editorialUrl || null,
      descriptionSources:
        descriptionSources && descriptionSources.length > 0
          ? (descriptionSources as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      faqAnswers: faqAnswers || null
    }
    
    if (existing) {
      // Update existing dish
      const updated = await prisma.dish.update({
        where: { id: existing.id },
        data: {
          ...dishData,
          photoUrl: photoPath || existing.photoUrl // Don't overwrite existing photo with null
        }
      })
      
      if (photoPath) {
        console.log(`  ✓ Updated dish and PUBLISHED to website`)
      } else {
        console.log(`  ✓ Updated dish - SAVED AS DRAFT (awaiting image)`)
      }
      
      return {
        success: true,
        dishId: updated.id
      }
    } else {
      // Create new dish
      const dish = await prisma.dish.create({
        data: {
          ...dishData,
          slug,
          restaurantId
        }
      })
      
      if (photoPath) {
        console.log(`  ✓ Created dish and PUBLISHED to website`)
      } else {
        console.log(`  ✓ Created dish - SAVED AS DRAFT (awaiting image)`)
      }
      
      return {
        success: true,
        dishId: dish.id
      }
    }
  } catch (error) {
    console.error('Publish error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Update restaurant cuisine if needed
 */
export async function updateRestaurantCuisine(
  restaurantId: string,
  cuisine: string | null
): Promise<void> {
  if (!cuisine) return
  
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { cuisine: true }
    })
    
    // Only update if restaurant doesn't have cuisine set
    if (!restaurant?.cuisine) {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { cuisine }
      })
      console.log(`  ✓ Updated cuisine to: ${cuisine}`)
    }
  } catch (error) {
    console.error('Failed to update cuisine:', error)
  }
}

