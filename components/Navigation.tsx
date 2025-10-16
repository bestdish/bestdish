'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import SearchBar from './SearchBar'
import MobileSearchOverlay from './MobileSearchOverlay'

export default function Navigation() {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background border-b border-border backdrop-blur-sm bg-background/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                <span className="text-primary">Best</span><span className="text-foreground">Dish</span><sup className="text-xs">™</sup>
              </Link>
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-[600px]">
              <SearchBar variant="header" />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Mobile Search Icon */}
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                className="md:hidden p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5 text-foreground" />
              </button>

              {/* Log In Button */}
              <Link 
                href="/login" 
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-bold text-sm transition-colors whitespace-nowrap"
                style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay 
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />
    </>
  )
}

