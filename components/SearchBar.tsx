'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SearchResult {
  type: 'dish' | 'restaurant'
  id: string
  name: string
  slug: string
  restaurantName?: string
  restaurantSlug?: string
  cityName: string
  citySlug: string
  rating?: number | null
  ratingCount?: number
  dishCount?: number
  url: string
}

interface SearchBarProps {
  variant?: 'header' | 'homepage'
  onResultClick?: () => void
}

export default function SearchBar({ variant = 'header', onResultClick }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 0) {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
          const data = await response.json()
          setResults(data.results || [])
          setIsOpen(true)
        } catch (error) {
          console.error('Search failed:', error)
          setResults([])
        } finally {
          setIsLoading(false)
        }
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault()
      handleResultClick(results[selectedIndex])
    }
  }

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setQuery('')
    setResults([])
    setIsOpen(false)
    onResultClick?.()
  }

  const isHomepage = variant === 'homepage'

  return (
    <div ref={searchRef} className={cn(
      'relative',
      isHomepage ? 'w-full max-w-[700px] mx-auto' : 'flex-1 max-w-[700px]'
    )}>
      {/* Search Input */}
      <div className="relative">
        <Search className={cn(
          'absolute left-4 text-muted-foreground',
          isHomepage ? 'top-5 h-6 w-6' : 'top-3 h-5 w-5'
        )} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search dishes or restaurants..."
          className={cn(
            'w-full bg-white border-2 border-primary rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all',
            isHomepage ? 'h-16 pl-14 pr-14 text-lg' : 'h-12 pl-12 pr-12 text-base'
          )}
          style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
        />
        {isLoading && (
          <Loader2 className={cn(
            'absolute right-4 text-primary animate-spin',
            isHomepage ? 'top-5 h-6 w-6' : 'top-3 h-5 w-5'
          )} />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-border rounded-2xl shadow-xl overflow-hidden">
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result)}
              className={cn(
                'w-full flex items-center justify-between gap-3 p-3 hover:bg-primary/10 transition-colors text-left',
                selectedIndex === index && 'bg-primary/10'
              )}
            >
              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-foreground truncate" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  {result.name}
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {result.type === 'dish' ? (
                    <span>{result.restaurantName} · {result.cityName}</span>
                  ) : (
                    <span>{result.cityName}</span>
                  )}
                </div>
              </div>

              {/* Rating/Count */}
              {result.type === 'dish' && result.rating && result.ratingCount && result.ratingCount > 0 ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-bold text-foreground">{result.rating}</span>
                </div>
              ) : null}
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && !isLoading && query.trim().length > 0 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-border rounded-2xl shadow-xl p-6 text-center">
          <p className="text-muted-foreground">No dishes or restaurants found for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  )
}

