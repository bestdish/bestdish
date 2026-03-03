/**
 * AI Content Generator for Curated Dishes
 * Generates content for a SPECIFIC dish (not identifying which dish)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface CuratedDishContent {
  description: string
  quotes: Array<{
    text: string
    source: string
    url?: string
  }>
  cuisine: string | null
  price: number | null
}

/**
 * Generate content for a specific dish (user has already told us which dish)
 */
export async function generateCuratedDishContent(
  dishName: string,
  restaurantName: string,
  city: string,
  scrapedContent: string
): Promise<CuratedDishContent | null> {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const prompt = `You are an expert food critic writing an original review for "${dishName}" at "${restaurantName}" in ${city}, UK.

SCRAPED CONTENT (for research about this specific dish):
${scrapedContent}

TASK:
Write an original critical appraisal of "${dishName}" specifically. DO NOT write about any other dish.

CRITICAL REQUIREMENTS FOR DESCRIPTION:
- Write ONLY about "${dishName}" - ignore all other dishes mentioned in the content
- Write as an EXPERT FOOD CRITIC with YOUR OWN VOICE and original phrasing
- This is THE BEST dish at this restaurant - emphasize what makes it exceptional
- Be authoritative and positive (you're recommending it)
- Focus on WHY "${dishName}" is outstanding: flavors, technique, presentation, ingredients
- Use vivid, sensory language: how it tastes, looks, feels, smells
- 150-200 words in editorial magazine style
- Third person, present tense
- Example tone: "The afternoon tea at Betty's transcends expectation with delicate finger sandwiches..." NOT "Reviews mention the afternoon tea is good..."

OTHER REQUIREMENTS:
1. Extract the price of "${dishName}" if mentioned (in GBP)
2. Extract 2-3 compelling quotes specifically about "${dishName}" from the content (with source)
3. Identify the cuisine type of the restaurant (not the dish)
4. If you can't find information about "${dishName}" in the content, write based on what you know about this type of dish

OUTPUT ONLY valid JSON in this exact format:
{
  "description": "Your 150-200 word description of ${dishName} here...",
  "quotes": [
    {"text": "Quote specifically about ${dishName}", "source": "Source name"},
  ],
  "cuisine": "Cuisine Type" or null,
  "price": 12.50 or null
}

Return ONLY the JSON, no other text.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    if (!text?.trim()) {
      console.error('Gemini returned empty or blocked response')
      throw new Error('AI returned no content (possible safety block or quota). Try again or simplify the dish name.')
    }
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response:', text?.slice(0, 500))
      throw new Error('Gemini did not return valid JSON. Try again or add more dish/restaurant context.')
    }
    
    let content: CuratedDishContent
    try {
      content = JSON.parse(jsonMatch[0]) as CuratedDishContent
    } catch (parseErr) {
      console.error('Gemini JSON parse error:', parseErr, 'Raw:', jsonMatch[0]?.slice(0, 300))
      throw new Error('AI response was malformed. Please try again.')
    }
    
    // Validate result
    if (!content.description || content.description.length < 50) {
      console.error('Description too short in AI result:', content.description?.length)
      throw new Error('AI description was too short. Try adding more context about the dish or restaurant.')
    }
    
    return content
  } catch (error) {
    if (error instanceof Error) {
      console.error('AI content generation error:', error)
      throw error
    }
    throw new Error('Failed to generate AI content. Check GEMINI_API_KEY and try again.')
  }
}



