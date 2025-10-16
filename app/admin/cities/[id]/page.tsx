'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'
import PhotoUpload from '@/components/PhotoUpload'

interface City {
  id: string
  name: string
  slug: string
  description: string | null
  photoUrl: string | null
}

export default function EditCityPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [cityId, setCityId] = useState<string>('')
  const [city, setCity] = useState<City | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => {
      setCityId(p.id)
      fetchCity(p.id)
    })
  }, [params])

  async function fetchCity(id: string) {
    try {
      const response = await fetch(`/api/cities/${id}`)
      if (response.ok) {
        const data = await response.json()
        setCity(data.city)
        setPhotoUrl(data.city.photoUrl || '')
      } else {
        toast.error('City not found')
        router.push('/admin/cities')
      }
    } catch (error) {
      console.error('Error fetching city:', error)
      toast.error('Failed to load city')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!city) return

    setSaving(true)
    try {
      const response = await fetch(`/api/cities/${cityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrl: photoUrl || null
        })
      })

      if (response.ok) {
        toast.success('City updated successfully!')
        router.push('/admin/cities')
      } else {
        toast.error('Failed to update city')
      }
    } catch (error) {
      console.error('Error saving city:', error)
      toast.error('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!city) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/cities" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Cities
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit {city.name}</h1>
          <p className="mt-2 text-gray-600">
            Update the city photo for the homepage
          </p>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>City Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Homepage City Photo
              </label>
              <p className="text-xs text-gray-500 mb-4">
                Upload a cityscape or landmark photo for the homepage "Browse all cities" section
              </p>
              <PhotoUpload
                onUploadComplete={(url) => setPhotoUrl(url)}
                currentPhotoUrl={photoUrl}
                bucketName="dish-photos"
                entityName={name ? `${name}-city` : 'city'}
              />
            </div>

            {/* Or Manual URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Enter Photo URL
              </label>
              <Input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended size: 800x600px or larger
              </p>
            </div>

            {/* Preview */}
            {photoUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preview
                </label>
                <div className="relative h-[140px] w-full rounded-2xl overflow-hidden">
                  <img
                    src={photoUrl}
                    alt={city.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <h3 className="text-base font-bold drop-shadow-lg">{city.name}</h3>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Link href="/admin/cities">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

