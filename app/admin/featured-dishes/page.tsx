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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-100">Featured Dishes</h1>
          <p className="text-gray-400 text-lg">
            Manage which dishes appear in the "Explore Featured Dishes" section. Currently featuring {featuredCount} dishes.
          </p>
        </div>

        {/* Dishes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dishes.map((dish) => (
            <Card key={dish.id} className={`rounded-2xl shadow-lg bg-gray-800/50 hover:bg-gray-800/70 transition-all ${dish.isFeatured ? 'border-cyan-500 border-2' : 'border-gray-700'}`}>
              <CardHeader>
                <CardTitle className="text-lg text-gray-100">{dish.name}</CardTitle>
                <p className="text-sm text-gray-400">
                  {dish.restaurant.name} • {dish.restaurant.city.name}
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => toggleFeatured(dish.id, dish.isFeatured)}
                  disabled={updating === dish.id}
                  className={`w-full rounded-xl ${dish.isFeatured ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  {updating === dish.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Star className={`h-4 w-4 mr-2 ${dish.isFeatured ? 'fill-current' : ''}`} />
                      {dish.isFeatured ? 'Remove from Featured' : 'Add to Featured'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}


