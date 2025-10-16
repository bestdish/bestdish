import { Star } from 'lucide-react'

interface CommunityScoreProps {
  averageRating: number
  totalRatings: number
}

export default function CommunityScore({ averageRating, totalRatings }: CommunityScoreProps) {
  if (totalRatings === 0) {
    return null // Don't show if no ratings yet
  }

  return (
    <div className="flex items-center gap-4">
      {/* Star Display */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 ${
              star <= Math.round(averageRating)
                ? 'fill-primary text-primary'
                : 'text-muted-foreground/20'
            }`}
          />
        ))}
      </div>

      {/* Score and Count */}
      <div>
        <div className="text-2xl font-bold text-foreground">
          {averageRating.toFixed(1)}
        </div>
        <div className="text-xs text-muted-foreground">
          {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
        </div>
      </div>
    </div>
  )
}

