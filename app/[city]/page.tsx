import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { generateCitySchema, generateMetaTags } from '@/lib/seo'
import { Card, CardContent } from '@/components/ui/card'
import { Star, MapPin, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { getPublicImageUrl } from '@/lib/imageUrl'

// Force dynamic rendering to avoid database connection issues during static generation
export const dynamic = 'force-dynamic'

interface CityPageProps {
  params: Promise<{ city: string }>
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city: citySlug } = await params
  
  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
    include: {
      restaurants: {
        where: { 
          isActive: true
        },
        select: {
          id: true,
          name: true,
          slug: true,
          rating: true,
          cuisine: true,
          dishes: {
            where: { isBest: true },
            take: 1
          }
        }
      }
    }
  })

  if (!city) {
    return {
      title: 'City Not Found',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const cityUrl = `${baseUrl}/${citySlug}`
  
  const meta = generateMetaTags({
    title: `Best Restaurants in ${city.name} | BestDish`,
    description: `Discover the top-rated restaurants in ${city.name}. Find the best dishes, read reviews, and explore local dining.`,
    url: cityUrl,
    type: 'website'
  })

  return {
    ...meta,
    alternates: {
      canonical: cityUrl,
    },
  }
}

export default async function CityPage({ params }: CityPageProps) {
  const { city: citySlug } = await params
  
  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
    include: {
      restaurants: {
        where: { 
          isActive: true
        },
        include: {
          dishes: {
            where: { 
              isBest: true
            },
            take: 1
          },
          _count: {
            select: { dishes: true }
          }
        },
        orderBy: [
          { rating: 'desc' },
          { name: 'asc' }
        ]
      }
    }
  })

  if (!city) {
    notFound()
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  const schema = generateCitySchema({
    name: city.name,
    slug: city.slug,
    description: city.description,
    restaurants: city.restaurants.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      rating: r.rating,
      cuisine: r.cuisine
    }))
  })

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": city.name,
        "item": `${process.env.NEXT_PUBLIC_SITE_URL}/${city.slug}`
      }
    ]
  }

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Image Section */}
        {city.photoUrl && (
          <div className="relative h-[200px] md:h-[250px] w-full overflow-hidden">
            <img
              src={city.photoUrl.startsWith('http') ? city.photoUrl : getPublicImageUrl('dish-photos', city.photoUrl)}
              alt={city.name}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-background" />
            
            {/* City name overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-2xl">
                  {city.name}
                </h1>
                <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto drop-shadow-lg">
                  {city.description || `Discover the best dining experiences in ${city.name}`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header (for cities without photos) */}
          {!city.photoUrl && (
            <div className="text-center mb-16 py-12">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Best <span className="text-primary">Restaurants</span> in {city.name}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                {city.description || `Discover the top-rated restaurants in ${city.name}. Find the best dishes, read reviews, and explore local dining.`}
              </p>
            </div>
          )}

          {/* Section header for cities with photos */}
          {city.photoUrl && (
            <div className="text-center mb-12 py-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Top <span className="text-primary">Restaurants</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Explore the finest dining experiences {city.name} has to offer
              </p>
            </div>
          )}

          {/* Restaurants Grid */}
          {city.restaurants.length === 0 ? (
            <Card className="rounded-lg shadow-sm bg-card border-border">
              <CardContent className="p-12 text-center">
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">No restaurants yet</h3>
                  <p className="text-muted-foreground">Check back soon for the best restaurants in {city.name}!</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {city.restaurants
                .filter(restaurant => restaurant.dishes.length > 0) // Only show restaurants with published dishes
                .map((restaurant) => {
                const bestDish = restaurant.dishes[0]
                // Get dish photo: if it's a filename, convert to Supabase URL; otherwise use restaurant photo
                const dishPhoto = bestDish?.photoUrl
                  ? (bestDish.photoUrl.startsWith('http') ? bestDish.photoUrl : getPublicImageUrl('dish-photos', bestDish.photoUrl))
                  : restaurant.photoUrl
                
                return (
                  <Link
                    key={restaurant.id}
                    href={bestDish ? `/${city.slug}/${restaurant.slug}/${bestDish.slug}` : `/${city.slug}/${restaurant.slug}`}
                    className="group"
                  >
                    <Card className="rounded-2xl shadow-md bg-card border-border hover:shadow-xl transition-all duration-300 overflow-hidden group">
                      <div className="relative aspect-[4/3] overflow-hidden bg-white">
                        {dishPhoto ? (
                          <img
                            src={dishPhoto}
                            alt={bestDish ? bestDish.name : restaurant.name}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                            <MapPin className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        
                        {/* Pill overlays */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                          {restaurant.cuisine && (
                            <span className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-foreground shadow-md border border-border">
                              {restaurant.cuisine}
                            </span>
                          )}
                          {bestDish && (
                            <span className="px-3 py-1.5 bg-primary backdrop-blur-sm rounded-full text-xs font-bold text-primary-foreground shadow-md">
                              Editor's Choice
                            </span>
                          )}
                        </div>
                        
                        {restaurant.priceRange && (
                          <div className="absolute bottom-3 right-3">
                            <span className="px-3 py-1.5 bg-foreground/90 backdrop-blur-sm rounded-full text-xs font-bold text-white shadow-md">
                              {restaurant.priceRange}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-foreground mb-1.5 line-clamp-1 group-hover:text-primary transition-colors">
                          {restaurant.name}
                        </h3>
                        
                        {bestDish && (
                          <p className="text-base text-foreground/90 font-medium mb-3 line-clamp-1">
                            {bestDish.name}
                          </p>
                        )}
                        
                        {restaurant.address && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-4">
                            {restaurant.address}
                          </p>
                        )}
                        
                        <div className="pt-3 border-t border-border">
                          <div className="text-sm font-bold text-primary group-hover:underline transition-all">
                            View Details →
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}


