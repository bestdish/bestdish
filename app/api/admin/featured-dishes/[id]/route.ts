import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { isFeatured } = body

    const dish = await prisma.dish.update({
      where: { id },
      data: { isFeatured }
    })

    return NextResponse.json({ dish })
  } catch (error) {
    console.error('Error updating dish:', error)
    return NextResponse.json(
      { error: 'Failed to update dish' },
      { status: 500 }
    )
  }
}


