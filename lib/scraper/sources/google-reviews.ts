/**
 * Google Reviews fetcher using Places API
 */

export interface GoogleReview {
  text: string
  rating: number
  author: string
}

export async function fetchGoogleReviews(placeId: string): Promise<{ reviews: GoogleReview[], error?: string }> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  
  if (!apiKey) {
    return { reviews: [], error: 'No API key' }
  }
  
  try {
    // Use Places API (New) to get reviews
    const fields = 'reviews'
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.status !== 'OK' || !data.result?.reviews) {
      return { reviews: [], error: data.status }
    }
    
    const reviews: GoogleReview[] = data.result.reviews
      .filter((r: any) => r.text && r.text.length > 50) // Only meaningful reviews
      .slice(0, 10) // Top 10 reviews
      .map((r: any) => ({
        text: r.text,
        rating: r.rating || 0,
        author: r.author_name || 'Anonymous'
      }))
    
    return { reviews }
  } catch (error) {
    console.error('Error fetching Google reviews:', error)
    return { reviews: [], error: 'Fetch failed' }
  }
}


