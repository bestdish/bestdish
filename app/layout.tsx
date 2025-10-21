import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'sonner'
import Link from 'next/link'
import "./globals.css";
import Navigation from '@/components/Navigation'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BestDish - Discover the Best Dishes in Every City",
  description: "Find the top-rated dishes, read authentic reviews, and discover hidden culinary gems in cities across the UK.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation />

        {children}
        
        {/* Footer */}
        <footer className="bg-black border-t border-white/10 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1">
                <Link href="/" className="text-xl font-bold" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                  <span className="text-primary">Best</span><span className="text-white">Dish</span><sup className="text-xs text-white">™</sup>
                </Link>
                <p className="mt-2 text-sm text-white/70">
                  Discover the best dishes across the UK
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-3" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Explore</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li><Link href="/" className="hover:text-primary" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Home</Link></li>
                  <li><Link href="/nationwide" className="hover:text-primary" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Nationwide Chains</Link></li>
                  <li><Link href="/manchester" className="hover:text-primary" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Manchester</Link></li>
                  <li><Link href="/london" className="hover:text-primary" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>London</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-3" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Company</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li><Link href="/login" className="hover:text-primary" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Sign In</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-white mb-3" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Legal</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li><Link href="#" className="hover:text-primary" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Privacy</Link></li>
                  <li><Link href="#" className="hover:text-primary" style={{ fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Terms</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/70">
              © {new Date().getFullYear()} BestDish™. All rights reserved.
            </div>
          </div>
        </footer>
        
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
