import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Truck, RefreshCw, Headphones } from "lucide-react";
import { products, categories } from "@/data/products";
import FeaturedSection from "@/components/ui/FeaturedSection";

export const metadata = {
  title: "Nexora — Electronics & Accessories",
  description: "Shop premium electronics and accessories. Fast shipping, easy returns, real-time tracking.",
};


const perks = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over ₱2,000" },
  { icon: ShieldCheck, title: "Authentic Products", desc: "100% genuine items" },
  { icon: RefreshCw, title: "Easy Returns", desc: "30-day return window" },
  { icon: Headphones, title: "24/7 Support", desc: "Always here to help" },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gray-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1600&q=80"
            alt="Electronics background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 md:py-40">
          <div className="max-w-xl">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
              Electronics & Accessories
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight mb-6">
              The tech you need,
              <br />
              delivered fast.
            </h1>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Premium electronics and accessories with real-time order tracking and hassle-free returns.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
              >
                Shop Now <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 border border-gray-700 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:border-gray-500 transition-colors"
              >
                Track My Order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Perks Bar */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Browse Categories</h2>
            <p className="text-sm text-gray-400 mt-1">Find exactly what you&apos;re looking for</p>
          </div>
          <Link
            href="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 px-4 py-2 rounded-xl hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            All Products <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="group flex flex-col items-center gap-2 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200 text-center"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 leading-snug">
                {cat.name}
              </span>
              <span className="text-xs text-gray-400 mb-1">{cat.count} items</span>
              <Link
                href={`/shop?category=${encodeURIComponent(cat.name)}`}
                className="text-[11px] font-semibold text-white bg-gray-900 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 hover:bg-gray-700"
              >
                Shop Now
              </Link>
            </div>
          ))}
        </div>
        {/* Mobile: visible Shop All button */}
        <div className="mt-5 sm:hidden text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 px-5 py-2.5 rounded-xl hover:border-gray-400 transition-colors"
          >
            Shop All Products <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      <FeaturedSection />

      {/* Banner CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gray-950 rounded-3xl px-8 py-14 md:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
              Real-time order tracking
            </h2>
            <p className="text-gray-400 text-sm md:text-base">
              Know exactly where your order is — from our warehouse to your door.
            </p>
          </div>
          <Link
            href="/track"
            className="flex-shrink-0 inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            Track Your Order <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
