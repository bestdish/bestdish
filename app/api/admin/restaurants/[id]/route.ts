import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        city: true,
        dishes: {
          where: { isBest: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ restaurant })
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Handle both formats: { restaurant: {...}, dish: {...} } or flat {...}
    const restaurantData = body.restaurant || body
    const dishData = body.dish

    // Update restaurant
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        name: restaurantData.name,
        cityId: restaurantData.cityId,
        address: restaurantData.address,
        phone: restaurantData.phone,
        website: restaurantData.website,
        cuisine: restaurantData.cuisine,
        priceRange: restaurantData.priceRange,
        photoUrl: restaurantData.photoUrl,
        rating: restaurantData.rating,
        googlePlaceId: restaurantData.googlePlaceId,
        isActive: restaurantData.isActive,
        isChain: restaurantData.isChain
      }
    })

    // Update or create dish if dish data provided
    if (dishData && dishData.name) {
      if (dishData.id) {
        // Update existing dish
        await prisma.dish.update({
          where: { id: dishData.id },
          data: {
            name: dishData.name,
            description: dishData.description,
            price: dishData.price,
            photoUrl: dishData.photoUrl,
            isFeatured: dishData.isFeatured ?? false
          }
        })
      } else {
        // Create new dish
        await prisma.dish.create({
          data: {
            name: dishData.name,
            description: dishData.description,
            price: dishData.price,
            photoUrl: dishData.photoUrl,
            restaurantId: id,
            isBest: true,
            isFeatured: dishData.isFeatured ?? false,
            slug: dishData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          }
        })
      }
    }

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error('Error updating restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete all dishes first (foreign key constraint)
    await prisma.dish.deleteMany({
      where: { restaurantId: id }
    })

    // Then delete the restaurant
    await prisma.restaurant.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting restaurant:', error)
    return NextResponse.json(
      { error: 'Failed to delete restaurant' },
      { status: 500 }
    )
  }
}

