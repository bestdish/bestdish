/**
 * Utilities for dish description source display
 */

export interface DescriptionSource {
  name: string
  url: string
}

/**
 * Convert hostname (e.g. manchesterconfidential.co.uk) to display name (e.g. Manchester Confidential)
 */
export function humanizeHostname(hostname: string): string {
  // Remove www. prefix if present
  const cleaned = hostname.replace(/^www\./, '')
  // Take the domain part (before TLD)
  const domainPart = cleaned.split('.')[0] ?? cleaned
  // Replace hyphens/underscores with spaces and title-case each word
  const words = domainPart.replace(/[-_]/g, ' ').split(/\s+/)
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Map articles from web scraper to descriptionSources format
 */
export function articlesToDescriptionSources(
  articles: Array<{ url: string; source: string }>
): DescriptionSource[] {
  const seen = new Set<string>()
  return articles
    .filter(a => a.url && a.source)
    .map(a => ({
      name: humanizeHostname(a.source),
      url: a.url,
    }))
    .filter(s => {
      const key = s.url
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}
