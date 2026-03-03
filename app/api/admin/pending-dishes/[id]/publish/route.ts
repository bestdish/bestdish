import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publishDishToInstagram } from '@/lib/curation/instagramGraphPublisher'

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

    // Post to Instagram: Graph API (preferred) or Make.com webhook fallback
    if (process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN && process.env.INSTAGRAM_IG_USER_ID) {
      const igResult = await publishDishToInstagram(id)
      if (!igResult.success) {
        console.warn('Instagram Graph API post failed, but dish was published:', igResult.error)
      }
    } else if (process.env.MAKE_WEBHOOK_URL) {
      try {
        const response = await fetch(process.env.MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dishId: id })
        })
        if (!response.ok) {
          console.warn('Instagram webhook trigger failed, but dish was published')
        }
      } catch (error) {
        console.warn('Instagram webhook error, but dish was published:', error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: 'Failed to publish dish' }, { status: 500 })
  }
}


