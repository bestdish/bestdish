/**
 * Google Reviews fetcher
 */

export interface GoogleReview {
  text: string
  rating: number
  author: string
}

export async function fetchGoogleReviews(placeId: string): Promise<{ reviews: GoogleReview[], error?: string }> {
  // Note: Google Places API reviews require a paid API key
  // For now, return empty to rely on web scraping
  return { reviews: [] }
}

