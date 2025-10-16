import { getPublicImageUrl } from './imageUrl'

/**
 * Generate slug from string (URL-safe)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generate Schema.org JSON-LD for City page
 */
export function generateCitySchema(city: {
  name: string
  slug: string
  description?: string | null
  restaurants: Array<{
    id: string
    name: string
    slug: string
    rating?: number | null
    cuisine?: string | null
  }>
}) {
  return {
    "@context": "https://schema.org",
    "@type": "City",
    "name": city.name,
    "description": city.description || `Discover the best restaurants in ${city.name}`,
    "url": `${process.env.NEXT_PUBLIC_SITE_URL}/${city.slug}`,
    "hasPart": city.restaurants.map(restaurant => ({
      "@type": "Restaurant",
      "name": restaurant.name,
      "url": `${process.env.NEXT_PUBLIC_SITE_URL}/${city.slug}/${restaurant.slug}`,
      "aggregateRating": restaurant.rating ? {
        "@type": "AggregateRating",
        "ratingValue": restaurant.rating.toString(),
        "bestRating": "5",
        "worstRating": "1"
      } : undefined,
      "servesCuisine": restaurant.cuisine || undefined
    }))
  }
}

/**
 * Generate Schema.org JSON-LD for Restaurant page
 */
export function generateRestaurantSchema(restaurant: {
  id: string
  name: string
  slug: string
  description?: string | null
  address?: string | null
  cuisine?: string | null
  rating?: number | null
  priceRange?: string | null
  phone?: string | null
  website?: string | null
  photoUrl?: string | null
  city: {
    name: string
    slug: string
  }
  dishes: Array<{
    id: string
    name: string
    slug: string
    description?: string | null
    price?: number | null
    photoUrl?: string | null
  }>
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  const restaurantUrl = `${baseUrl}/${restaurant.city.slug}/${restaurant.slug}`
  
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": restaurant.name,
    "description": restaurant.description || `${restaurant.name} in ${restaurant.city.name}`,
    "url": restaurantUrl,
    "address": restaurant.address ? {
      "@type": "PostalAddress",
      "streetAddress": restaurant.address,
      "addressLocality": restaurant.city.name
    } : undefined,
    "telephone": restaurant.phone || undefined,
    "website": restaurant.website || undefined,
    "servesCuisine": restaurant.cuisine || undefined,
    "priceRange": restaurant.priceRange || undefined,
    "image": restaurant.photoUrl ? getPublicImageUrl('dish-photos', restaurant.photoUrl) : undefined,
    "aggregateRating": restaurant.rating ? {
      "@type": "AggregateRating",
      "ratingValue": restaurant.rating.toString(),
      "bestRating": "5",
      "worstRating": "1"
    } : undefined,
    "hasMenu": {
      "@type": "Menu",
      "hasMenuSection": [{
        "@type": "MenuSection",
        "name": "Main Dishes",
        "hasMenuItem": restaurant.dishes.map(dish => ({
          "@type": "MenuItem",
          "name": dish.name,
          "description": dish.description || undefined,
          "image": dish.photoUrl ? getPublicImageUrl('dish-photos', dish.photoUrl) : undefined,
          "url": `${restaurantUrl}/${dish.slug}`,
          "offers": dish.price ? {
            "@type": "Offer",
            "priceCurrency": "GBP",
            "price": dish.price.toString()
          } : undefined
        }))
      }]
    }
  }
}

/**
 * Generate Schema.org JSON-LD for Dish page
 */
export function generateDishSchema(dish: {
  id: string
  name: string
  slug: string
  description?: string | null
  price?: number | null
  photoUrl?: string | null
  restaurant: {
    name: string
    slug: string
    address?: string | null
    city: {
      name: string
      slug: string
    }
  }
  reviews: Array<{
    id: string
    rating: number
    comment?: string | null
    createdAt: string
    user: {
      name?: string | null
      email: string
    }
  }>
  averageRating: number
  reviewCount: number
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  const dishUrl = `${baseUrl}/${dish.restaurant.city.slug}/${dish.restaurant.slug}/${dish.slug}`
  
  return {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    "name": dish.name,
    "description": dish.description || `${dish.name} at ${dish.restaurant.name}`,
    "image": dish.photoUrl ? getPublicImageUrl('dish-photos', dish.photoUrl) : undefined,
    "url": dishUrl,
    "offers": dish.price ? {
      "@type": "Offer",
      "priceCurrency": "GBP",
      "price": dish.price.toString(),
      "availability": "https://schema.org/InStock"
    } : undefined,
    "menuAddOn": {
      "@type": "Menu",
      "provider": {
        "@type": "Restaurant",
        "name": dish.restaurant.name,
        "address": dish.restaurant.address ? {
          "@type": "PostalAddress",
          "streetAddress": dish.restaurant.address,
          "addressLocality": dish.restaurant.city.name
        } : undefined
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": dish.averageRating.toString(),
      "reviewCount": dish.reviewCount.toString(),
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": dish.reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.user.name || review.user.email.split('@')[0]
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating.toString(),
        "bestRating": "5",
        "worstRating": "1"
      },
      "reviewBody": review.comment || undefined,
      "datePublished": new Date(review.createdAt).toISOString()
    }))
  }
}

/**
 * Generate breadcrumb JSON-LD
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{
  name: string
  url: string
}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  }
}

/**
 * Generate meta tags for pages
 */
export function generateMetaTags({
  title,
  description,
  url,
  image,
  type = 'website'
}: {
  title: string
  description: string
  url: string
  image?: string
  type?: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'BestDish',
      images: image ? [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ] : [],
      locale: 'en_GB',
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: url,
    },
  }
}


