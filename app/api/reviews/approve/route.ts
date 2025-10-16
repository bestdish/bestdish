import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for approval action
const approvalSchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required')
})

/**
 * POST /api/reviews/approve
 * Approve a review (admin only - page protection assumed)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = approvalSchema.parse(body)
    const { reviewId } = validatedData

    // Find the review with related data
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: true,
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

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Update review to approved
    const approvedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        approved: true
      },
      include: {
        user: true,
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

    // Recalculate dish average rating (only count reviews with ratings)
    const avgRating = await prisma.review.aggregate({
      where: {
        dishId: review.dishId,
        approved: true,
        rating: { not: null }
      },
      _avg: {
        rating: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Comment approved successfully',
      review: approvedReview,
      averageRating: avgRating._avg.rating || 0
    })

  } catch (error) {
    console.error('Error processing review approval:', error)
    
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


