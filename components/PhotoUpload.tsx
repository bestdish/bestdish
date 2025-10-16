'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import imageCompression from 'browser-image-compression'
import { toast } from 'sonner'

interface PhotoUploadProps {
  onUploadComplete: (url: string) => void
  currentPhotoUrl?: string
  bucketName?: string
  folder?: string
  entityName?: string // For SEO-friendly filenames (e.g., dish name, restaurant name)
}

export default function PhotoUpload({ 
  onUploadComplete, 
  currentPhotoUrl,
  bucketName = 'dish-photos',
  folder = '',
  entityName
}: PhotoUploadProps) {
  // Convert filename to full Supabase URL if needed
  const getDisplayUrl = (url?: string) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    // It's a filename, convert to Supabase URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${url}`
  }
  
  const [preview, setPreview] = useState<string | null>(getDisplayUrl(currentPhotoUrl))
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper function to create SEO-friendly slug
  const createSeoSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) // Limit to 50 chars
  }

  const handleFileSelect = async (file: File) => {
    try {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic', 'image/heif']
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPG, PNG, WebP, HEIC)')
        return
      }

      // Show info for large files (no hard limit)
      const infoSize = 10 * 1024 * 1024 // 10MB
      if (file.size > infoSize) {
        toast.info('Optimizing large image - this may take a moment...')
      }

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Start upload
      setIsUploading(true)
      setUploadProgress(20)

      // Optimize image with aggressive compression and SEO settings
      const options = {
        maxSizeMB: 0.5, // Target 500KB for high quality, but will compress more if needed
        maxWidthOrHeight: 1920, // Higher quality for retina displays
        useWebWorker: true,
        fileType: 'image/webp', // Convert to WebP for best compression/quality ratio
        initialQuality: 0.85, // High quality WebP
      }

      setUploadProgress(40)
      const compressedFile = await imageCompression(file, options)
      
      console.log('Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB')
      console.log('Optimized WebP size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB')
      console.log('Compression ratio:', ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%')

      setUploadProgress(60)

      // Create SEO-friendly filename
      let seoFileName: string
      if (entityName) {
        const slug = createSeoSlug(entityName)
        seoFileName = `${slug}-${Date.now()}.webp`
      } else {
        const originalName = file.name.replace(/\.[^/.]+$/, '')
        const slug = createSeoSlug(originalName)
        seoFileName = `${slug}-${Date.now()}.webp`
      }

      // Upload via API route (server-side with admin permissions)
      const uploadFormData = new FormData()
      uploadFormData.append('file', compressedFile)
      uploadFormData.append('bucket', bucketName)
      uploadFormData.append('folder', folder)
      uploadFormData.append('fileName', seoFileName)

      setUploadProgress(70)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadData = await uploadResponse.json()
      
      setUploadProgress(100)
      const publicUrl = uploadData.url
      
      toast.success('Photo uploaded successfully!')
      onUploadComplete(publicUrl)

    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Failed to upload photo')
      setPreview(currentPhotoUrl || null)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile()
          if (file) {
            handleFileSelect(file)
          }
        }
      }
    }
  }, [])

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-gray-700">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-64 object-cover"
          />
          {!isUploading && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-gray-900 rounded-lg p-4 space-y-3 w-64">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                  <span className="text-white font-medium">Uploading...</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Optimizing image to WebP format
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onPaste={handlePaste}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-600 hover:bg-gray-800/30 transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg,image/heic,image/heif"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="inline-flex p-4 bg-gray-800 rounded-full group-hover:bg-indigo-600/20 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 group-hover:text-indigo-400 transition-colors" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                Upload Photo
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Drag and drop, paste from clipboard, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Any size accepted • Auto-optimized to WebP • SEO-friendly naming
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ImageIcon className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-gray-200">Automatic Optimization</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>✓ No file size limits - upload any size photo</li>
              <li>✓ Auto-converted to WebP format for 80-90% smaller files</li>
              <li>✓ SEO-friendly filenames generated automatically</li>
              <li>✓ Optimized for fast loading and search engine visibility</li>
              <li>✓ High quality maintained at 1920px max dimension</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

