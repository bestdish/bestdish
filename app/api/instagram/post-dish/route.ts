/**
 * API endpoint for Instagram automation
 * Returns formatted Instagram data for a specific dish
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dishId } = body
    
    if (!dishId) {
      return NextResponse.json({ error: 'dishId is required' }, { status: 400 })
    }
    
    // Get dish with all related data
    const dish = await prisma.dish.findUnique({
      where: {
        id: dishId
      },
      include: {
        restaurant: {
          include: {
            city: true
          }
        }
      }
    })
    
    if (!dish) {
      return NextResponse.json({ error: 'Dish not found' }, { status: 404 })
    }
    
    if (!dish.isBest) {
      return NextResponse.json({ error: 'Dish is not published' }, { status: 400 })
    }
    
    // Format for Instagram
    const instagramData = {
      dishName: dish.name,
      restaurantName: dish.restaurant.name,
      restaurantInstagram: dish.restaurant.instagramHandle || extractInstagramHandle(dish.restaurant.name),
      description: dish.description || '',
      editorialQuote: dish.editorialQuote || '',
      price: dish.price,
      dishPhotoUrl: getFullImageUrl(dish.photoUrl),
      restaurantPhotoUrl: getFullImageUrl(dish.restaurant.photoUrl),
      location: {
        name: `${dish.restaurant.name}, ${dish.restaurant.city.name}`,
        address: dish.restaurant.address
      },
      hashtags: generateHashtags(
        dish.name,
        dish.restaurant.name,
        dish.restaurant.city.name,
        dish.restaurant.cuisine
      ),
      websiteUrl: `${process.env.NEXT_PUBLIC_URL || 'https://bestdish.co.uk'}/${dish.restaurant.city.slug}/${dish.slug}`,
      cityName: dish.restaurant.city.name,
      cuisine: dish.restaurant.cuisine
    }
    
    return NextResponse.json(instagramData)
  } catch (error) {
    console.error('Error fetching dish for Instagram:', error)
    return NextResponse.json({ error: 'Failed to fetch dish data' }, { status: 500 })
  }
}

function getFullImageUrl(url: string | null): string | null {
  if (!url) return null
  
  // If already full URL, return as is
  if (url.startsWith('http')) return url
  
  // Otherwise, construct Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/dish-photos/${url}`
}

function extractInstagramHandle(restaurantName: string): string {
  // Common patterns for converting restaurant names to Instagram handles
  const handle = restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Remove duplicate underscores
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
  
  return `@${handle}`
}

function generateHashtags(
  dishName: string,
  restaurantName: string,
  cityName: string,
  cuisine: string | null
): string[] {
  const hashtags = [
    '#BestDish',
    '#BestDishUK',
    `#${cityName.replace(/\s+/g, '')}Food`,
    `#${cityName.replace(/\s+/g, '')}Eats`,
    '#Foodie',
    '#FoodPorn',
    '#Instafood',
    '#UKFood',
    '#FoodLovers',
    '#Delicious'
  ]
  
  // Add cuisine-specific hashtags
  if (cuisine) {
    const cuisineTag = cuisine.replace(/\s+/g, '')
    hashtags.push(`#${cuisineTag}`, `#${cuisineTag}Food`)
  }
  
  // Add dish-specific hashtags
  const dishLower = dishName.toLowerCase()
  if (dishLower.includes('pizza')) hashtags.push('#Pizza', '#PizzaLovers')
  if (dishLower.includes('pasta')) hashtags.push('#Pasta', '#ItalianFood')
  if (dishLower.includes('burger')) hashtags.push('#Burger', '#BurgerLovers')
  if (dishLower.includes('ramen')) hashtags.push('#Ramen', '#JapaneseFood')
  if (dishLower.includes('curry')) hashtags.push('#Curry', '#IndianFood')
  if (dishLower.includes('steak')) hashtags.push('#Steak', '#Steakhouse')
  if (dishLower.includes('sushi')) hashtags.push('#Sushi', '#SushiLovers')
  if (dishLower.includes('taco')) hashtags.push('#Taco', '#MexicanFood')
  if (dishLower.includes('tea')) hashtags.push('#AfternoonTea', '#TeaTime')
  
  // Remove duplicates and limit to 15 hashtags
  return [...new Set(hashtags)].slice(0, 15)
}

