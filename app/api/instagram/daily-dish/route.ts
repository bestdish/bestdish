/**
 * API endpoint for Instagram automation
 * Returns a random featured dish for daily posting
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get all published Manchester dishes with photos
    const dishes = await prisma.dish.findMany({
      where: {
        isBest: true,
        photoUrl: { not: null },
        restaurant: {
          city: { slug: 'manchester' },
          isActive: true
        }
      },
      include: {
        restaurant: {
          include: {
            city: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (dishes.length === 0) {
      return NextResponse.json({ error: 'No dishes available' }, { status: 404 })
    }

    // Select a random dish (or rotate through them)
    const randomDish = dishes[Math.floor(Math.random() * dishes.length)]

    // Format for Instagram
    const instagramData = {
      dishName: randomDish.name,
      restaurantName: randomDish.restaurant.name,
      restaurantInstagram: extractInstagramHandle(randomDish.restaurant.name),
      description: randomDish.description || '',
      price: randomDish.price,
      dishPhotoUrl: getFullImageUrl(randomDish.photoUrl),
      restaurantPhotoUrl: getFullImageUrl(randomDish.restaurant.photoUrl),
      location: {
        name: `${randomDish.restaurant.name}, ${randomDish.restaurant.city.name}`,
        address: randomDish.restaurant.address
      },
      hashtags: generateHashtags(randomDish.name, randomDish.restaurant.name, randomDish.restaurant.city.name),
      websiteUrl: `${process.env.NEXT_PUBLIC_URL || 'https://bestdish.co.uk'}/${randomDish.restaurant.city.slug}/${randomDish.restaurant.slug}/${randomDish.slug}`
    }

    return NextResponse.json(instagramData)
  } catch (error) {
    console.error('Error fetching daily dish:', error)
    return NextResponse.json({ error: 'Failed to fetch dish' }, { status: 500 })
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

function generateHashtags(dishName: string, restaurantName: string, cityName: string): string[] {
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
  
  // Add dish-specific hashtags
  if (dishName.toLowerCase().includes('pizza')) hashtags.push('#Pizza', '#PizzaLovers')
  if (dishName.toLowerCase().includes('pasta')) hashtags.push('#Pasta', '#ItalianFood')
  if (dishName.toLowerCase().includes('burger')) hashtags.push('#Burger', '#BurgerLovers')
  if (dishName.toLowerCase().includes('ramen')) hashtags.push('#Ramen', '#JapaneseFood')
  if (dishName.toLowerCase().includes('curry')) hashtags.push('#Curry', '#IndianFood')
  if (dishName.toLowerCase().includes('steak')) hashtags.push('#Steak', '#Steakhouse')
  
  return hashtags.slice(0, 15) // Instagram allows 30, but 15 is optimal
}

