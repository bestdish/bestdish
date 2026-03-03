/**
 * Restaurant Matcher
 * Finds and matches existing restaurants or prepares data for new ones
 */

import { prisma } from '@/lib/prisma'

export interface RestaurantMatch {
  exists: boolean
  restaurant?: {
    id: string
    name: string
    address: string | null
    website: string | null
    cuisine: string | null
  }
  action: 'update' | 'create'
}

/**
 * Search for existing restaurant by name and city
 */
export async function matchRestaurant(
  name: string,
  citySlug: string,
  address?: string
): Promise<RestaurantMatch> {
  // Normalize name for comparison
  const normalizedName = name.trim().toLowerCase()
  
  // Try exact name match in the city
  const existingRestaurant = await prisma.restaurant.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive'
      },
      city: {
        slug: citySlug
      }
    },
    select: {
      id: true,
      name: true,
      address: true,
      website: true,
      cuisine: true
    }
  })
  
  if (existingRestaurant) {
    return {
      exists: true,
      restaurant: existingRestaurant,
      action: 'update'
    }
  }
  
  // If address provided, check for similar address matches
  if (address) {
    const restaurantsInCity = await prisma.restaurant.findMany({
      where: {
        city: {
          slug: citySlug
        },
        address: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        address: true,
        website: true,
        cuisine: true
      }
    })
    
    // Simple address similarity check
    const normalizedAddress = address.toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const restaurant of restaurantsInCity) {
      if (restaurant.address) {
        const restAddress = restaurant.address.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (normalizedAddress.includes(restAddress) || restAddress.includes(normalizedAddress)) {
          return {
            exists: true,
            restaurant,
            action: 'update'
          }
        }
      }
    }
  }
  
  return {
    exists: false,
    action: 'create'
  }
}

/**
 * Generate slug from restaurant name
 */
export function generateRestaurantSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}



