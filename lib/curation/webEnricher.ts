/**
 * Web Enricher
 * Uses Google search to find restaurant details
 */

import { searchRestaurantArticles } from '@/lib/scraper/sources/web-scraper'
import { normalizeCuisine } from './cuisineMapper'

export interface RestaurantData {
  name: string
  address: string | null
  website: string | null
  phone: string | null
  cuisine: string | null
  rating: number | null
  scrapedContent: string
}

/**
 * Search and extract restaurant details from web
 */
export async function enrichRestaurantData(
  instagramHandle: string,
  city: string,
  restaurantNameHint?: string
): Promise<RestaurantData> {
  console.log(`🔍 Enriching data for @${instagramHandle} in ${city}`)
  
  // Clean instagram handle
  const cleanHandle = instagramHandle.replace('@', '').trim()
  
  // Build search queries
  const searchName = restaurantNameHint || cleanHandle
  
  // Search for articles about the restaurant
  const articles = await searchRestaurantArticles(searchName, city)
  console.log(`  ✓ Found ${articles.length} articles`)
  
  // Combine all scraped content
  const scrapedContent = articles
    .map(article => article.content)
    .join('\n\n')
  
  // Extract details from articles
  const details = extractRestaurantDetails(articles, searchName, city)
  
  return {
    name: details.name || searchName,
    address: details.address,
    website: details.website,
    phone: details.phone,
    cuisine: details.cuisine,
    rating: details.rating,
    scrapedContent
  }
}

/**
 * Extract restaurant details from scraped articles
 */
function extractRestaurantDetails(
  articles: Array<{ url: string; source?: string; content: string }>,
  restaurantName: string,
  city: string
) {
  let address: string | null = null
  let website: string | null = null
  let phone: string | null = null
  let cuisine: string | null = null
  let rating: number | null = null
  let name = restaurantName
  
  const combinedText = articles.map(a => `${a.source || ''}\n${a.content}`).join('\n')
  
  // Extract address (UK format) - multiple patterns
  const addressPatterns = [
    /\d+\s+[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+\s*[A-Z\d\s]{2,10}/,
    /\d+[A-Za-z]?\s+[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+/,
    /[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+\s+[A-Z]{1,2}\d{1,2}\s?\d?[A-Z]{2}/i
  ]
  
  for (const pattern of addressPatterns) {
    const addressMatch = combinedText.match(pattern)
    if (addressMatch) {
      address = addressMatch[0].trim()
      break
    }
  }
  
  // If no address found, try Google Maps search as fallback
  if (!address) {
    // Will use restaurant name + city for Google Maps
    address = `${restaurantName}, ${city}`
  }
  
  // Extract website - try multiple methods
  // Method 1: Look for explicit website mentions
  const websitePatterns = [
    /(?:website|visit|book|reservations?|menu):\s*(https?:\/\/[^\s<>"]+)/i,
    /(?:visit|book|order).*?(https?:\/\/[^\s<>"]+)/i,
    /href=["'](https?:\/\/[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s<>"']*)["']/
  ]
  
  for (const pattern of websitePatterns) {
    const match = combinedText.match(pattern)
    if (match && match[1]) {
      const url = match[1].trim().replace(/[,.]$/, '') // Remove trailing punctuation
      if (!url.includes('google') && !url.includes('facebook') && !url.includes('instagram')) {
        website = url
        break
      }
    }
  }
  
  // Method 2: Look for any restaurant domain
  if (!website) {
    const domainRegex = /(https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g
    const domains = combinedText.match(domainRegex) || []
    
    // Filter out social media and common sites
    const validDomains = domains.filter(url => 
      !url.includes('google') &&
      !url.includes('facebook') &&
      !url.includes('instagram') &&
      !url.includes('twitter') &&
      !url.includes('tripadvisor') &&
      !url.includes('opentable') &&
      !url.includes('yelp')
    )
    
    if (validDomains.length > 0) {
      website = validDomains[0].trim()
    }
  }
  
  // Extract phone (UK format)
  const phoneRegex = /(?:tel|phone|call):\s*(\+?44\s?\d{3,4}\s?\d{3,4}\s?\d{3,4}|\d{4,5}\s?\d{3,4}\s?\d{3,4})/i
  const phoneMatch = combinedText.match(phoneRegex)
  if (phoneMatch) {
    phone = phoneMatch[1].trim()
  }
  
  // Extract cuisine type
  const cuisineKeywords = [
    'italian', 'indian', 'chinese', 'japanese', 'thai', 'vietnamese', 
    'mexican', 'french', 'spanish', 'tapas', 'basque', 'catalan',
    'greek', 'turkish', 'lebanese', 'middle eastern', 'persian',
    'british', 'american', 'korean', 'fusion', 'mediterranean',
    'seafood', 'steakhouse', 'vegan', 'vegetarian', 'pizza', 'burger',
    'cafe', 'bakery', 'bistro', 'brasserie', 'gastropub', 'pub'
  ]
  
  for (const keyword of cuisineKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(combinedText)) {
      // Found a cuisine keyword - normalize it to top-level category
      const detected = keyword
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      cuisine = normalizeCuisine(detected)
      if (cuisine) break
    }
  }
  
  // Extract rating
  const ratingRegex = /(\d\.?\d?)\s*(?:\/\s*5|out of 5|stars)/i
  const ratingMatch = combinedText.match(ratingRegex)
  if (ratingMatch) {
    const parsedRating = parseFloat(ratingMatch[1])
    if (parsedRating >= 0 && parsedRating <= 5) {
      rating = parsedRating
    }
  }
  
  // Try to extract proper restaurant name from sources
  for (const article of articles) {
    if (article.source && article.source.toLowerCase().includes('review')) {
      // Extract name before common separators
      const sourceParts = article.source.split(/[-–—|:]/)[0].trim()
      if (sourceParts.length > 3 && sourceParts.length < 50) {
        name = sourceParts
        break
      }
    }
  }
  
  return { name, address, website, phone, cuisine, rating }
}

