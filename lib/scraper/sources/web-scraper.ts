/**
 * Web scraper for food blog articles
 *
 * Uses Serper (serper.dev) for article search - Google Custom Search is deprecated.
 * Get a free API key at https://serper.dev/api-key (2,500 free queries).
 */

import axios from 'axios'

export interface Article {
  url: string
  source: string
  content: string
}

const RESTAURANT_REVIEW_SITES = [
  'manchestersfinest.com',
  'confidentials.com',
  'manchesterconfidential.co.uk',
  'timeout.com',
  'theguardian.com',
  'eater.com',
  'manchestereveningnews.co.uk',
  'hardens.com',
  'thegoodfoodguide.co.uk',
  'andyhayler.com',
  'foodiva.net',
  'hungrybritish.com',
  'squaremeal.co.uk',
]

function buildSiteRestriction(): string {
  return RESTAURANT_REVIEW_SITES.map((s) => `site:${s}`).join(' OR ')
}

/**
 * Search for articles about a restaurant using Serper API
 */
export async function searchRestaurantArticles(
  restaurantName: string,
  cityName: string
): Promise<Article[]> {
  const apiKey = process.env.SERPER_API_KEY

  if (!apiKey) {
    console.log('    ⚠️  SERPER_API_KEY not configured (get one at https://serper.dev/api-key)')
    return []
  }

  try {
    const baseQuery = `${restaurantName} ${cityName} UK review best dish`
    const siteFilter = buildSiteRestriction()
    const query = `${baseQuery} (${siteFilter})`

    console.log(`    🔍 Searching articles: "${baseQuery}"`)
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: query, num: 10 },
      {
        timeout: 10000,
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
      }
    )

    const organic = response.data?.organic ?? []
    if (organic.length === 0) {
      console.log('    ⚠️  No articles found')
      return []
    }

    console.log(`    ✓ Found ${organic.length} articles`)

    const articles: Article[] = []

    for (const item of organic.slice(0, 3)) {
      const link = item.url ?? item.link
      if (!link) continue

      try {
        const articleResponse = await axios.get(link, {
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          maxContentLength: 200000,
        })

        let text = articleResponse.data.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        text = text.replace(/<[^>]+>/g, ' ')
        text = text.replace(/\s+/g, ' ').trim()

        if (text.length > 200) {
          articles.push({
            url: link,
            source: new URL(link).hostname.replace('www.', ''),
            content: text.substring(0, 3000),
          })
        }
      } catch {
        console.log(`    ⚠️  Failed to fetch article: ${link}`)
      }
    }

    console.log(`    ✓ Scraped ${articles.length} articles successfully`)
    return articles
  } catch (error: any) {
    console.log(`    ❌ Article search failed: ${error.response?.data?.message ?? error.message}`)
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


