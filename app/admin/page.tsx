import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, CheckCircle, Users, TrendingUp, MapPin } from 'lucide-react'

// Force dynamic rendering - don't try to generate at build time
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  // Get stats
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
  const featuredDishes = await prisma.dish.count({
    where: { isFeatured: true }
  })
  const totalCities = await prisma.city.count()

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-gray-400 text-lg">
            Welcome back! Here's what's happening with BestDish today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Cities */}
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Cities</p>
                  <p className="text-3xl font-bold text-gray-100">{totalCities}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <MapPin className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Dishes */}
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Total Dishes</p>
                  <p className="text-3xl font-bold text-gray-100">{totalDishes}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Reviews */}
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Total Reviews</p>
                  <p className="text-3xl font-bold text-gray-100">{totalReviews}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Reviews */}
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Pending Reviews</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-100">{pendingReviews}</p>
                    {pendingReviews > 0 && (
                      <span className="text-xs font-medium text-yellow-400 px-2 py-0.5 bg-yellow-500/10 rounded-full">
                        Action needed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Dishes */}
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Pending Images</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-100">{pendingDishes}</p>
                    {pendingDishes > 0 && (
                      <span className="text-xs font-medium text-orange-400 px-2 py-0.5 bg-orange-500/10 rounded-full">
                        Upload needed
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <Clock className="h-6 w-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Featured Dishes */}
          <Card className="rounded-2xl shadow-lg bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">Featured Dishes</p>
                  <p className="text-3xl font-bold text-gray-100">{featuredDishes}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <TrendingUp className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-gray-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pendingReviews > 0 && (
              <a
                href="/admin/pending-reviews"
                className="block p-6 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <Clock className="h-8 w-8 text-yellow-400" />
                  <div>
                    <p className="text-lg font-semibold text-gray-100 group-hover:text-yellow-400 transition-colors">
                      Moderate {pendingReviews} Review{pendingReviews !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-400">User comments waiting for approval</p>
                  </div>
                </div>
              </a>
            )}
            {pendingDishes > 0 && (
              <a
                href="/admin/pending-dishes"
                className="block p-6 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <Clock className="h-8 w-8 text-orange-400" />
                  <div>
                    <p className="text-lg font-semibold text-gray-100 group-hover:text-orange-400 transition-colors">
                      Upload {pendingDishes} Photo{pendingDishes !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-400">Dishes need images before publishing</p>
                  </div>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

