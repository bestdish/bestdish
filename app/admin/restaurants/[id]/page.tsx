'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import PhotoUpload from '@/components/PhotoUpload'
import { toast } from 'sonner'
import { ArrowLeft, Save, Trash2, Loader2, Instagram } from 'lucide-react'
import Link from 'next/link'
import { use } from 'react'

interface City {
  id: string
  name: string
  slug: string
}

interface Restaurant {
  id: string
  name: string
  slug: string
  cityId: string
  address: string | null
  phone: string | null
  website: string | null
  cuisine: string | null
  priceRange: string | null
  dishes: Array<{
    id: string
    name: string
    description: string | null
    price: number | null
    photoUrl: string | null
    isBest: boolean
  }>
}

export default function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [cities, setCities] = useState<City[]>([])
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [postingToIg, setPostingToIg] = useState(false)
  
  // Restaurant fields
  const [name, setName] = useState('')
  const [cityId, setCityId] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [cuisine, setCuisine] = useState('')
  const [priceRange, setPriceRange] = useState('')
  
  // Dish fields
  const [dishId, setDishId] = useState('')
  const [dishName, setDishName] = useState('')
  const [dishDescription, setDishDescription] = useState('')
  const [dishPrice, setDishPrice] = useState('')
  const [dishPhotoUrl, setDishPhotoUrl] = useState('')
  const [dishIsFeatured, setDishIsFeatured] = useState(false)

  // Load cities and restaurant data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load cities
        const citiesRes = await fetch('/api/cities')
        const citiesData = await citiesRes.json()
        setCities(citiesData.cities || [])

        // Load restaurant
        const restaurantRes = await fetch(`/api/admin/restaurants/${id}`)
        const restaurantData = await restaurantRes.json()
        
        if (restaurantData.restaurant) {
          const r = restaurantData.restaurant
          setRestaurant(r)
          setName(r.name)
          setCityId(r.cityId)
          setAddress(r.address || '')
          setPhone(r.phone || '')
          setWebsite(r.website || '')
          setCuisine(r.cuisine || '')
          setPriceRange(r.priceRange || '')

          // Load best dish
          const bestDish = r.dishes[0]
          if (bestDish) {
            setDishId(bestDish.id)
            setDishName(bestDish.name)
            setDishDescription(bestDish.description || '')
            setDishPrice(bestDish.price?.toString() || '')
            setDishPhotoUrl(bestDish.photoUrl || '')
            setDishIsFeatured(bestDish.isFeatured || false)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load restaurant data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !cityId || !dishName) {
      toast.error('Please fill in required fields')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/admin/restaurants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurant: {
            name,
            cityId,
            address: address || null,
            phone: phone || null,
            website: website || null,
            cuisine: cuisine || null,
            priceRange: priceRange || null,
          },
          dish: {
            id: dishId,
            name: dishName,
            description: dishDescription || null,
            price: dishPrice ? parseFloat(dishPrice) : null,
            photoUrl: dishPhotoUrl || null,
            isFeatured: dishIsFeatured,
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update restaurant')
      }

      toast.success('Restaurant updated successfully!')
      router.push('/admin/restaurants')
      router.refresh()
      
    } catch (error) {
      console.error('Error updating restaurant:', error)
      toast.error('Failed to update restaurant')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePostToInstagram = async () => {
    if (!dishId) return
    setPostingToIg(true)
    try {
      const res = await fetch(`/api/admin/dishes/${dishId}/post-to-instagram`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success('Posted to Instagram!')
      } else {
        toast.error(data.error || 'Failed to post to Instagram')
      }
    } catch (e) {
      toast.error('Failed to post to Instagram')
    } finally {
      setPostingToIg(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this restaurant? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/restaurants/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete restaurant')
      }

      toast.success('Restaurant deleted successfully')
      router.push('/admin/restaurants')
      router.refresh()
      
    } catch (error) {
      console.error('Error deleting restaurant:', error)
      toast.error('Failed to delete restaurant')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-indigo-400 animate-spin mx-auto" />
          <p className="text-gray-400">Loading restaurant...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400">Restaurant not found</p>
          <Link href="/admin/restaurants">
            <Button>Back to Restaurants</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/restaurants">
              <Button variant="outline" className="bg-gray-800 border-gray-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-gray-100">Edit Restaurant</h1>
              <p className="text-gray-400 mt-1">{restaurant.name}</p>
            </div>
          </div>

          <Button
            onClick={handleDelete}
            variant="outline"
            className="bg-red-600/10 border-red-600/30 text-red-400 hover:bg-red-600/20"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Restaurant Details */}
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Restaurant Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Restaurant Name <span className="text-red-400">*</span>
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-gray-100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    City <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100"
                    required
                  >
                    <option value="">Select a city...</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Address</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-gray-100"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Phone</label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Website</label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Cuisine</label>
                  <Input
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-gray-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Price Range</label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100"
                  >
                    <option value="">Select...</option>
                    <option value="£">£ - Budget</option>
                    <option value="££">££ - Moderate</option>
                    <option value="£££">£££ - Upscale</option>
                    <option value="££££">££££ - Fine Dining</option>
                  </select>
                </div>
              </div>

              {/* Info Note */}
              <div className="pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400 italic">
                  💡 Tip: For chain restaurants, set the city to "Nationwide"
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Best Dish */}
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">The Best Dish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Dish Name <span className="text-red-400">*</span>
                </label>
                <Input
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-gray-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Description
                </label>
                <Textarea
                  value={dishDescription}
                  onChange={(e) => setDishDescription(e.target.value)}
                  rows={6}
                  className="bg-gray-900 border-gray-700 text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Price (£)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={dishPrice}
                  onChange={(e) => setDishPrice(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Dish Photo
                </label>
                <PhotoUpload
                  onUploadComplete={(url) => setDishPhotoUrl(url)}
                  currentPhotoUrl={dishPhotoUrl}
                  entityName={dishName || 'dish'}
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={dishIsFeatured}
                  onChange={(e) => setDishIsFeatured(e.target.checked)}
                  className="w-5 h-5 rounded border-yellow-600 bg-gray-900 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-gray-900"
                />
                <label htmlFor="isFeatured" className="text-sm font-medium text-yellow-400 cursor-pointer">
                  ⭐ Feature this dish on homepage
                </label>
              </div>

              {dishId && dishPhotoUrl && dishDescription?.trim() && (
                <div className="pt-4 border-t border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePostToInstagram}
                    disabled={postingToIg}
                    className="bg-pink-900/20 border-pink-600/30 text-pink-300 hover:bg-pink-900/40"
                  >
                    {postingToIg ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Instagram className="h-4 w-4 mr-2" />
                        Post to Instagram
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">Posts this dish to the BestDish Instagram account.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <Link href="/admin/restaurants">
              <Button type="button" variant="outline" className="bg-gray-800 border-gray-700">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={isSaving || !name || !cityId || !dishName}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

