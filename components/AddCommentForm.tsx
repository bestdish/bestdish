'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Star } from 'lucide-react'

interface AddCommentFormProps {
  dishId: string
  dishName: string
  onCommentSubmitted?: () => void
}

export default function AddCommentForm({ dishId, dishName, onCommentSubmitted }: AddCommentFormProps) {
  const [name, setName] = useState('')
  const [rating, setRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoverRating, setHoverRating] = useState<number>(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !comment.trim()) {
      toast.error('Please enter your name and comment')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dishId,
          authorName: name.trim(),
          rating: rating > 0 ? rating : null,
          comment: comment.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit comment')
      }

      toast.success('Comment submitted! It will appear after approval.')
      
      // Reset form
      setName('')
      setRating(0)
      setComment('')
      
      if (onCommentSubmitted) {
        onCommentSubmitted()
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      toast.error('Failed to submit comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div>
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-white border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Star Rating (Optional) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-muted-foreground">Rate this dish (optional)</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-7 w-7 ${
                    star <= (hoverRating || rating)
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground/30'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <button
                type="button"
                onClick={() => setRating(0)}
                className="ml-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Comment Textarea */}
        <div>
          <Textarea
            placeholder={`Share your thoughts about ${dishName}...`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            rows={3}
            className="bg-white border-border text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || !name.trim() || !comment.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      </form>
    </div>
  )
}


