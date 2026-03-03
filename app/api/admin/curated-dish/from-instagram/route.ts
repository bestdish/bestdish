/**
 * API: Run "From Instagram post" pipeline and return data to pre-fill the Curated Dish form.
 * POST body: { postUrl: string, citySlug: string, dishName?: string, restaurantName?: string }
 * Returns: pipeline result (dishName, restaurantName, cityName, citySlug, instagramHandle?, description, price, cuisine, quotes, imageBase64?, extractionFailed?, error?)
 */

import { NextRequest, NextResponse } from 'next/server'
import { runInstagramPostPipeline } from '@/lib/curation/instagramPostPipeline'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const postUrl = body.postUrl as string
    const citySlug = body.citySlug as string
    const dishName = (body.dishName as string) || undefined
    const restaurantName = (body.restaurantName as string) || undefined

    if (!postUrl?.trim() || !citySlug?.trim()) {
      return NextResponse.json(
        { success: false, error: 'postUrl and citySlug are required' },
        { status: 400 }
      )
    }
    if (!restaurantName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'restaurantName is required (for v1)' },
        { status: 400 }
      )
    }

    const city = await prisma.city.findUnique({
      where: { slug: citySlug },
    })
    if (!city) {
      return NextResponse.json(
        { success: false, error: `City not found: ${citySlug}` },
        { status: 404 }
      )
    }

    const result = await runInstagramPostPipeline({
      postUrl: postUrl.trim(),
      restaurantName: restaurantName.trim(),
      cityName: city.name,
      dishNameOverride: dishName?.trim() || undefined,
      skipMatchCheck: true,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    // Try to get instagramHandle from DB (restaurant already exists)
    let instagramHandle: string | undefined
    const existing = await prisma.restaurant.findFirst({
      where: {
        cityId: city.id,
        name: { equals: result.restaurantName ?? restaurantName.trim(), mode: 'insensitive' },
      },
      select: { instagramHandle: true },
    })
    if (existing?.instagramHandle) {
      instagramHandle = existing.instagramHandle.startsWith('@')
        ? existing.instagramHandle
        : `@${existing.instagramHandle}`
    }

    return NextResponse.json({
      success: true,
      extractionFailed: result.extractionFailed ?? false,
      dishName: result.dishName,
      restaurantName: result.restaurantName,
      cityName: result.cityName,
      citySlug,
      instagramHandle: instagramHandle ?? undefined,
      description: result.description,
      price: result.price ?? undefined,
      cuisine: result.cuisine ?? undefined,
      quotes: result.quotes,
      imageUrl: result.imageUrl ?? undefined,
      imageBase64: result.imageBase64 ?? undefined,
    })
  } catch (error) {
    console.error('from-instagram API error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
