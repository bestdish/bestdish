import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for comment submission (no authentication required)
const commentSchema = z.object({
  dishId: z.string().min(1, 'Dish ID is required'),
  authorName: z.string().min(1, 'Name is required'),
  rating: z.number().min(1).max(5).optional().nullable(),
  comment: z.string().min(1, 'Comment is required'),
})

/**
 * POST /api/reviews
 * Create a new review (always starts with approved=false)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = commentSchema.parse(body)
    const { dishId, authorName, rating, comment } = validatedData

    // Verify dish exists
    const dish = await prisma.dish.findUnique({
      where: { id: dishId },
      include: {
        restaurant: {
          include: {
            city: true
          }
        }
      }
    })

    if (!dish) {
      return NextResponse.json(
        { error: 'Dish not found' },
        { status: 404 }
      )
    }

    // Create comment with approved = false (no authentication required)
    const review = await prisma.review.create({
      data: {
        authorName,
        dishId,
        rating: rating || null,
        comment,
        approved: false // Always start as unapproved for moderation
      },
      include: {
        dish: {
          include: {
            restaurant: {
              include: {
                city: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      review: {
        id: review.id,
        authorName: review.authorName,
        rating: review.rating,
        comment: review.comment,
        approved: review.approved,
        createdAt: review.createdAt,
        dish: {
          id: review.dish.id,
          name: review.dish.name,
          restaurant: {
            name: review.dish.restaurant.name,
            city: review.dish.restaurant.city.name
          }
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating review:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reviews?dishId=xxx&approved=true
 * Fetch reviews for a specific dish
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dishId = searchParams.get('dishId')
    const approved = searchParams.get('approved')

    if (!dishId) {
      return NextResponse.json(
        { error: 'dishId parameter is required' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: any = { dishId }
    if (approved !== null) {
      where.approved = approved === 'true'
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate average rating for approved reviews with ratings only
    const avgRating = await prisma.review.aggregate({
      where: {
        dishId,
        approved: true,
        rating: { not: null }
      },
      _avg: {
        rating: true
      },
      _count: {
        rating: true
      }
    })

    return NextResponse.json({
      reviews,
      averageRating: avgRating._avg.rating || 0,
      totalRatings: avgRating._count.rating || 0,
      totalReviews: reviews.length
    })

  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}