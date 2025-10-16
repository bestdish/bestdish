'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Star, User } from 'lucide-react'

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

interface ReviewCardProps {
  review: Review
  index?: number
}

export default function ReviewCard({ review, index = 0 }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating
                ? 'fill-primary text-primary'
                : 'text-muted-foreground/30'
            }`}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="rounded-xl shadow-sm bg-white border-border hover:shadow-md transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>

            {/* Comment Content */}
            <div className="flex-1 space-y-2">
              {/* User Info and Rating */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-foreground text-sm">
                    {review.authorName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                {review.rating && renderStars(review.rating)}
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-foreground/90 leading-relaxed text-sm">{review.comment}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}