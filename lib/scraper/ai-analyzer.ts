/**
 * AI Analyzer using Google Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AIAnalysisResult {
  bestDish: string
  price: number | null
  description: string
  quotes: Array<{
    text: string
    source: string
    url?: string
  }>
  cuisine: string | null
  confidence: 'high' | 'medium' | 'low'
  photoKeywords: string[]
}

export async function analyzeDishContent(
  restaurantName: string,
  city: string,
  scrapedContent: string
): Promise<AIAnalysisResult | null> {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `You are an expert food critic writing an original review for "${restaurantName}" in ${city}, UK.

SCRAPED CONTENT (for research only):
${scrapedContent}

TASK:
Identify THE ONE best/signature dish and write an original critical appraisal.

CRITICAL REQUIREMENTS FOR DESCRIPTION:
- Write as an EXPERT FOOD CRITIC, not a summary of other reviews
- Use YOUR OWN VOICE and original phrasing
- This dish is THE BEST on the menu - emphasize what makes it exceptional
- Be authoritative and positive (you're recommending it)
- Focus on WHY this dish is outstanding: flavors, technique, presentation, ingredients
- Use vivid, sensory language: how it tastes, looks, feels
- 150-200 words in editorial magazine style
- Third person, present tense
- Example tone: "This exquisite Sunday roast elevates tradition with perfectly seasoned beef..." NOT "Reviews mention the Sunday roast is good..."

DISH NAME REQUIREMENTS:
- Must be SPECIFIC (e.g., "Chocolate Fondant" not "Dessert")
- Must be at least 2 words OR contain specific ingredients/descriptors
- Reject generic single words: "dessert", "starter", "main", "appetizer"
- Choose the most praised and unique dish from the content

OTHER REQUIREMENTS:
1. Extract the price if mentioned (in GBP)
2. Extract 2-3 compelling quotes from the content (with source)
3. Identify the cuisine type
4. Assess confidence: HIGH (dish clearly identified), MEDIUM (some ambiguity), LOW (unclear)
5. Suggest 3-5 keywords for photo search

OUTPUT ONLY valid JSON in this exact format:
{
  "bestDish": "Exact Dish Name",
  "price": 12.50 or null,
  "description": "Your 150-200 word description here...",
  "quotes": [
    {"text": "Quote from review or article", "source": "Source name or Google Review"},
  ],
  "cuisine": "Cuisine Type" or null,
  "confidence": "high" or "medium" or "low",
  "photoKeywords": ["keyword1", "keyword2", "keyword3"]
}

Return ONLY the JSON, no other text.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Extract JSON from response (Gemini sometimes adds markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response:', text)
      return null
    }
    
    const analysis = JSON.parse(jsonMatch[0]) as AIAnalysisResult
    
    // Validate result
    if (!analysis.bestDish || analysis.bestDish.length < 3) {
      console.error('Invalid dish name in AI result')
      return null
    }
    
    // Validate against generic dish names
    const genericTerms = ['dessert', 'starter', 'main', 'appetizer', 'entree', 'sweet', 'pudding', 'salad', 'soup', 'sandwich']
    const dishLower = analysis.bestDish.toLowerCase().trim()
    const wordCount = analysis.bestDish.trim().split(/\s+/).length
    
    if (wordCount === 1 && genericTerms.includes(dishLower)) {
      console.error(`Generic dish name rejected: "${analysis.bestDish}"`)
      return null
    }
    
    if (!analysis.description || analysis.description.length < 50) {
      console.error('Description too short in AI result')
      return null
    }
    
    return analysis
  } catch (error) {
    console.error('AI analysis error:', error)
    return null
  }
}

/**
 * Select best editorial quote from AI analysis
 */
export interface EditorialQuote {
  quote: string
  source: string
  url: string | null
}

export function selectBestQuote(
  quotes: Array<{text: string, source: string, url?: string}>,
  articles: Array<{url: string, source: string}>
): EditorialQuote | null {
  if (!quotes || quotes.length === 0) return null
  
  // Prefer quotes from known food blogs
  const editorialSources = ['Manchester Finest', 'Confidentials', 'Eater', 'Guardian', 'Time Out']
  
  for (const quote of quotes) {
    const isEditorial = editorialSources.some(src => 
      quote.source.toLowerCase().includes(src.toLowerCase())
    )
    
    if (isEditorial && quote.text.length > 30 && quote.text.length < 250) {
      // Find matching article URL
      const matchingArticle = articles.find(a => 
        quote.source.toLowerCase().includes(a.source.toLowerCase())
      )
      
      return {
        quote: quote.text,
        source: quote.source,
        url: matchingArticle?.url || quote.url || null
      }
    }
  }
  
  // Fallback: use first non-Google review quote
  const nonReviewQuote = quotes.find(q => 
    !q.source.toLowerCase().includes('google') &&
    !q.source.toLowerCase().includes('review') &&
    q.text.length > 30 && 
    q.text.length < 250
  )
  
  if (nonReviewQuote) {
    const matchingArticle = articles.find(a => 
      nonReviewQuote.source.toLowerCase().includes(a.source.toLowerCase())
    )
    
    return {
      quote: nonReviewQuote.text,
      source: nonReviewQuote.source,
      url: matchingArticle?.url || nonReviewQuote.url || null
    }
  }
  
  return null
}

/**
 * Generate SEO-optimized FAQ answers
 */
export interface FAQItem {
  question: string
  answer: string
}

export async function generateFAQs(
  restaurantName: string,
  dishName: string,
  city: string,
  cuisine: string | null,
  price: number | null,
  website: string | null,
  address: string | null
): Promise<FAQItem[]> {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    return generateFallbackFAQs(restaurantName, dishName, city, cuisine, price, website)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Generate concise, helpful FAQ answers for ${dishName} at ${restaurantName} in ${city}.

CONTEXT:
- Dish: ${dishName}
- Restaurant: ${restaurantName}
- City: ${city}
- Cuisine: ${cuisine || 'N/A'}
- Price: ${price ? `£${price}` : 'N/A'}
- Website: ${website || 'N/A'}
- Address: ${address || 'N/A'}

Generate exactly 5 FAQ items with these questions:
1. "Do I need to book ahead at ${restaurantName}?"
2. "What makes the ${dishName} at ${restaurantName} special?"
3. "Is the ${dishName} suitable for dietary requirements?"
4. "How much does ${dishName} cost at ${restaurantName}?"
5. "Where can I find the full menu for ${restaurantName}?"

REQUIREMENTS:
- Each answer should be 2-3 sentences
- Be factual based on provided context
- Include clickable links where possible:
  * For booking question: If website exists, include HTML link like <a href="${website}" target="_blank" rel="noopener">book online</a>
  * For menu question: If website exists, include HTML link like <a href="${website}" target="_blank" rel="noopener">view their menu</a>
- If info is missing, give general helpful advice
- Make answers SEO-friendly and natural
- Write in second person ("you")
- Use proper HTML anchor tags for links

OUTPUT ONLY valid JSON in this format:
[
  {"question": "Question here?", "answer": "2-3 sentence answer with <a> tags if applicable."},
  ...
]

Return ONLY the JSON array, no other text.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('No JSON array found in FAQ response')
      return generateFallbackFAQs(restaurantName, dishName, city, cuisine, price, website)
    }
    
    const faqs = JSON.parse(jsonMatch[0]) as FAQItem[]
    
    if (!Array.isArray(faqs) || faqs.length !== 5) {
      console.error('Invalid FAQ array')
      return generateFallbackFAQs(restaurantName, dishName, city, cuisine, price, website)
    }
    
    return faqs
  } catch (error) {
    console.error('FAQ generation error:', error)
    return generateFallbackFAQs(restaurantName, dishName, city, cuisine, price, website)
  }
}

/**
 * Fallback FAQ generation without AI
 */
function generateFallbackFAQs(
  restaurantName: string,
  dishName: string,
  city: string,
  cuisine: string | null,
  price: number | null,
  website: string | null
): FAQItem[] {
  return [
    {
      question: `Do I need to book ahead at ${restaurantName}?`,
      answer: website
        ? `It's recommended to book ahead at ${restaurantName}, especially during peak dining hours and weekends. You can <a href="${website}" target="_blank" rel="noopener">book online through their website</a> or call directly. Walk-ins may be accommodated depending on availability.`
        : `It's recommended to book ahead at ${restaurantName}, especially during peak dining hours and weekends. You can typically make reservations through their website or by calling directly. Walk-ins may be accommodated depending on availability.`
    },
    {
      question: `What makes the ${dishName} at ${restaurantName} special?`,
      answer: `The ${dishName} at ${restaurantName} is considered their signature dish${cuisine ? ` and showcases authentic ${cuisine} flavors` : ''}. It's prepared with quality ingredients and has become a favorite among regular diners at this ${city} establishment.`
    },
    {
      question: `Is the ${dishName} suitable for dietary requirements?`,
      answer: website
        ? `For specific dietary requirements, it's best to contact ${restaurantName} directly before visiting. You can <a href="${website}" target="_blank" rel="noopener">check their website</a> for dietary information or call ahead. Most restaurants can accommodate common dietary needs with advance notice.`
        : `For specific dietary requirements, it's best to contact ${restaurantName} directly before visiting. Most restaurants can accommodate common dietary needs with advance notice, including vegetarian, vegan, and gluten-free options.`
    },
    {
      question: `How much does ${dishName} cost at ${restaurantName}?`,
      answer: price 
        ? website
          ? `The ${dishName} is priced at £${price.toFixed(2)}. Prices may vary and it's always worth <a href="${website}" target="_blank" rel="noopener">checking their current menu</a> for the most up-to-date information.`
          : `The ${dishName} is priced at £${price.toFixed(2)}. Prices may vary and it's always worth checking their current menu for the most up-to-date information.`
        : website
          ? `For current pricing of the ${dishName}, we recommend <a href="${website}" target="_blank" rel="noopener">checking ${restaurantName}'s menu</a> or contacting them directly for the most accurate information.`
          : `For current pricing of the ${dishName}, we recommend checking ${restaurantName}'s menu or contacting them directly for the most accurate information.`
    },
    {
      question: `Where can I find the full menu for ${restaurantName}?`,
      answer: website
        ? `You can <a href="${website}" target="_blank" rel="noopener">view the full menu for ${restaurantName}</a> on their official website. The menu typically includes detailed descriptions of all dishes, pricing, and information about ingredients and dietary options.`
        : `For the complete menu at ${restaurantName}, visit the restaurant in ${city} or contact them directly. Many establishments also post their menus on social media or third-party dining platforms.`
    }
  ]
}

/**
 * Fallback: Generate simple description from restaurant data
 */
export function generateFallbackDescription(
  restaurantName: string,
  city: string,
  cuisine: string | null
): string {
  const cuisineText = cuisine ? ` serving ${cuisine} cuisine` : ''
  return `${restaurantName} is a popular restaurant in ${city}${cuisineText}. Known for its quality dishes and welcoming atmosphere, this establishment has become a favorite among locals and visitors alike. The restaurant offers a carefully curated menu featuring fresh ingredients and expertly prepared dishes.`
}

