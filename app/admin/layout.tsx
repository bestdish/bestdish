'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Utensils, 
  MapPin, 
  MessageSquare, 
  Star, 
  Clock,
  Sparkles,
  Menu,
  X
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Curated Dish Tool', href: '/admin/curated-dish', icon: Sparkles },
  { name: 'Dish Management', href: '/admin/restaurants', icon: Utensils },
  { name: 'City Management', href: '/admin/cities', icon: MapPin },
  { name: 'Review Moderation', href: '/admin/pending-reviews', icon: MessageSquare },
  { name: 'Featured Dishes', href: '/admin/featured-dishes', icon: Star },
  { name: 'Pending Dishes', href: '/admin/pending-dishes', icon: Clock },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar - hidden on mobile unless open, always visible on md+ */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-screen w-64 max-w-[85vw] border-r border-gray-800 bg-gray-900
          transform transition-transform duration-200 ease-out
          md:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo/Brand + Close button on mobile */}
          <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4 md:px-6">
            <Link href="/admin" className="flex items-center gap-2" onClick={closeSidebar}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                <Utensils className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-100">BestDish</span>
            </Link>
            <button
              type="button"
              onClick={closeSidebar}
              className="md:hidden p-2 -m-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className={`
                      flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                      ${
                        active
                          ? 'bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/20'
                          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-cyan-400' : ''}`} />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center gap-3 rounded-xl bg-gray-800/50 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-semibold text-white flex-shrink-0">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">Admin</p>
                <p className="text-xs text-gray-500 truncate">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content - full width on mobile, with margin on desktop */}
      <main className="flex-1 min-w-0 md:ml-64">
        {/* Mobile header with hamburger */}
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-gray-800 bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-gray-950/80 px-4 md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 -m-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Utensils className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-100">BestDish Admin</span>
          </Link>
        </div>
        {children}
      </main>
    </div>
  )
}

