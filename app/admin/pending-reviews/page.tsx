'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Star, CheckCircle, XCircle, User } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Review {
  id: string
  authorName: string
  rating: number | null
  comment: string | null
  createdAt: string
  dish: {
    name: string
    restaurant: {
      name: string
      city: {
        name: string
      }
    }
  }
}

export default function PendingReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const loadReviews = async () => {
    try {
      const response = await fetch('/api/admin/pending-reviews')
      if (!response.ok) throw new Error('Failed to fetch reviews')
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast.error('Failed to load pending reviews')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  const handleApprove = async (reviewId: string) => {
    try {
      const response = await fetch('/api/reviews/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId })
      })

      if (!response.ok) throw new Error('Failed to approve')
      
      toast.success('Comment approved!')
      loadReviews()
      router.refresh()
    } catch (error) {
      console.error('Error approving:', error)
      toast.error('Failed to approve comment')
    }
  }

  const handleReject = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to reject')
      
      toast.success('Comment rejected')
      loadReviews()
      router.refresh()
    } catch (error) {
      console.error('Error rejecting:', error)
      toast.error('Failed to reject comment')
    }
  }

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-sm text-gray-500">No rating</span>
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-100">Review Moderation</h1>
          <p className="text-gray-400 text-lg">{reviews.length} comment{reviews.length !== 1 ? 's' : ''} awaiting moderation</p>
        </div>

        {reviews.length === 0 ? (
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-100 mb-2">All Clear!</h3>
              <p className="text-gray-400">No pending comments to review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-100">{review.authorName}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dish Info */}
                    <div className="pl-13">
                      <p className="text-sm text-cyan-400 font-medium">{review.dish.name}</p>
                      <p className="text-xs text-gray-500">{review.dish.restaurant.name}, {review.dish.restaurant.city.name}</p>
                    </div>
                    
                    {/* Comment */}
                    {review.comment && (
                      <p className="text-gray-300 pl-13">{review.comment}</p>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pl-13 pt-3 border-t border-gray-700">
                      <button 
                        onClick={() => handleApprove(review.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors text-sm"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(review.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors text-sm"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
