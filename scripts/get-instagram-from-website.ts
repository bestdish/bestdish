/**
 * Get Instagram handle(s) from a restaurant website.
 * Use this to find official Instagram before testing one dish.
 *
 * Usage: npx tsx scripts/get-instagram-from-website.ts <websiteUrl>
 * Example: npx tsx scripts/get-instagram-from-website.ts https://dishoom.com
 */

import 'dotenv/config'

const websiteUrl = process.argv[2]
if (!websiteUrl || !websiteUrl.startsWith('http')) {
  console.log('Usage: npx tsx scripts/get-instagram-from-website.ts <websiteUrl>')
  console.log('Example: npx tsx scripts/get-instagram-from-website.ts https://dishoom.com')
  process.exit(1)
}

const INSTAGRAM_PATTERNS = [
  /instagram\.com\/([a-zA-Z0-9._]{2,30})/g,
  /@([a-zA-Z0-9._]{2,30})(?=\s|$|[^a-zA-Z0-9._])/g,
]

async function main() {
  console.log(`Fetching: ${websiteUrl}\n`)
  const res = await fetch(websiteUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    redirect: 'follow',
  })
  if (!res.ok) {
    console.error(`Failed to fetch: ${res.status} ${res.statusText}`)
    process.exit(1)
  }
  const html = await res.text()
  const handles = new Set<string>()
  for (const pattern of INSTAGRAM_PATTERNS) {
    const matches = html.matchAll(pattern)
    for (const m of matches) {
      const h = m[1].toLowerCase().trim()
      if (h.length >= 2 && !h.includes('instagram') && !h.includes('share')) {
        handles.add(h.startsWith('@') ? h : `@${h}`)
      }
    }
  }
  if (handles.size === 0) {
    console.log('No Instagram links found on this page.')
    process.exit(0)
  }
  console.log('Instagram handle(s) found:')
  for (const h of handles) {
    console.log(`  ${h.startsWith('@') ? h : '@' + h}  →  https://instagram.com/${h.replace('@', '')}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
