/**
 * POST: Trigger posting a dish to the BestDish Instagram account via Graph API.
 * Dish must be published (isBest: true) and have photo + description.
 */

import { NextRequest, NextResponse } from 'next/server'
import { publishDishToInstagram } from '@/lib/curation/instagramGraphPublisher'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await publishDishToInstagram(id)
    if (result.success) {
      return NextResponse.json({ success: true, mediaId: result.mediaId })
    }
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    )
  } catch (error) {
    console.error('Post to Instagram error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to post to Instagram' },
      { status: 500 }
    )
  }
}
