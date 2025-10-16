import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const dishes = await prisma.dish.findMany({
      where: {
        isBest: true,
        restaurant: {
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
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ dishes })
  } catch (error) {
    console.error('Error fetching dishes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dishes' },
      { status: 500 }
    )
  }
}

