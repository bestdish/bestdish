/**
 * Resolve restaurant name + city to website and Instagram handle (no manual step).
 * 1. Try DB: find restaurant by name + city; use website or existing instagramHandle.
 * 2. If no website: Google Places API text search → place details → website.
 * 3. Fetch website, extract Instagram links, filter out false positives (schema words, domains).
 *
 * Usage: npx tsx scripts/resolve-restaurant-to-instagram.ts "Canto" "Manchester"
 *    or: npx tsx scripts/resolve-restaurant-to-instagram.ts Canto Manchester
 */

import 'dotenv/config'
import { prisma } from '../lib/prisma'

const restaurantName = process.argv[2]
const cityName = process.argv[3]

if (!restaurantName || !cityName) {
  console.log('Usage: npx tsx scripts/resolve-restaurant-to-instagram.ts <restaurantName> <cityName>')
  console.log('Example: npx tsx scripts/resolve-restaurant-to-instagram.ts Canto Manchester')
  process.exit(1)
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const INSTAGRAM_PATTERNS = [
  /instagram\.com\/([a-zA-Z0-9._]{2,30})/g,
  /@([a-zA-Z0-9._]{2,30})(?=\s|$|[^a-zA-Z0-9._])/g,
]

const SCHEMA_AND_NOISE = new Set([
  'context', 'type', 'id', 'graph', 'media', 'font', 'schema', 'url', 'name',
  'description', 'image', 'logo', 'author', 'publisher', 'sameas',
])

function extractHandlesFromHtml(html: string): string[] {
  const handles = new Set<string>()
  for (const pattern of INSTAGRAM_PATTERNS) {
    const matches = html.matchAll(pattern)
    for (const m of matches) {
      const h = m[1].toLowerCase().trim()
      if (h.length >= 2 && h.length <= 30 && !h.includes('instagram') && !h.includes('share')) {
        handles.add(h)
      }
    }
  }
  return Array.from(handles)
}

function filterAndRankHandles(
  handles: string[],
  restaurantName: string,
  cityName: string
): string[] {
  const nameParts = restaurantName.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean)
  const citySlug = cityName.toLowerCase().replace(/\s+/, '') // e.g. manchester, mcr

  const scored = handles
    .filter((h) => {
      if (SCHEMA_AND_NOISE.has(h)) return false
      if (h.includes('.')) return false
      if (h.length < 3) return false
      return true
    })
    .map((h) => {
      let score = 0
      for (const part of nameParts) {
        if (part.length >= 2 && h.includes(part)) score += 10
      }
      if (citySlug === 'manchester' && (h.includes('mcr') || h.includes('manchester'))) score += 5
      if (h.includes('restaurant') || h.includes('food')) score += 2
      return { handle: h, score }
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)

  return scored.map((x) => x.handle)
}

async function getWebsiteFromPlaces(name: string, city: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) return null
  const query = encodeURIComponent(`${name} restaurant ${city} UK`)
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&type=restaurant&key=${apiKey}`
  const searchRes = await fetch(searchUrl)
  if (!searchRes.ok) return null
  const searchData = await searchRes.json()
  const first = searchData.results?.[0]
  if (!first?.place_id) return null
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${first.place_id}&fields=website,name&key=${apiKey}`
  const detailsRes = await fetch(detailsUrl)
  if (!detailsRes.ok) return null
  const detailsData = await detailsRes.json()
  return detailsData.result?.website || null
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function main() {
  const citySlug = slugify(cityName)
  console.log(`Resolving: "${restaurantName}" in ${cityName}\n`)

  let website: string | null = null
  let existingInstagram: string | null = null

  const dbRestaurant = await prisma.restaurant.findFirst({
    where: {
      name: { contains: restaurantName, mode: 'insensitive' },
      city: { slug: citySlug },
    },
    include: { city: true },
  })

  if (dbRestaurant) {
    console.log(`  DB: found "${dbRestaurant.name}" (${dbRestaurant.city.name})`)
    existingInstagram = dbRestaurant.instagramHandle || null
    website = dbRestaurant.website || null
    if (existingInstagram) {
      console.log(`  Instagram (from DB): ${existingInstagram}`)
      console.log(`  Website: ${website || '—'}`)
      await prisma.$disconnect()
      console.log('\nResult: use', existingInstagram)
      process.exit(0)
    }
    if (website) console.log(`  Website: ${website}`)
  } else {
    console.log('  DB: no restaurant found')
  }

  if (!website) {
    console.log('  Places: searching for website...')
    website = await getWebsiteFromPlaces(restaurantName, cityName)
    if (website) console.log(`  Places: ${website}`)
    else console.log('  Places: no website found')
  }

  if (!website) {
    console.log('\nNo website found. Cannot extract Instagram without a URL.')
    await prisma.$disconnect()
    process.exit(1)
  }

  console.log('  Fetching website...')
  const html = await fetchHtml(website)
  const rawHandles = extractHandlesFromHtml(html)
  const ranked = filterAndRankHandles(rawHandles, restaurantName, cityName)

  await prisma.$disconnect()

  if (ranked.length === 0) {
    console.log('\nNo Instagram handle found on the website (after filtering).')
    process.exit(0)
  }

  const best = ranked[0]
  const handle = best.startsWith('@') ? best : `@${best}`
  console.log('\nResult:')
  console.log(`  Website: ${website}`)
  console.log(`  Instagram: ${handle}  →  https://instagram.com/${best.replace('@', '')}`)
  if (ranked.length > 1) {
    console.log('  Other candidates:', ranked.slice(1, 5).map((h) => (h.startsWith('@') ? h : `@${h}`)).join(', '))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
