import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - BestDish',
  description: 'BestDish privacy policy: how we collect, use and protect your information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link href="/" className="text-primary hover:underline text-sm mb-8 inline-block">
          ← Back to BestDish
        </Link>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/70 text-sm mb-12">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Who we are</h2>
            <p className="text-white/80">
              BestDish (&quot;we&quot;, &quot;our&quot;) is a food discovery website that helps people find the best dishes at restaurants. We operate at bestdish.co.uk (and related domains). When you use our site or interact with our Instagram account, this policy applies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information we collect</h2>
            <p className="text-white/80 mb-2">We may collect:</p>
            <ul className="list-disc pl-6 text-white/80 space-y-1">
              <li><strong>Usage data:</strong> pages you visit, device type, and general location (e.g. city) to improve the site.</li>
              <li><strong>Account data:</strong> if you sign in (e.g. for admin), we store the identifiers needed to run the service.</li>
              <li><strong>Public content:</strong> dish and restaurant information we curate or scrape from public sources (menus, reviews, articles). We do not collect or store your personal content from third-party platforms except where you give it to us (e.g. when you submit a dish or review).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How we use it</h2>
            <p className="text-white/80">
              We use the information to run and improve BestDish: to show you dishes and restaurants, to publish curated content to our own BestDish Instagram account, to moderate content, and to fix issues. We do not sell your personal data. We may use cookies and similar technologies for essential operation and analytics.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Instagram and third-party services</h2>
            <p className="text-white/80">
              We use Meta’s Instagram Graph API to post content to our official BestDish Instagram account. Only our team can publish; we do not let third-party users post through our app. Our use of Instagram is subject to Meta’s terms and data policies. We may use other third-party services (e.g. hosting, analytics); their privacy policies apply to their processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data retention and security</h2>
            <p className="text-white/80">
              We keep data only as long as needed to run the service and meet legal obligations. We use industry-standard measures to protect data; no system is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your rights</h2>
            <p className="text-white/80">
              Depending on where you live, you may have rights to access, correct, delete, or restrict use of your personal data, or to object to processing. To exercise these or ask questions, contact us using the details below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Changes</h2>
            <p className="text-white/80">
              We may update this policy from time to time. The &quot;Last updated&quot; date at the top will change when we do. Continued use of the site after changes means you accept the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Contact</h2>
            <p className="text-white/80">
              For privacy-related questions or requests, contact us at the email or address listed on our website or in the Meta App Dashboard for the BestDish app.
            </p>
          </section>
        </div>

        <p className="mt-12 text-white/60 text-sm">
          © {new Date().getFullYear()} BestDish. All rights reserved.
        </p>
      </div>
    </div>
  )
}
