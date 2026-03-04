import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, MapPin, Image as ImageIcon, Users } from 'lucide-react'
import Link from 'next/link'
import { getPublicImageUrl } from '@/lib/imageUrl'

export const dynamic = 'force-dynamic'

export default async function AdminRestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({
    include: {
      city: true,
      dishes: {
        where: { isBest: true },
        take: 1
      }
    },
    orderBy: [
      { city: { name: 'asc' } },
      { name: 'asc' }
    ]
  })

  // Group by city
  const restaurantsByCity = restaurants.reduce((acc, restaurant) => {
    const cityName = restaurant.city.name
    if (!acc[cityName]) {
      acc[cityName] = []
    }
    acc[cityName].push(restaurant)
    return acc
  }, {} as Record<string, typeof restaurants>)

  const totalDishes = restaurants.reduce((sum, r) => sum + r.dishes.length, 0)

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-100">Dish Management</h1>
          <p className="text-gray-400 text-lg">
            View and manage all curated dishes by city
          </p>
        </div>

        {/* Stats */}
        <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-400">Total Curated Dishes</p>
                <p className="text-3xl font-bold text-gray-100">{totalDishes}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurants by City */}
        <div className="space-y-8">
          {restaurants.length === 0 ? (
            <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
              <CardContent className="p-12 text-center">
                <ImageIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-100 mb-2">No Dishes Yet</h3>
                <p className="text-gray-400 mb-6">
                  Start building your curated dish library using the Curated Dish Tool
                </p>
                <Link href="/admin/curated-dish">
                  <Button className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl">
                    Create Your First Dish
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            Object.entries(restaurantsByCity).map(([cityName, cityRestaurants]) => (
            <div key={cityName} className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-cyan-400" />
                {cityName}
                <span className="text-sm font-normal text-gray-400 ml-2">
                  ({cityRestaurants.length} {cityRestaurants.length === 1 ? 'restaurant' : 'restaurants'})
                </span>
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {cityRestaurants.map((restaurant) => {
                  const bestDish = restaurant.dishes[0]
                  
                  return (
                    <Card key={restaurant.id} className="rounded-xl shadow-lg bg-gray-800/50 border-gray-700">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-6">
                          {/* Restaurant/Dish Photo */}
                          <div className="flex-shrink-0">
                            {(() => {
                              const photoUrl = bestDish?.photoUrl
                                ? (bestDish.photoUrl.startsWith('http') ? bestDish.photoUrl : getPublicImageUrl('dish-photos', bestDish.photoUrl))
                                : restaurant.photoUrl
                              
                              return photoUrl ? (
                                <img
                                  src={photoUrl}
                                  alt={restaurant.name}
                                  className="w-32 h-32 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-gray-500" />
                                </div>
                              )
                            })()}
                          </div>

                          {/* Restaurant Details */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-xl font-bold text-gray-100">
                                    {restaurant.name}
                                  </h3>
                                </div>
                                
                                {bestDish && (
                                  <p className="text-sm text-gray-400 mb-2">
                                    Best Dish: <span className="text-cyan-400 font-medium">{bestDish.name}</span>
                                  </p>
                                )}

                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                  {restaurant.cuisine && (
                                    <span className="px-2 py-1 bg-gray-700 rounded-lg">
                                      {restaurant.cuisine}
                                    </span>
                                  )}
                                  {restaurant.priceRange && (
                                    <span>{restaurant.priceRange}</span>
                                  )}
                                </div>
                              </div>

                              <Link href={`/admin/restaurants/${restaurant.id}`}>
                                <Button className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                              </Link>
                            </div>

                            {restaurant.address && (
                              <div className="flex items-start gap-2 text-sm text-gray-400">
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{restaurant.address}</span>
                              </div>
                            )}

                            {bestDish?.description && (
                              <p className="text-sm text-gray-400 line-clamp-2">
                                {bestDish.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  )
}

