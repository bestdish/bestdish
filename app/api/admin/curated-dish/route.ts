/**
 * API endpoint for curated dish creation
 */

import { NextRequest, NextResponse } from 'next/server'
import { curateDish } from '@/lib/curation/dishCurator'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const instagramHandle = formData.get('instagramHandle') as string
    const dishName = formData.get('dishName') as string
    let citySlug = formData.get('citySlug') as string
    const newCityName = formData.get('newCityName') as string | undefined
    const restaurantNameOverride = formData.get('restaurantNameOverride') as string | undefined
    const isFeatured = formData.get('isFeatured') === 'true'
    const photoUrl = formData.get('photoUrl') as string | undefined
    const photoFile = formData.get('photoFile') as File | undefined
    
    // Validation
    if (!instagramHandle || !dishName || (!citySlug && !newCityName)) {
      return NextResponse.json(
        { error: 'Missing required fields: instagramHandle, dishName, city' },
        { status: 400 }
      )
    }
    
    // Create new city if provided
    if (newCityName && citySlug) {
      const { prisma } = await import('@/lib/prisma')
      
      // Check if city already exists
      const existingCity = await prisma.city.findUnique({
        where: { slug: citySlug }
      })
      
      if (!existingCity) {
        await prisma.city.create({
          data: {
            name: newCityName,
            slug: citySlug
          }
        })
      }
    }
    
    if (!photoUrl && !photoFile) {
      return NextResponse.json(
        { error: 'Must provide either photoUrl or photoFile' },
        { status: 400 }
      )
    }
    
    // Process the curation
    const result = await curateDish({
      instagramHandle,
      dishName,
      citySlug,
      isFeatured,
      photoFile: photoFile && photoFile.size > 0 ? photoFile : undefined,
      photoUrl: photoUrl || undefined,
      restaurantNameOverride: restaurantNameOverride || undefined
    })
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        dish: {
          id: result.dishId,
          slug: result.dishSlug,
          url: `/${result.citySlug}/${result.dishSlug}`
        },
        progress: result.progress
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          progress: result.progress
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

