import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Store, Clock, CheckCircle, Users, MapPin, Star } from 'lucide-react'
import Link from 'next/link'

export default async function AdminDashboard() {
  // Get stats
  const totalRestaurants = await prisma.restaurant.count()
  const totalDishes = await prisma.dish.count()
  const pendingReviews = await prisma.review.count({
    where: { approved: false }
  })
  const totalReviews = await prisma.review.count()
  const pendingDishes = await prisma.dish.count({
    where: {
      isBest: false,
      description: { not: null }
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-100">Admin Dashboard</h1>
          <p className="text-gray-400 text-lg">
            Manage BestDish content and reviews
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-900/50 rounded-xl border border-indigo-600/30">
                  <Store className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-100">{totalRestaurants}</p>
                  <p className="text-sm text-gray-400">Restaurants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-900/50 rounded-xl border border-purple-600/30">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-100">{totalDishes}</p>
                  <p className="text-sm text-gray-400">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-900/50 rounded-xl border border-orange-600/30">
                  <Clock className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-100">{pendingDishes}</p>
                  <p className="text-sm text-gray-400">Pending Images</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-900/50 rounded-xl border border-yellow-600/30">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-100">{pendingReviews}</p>
                  <p className="text-sm text-gray-400">Pending Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-900/50 rounded-xl border border-green-600/30">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-100">{totalReviews}</p>
                  <p className="text-sm text-gray-400">Total Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/admin/cities">
            <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-600/20 rounded-xl border border-blue-600/30 inline-block">
                    <MapPin className="h-8 w-8 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-100 group-hover:text-blue-400 transition-colors mb-2">
                      City Management
                    </h2>
                    <p className="text-gray-400">
                      Edit city photos and details for the homepage
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/restaurants">
            <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-600/20 rounded-xl border border-indigo-600/30 inline-block">
                    <Store className="h-8 w-8 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-100 group-hover:text-indigo-400 transition-colors mb-2">
                      Restaurant Management
                    </h2>
                    <p className="text-gray-400">
                      Add, edit, and manage restaurants and their best dishes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/pending-reviews">
            <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-600/20 rounded-xl border border-yellow-600/30 inline-block">
                    <Clock className="h-8 w-8 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-100 group-hover:text-yellow-400 transition-colors mb-2">
                      Review Moderation
                    </h2>
                    <p className="text-gray-400">
                      Approve or reject pending user reviews
                    </p>
                  </div>
                  {pendingReviews > 0 && (
                    <div className="inline-block px-3 py-1 bg-yellow-600/20 border border-yellow-600/30 rounded-full">
                      <span className="text-yellow-400 font-medium">{pendingReviews} pending</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/featured-dishes">
            <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="p-4 bg-amber-600/20 rounded-xl border border-amber-600/30 inline-block">
                    <Star className="h-8 w-8 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-100 group-hover:text-amber-400 transition-colors mb-2">
                      Featured Dishes
                    </h2>
                    <p className="text-gray-400">
                      Manage featured dishes on homepage
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/pending-dishes">
            <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all cursor-pointer group">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="p-4 bg-orange-600/20 rounded-xl border border-orange-600/30 inline-block">
                    <Clock className="h-8 w-8 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-100 group-hover:text-orange-400 transition-colors mb-2">
                      Pending Dishes
                    </h2>
                    <p className="text-gray-400">
                      Review dishes awaiting photos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

