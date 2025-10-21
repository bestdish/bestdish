import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verify dish exists and has a photo
    const dish = await prisma.dish.findUnique({
      where: { id }
    })

    if (!dish) {
      return NextResponse.json({ error: 'Dish not found' }, { status: 404 })
    }

    if (!dish.photoUrl) {
      return NextResponse.json({ error: 'Cannot publish without a photo' }, { status: 400 })
    }

    // Publish the dish
    await prisma.dish.update({
      where: { id },
      data: { isBest: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: 'Failed to publish dish' }, { status: 500 })
  }
}


