import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const perPage = 20

    // Fetch dishes that are NOT published (isBest: false) but have editorial content
    const where = {
      isBest: false,
      description: {
        not: null
      },
      AND: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { restaurant: { name: { contains: search, mode: 'insensitive' as const } } },
          { restaurant: { city: { name: { contains: search, mode: 'insensitive' as const } } } }
        ]
      } : {}
    }

    const [dishes, total] = await Promise.all([
      prisma.dish.findMany({
        where,
        include: {
          restaurant: {
            include: {
              city: {
                select: {
                  name: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: (page - 1) * perPage,
        take: perPage
      }),
      prisma.dish.count({ where })
    ])

    return NextResponse.json({
      dishes,
      totalPages: Math.ceil(total / perPage),
      total
    })
  } catch (error) {
    console.error('Error fetching pending dishes:', error)
    return NextResponse.json({ error: 'Failed to fetch pending dishes' }, { status: 500 })
  }
}


