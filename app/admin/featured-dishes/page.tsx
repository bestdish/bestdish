'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Dish {
  id: string
  name: string
  isFeatured: boolean
  restaurant: {
    name: string
    city: {
      name: string
    }
  }
}

export default function FeaturedDishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchDishes()
  }, [])

  async function fetchDishes() {
    try {
      const response = await fetch('/api/admin/featured-dishes')
      if (response.ok) {
        const data = await response.json()
        setDishes(data.dishes)
      }
    } catch (error) {
      toast.error('Failed to load dishes')
    } finally {
      setLoading(false)
    }
  }

  async function toggleFeatured(dishId: string, currentStatus: boolean) {
    setUpdating(dishId)
    try {
      const response = await fetch(`/api/admin/featured-dishes/${dishId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !currentStatus })
      })

      if (response.ok) {
        setDishes(dishes.map(dish => 
          dish.id === dishId ? { ...dish, isFeatured: !currentStatus } : dish
        ))
        toast.success(!currentStatus ? 'Added to featured' : 'Removed from featured')
      } else {
        toast.error('Failed to update')
      }
    } catch (error) {
      toast.error('Failed to update')
    } finally {
      setUpdating(null)
    }
  }

  const featuredCount = dishes.filter(d => d.isFeatured).length

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-primary mb-4 inline-block">
            ← Back to Admin
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Featured Dishes</h1>
          <p className="text-muted-foreground">
            Manage which dishes appear in the "Explore Featured Dishes" section. Currently featuring {featuredCount} dishes.
          </p>
        </div>

        {/* Dishes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dishes.map((dish) => (
            <Card key={dish.id} className={dish.isFeatured ? 'border-primary border-2' : ''}>
              <CardHeader>
                <CardTitle className="text-lg">{dish.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {dish.restaurant.name} • {dish.restaurant.city.name}
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => toggleFeatured(dish.id, dish.isFeatured)}
                  disabled={updating === dish.id}
                  variant={dish.isFeatured ? 'default' : 'outline'}
                  className="w-full"
                >
                  {updating === dish.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Star className={`h-4 w-4 mr-2 ${dish.isFeatured ? 'fill-current' : ''}`} />
                  )}
                  {dish.isFeatured ? 'Remove from Featured' : 'Add to Featured'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

