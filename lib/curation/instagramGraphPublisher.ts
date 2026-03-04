/**
 * Publish a dish to the BestDish Instagram account via the Instagram Graph API.
 * Replaces Make.com webhook for posting. Requires INSTAGRAM_GRAPH_ACCESS_TOKEN and INSTAGRAM_IG_USER_ID.
 */

import { prisma } from '@/lib/prisma'

const GRAPH_API_VERSION = 'v21.0'
const GRAPH_INSTAGRAM_BASE = `https://graph.instagram.com/${GRAPH_API_VERSION}`
const GRAPH_FACEBOOK_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

export interface PublishToInstagramResult {
  success: boolean
  mediaId?: string
  error?: string
}

function getFullImageUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null
  return `${supabaseUrl}/storage/v1/object/public/dish-photos/${url}`
}

function extractInstagramHandle(restaurantName: string): string | null {
  if (!restaurantName) return null
  const handle = restaurantName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  if (!handle || handle.length === 0) return null
  return handle
}

function generateHashtags(
  dishName: string,
  restaurantName: string,
  cityName: string,
  cuisine: string | null
): string[] {
  const hashtags = [
    '#BestDish',
    '#BestDishUK',
    `#${cityName.replace(/\s+/g, '')}Food`,
    `#${cityName.replace(/\s+/g, '')}Eats`,
    '#Foodie',
    '#FoodPorn',
    '#Instafood',
    '#UKFood',
    '#FoodLovers',
    '#Delicious',
  ]
  if (cuisine) {
    const cuisineTag = cuisine.replace(/\s+/g, '')
    hashtags.push(`#${cuisineTag}`, `#${cuisineTag}Food`)
  }
  const dishLower = dishName.toLowerCase()
  if (dishLower.includes('pizza')) hashtags.push('#Pizza', '#PizzaLovers')
  if (dishLower.includes('pasta')) hashtags.push('#Pasta', '#ItalianFood')
  if (dishLower.includes('burger')) hashtags.push('#Burger', '#BurgerLovers')
  if (dishLower.includes('ramen')) hashtags.push('#Ramen', '#JapaneseFood')
  if (dishLower.includes('curry')) hashtags.push('#Curry', '#IndianFood')
  if (dishLower.includes('steak')) hashtags.push('#Steak', '#Steakhouse')
  if (dishLower.includes('sushi')) hashtags.push('#Sushi', '#SushiLovers')
  if (dishLower.includes('taco')) hashtags.push('#Taco', '#MexicanFood')
  if (dishLower.includes('tea')) hashtags.push('#AfternoonTea', '#TeaTime')
  return [...new Set(hashtags)].slice(0, 15)
}

function buildCaption(dish: {
  name: string
  description: string | null
  restaurant: { name: string; instagramHandle: string | null; city: { name: string }; cuisine: string | null }
}): string {
  let restaurantInstagram = dish.restaurant.instagramHandle
  if (!restaurantInstagram) {
    const generated = extractInstagramHandle(dish.restaurant.name)
    restaurantInstagram = generated ? `@${generated}` : `@${dish.restaurant.name}`
  } else if (!restaurantInstagram.startsWith('@')) {
    restaurantInstagram = `@${restaurantInstagram}`
  }
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://bestdish.co.uk'
  const location = `${dish.restaurant.name}, ${dish.restaurant.city.name}`
  const hashtags = generateHashtags(
    dish.name,
    dish.restaurant.name,
    dish.restaurant.city.name,
    dish.restaurant.cuisine
  )
  const descriptionText = (dish.description ?? '').slice(0, 1800)
  const lines = [
    `${dish.name} @ ${restaurantInstagram}`,
    '',
    descriptionText,
    '',
    `📍 ${location}`,
    `🔗 ${baseUrl.replace(/^https?:\/\//, '')}`,
    '',
    hashtags.join(' '),
  ]
  return lines.join('\n')
}

/**
 * Publish a dish to Instagram via the Graph API. Requires env INSTAGRAM_GRAPH_ACCESS_TOKEN and INSTAGRAM_IG_USER_ID.
 * If not configured, returns { success: false, error: '...' } without throwing.
 */
/**
 * IG-prefix tokens = Instagram user token → use graph.instagram.com and "me".
 * EAA/other = Facebook/Page token → use graph.facebook.com and numeric INSTAGRAM_IG_USER_ID.
 */
function getInstagramApiConfig(token: string): { baseUrl: string; igUserId: string } {
  const isIgToken = token.startsWith('IG') || token.startsWith('IGA')
  const igUserId = process.env.INSTAGRAM_IG_USER_ID?.trim()
  if (isIgToken) {
    return { baseUrl: GRAPH_INSTAGRAM_BASE, igUserId: 'me' }
  }
  if (!igUserId) {
    return { baseUrl: GRAPH_FACEBOOK_BASE, igUserId: 'me' }
  }
  return { baseUrl: GRAPH_FACEBOOK_BASE, igUserId }
}

export async function publishDishToInstagram(dishId: string): Promise<PublishToInstagramResult> {
  const rawToken = process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN
  const token = rawToken?.replace(/\s+/g, '').trim()
  if (!token) {
    return { success: false, error: 'Instagram Graph API not configured (INSTAGRAM_GRAPH_ACCESS_TOKEN)' }
  }
  const { baseUrl, igUserId } = getInstagramApiConfig(token)

  const dish = await prisma.dish.findUnique({
    where: { id: dishId },
    include: {
      restaurant: { include: { city: true } },
    },
  })
  if (!dish) {
    return { success: false, error: 'Dish not found' }
  }
  if (!dish.isBest) {
    return { success: false, error: 'Dish is not published' }
  }
  if (!dish.photoUrl || !dish.description?.trim()) {
    return { success: false, error: 'Dish is missing photo or description' }
  }

  const photoUrl = getFullImageUrl(dish.photoUrl)
  if (!photoUrl) {
    return { success: false, error: 'Failed to build photo URL' }
  }

  try {
    const imageCheck = await fetch(photoUrl, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
    if (!imageCheck.ok) {
      return { success: false, error: 'Dish photo URL is not accessible' }
    }
  } catch (e) {
    console.error('Instagram publish: image warmup failed', e)
    return { success: false, error: 'Dish photo is not accessible' }
  }

  const caption = buildCaption(dish)
  const createUrl = `${baseUrl}/${igUserId}/media`
  const params = new URLSearchParams({
    access_token: token,
    image_url: photoUrl,
    caption,
  })

  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  })
  const createData = (await createRes.json()) as { id?: string; error?: { message: string; code?: number } }
  if (createData.error) {
    console.error('Instagram Graph API create container error:', createData.error)
    let msg = createData.error.message || 'Failed to create media container'
    if (msg.toLowerCase().includes('parse') && msg.toLowerCase().includes('token')) {
      console.error('INSTAGRAM_GRAPH_ACCESS_TOKEN length:', token.length, 'prefix:', token.slice(0, 3), '(IG/IGA = Instagram token, EAA = Page token)')
      msg = 'Invalid Instagram access token. Ensure (1) the token was generated by the Facebook account that is an App Tester/Admin, (2) that account accepted the tester invite, (3) INSTAGRAM_GRAPH_ACCESS_TOKEN has no extra spaces/newlines and is the full token. For Page-linked Instagram set INSTAGRAM_IG_USER_ID to the numeric IG user ID.'
    }
    return { success: false, error: msg }
  }
  if (!createData.id) {
    return { success: false, error: 'No container ID returned from Instagram' }
  }

  const containerId = createData.id
  await new Promise((r) => setTimeout(r, 2000))

  const publishUrl = `${baseUrl}/${igUserId}/media_publish`
  const publishParams = new URLSearchParams({
    access_token: token,
    creation_id: containerId,
  })
  const publishRes = await fetch(publishUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: publishParams.toString(),
  })
  const publishData = (await publishRes.json()) as { id?: string; error?: { message: string } }
  if (publishData.error) {
    console.error('Instagram Graph API publish error:', publishData.error)
    return { success: false, error: publishData.error.message || 'Failed to publish' }
  }
  return { success: true, mediaId: publishData.id }
}
