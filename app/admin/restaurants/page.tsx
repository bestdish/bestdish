import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, MapPin, Store, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { getPublicImageUrl } from '@/lib/imageUrl'

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

  const totalRestaurants = restaurants.length
  const totalChains = restaurants.filter(r => r.isChain).length
  const totalIndependent = restaurants.filter(r => !r.isChain).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-100">Restaurant Management</h1>
            <p className="text-gray-400 text-lg mt-2">
              Manage restaurants and their best dishes
            </p>
          </div>
          
          <Link href="/admin/restaurants/new">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-6">
              <Plus className="h-5 w-5 mr-2" />
              Add Restaurant
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-900/50 rounded-xl border border-indigo-600/30">
                  <Store className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-100">{totalRestaurants}</p>
                  <p className="text-sm text-gray-400">Total Restaurants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-900/50 rounded-xl border border-purple-600/30">
                  <MapPin className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-100">{totalIndependent}</p>
                  <p className="text-sm text-gray-400">Independent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-900/50 rounded-xl border border-amber-600/30">
                  <Store className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-100">{totalChains}</p>
                  <p className="text-sm text-gray-400">Chain Locations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Restaurants by City */}
        <div className="space-y-8">
          {Object.entries(restaurantsByCity).map(([cityName, cityRestaurants]) => (
            <div key={cityName} className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-indigo-400" />
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
                                  {restaurant.isChain && (
                                    <span className="px-2 py-1 bg-amber-600/20 border border-amber-600/30 rounded-lg text-xs text-amber-400 font-medium">
                                      Chain
                                    </span>
                                  )}
                                </div>
                                
                                {bestDish && (
                                  <p className="text-sm text-gray-400 mb-2">
                                    Best Dish: <span className="text-indigo-400 font-medium">{bestDish.name}</span>
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
                                <Button variant="outline" className="bg-gray-700 hover:bg-gray-600 border-gray-600">
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
          ))}
        </div>
      </div>
    </div>
  )
}

