'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Image as ImageIcon } from 'lucide-react'
import { getPublicImageUrl } from '@/lib/imageUrl'

interface City {
  id: string
  name: string
  slug: string
  photoUrl: string | null
  _count: {
    restaurants: number
  }
}

export default function CitiesAdminPage() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCities()
  }, [])

  async function fetchCities() {
    try {
      const response = await fetch('/api/cities')
      if (response.ok) {
        const data = await response.json()
        setCities(data.cities)
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCityImageUrl = (photoUrl: string | null) => {
    if (!photoUrl) return null
    if (photoUrl.startsWith('http')) return photoUrl
    return getPublicImageUrl('dish-photos', photoUrl)
  }

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
          <h1 className="text-4xl font-bold text-gray-100">City Management</h1>
          <p className="text-gray-400 text-lg">
            Edit city information and homepage photos
          </p>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => {
            const imageUrl = getCityImageUrl(city.photoUrl)
            return (
              <Card key={city.id} className="rounded-2xl overflow-hidden bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
                <CardContent className="p-0">
                  {/* City Photo */}
                  <div className="relative h-48 bg-gray-700">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={city.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700">
                        <ImageIcon className="h-12 w-12 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* City Info */}
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-100 mb-1">
                        {city.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {city._count.restaurants} restaurant{city._count.restaurants !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <Link href={`/admin/cities/${city.id}`}>
                      <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit City Photo
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}






