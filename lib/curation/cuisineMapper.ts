/**
 * Cuisine Normalization Mapper
 * Maps detected cuisine variations to standardized top-level categories
 */

/**
 * Top-level cuisine categories for user-facing display
 */
export const TOP_LEVEL_CUISINES = [
  'Burgers',
  'Pizza',
  'Pasta',
  'Tapas',
  'Steak',
  'British',
  'Indian',
  'Chinese',
  'Sushi',
  'Thai',
  'Mexican',
  'Middle Eastern',
  'Seafood',
  'Chicken',
  'Sandwiches',
  'Salads',
  'Caribbean',
  'Vegan',
  'Vegetarian',
  'Bakery'
] as const

export type TopLevelCuisine = typeof TOP_LEVEL_CUISINES[number]

/**
 * Cuisine mapping rules
 * Maps detected variations to top-level categories
 */
const CUISINE_MAP: Record<string, TopLevelCuisine | null> = {
  // Tapas (Spanish variations)
  'spanish': 'Tapas',
  'tapas': 'Tapas',
  'basque': 'Tapas',
  'catalan': 'Tapas',
  
  // Sushi (Japanese variations)
  'japanese': 'Sushi',
  'sushi': 'Sushi',
  'ramen': 'Sushi',
  
  // Pasta (Italian variations that aren't pizza)
  'italian': 'Pasta',
  'pasta': 'Pasta',
  
  // Pizza (separate from Italian)
  'pizza': 'Pizza',
  'pizzeria': 'Pizza',
  
  // British (pub food, roasts)
  'british': 'British',
  'pub': 'British',
  'gastropub': 'British',
  'roast': 'British',
  'fish and chips': 'British',
  'english': 'British',
  
  // Steak
  'steakhouse': 'Steak',
  'steak': 'Steak',
  'grill': 'Steak',
  
  // Burgers
  'burger': 'Burgers',
  'burgers': 'Burgers',
  'hamburger': 'Burgers',
  
  // Indian
  'indian': 'Indian',
  'curry': 'Indian',
  
  // Chinese
  'chinese': 'Chinese',
  
  // Thai
  'thai': 'Thai',
  
  // Mexican
  'mexican': 'Mexican',
  'tex-mex': 'Mexican',
  
  // Middle Eastern
  'middle eastern': 'Middle Eastern',
  'lebanese': 'Middle Eastern',
  'turkish': 'Middle Eastern',
  'persian': 'Middle Eastern',
  'greek': 'Middle Eastern',
  
  // Seafood
  'seafood': 'Seafood',
  'fish': 'Seafood',
  
  // Chicken
  'chicken': 'Chicken',
  'fried chicken': 'Chicken',
  'rotisserie': 'Chicken',
  'wings': 'Chicken',
  
  // Sandwiches
  'sandwich': 'Sandwiches',
  'sandwiches': 'Sandwiches',
  'deli': 'Sandwiches',
  'sub': 'Sandwiches',
  
  // Salads
  'salad': 'Salads',
  'salads': 'Salads',
  
  // Caribbean
  'caribbean': 'Caribbean',
  'jamaican': 'Caribbean',
  'jerk': 'Caribbean',
  
  // Vegan
  'vegan': 'Vegan',
  'plant-based': 'Vegan',
  
  // Vegetarian
  'vegetarian': 'Vegetarian',
  'veggie': 'Vegetarian',
  
  // Bakery
  'bakery': 'Bakery',
  'cafe': 'Bakery',
  'patisserie': 'Bakery',
  'coffee shop': 'Bakery',
  
  // Fusion (map to closest traditional)
  'fusion': null, // Will be determined by context
  'modern european': 'British',
  'contemporary': null,
  'modern british': 'British',
  'asian fusion': 'Chinese', // Default to Chinese for Asian fusion
  'pan-asian': 'Chinese',
  
  // Edge cases / Additional mappings
  'american': 'Burgers', // Default American to Burgers
  'portuguese': 'Chicken', // Nando's style
  'bar': null, // Not a cuisine type
  'brasserie': 'British',
  'bistro': 'British',
  
  // Asian variations
  'taiwanese': 'Chinese',
  'korean': 'Chinese', // Or could map to own category if you want Korean
  'vietnamese': 'Chinese',
  
  // Keep unassigned (niche cuisines)
  'scandinavian': null,
  'sri lankan': null,
  'mediterranean': null // Too broad
}

/**
 * Normalize cuisine to top-level category
 */
export function normalizeCuisine(detectedCuisine: string | null): TopLevelCuisine | null {
  if (!detectedCuisine) return null
  
  const normalized = detectedCuisine.toLowerCase().trim()
  
  // Direct mapping
  if (CUISINE_MAP[normalized] !== undefined) {
    return CUISINE_MAP[normalized]
  }
  
  // Partial match (for compound names like "Spanish Tapas Bar")
  for (const [key, value] of Object.entries(CUISINE_MAP)) {
    if (normalized.includes(key)) {
      return value
    }
  }
  
  // If already a top-level cuisine, return as-is
  const capitalizedInput = detectedCuisine
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  if (TOP_LEVEL_CUISINES.includes(capitalizedInput as TopLevelCuisine)) {
    return capitalizedInput as TopLevelCuisine
  }
  
  // No mapping found - return null to avoid creating bad categories
  return null
}

/**
 * Get all top-level cuisines for filtering/display
 */
export function getTopLevelCuisines(): readonly TopLevelCuisine[] {
  return TOP_LEVEL_CUISINES
}

