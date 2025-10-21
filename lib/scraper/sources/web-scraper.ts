/**
 * Web scraper for food blog articles
 */

import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface Article {
  url: string
  source: string
  content: string
}

/**
 * Search for articles about a restaurant
 */
export async function searchRestaurantArticles(
  restaurantName: string,
  cityName: string
): Promise<Article[]> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID
  
  if (!apiKey || !searchEngineId) {
    console.log('    ⚠️  Google Custom Search not configured')
    return []
  }
  
  try {
    const query = `${restaurantName} ${cityName} UK review best dish`
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`
    
    console.log(`    🔍 Searching articles: "${query}"`)
    const response = await axios.get(url, { timeout: 10000 })
    
    if (!response.data.items || response.data.items.length === 0) {
      console.log('    ⚠️  No articles found')
      return []
    }
    
    console.log(`    ✓ Found ${response.data.items.length} articles`)
    
    const articles: Article[] = []
    
    for (const item of response.data.items.slice(0, 3)) {
      try {
        // Fetch article content
        const articleResponse = await axios.get(item.link, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          maxContentLength: 200000
        })
        
        // Extract text content
        let text = articleResponse.data.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        text = text.replace(/<[^>]+>/g, ' ')
        text = text.replace(/\s+/g, ' ').trim()
        
        if (text.length > 200) {
          articles.push({
            url: item.link,
            source: new URL(item.link).hostname.replace('www.', ''),
            content: text.substring(0, 3000)
          })
        }
      } catch (error) {
        console.log(`    ⚠️  Failed to fetch article: ${item.link}`)
      }
    }
    
    console.log(`    ✓ Scraped ${articles.length} articles successfully`)
    return articles
  } catch (error: any) {
    console.log(`    ❌ Article search failed: ${error.message}`)
    return []
  }
}

/**
 * Combine all content sources
 */
export function combineContent(
  articles: Article[],
  reviews: Array<{ text: string }>
): string {
  let combined = ''
  
  // Add articles
  for (const article of articles) {
    combined += `\n\n--- Article from ${article.source} ---\n`
    combined += article.content
  }
  
  // Add reviews
  for (const review of reviews) {
    combined += `\n\n--- Review ---\n`
    combined += review.text
  }
  
  return combined.trim()
}


