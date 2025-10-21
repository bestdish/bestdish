import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        approved: false
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
        },
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error('Error fetching pending reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending reviews' },
      { status: 500 }
    )
  }
}


