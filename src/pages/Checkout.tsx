/**
 * ALAYA INSIDER — Checkout (Not Used)
 * --------------------------------------------------------------------------
 * ALAYA INSIDER is an affiliate-only platform.
 * No direct checkout, payments, or order processing occurs here.
 * Users compare prices and are redirected to trusted merchant websites
 * (Amazon, Walmart, Best Buy, etc.) to complete their purchase.
 *
 * This page redirects to the compare page or provides information
 * about how the affiliate model works.
 */

import { Link } from "react-router-dom";
import { ExternalLink, ArrowRight, Search, Handshake } from "lucide-react";
import { Seo } from "../components/Seo";
import { Breadcrumbs } from "../components/ui";

export default function Checkout() {
  return (
    <>
      <Seo title="How ALAYA INSIDER Works" path="/checkout" />
      <div className="container-edge py-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "How We Work" }]} />
      </div>

      <section className="container-edge pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent">
            <Handshake className="h-8 w-8" />
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold text-ink sm:text-5xl">
            We Compare. You Choose.
          </h1>
          <p className="mt-4 text-lg text-muted text-balance">
            ALAYA INSIDER is an affiliate-only platform. We research, compare, and recommend the best products
            from trusted merchants. When you click a link and make a purchase, we may earn a commission —
            at no extra cost to you.
          </p>

          <div className="mt-10 grid gap-6 text-left sm:grid-cols-3">
            <div className="card p-5 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
                <Search className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">1. Compare</h3>
              <p className="mt-2 text-sm text-muted">Browse our editorial reviews and compare prices across multiple merchants.</p>
            </div>
            <div className="card p-5 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
                <ExternalLink className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">2. Choose</h3>
              <p className="mt-2 text-sm text-muted">Select the best merchant for your needs — best price, fastest delivery, highest trust.</p>
            </div>
            <div className="card p-5 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent">
                <Handshake className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">3. Shop</h3>
              <p className="mt-2 text-sm text-muted">You're redirected to the merchant's website — Amazon, Walmart, Best Buy and more.</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/compare" className="btn-primary btn-lg">
              Compare Prices <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/shop" className="btn-outline btn-lg">
              Browse Products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
