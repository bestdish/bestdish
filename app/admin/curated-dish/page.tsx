'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Link as LinkIcon, Loader2, CheckCircle, XCircle, Sparkles, Instagram } from 'lucide-react'
import Link from 'next/link'

interface City {
  id: string
  name: string
  slug: string
}

export default function CuratedDishPage() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string[]>([])
  const [result, setResult] = useState<{
    success: boolean
    dishUrl?: string
    error?: string
  } | null>(null)

  // Form state
  const [instagramHandle, setInstagramHandle] = useState('')
  const [dishName, setDishName] = useState('')
  const [citySlug, setCitySlug] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [isNewCity, setIsNewCity] = useState(false)
  const [restaurantName, setRestaurantName] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [photoMode, setPhotoMode] = useState<'upload' | 'url' | 'from-instagram'>('upload')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')

  // From Instagram post state
  const [igPostUrl, setIgPostUrl] = useState('')
  const [igDishName, setIgDishName] = useState('')
  const [igRestaurantName, setIgRestaurantName] = useState('')
  const [fetchLoading, setFetchLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [extractionFailedMessage, setExtractionFailedMessage] = useState<string | null>(null)

  // Load cities
  useEffect(() => {
    fetch('/api/cities')
      .then(res => res.json())
      .then(data => setCities(data.cities || []))
      .catch(err => console.error('Failed to load cities:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setProgress(['Starting...'])
    setResult(null)

    const formData = new FormData()
    formData.append('instagramHandle', instagramHandle)
    formData.append('dishName', dishName)
    formData.append('citySlug', citySlug)
    formData.append('isFeatured', isFeatured.toString())
    if (isNewCity) formData.append('newCityName', cityInput)
    if (restaurantName) formData.append('restaurantNameOverride', restaurantName)
    
    if (photoMode === 'upload' && photoFile) {
      formData.append('photoFile', photoFile)
    } else if (photoMode === 'url' && photoUrl) {
      formData.append('photoUrl', photoUrl)
    }

    try {
      const response = await fetch('/api/admin/curated-dish', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (data.progress) {
        setProgress(data.progress)
      }

      if (data.success) {
        setResult({
          success: true,
          dishUrl: data.dish.url
        })
      } else {
        const errorMessage = data.error || data.progress?.find((s: string) => s.includes('❌'))?.replace(/^\s*❌\s*/, '') || 'Unknown error occurred'
        setResult({
          success: false,
          error: errorMessage
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setInstagramHandle('')
    setDishName('')
    setCitySlug('')
    setRestaurantName('')
    setPhotoFile(null)
    setPhotoUrl('')
    setProgress([])
    setResult(null)
    setIgPostUrl('')
    setIgDishName('')
    setIgRestaurantName('')
    setFetchError(null)
    setExtractionFailedMessage(null)
  }

  const handleFetchFromInstagram = async () => {
    if (!igPostUrl.trim() || !citySlug || !igRestaurantName.trim()) {
      setFetchError('Post URL, City, and Restaurant name are required.')
      return
    }
    setFetchLoading(true)
    setFetchError(null)
    setExtractionFailedMessage(null)
    try {
      const res = await fetch('/api/admin/curated-dish/from-instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postUrl: igPostUrl.trim(),
          citySlug,
          dishName: igDishName.trim() || undefined,
          restaurantName: igRestaurantName.trim(),
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setFetchError(data.error || 'Fetch failed')
        return
      }
      // Pre-fill form
      if (data.dishName) setDishName(data.dishName)
      if (data.restaurantName) setRestaurantName(data.restaurantName)
      if (data.citySlug) setCitySlug(data.citySlug)
      if (data.instagramHandle) setInstagramHandle(data.instagramHandle)
      if (data.extractionFailed) {
        setExtractionFailedMessage("We couldn't fetch the image from Instagram. Please upload the image below, then click Create Curated Dish.")
        setPhotoMode('upload')
        setPhotoFile(null)
        setPhotoUrl('')
      } else if (data.imageBase64) {
        const blob = await (await fetch(`data:image/jpeg;base64,${data.imageBase64}`)).blob()
        const file = new File([blob], 'instagram-dish.jpg', { type: 'image/jpeg' })
        setPhotoFile(file)
        setPhotoMode('upload')
        setPhotoUrl('')
        setExtractionFailedMessage(null)
      } else if (data.imageUrl) {
        setPhotoUrl(data.imageUrl)
        setPhotoMode('url')
        setExtractionFailedMessage(null)
      }
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setFetchLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <Link href="/admin" className="inline-flex items-center text-sm text-gray-400 hover:text-cyan-400 mb-4 transition-colors">
            ← Back to Admin
          </Link>
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-gray-100">Curated Dish Tool</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Manually curate high-quality dishes with AI-powered content generation
          </p>
        </div>

        {/* Form */}
        <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Dish Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Instagram Handle */}
              <div className="space-y-2">
                <Label htmlFor="instagramHandle" className="text-gray-300">
                  Instagram Handle *
                </Label>
                <Input
                  id="instagramHandle"
                  placeholder="@dishoom or dishoom"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-gray-700 border-gray-600 text-gray-100 rounded-xl"
                />
                <p className="text-xs text-gray-500">The restaurant's Instagram handle</p>
              </div>

              {/* Dish Name */}
              <div className="space-y-2">
                <Label htmlFor="dishName" className="text-gray-300">
                  Dish Name *
                </Label>
                <Input
                  id="dishName"
                  placeholder="House Black Daal"
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-gray-700 border-gray-600 text-gray-100 rounded-xl"
                />
                <p className="text-xs text-gray-500">The specific dish you want to add</p>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-gray-300">
                  City *
                </Label>
                <div className="space-y-3">
                  <select
                    id="city"
                    value={citySlug}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '__new__') {
                        setIsNewCity(true)
                        setCitySlug('')
                      } else {
                        setIsNewCity(false)
                        setCitySlug(value)
                        setCityInput('')
                      }
                    }}
                    required={!isNewCity}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-gray-700 border-gray-600 text-gray-100 rounded-xl border"
                  >
                    <option value="">Select existing city</option>
                    {cities.map(city => (
                      <option key={city.id} value={city.slug}>
                        {city.name}
                      </option>
                    ))}
                    <option value="__new__">+ Create New City</option>
                  </select>
                  
                  {isNewCity && (
                    <div className="space-y-2 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                      <Label htmlFor="newCity" className="text-cyan-300">
                        New City Name
                      </Label>
                      <Input
                        id="newCity"
                        placeholder="e.g., Leeds, Bristol, Edinburgh"
                        value={cityInput}
                        onChange={(e) => {
                          const value = e.target.value
                          setCityInput(value)
                          // Auto-generate slug
                          setCitySlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
                        }}
                        required
                        disabled={loading}
                        className="bg-gray-700 border-gray-600 text-gray-100 rounded-xl"
                      />
                      <p className="text-xs text-gray-400">
                        City will be created and appear in City Management
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Restaurant Name Override (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="restaurantName" className="text-gray-300">
                  Restaurant Name (optional)
                </Label>
                <Input
                  id="restaurantName"
                  placeholder="Leave empty to auto-detect"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  disabled={loading}
                  className="bg-gray-700 border-gray-600 text-gray-100 rounded-xl"
                />
                <p className="text-xs text-gray-500">Override if you know the exact restaurant name</p>
              </div>

              {/* Featured Toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl border border-gray-600">
                  <div>
                    <Label htmlFor="featured" className="text-gray-300 cursor-pointer">
                      Feature on Homepage
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Display in "Explore Featured Dishes" section
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="featured"
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      disabled={loading}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                  </label>
                </div>
              </div>

              {/* Photo */}
              <div className="space-y-2">
                <Label className="text-gray-300">Photo * (Recommended: Upload)</Label>
                <Tabs value={photoMode} onValueChange={(v) => setPhotoMode(v as 'upload' | 'url' | 'from-instagram')}>
                  <TabsList className="bg-gray-700">
                    <TabsTrigger value="upload" className="data-[state=active]:bg-cyan-600">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="url" className="data-[state=active]:bg-cyan-600">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      URL
                    </TabsTrigger>
                    <TabsTrigger value="from-instagram" className="data-[state=active]:bg-cyan-600">
                      <Instagram className="h-4 w-4 mr-2" />
                      From Instagram post
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="url" className="space-y-2">
                    <Input
                      placeholder="https://example.com/photo.jpg (direct image URL)"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      disabled={loading}
                      className="bg-gray-700 border-gray-600 text-gray-100 rounded-xl"
                    />
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-xs text-yellow-300">
                        ⚠️ <strong>Note:</strong> Instagram URLs often fail due to blocking. Upload or From Instagram post is more reliable!
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="upload" className="space-y-2">
                    {extractionFailedMessage && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <p className="text-xs text-amber-200">{extractionFailedMessage}</p>
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                      disabled={loading}
                      className="bg-gray-700 border-gray-600 text-gray-100 rounded-xl"
                    />
                    {photoFile && (
                      <p className="text-xs text-green-400">
                        ✓ Selected: {photoFile.name}
                      </p>
                    )}
                    <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <p className="text-xs text-cyan-300">
                        💡 <strong>Recommended:</strong> Right-click Instagram photo → "Save Image As..." → Upload here
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="from-instagram" className="space-y-4">
                    <p className="text-sm text-gray-400">
                      Paste an Instagram post URL and we&apos;ll try to fetch the image and dish details. If image fetch fails, you can upload it below.
                    </p>
                    <div className="space-y-2">
                      <Label className="text-gray-300">Post URL *</Label>
                      <Input
                        placeholder="https://www.instagram.com/p/..."
                        value={igPostUrl}
                        onChange={(e) => setIgPostUrl(e.target.value)}
                        disabled={fetchLoading}
                        className="bg-gray-700 border-gray-600 text-gray-100 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Restaurant name *</Label>
                        <Input
                          placeholder="e.g. Canto"
                          value={igRestaurantName}
                          onChange={(e) => setIgRestaurantName(e.target.value)}
                          disabled={fetchLoading}
                          className="bg-gray-700 border-gray-600 text-gray-100 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Dish name (optional)</Label>
                        <Input
                          placeholder="e.g. Patatas Bravas"
                          value={igDishName}
                          onChange={(e) => setIgDishName(e.target.value)}
                          disabled={fetchLoading}
                          className="bg-gray-700 border-gray-600 text-gray-100 rounded-xl"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      City is taken from the dropdown above. Make sure it&apos;s set before fetching.
                    </p>
                    {fetchError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-200">{fetchError}</p>
                      </div>
                    )}
                    <Button
                      type="button"
                      onClick={handleFetchFromInstagram}
                      disabled={fetchLoading || !citySlug}
                      className="bg-cyan-600 hover:bg-cyan-700 rounded-xl"
                    >
                      {fetchLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <Instagram className="mr-2 h-4 w-4" />
                          Fetch from Instagram
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 rounded-xl text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Curated Dish
                    </>
                  )}
                </Button>
                {result && (
                  <Button
                    type="button"
                    onClick={handleReset}
                    variant="outline"
                    className="bg-gray-700 border-gray-600 hover:bg-gray-600 rounded-xl"
                  >
                    Create Another
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Progress */}
        {progress.length > 0 && (
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm">
                {progress.map((step, index) => (
                  <div
                    key={index}
                    className={`
                      ${step.startsWith('✓') || step.startsWith('✅') ? 'text-green-400' : ''}
                      ${step.startsWith('⚠') ? 'text-yellow-400' : ''}
                      ${step.startsWith('❌') ? 'text-red-400' : ''}
                      ${!step.match(/^[✓✅⚠❌]/) ? 'text-gray-300' : ''}
                    `}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card className={`rounded-2xl shadow-lg ${result.success ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {result.success ? (
                  <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0 mt-1" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1 space-y-3">
                  <h3 className={`text-lg font-bold ${result.success ? 'text-green-100' : 'text-red-100'}`}>
                    {result.success ? 'Dish Created Successfully!' : 'Error Creating Dish'}
                  </h3>
                  {result.success && result.dishUrl && (
                    <div className="space-y-2">
                      <p className="text-gray-300">Your dish is now live:</p>
                      <a
                        href={result.dishUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl transition-colors"
                      >
                        View Dish Page →
                      </a>
                    </div>
                  )}
                  {result.error && (
                    <p className="text-red-200">{result.error}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

