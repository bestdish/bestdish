import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Star, Users, Clock, Utensils } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { getPublicImageUrl } from '@/lib/imageUrl'
import SearchBar from '@/components/SearchBar'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'BestDish - Discover the Best Dishes in Every City',
  description: 'Find the top-rated dishes, read authentic reviews, and discover hidden culinary gems in cities across the UK. From London to Manchester, explore the best restaurants and dishes.',
  openGraph: {
    title: 'BestDish - Discover the Best Dishes in Every City',
    description: 'Find the top-rated dishes, read authentic reviews, and discover hidden culinary gems in cities across the UK.',
    type: 'website',
  },
}

export default async function HomePage() {
  // Fetch cities
  const cities = await prisma.city.findMany({
    include: {
      _count: {
        select: {
          restaurants: { where: { isActive: true } }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  // Fetch latest dishes for "What's New"
  const latestDishes = await prisma.dish.findMany({
    where: {
      isBest: true,
      restaurant: {
        isActive: true
      }
    },
    include: {
      restaurant: {
        include: {
          city: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 12
  })

  // Fetch featured dishes
  const featuredDishes = await prisma.dish.findMany({
    where: { 
      isFeatured: true, 
      isBest: true, 
      restaurant: { isActive: true } 
    },
    include: { restaurant: { include: { city: true } } },
    orderBy: { createdAt: 'desc' },
    take: 12
  })

  // Fetch nationwide dishes
  const nationwideDishes = await prisma.dish.findMany({
    where: {
      isBest: true,
      restaurant: {
        isActive: true,
        city: {
          slug: 'nationwide'
        }
      }
    },
    include: {
      restaurant: {
        include: {
          city: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 12
  })

  // Get unique cuisines for category pills - HIDDEN FOR NOW
  // const cuisines = await prisma.restaurant.groupBy({
  //   by: ['cuisine'],
  //   where: {
  //     cuisine: { not: null },
  //     isActive: true
  //   },
  //   _count: {
  //     cuisine: true
  //   },
  //   orderBy: {
  //     _count: {
  //       cuisine: 'desc'
  //     }
  //   },
  //   take: 12
  // })
  const cuisines: any[] = [] // Temporarily disabled

  const totalRestaurants = cities.reduce((sum, city) => sum + city._count.restaurants, 0)

  // City hero images mapping
  const cityImages: Record<string, string> = {
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
    'manchester': 'https://images.unsplash.com/photo-1579057318458-50d40ae3241f?w=800&q=80',
    'birmingham': 'https://images.unsplash.com/photo-1570099479759-15502e009e00?w=800&q=80', // Birmingham skyline
    'edinburgh': 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&q=80',
    'glasgow': 'https://images.unsplash.com/photo-1617198254096-157c5d95281f?w=800&q=80',
    'leeds': 'https://images.unsplash.com/photo-1595439143451-edd366c36a0c?w=800&q=80',
    'bristol': 'https://images.unsplash.com/photo-1529704193007-e8c78f0f46f9?w=800&q=80', // Bristol cityscape
    'liverpool': 'https://images.unsplash.com/photo-1546969031-b8b02c931d66?w=800&q=80',
    'cardiff': 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800&q=80', // Cardiff castle/city
    'newcastle': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&q=80'
  }

  // Cuisine emoji mapping
  const cuisineEmojis: Record<string, string> = {
    'italian': '🍝',
    'chinese': '🥢',
    'american': '🍔',
    'british': '🍺',
    'indian': '🍛',
    'japanese': '🍣',
    'french': '🥐',
    'mexican': '🌮',
    'thai': '🍜',
    'spanish': '🥘',
    'portuguese': '🐓',
    'bar': '🍸',
    'café': '☕',
    'cafe': '☕',
    'fast-food': '🍟',
    'asian-fusion': '🥡'
  }

  return (
    <>
      {/* Schema.org JSON-LD for Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "BestDish",
            "description": "Discover the best dishes in every city across the UK",
            "url": process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            "logo": `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
            "sameAs": [],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "email": "hello@bestdish.co.uk"
            }
          }),
        }}
      />

      <div className="min-h-screen bg-background">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section - Editorial Magazine Style */}
          <div className="text-center py-20">
            {/* Logo */}
            <div className="mb-3">
              <div className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                <span className="text-primary">Best</span><span className="text-foreground">Dish</span><sup className="text-xs">™</sup>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight leading-[1.1]">
              The Only Ranking That Matters.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We don't rate restaurants. We rate dishes. Find the one worth ordering.
            </p>
          </div>

          {/* Browse by Cuisine Section - HIDDEN FOR NOW */}
          {/* <div className="mb-12 -mx-4 sm:mx-0">
            <h2 className="text-4xl font-bold text-foreground mb-8 px-4 sm:px-0">Browse by <span className="text-primary">Cuisine</span></h2>
            <div className="flex gap-3 overflow-x-auto px-4 sm:px-0 pb-4 scrollbar-hide">
              {cuisines.map((cuisine) => {
                const slug = cuisine.cuisine?.toLowerCase().replace(/\s+/g, '-') || ''
                const emoji = cuisineEmojis[slug] || '🍽️'
                
                return (
                  <Link
                    key={cuisine.cuisine}
                    href={`/cuisine/${slug}`}
                    className="flex-shrink-0"
                  >
                    <div className="relative min-w-[140px] h-[48px] px-4 rounded-full bg-muted hover:bg-muted/80 shadow-sm hover:shadow-md transition-all duration-200 group border border-border">
                      <div className="h-full flex items-center justify-center gap-2">
                        <span className="text-xl" style={{ filter: 'hue-rotate(0deg) saturate(2) brightness(1.1)', color: 'hsl(45, 100%, 45%)' }}>{emoji}</span>
                        <span className="text-sm font-bold text-foreground whitespace-nowrap" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                          {cuisine.cuisine}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div> */}

          {/* Explore Featured Dishes - Horizontal Scroll */}
          {featuredDishes.length > 0 && (
            <div className="mb-20 -mx-4 sm:mx-0">
              <h2 className="text-4xl font-bold text-foreground mb-8 px-4 sm:px-0">Explore <span className="text-primary">Featured</span> Dishes</h2>
              <div className="flex gap-6 overflow-x-auto px-4 sm:px-0 pb-4 scrollbar-hide">
                {featuredDishes.map((dish) => {
                  // Get dish photo: if it's a filename, convert to Supabase URL; otherwise use restaurant photo
                  const photoUrl = dish.photoUrl 
                    ? (dish.photoUrl.startsWith('http') ? dish.photoUrl : getPublicImageUrl('dish-photos', dish.photoUrl))
                    : dish.restaurant.photoUrl
                  
                  return (
                    <Link
                      key={dish.id}
                      href={`/${dish.restaurant.city.slug}/${dish.slug}`}
                      className="group flex-shrink-0"
                    >
                      <div className="w-[280px] bg-card rounded-2xl shadow-md hover:shadow-xl border border-border transition-all duration-300 overflow-hidden">
                        <div className="relative aspect-square overflow-hidden bg-white">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={dish.name}
                              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                              <Clock className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}
                          
                          {/* Pill overlays */}
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1.5 bg-primary backdrop-blur-sm rounded-full text-xs font-bold text-primary-foreground shadow-lg" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              {dish.restaurant.city.name}
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-5">
                          <h3 className="font-bold text-foreground text-base mb-1.5 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {dish.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1 font-medium">
                            {dish.restaurant.name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Browse All Cities - Compact Cards */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-foreground mb-8">Browse All <span className="text-primary">Cities</span></h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {cities.filter(city => city.slug !== 'nationwide' && city._count.restaurants > 0).map((city) => {
                // Use uploaded city photo or fallback to placeholder
                const cityImage = city.photoUrl 
                  ? (city.photoUrl.startsWith('http') ? city.photoUrl : getPublicImageUrl('dish-photos', city.photoUrl))
                  : (cityImages[city.slug] || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80')
                
                return (
                  <Link
                    key={city.id}
                    href={`/${city.slug}`}
                    className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-[120px] border border-border bg-card"
                  >
                    <img 
                      src={cityImage}
                      alt={city.name}
                      className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent group-hover:from-black/80 transition-all"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <h3 className="text-base font-bold mb-0.5 drop-shadow-lg">{city.name}</h3>
                      <p className="text-xs opacity-95 drop-shadow-md">{city._count.restaurants} restaurants</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* What's New on BestDish - Horizontal Scroll */}
          <div className="mb-20 -mx-4 sm:mx-0">
            <h2 className="text-4xl font-bold text-foreground mb-8 px-4 sm:px-0">What&apos;s <span className="text-primary">New</span> on BestDish</h2>
            <div className="flex gap-6 overflow-x-auto px-4 sm:px-0 pb-4 scrollbar-hide">
              {latestDishes.map((dish) => {
                // Get dish photo: if it's a filename, convert to Supabase URL; otherwise use restaurant photo
                const photoUrl = dish.photoUrl 
                  ? (dish.photoUrl.startsWith('http') ? dish.photoUrl : getPublicImageUrl('dish-photos', dish.photoUrl))
                  : dish.restaurant.photoUrl
                
                return (
                  <Link
                    key={dish.id}
                    href={`/${dish.restaurant.city.slug}/${dish.restaurant.slug}/${dish.slug}`}
                    className="group flex-shrink-0"
                  >
                    <div className="w-[280px] bg-card rounded-2xl shadow-md hover:shadow-xl border border-border transition-all duration-300 overflow-hidden">
                      <div className="relative aspect-square overflow-hidden bg-white">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={dish.name}
                            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                            <Clock className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        
                        {/* Pill overlays */}
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1.5 bg-primary backdrop-blur-sm rounded-full text-xs font-bold text-primary-foreground shadow-lg" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                            {dish.restaurant.city.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <h3 className="font-bold text-foreground text-base mb-1.5 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                          {dish.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1 font-medium">
                          {dish.restaurant.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Nationwide Dishes - Horizontal Scroll */}
          {nationwideDishes.length > 0 && (
            <div className="mb-20 -mx-4 sm:mx-0">
              <h2 className="text-4xl font-bold text-foreground mb-8 px-4 sm:px-0"><span className="text-primary">Nationwide</span> Favorites</h2>
              <div className="flex gap-6 overflow-x-auto px-4 sm:px-0 pb-4 scrollbar-hide">
                {nationwideDishes.map((dish) => {
                  // Get dish photo: if it's a filename, convert to Supabase URL; otherwise use restaurant photo
                  const photoUrl = dish.photoUrl 
                    ? (dish.photoUrl.startsWith('http') ? dish.photoUrl : getPublicImageUrl('dish-photos', dish.photoUrl))
                    : dish.restaurant.photoUrl
                  
                  return (
                    <Link
                      key={dish.id}
                      href={`/${dish.restaurant.city.slug}/${dish.slug}`}
                      className="group flex-shrink-0"
                    >
                      <div className="w-[280px] bg-card rounded-2xl shadow-md hover:shadow-xl border border-border transition-all duration-300 overflow-hidden">
                        <div className="relative aspect-square overflow-hidden bg-white">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={dish.name}
                              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                              <Clock className="h-12 w-12 text-muted-foreground/30" />
                            </div>
                          )}
                          
                          {/* Pill overlays */}
                          <div className="absolute top-3 left-3">
                            <span className="px-3 py-1.5 bg-primary backdrop-blur-sm rounded-full text-xs font-bold text-primary-foreground shadow-lg" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                              Nationwide
                            </span>
                          </div>
                        </div>
                        
                        <div className="p-5">
                          <h3 className="font-bold text-foreground text-base mb-1.5 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                            {dish.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1 font-medium">
                            {dish.restaurant.name}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Restaurant Contact Card */}
          <div className="py-16 border-t border-border">
            <div className="max-w-2xl mx-auto">
              <Card className="rounded-2xl shadow-lg bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-8 text-center">
                  <div className="mb-4">
                    <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      Are You a Restaurant Owner?
                    </h3>
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Want your signature dish featured on BestDish? We're always looking to showcase exceptional dining experiences.
                  </p>
                  <a
                    href="mailto:hello@bestdish.co.uk?subject=Restaurant Listing Request"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-colors shadow-md hover:shadow-lg"
                  >
                    Get in Touch
                  </a>
                  <p className="text-sm text-muted-foreground mt-4">
                    Email us at <span className="font-medium text-foreground">hello@bestdish.co.uk</span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Search Section */}
          <div className="py-24 text-center border-t border-border">
            <div className="max-w-3xl mx-auto px-4">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Ready to Find Your Next <span className="text-primary">Favorite Dish?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Search by dish name or restaurant
              </p>
              <SearchBar variant="homepage" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}