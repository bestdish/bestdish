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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!city) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Link href="/admin/cities" className="inline-flex items-center text-sm text-gray-400 hover:text-cyan-400 mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Cities
          </Link>
          <h1 className="text-4xl font-bold text-gray-100">Edit {city.name}</h1>
          <p className="text-gray-400 text-lg">
            Update the city photo for the homepage
          </p>
        </div>

        {/* Edit Form */}
        <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">City Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Homepage City Photo
              </label>
              <p className="text-xs text-gray-500 mb-4">
                Upload a cityscape or landmark photo for the homepage "Browse all cities" section
              </p>
              <PhotoUpload
                onUploadComplete={(url) => setPhotoUrl(url)}
                currentPhotoUrl={photoUrl}
                bucketName="dish-photos"
                entityName={city?.name ? `${city.name}-city` : 'city'}
              />
            </div>

            {/* Or Manual URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Or Enter Photo URL
              </label>
              <Input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="bg-gray-700 border-gray-600 text-gray-100 rounded-xl"
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended size: 800x600px or larger
              </p>
            </div>

            {/* Preview */}
            {photoUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preview
                </label>
                <div className="relative h-[140px] w-full rounded-2xl overflow-hidden border border-gray-700">
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
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
              <Link href="/admin/cities">
                <Button variant="outline" className="bg-gray-700 border-gray-600 hover:bg-gray-600 rounded-xl">Cancel</Button>
              </Link>
              <Button onClick={handleSave} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 rounded-xl">
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

