'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star } from 'lucide-react'
import ReviewCard from './ReviewCard'

interface Review {
  id: string
  rating?: number | null
  comment?: string | null
  createdAt: string
  authorName: string
  user?: {
    email: string
    name?: string | null
  } | null
}

interface ReviewListProps {
  reviews: Review[]
  averageRating?: number
  totalReviews?: number
  dishName: string
}

export default function ReviewList({ reviews, averageRating = 0, totalReviews = 0, dishName }: ReviewListProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
              i < Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-600'
            }`}
          />
        ))}
        <span className="ml-2 text-gray-300 font-medium">
          {rating.toFixed(1)}
        </span>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {reviews.map((review, index) => (
        <ReviewCard key={review.id} review={review} index={index} />
      ))}
    </div>
  )
}


