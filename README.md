# BestDish 🍽️

A beautifully designed, SEO-optimized food discovery platform where users can find the best dishes in each city, leave reviews, and see what's trending.

## 🌟 Features

- **City-based Restaurant Discovery**: Browse restaurants by city with beautiful editorial design
- **Dish-level Reviews**: Focus on individual dishes rather than just restaurants
- **User Authentication**: Google OAuth integration via Supabase Auth
- **Photo Uploads**: Users can upload photos with their reviews
- **Review Moderation**: Admin panel for approving/rejecting reviews
- **SEO Optimized**: Complete Schema.org markup, dynamic sitemaps, and meta tags
- **Data Scraping**: Automated restaurant data collection via Google Places API
- **Instagram Automation**: API endpoint for automated social media posting

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: TailwindCSS + Shadcn/UI (dark editorial theme)
- **Database**: Supabase (Postgres + Prisma ORM)
- **Auth**: Supabase Auth with Google OAuth
- **Storage**: Supabase Storage for user-uploaded photos
- **Data Source**: Google Places API for restaurant data
- **Deployment**: Vercel + Supabase

## 🚀 Quick Start

### 1. Environment Setup

Create a `.env.local` file with the following variables:

```bash
# Database
DATABASE_URL="your-supabase-database-url"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Google Places API (for scraping)
GOOGLE_PLACES_API_KEY="your-google-places-api-key"

# Admin Secrets
SCRAPER_ADMIN_SECRET="your-admin-secret"
VERCEL_ADMIN_SECRET="your-vercel-admin-secret"

# Site Configuration
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed initial cities
npm run db:seed-cities
```

### 4. Scrape Restaurant Data

```bash
# Scrape restaurants from Google Places API
npm run scrape-restaurants
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your app!

## 📁 Project Structure

```
bestdish/
├── app/                          # Next.js App Router
│   ├── [city]/                   # Dynamic city pages
│   │   ├── page.tsx             # City listing page
│   │   └── [restaurant]/        # Dynamic restaurant pages
│   │       ├── page.tsx         # Restaurant detail page
│   │       └── [dish]/          # Dynamic dish pages
│   │           └── page.tsx     # Dish detail page
│   ├── admin/                   # Admin pages
│   │   └── pending-reviews/     # Review moderation
│   ├── api/                     # API routes
│   │   ├── reviews/             # Review submission
│   │   ├── trigger-scrape/      # Manual scraping trigger
│   │   ├── dish-of-the-day/     # Instagram automation
│   │   ├── sitemap.xml/         # Dynamic sitemap
│   │   └── robots.txt/          # Robots.txt
│   └── login/                   # Authentication
├── components/                   # React components
│   ├── ui/                      # Shadcn/UI components
│   ├── AddReviewForm.tsx        # Review submission form
│   ├── ReviewCard.tsx           # Individual review display
│   └── ReviewList.tsx           # Review listing
├── lib/                         # Utilities
│   ├── prisma.ts               # Database client
│   ├── supabaseClient.ts       # Client-side Supabase
│   ├── supabaseAdmin.ts        # Server-side Supabase
│   ├── seo.ts                  # SEO utilities
│   └── imageUrl.ts             # Image handling
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seeding
└── scripts/                    # Utility scripts
    ├── scrape-restaurants.ts   # Restaurant scraper
    └── seed-cities.ts          # City seeding
```

## 🗄️ Database Schema

The app uses the following main models:

- **City**: Contains city information and restaurant listings
- **Restaurant**: Restaurant details with Google Places integration
- **Dish**: Individual dishes with reviews and ratings
- **Review**: User reviews with photo uploads and moderation
- **User**: User accounts from Supabase Auth

## 🔧 Available Scripts

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server

# Database
npm run db:push            # Push schema changes
npm run db:generate        # Generate Prisma client
npm run db:seed            # Seed initial data
npm run db:seed-cities     # Seed cities only

# Data Management
npm run scrape-restaurants # Scrape restaurant data
```

## 🌐 API Endpoints

### Public Endpoints

- `GET /api/reviews?dishId=xxx&approved=true` - Get reviews for a dish
- `POST /api/reviews` - Submit a new review
- `GET /api/dish-of-the-day` - Get random high-rated dish for social media
- `GET /api/sitemap.xml` - Dynamic sitemap generation
- `GET /api/robots.txt` - Robots.txt file

### Admin Endpoints

- `POST /api/trigger-scrape` - Trigger restaurant scraping (requires admin secret)
- `POST /api/reviews/approve` - Approve/reject reviews (requires admin secret)

## 🎨 Design System

The app uses a dark editorial theme inspired by premium food publications:

- **Colors**: Deep grays, indigo accents, amber ratings
- **Typography**: Clean, readable fonts with proper hierarchy
- **Components**: Rounded corners (2xl), soft shadows, backdrop blur effects
- **Layout**: Grid-based with masonry-style restaurant cards

## 📱 SEO Features

- **Schema.org Markup**: Complete JSON-LD for all page types
- **Dynamic Meta Tags**: Title, description, OG tags, Twitter cards
- **Breadcrumbs**: Structured navigation with Schema.org markup
- **Sitemap**: Auto-generated from database content
- **Static Generation**: Pre-rendered pages for optimal performance

## 🔐 Authentication & Security

- **OAuth Integration**: Google sign-in via Supabase Auth
- **Admin Protection**: Secret-based admin endpoints
- **Photo Upload Security**: Secure storage with pending/approved workflow
- **Review Moderation**: All reviews require admin approval

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Supabase Setup

1. Create a new Supabase project
2. Enable Google OAuth provider
3. Create `dish-photos` storage bucket
4. Set up Row Level Security policies

## 📊 Data Sources

The app uses Google Places API to populate restaurant data:

- **Search**: Text search for restaurants by city
- **Details**: Comprehensive restaurant information
- **Photos**: Restaurant and dish imagery
- **Reviews**: Google ratings and user counts

## 🔮 Future Enhancements

- **Voting System**: Reddit-style upvote/downvote for dishes
- **Social Features**: User profiles and following
- **Map Integration**: Google Maps for restaurant locations
- **Menu Scraping**: Automated menu item extraction
- **Instagram Automation**: Automated social media posting via n8n
- **Mobile App**: React Native companion app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email hello@bestdish.co.uk or create an issue in the repository.

---

Built with ❤️ for food lovers everywhere.