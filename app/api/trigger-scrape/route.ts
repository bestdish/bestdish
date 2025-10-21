import { NextRequest, NextResponse } from 'next/server'
import { scrapeRestaurants } from '../../../scripts/scrape-restaurants'

/**
 * POST /api/trigger-scrape
 * Trigger the restaurant scraping script manually
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const adminSecret = request.headers.get('X-ADMIN-SECRET')
    const expectedSecret = process.env.SCRAPER_ADMIN_SECRET || process.env.VERCEL_ADMIN_SECRET
    
    if (!expectedSecret || adminSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      )
    }

    // Check if Google Places API key is available
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'GOOGLE_PLACES_API_KEY environment variable is required' },
        { status: 500 }
      )
    }

    // Run the scraping script
    console.log('Starting restaurant scraping via API trigger...')
    
    // Note: In a production environment, you might want to run this as a background job
    // For now, we'll run it synchronously but with a timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Scraping timeout')), 300000) // 5 minutes timeout
    })

    const scrapingPromise = scrapeRestaurants()

    try {
      await Promise.race([scrapingPromise, timeoutPromise])
      
      return NextResponse.json({
        success: true,
        message: 'Restaurant scraping completed successfully',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Scraping failed:', error)
      return NextResponse.json(
        { 
          error: 'Scraping failed', 
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error in trigger-scrape endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/trigger-scrape
 * Get scraping status (basic health check)
 */
export async function GET() {
  return NextResponse.json({
    message: 'Restaurant scraper endpoint',
    status: 'ready',
    timestamp: new Date().toISOString(),
    requiredEnvVars: {
      GOOGLE_PLACES_API_KEY: !!process.env.GOOGLE_PLACES_API_KEY,
      SCRAPER_ADMIN_SECRET: !!process.env.SCRAPER_ADMIN_SECRET
    }
  })
}







