'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import SearchBar from './SearchBar'

interface MobileSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <SearchBar variant="homepage" onResultClick={onClose} />
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label="Close search"
          >
            <X className="h-6 w-6 text-foreground" />
          </button>
        </div>
      </div>

      {/* Supporting Text */}
      <div className="px-4 py-6 text-center">
        <p className="text-muted-foreground">
          Search for your favorite dishes or restaurants
        </p>
      </div>
    </div>
  )
}

