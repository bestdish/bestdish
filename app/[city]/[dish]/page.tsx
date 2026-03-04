import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { generateDishSchema, generateMetaTags } from '@/lib/seo'
import { getPublicImageUrl } from '@/lib/imageUrl'
import { Card, CardContent } from '@/components/ui/card'
import { Star, MapPin, Clock, Users, Heart, Menu, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import AddCommentForm from '@/components/AddCommentForm'
import ReviewList from '@/components/ReviewList'
import CommunityScore from '@/components/CommunityScore'

// Force dynamic rendering to avoid database connection issues during static generation
export const dynamic = 'force-dynamic'

interface DishPageProps {
  params: Promise<{ city: string; dish: string }>
}

export async function generateMetadata({ params }: DishPageProps): Promise<Metadata> {
  const { city: citySlug, dish: dishSlug } = await params
  
  const dish = await prisma.dish.findFirst({
    where: { 
      slug: dishSlug,
      restaurant: {
        isActive: true,
        city: { slug: citySlug }
      }
    },
    include: {
      restaurant: {
        include: {
          city: true
        }
      },
      reviews: {
        where: { approved: true },
        include: {
          user: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!dish) {
    return {
      title: 'Dish Not Found',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const dishUrl = `${baseUrl}/${citySlug}/${dishSlug}`
  
  // Calculate average rating from reviews that have ratings
  const reviewsWithRatings = dish.reviews.filter(r => r.rating !== null)
  const averageRating = reviewsWithRatings.length > 0 
    ? reviewsWithRatings.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewsWithRatings.length 
    : 0
  const totalRatings = reviewsWithRatings.length

  // Generate description (avoid nested template literals)
  let description = dish.description
  if (!description) {
    const baseDesc = `Discover ${dish.name} at ${dish.restaurant.name} in ${dish.restaurant.city.name}.`
    const ratingDesc = dish.reviews.length > 0 
      ? ` Rated ${averageRating.toFixed(1)}/5 by ${dish.reviews.length} reviewers.`
      : ' Be the first to review this dish!'
    description = baseDesc + ratingDesc + ' Read reviews, see photos, and find the best dishes in your city.'
  }

  const meta = generateMetaTags({
    title: `${dish.name} at ${dish.restaurant.name} | ${dish.restaurant.city.name} | BestDish`,
    description,
    url: dishUrl,
    image: dish.photoUrl 
      ? (dish.photoUrl.startsWith('http') ? dish.photoUrl : getPublicImageUrl('dish-photos', dish.photoUrl))
      : (dish.restaurant.photoUrl || undefined),
    type: 'article'
  })

  return {
    ...meta,
    alternates: {
      canonical: dishUrl,
    },
  }
}

export default async function DishPage({ params }: DishPageProps) {
  const { city: citySlug, dish: dishSlug } = await params
  
  const dish = await prisma.dish.findFirst({
    where: { 
      slug: dishSlug,
      restaurant: {
        isActive: true,
        city: { slug: citySlug }
      }
    },
    include: {
      restaurant: {
        include: {
          city: true
        }
      },
      reviews: {
        where: { approved: true },
        include: {
          user: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!dish) {
    notFound()
  }

  // Calculate average rating from reviews that have ratings
  const reviewsWithRatings = dish.reviews.filter(r => r.rating !== null)
  const averageRating = reviewsWithRatings.length > 0 
    ? reviewsWithRatings.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewsWithRatings.length 
    : 0
  const totalRatings = reviewsWithRatings.length

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${
              i < Math.round(rating)
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  const schema = generateDishSchema({
    id: dish.id,
    name: dish.name,
    slug: dish.slug,
    description: dish.description,
    price: null, // Price hidden from users
    photoUrl: dish.photoUrl,
    restaurant: {
      name: dish.restaurant.name,
      slug: dish.restaurant.slug,
      address: dish.restaurant.address,
      city: {
        name: dish.restaurant.city.name,
        slug: dish.restaurant.city.slug
      }
    },
    reviews: dish.reviews
      .filter(review => review.rating !== null)
      .map(review => ({
        id: review.id,
        rating: review.rating!,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        user: {
          name: review.user?.name || review.authorName,
          email: review.user?.email || 'anonymous@bestdish.com'
        }
      })),
    averageRating,
    reviewCount: dish.reviews.length
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
        "name": dish.restaurant.city.name,
        "item": `${process.env.NEXT_PUBLIC_SITE_URL}/${dish.restaurant.city.slug}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": dish.restaurant.name,
        "item": `${process.env.NEXT_PUBLIC_SITE_URL}/${dish.restaurant.city.slug}/${dish.slug}`
      }
    ]
  }

  // FAQ Schema for SEO
  const faqSchema = dish.faqAnswers && Array.isArray(dish.faqAnswers) && dish.faqAnswers.length > 0 
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": (dish.faqAnswers as any[]).map((faq: any) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      }
    : null

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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      )}

      <div className="min-h-screen bg-background">
        {/* Article Container */}
        <article className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
          {/* Breadcrumbs */}
          <nav className="py-4">
            <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href={`/${dish.restaurant.city.slug}`} className="hover:text-primary transition-colors">
                  {dish.restaurant.city.name}
                </Link>
              </li>
              <li>/</li>
              <li className="text-foreground">{dish.restaurant.name}</li>
            </ol>
          </nav>

          {/* Hero Image Card */}
          <div className="my-8">
            <div className="rounded-3xl overflow-hidden shadow-2xl border-2 border-border bg-white">
              <div className="aspect-[16/9] w-full bg-white">
                {(() => {
                  const displayPhoto = dish.photoUrl?.startsWith('http') 
                    ? dish.photoUrl 
                    : dish.photoUrl 
                    ? getPublicImageUrl('dish-photos', dish.photoUrl)
                    : dish.restaurant.photoUrl
                  
                  return displayPhoto ? (
                    <img
                      src={displayPhoto}
                      alt={dish.name}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                      <Clock className="h-24 w-24 text-muted-foreground/30" />
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Dish Header - Compact for Above Fold */}
          <header className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <h2 className="font-bold text-foreground/70">
                {dish.restaurant.name}
              </h2>
              <span className="text-muted-foreground">•</span>
              <Link 
                href={`/${dish.restaurant.city.slug}`}
                className="text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
              >
                {dish.restaurant.city.name}
              </Link>
              {dish.restaurant.cuisine && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {dish.restaurant.cuisine}
                  </span>
                </>
              )}
              {dish.isBest && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-xs font-bold shadow-md">
                    Editor's Choice
                  </span>
                </>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              {dish.name}
            </h1>
            
            {dish.description && (
              <>
                <p className="text-lg text-foreground/80 leading-relaxed">
                  {dish.description}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Dish descriptions are generated automatically to give a balanced, unbiased view of what to expect.
                </p>
                {dish.descriptionSources &&
                  Array.isArray(dish.descriptionSources) &&
                  dish.descriptionSources.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium">Sources: </span>
                      {(dish.descriptionSources as { name: string; url: string }[]).map(
                        (src, i) => (
                          <span key={src.url}>
                            {i > 0 && ', '}
                            <a
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              {src.name}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </span>
                        )
                      )}
                    </div>
                  )}
              </>
            )}

            {/* Restaurant Quick Info - Button CTAs */}
            <div className="flex flex-wrap gap-4 pt-6 border-t border-border">
              {dish.restaurant.address && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dish.restaurant.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all font-bold text-sm shadow-md hover:shadow-lg"
                  style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                >
                  <MapPin className="h-4 w-4" />
                  <span>{dish.restaurant.address.split(',')[0]}</span>
                </a>
              )}
              
              {(dish.restaurant.website || dish.restaurant.menuUrl) && (
                <a 
                  href={dish.restaurant.menuUrl || dish.restaurant.website || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all font-bold text-sm"
                  style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
                >
                  <Menu className="h-4 w-4" />
                  <span>View Menu</span>
                </a>
              )}
            </div>
          </header>

          {/* Editorial Quote Section */}
          {dish.editorialQuote && (
            <section className="py-16 border-t border-border">
              <h2 className="text-3xl font-bold text-foreground mb-8">What the <span className="text-primary">Critics Say</span></h2>
              <blockquote className="border-l-[6px] border-primary pl-8 py-6 bg-card/50 rounded-r-2xl">
                <p className="text-xl italic text-foreground/90 leading-relaxed mb-4">
                  "{dish.editorialQuote}"
                </p>
                {dish.editorialSource && !/^scraped content$|^scraped$|^various sources?$/i.test(dish.editorialSource.trim()) && (
                  <footer className="text-base text-muted-foreground">
                    — <cite className="not-italic font-semibold">
                      {dish.editorialUrl ? (
                        <a 
                          href={dish.editorialUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {dish.editorialSource}
                        </a>
                      ) : (
                        dish.editorialSource
                      )}
                    </cite>
                  </footer>
                )}
              </blockquote>
            </section>
          )}

          {/* Community Section */}
          <section className="py-12 border-t border-border bg-white">
            <div className="space-y-6">
              {/* Heading with inline Community Score */}
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-foreground">What <span className="text-primary">People Say</span></h2>
                <CommunityScore 
                  averageRating={averageRating}
                  totalRatings={totalRatings}
                />
              </div>

              {/* Add Comment Form - Always visible */}
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Share Your Thoughts</h3>
                <AddCommentForm 
                  dishId={dish.id}
                  dishName={dish.name}
                />
              </div>

              {/* Comments List */}
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Community Comments {dish.reviews.length > 0 && `(${dish.reviews.length})`}
                </h3>
                <ReviewList
                  reviews={dish.reviews.map(review => ({
                    id: review.id,
                    rating: review.rating,
                    comment: review.comment,
                    createdAt: review.createdAt.toISOString(),
                    authorName: review.authorName,
                    user: review.user ? {
                      email: review.user.email,
                      name: review.user.name
                    } : null
                  }))}
                  averageRating={averageRating}
                  totalReviews={dish.reviews.length}
                  dishName={dish.name}
                />
              </div>
            </div>
          </section>

          {/* FAQ Section - Moved to bottom */}
          {dish.faqAnswers && Array.isArray(dish.faqAnswers) && dish.faqAnswers.length > 0 && (
            <section className="py-12 border-t border-border">
              <h2 className="text-3xl font-bold text-foreground mb-8">Frequently Asked <span className="text-primary">Questions</span></h2>
              <div className="space-y-8">
                {(dish.faqAnswers as any[]).map((faq: any, index: number) => (
                  <div key={index} className="space-y-3">
                    <h3 className="text-xl font-bold text-foreground">
                      {faq.question}
                    </h3>
                    <div 
                      className="text-base text-foreground/80 leading-relaxed prose prose-rose max-w-none"
                      dangerouslySetInnerHTML={{ __html: faq.answer }}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </article>
      </div>
    </>
  )
}


