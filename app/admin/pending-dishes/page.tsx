'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Clock, Upload, CheckCircle, XCircle, Search, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface PendingDish {
  id: string
  name: string
  slug: string
  description: string
  photoUrl: string | null
  editorialQuote: string | null
  faqAnswers: any
  createdAt: string
  restaurant: {
    id: string
    name: string
    city: {
      name: string
      slug: string
    }
  }
}

export default function PendingDishesPage() {
  const [dishes, setDishes] = useState<PendingDish[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [uploadingDish, setUploadingDish] = useState<string | null>(null)

  const fetchDishes = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/pending-dishes?page=${page}&search=${searchTerm}`)
      const data = await response.json()
      setDishes(data.dishes)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Failed to fetch pending dishes:', error)
      toast.error('Failed to load pending dishes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDishes()
  }, [page, searchTerm])

  const handlePhotoUpload = async (dishId: string, file: File) => {
    setUploadingDish(dishId)
    const formData = new FormData()
    formData.append('photo', file)
    
    try {
      const response = await fetch(`/api/admin/pending-dishes/${dishId}/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        toast.success('Photo uploaded successfully!')
        fetchDishes() // Refresh the list
      } else {
        toast.error('Failed to upload photo')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photo')
    } finally {
      setUploadingDish(null)
    }
  }

  const handlePublish = async (dishId: string) => {
    try {
      const response = await fetch(`/api/admin/pending-dishes/${dishId}/publish`, {
        method: 'POST'
      })
      
      if (response.ok) {
        toast.success('Dish published to website!')
        fetchDishes() // Refresh the list
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to publish dish')
      }
    } catch (error) {
      console.error('Publish error:', error)
      toast.error('Failed to publish dish')
    }
  }

  const handleDelete = async (dishId: string) => {
    if (!confirm('Are you sure you want to delete this draft dish?')) return
    
    try {
      const response = await fetch(`/api/admin/pending-dishes/${dishId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        toast.success('Draft dish deleted')
        fetchDishes()
      } else {
        toast.error('Failed to delete dish')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete dish')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-100">Pending Dishes</h1>
          <p className="text-gray-400 text-lg">Dishes awaiting image approval before publishing</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search by dish name, restaurant, or city..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-gray-800 border-gray-700 text-gray-100 rounded-xl"
          />
        </div>

        {/* Stats */}
        <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-400">Awaiting Images</p>
                <p className="text-3xl font-bold text-gray-100">{dishes.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Clock className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dishes List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          </div>
        ) : dishes.length === 0 ? (
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-100 mb-2">All Clear!</h3>
              <p className="text-gray-400">No dishes awaiting images</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {dishes.map((dish) => (
              <Card key={dish.id} className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-gray-100 mb-2">
                        {dish.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {dish.restaurant.name} · {dish.restaurant.city.name}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(dish.id)}
                        className="bg-red-900/20 border-red-800 hover:bg-red-900/40 rounded-xl"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Description Preview */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Description</h4>
                    <p className="text-sm text-gray-400 line-clamp-3">{dish.description}</p>
                  </div>

                  {/* Editorial Quote */}
                  {dish.editorialQuote && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Editorial Quote</h4>
                      <p className="text-sm text-gray-400 italic">"{dish.editorialQuote}"</p>
                    </div>
                  )}

                  {/* FAQs */}
                  {dish.faqAnswers && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">
                        FAQs: {Array.isArray(dish.faqAnswers) ? dish.faqAnswers.length : Object.keys(dish.faqAnswers).length} items
                      </h4>
                    </div>
                  )}

                  {/* Upload Photo */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label
                          htmlFor={`upload-${dish.id}`}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl cursor-pointer transition-colors"
                        >
                          {uploadingDish === dish.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Upload Photo
                            </>
                          )}
                        </label>
                        <input
                          id={`upload-${dish.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handlePhotoUpload(dish.id, file)
                          }}
                          disabled={uploadingDish === dish.id}
                        />
                      </div>
                      
                      {dish.photoUrl && (
                        <Button
                          onClick={() => handlePublish(dish.id)}
                          className="bg-green-600 hover:bg-green-700 rounded-xl"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Publish to Website
                        </Button>
                      )}
                      
                      <Link
                        href={`/${dish.restaurant.city.slug}/${dish.restaurant.name.toLowerCase().replace(/\s+/g, '-')}/${dish.slug}`}
                        target="_blank"
                      >
                        <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600 hover:bg-gray-600 rounded-xl">
                          Preview
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Current Photo Preview */}
                  {dish.photoUrl && (
                    <div className="border-t border-gray-700 pt-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Current Photo</h4>
                      <div className="relative w-full aspect-video bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src={dish.photoUrl.startsWith('http') 
                            ? dish.photoUrl 
                            : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/dish-photos/${dish.photoUrl}`
                          }
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
              className="bg-gray-800 border-gray-700"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-gray-400">
              Page {page} of {totalPages}
            </span>
            <Button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              variant="outline"
              className="bg-gray-800 border-gray-700"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


