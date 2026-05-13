"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { API_BASE } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { FALLBACK_IMAGE, type ApiProduct } from "@/lib/useProducts";
import { flyToCart } from "@/lib/flyToCart";
import type { Product } from "@/data/products";

const CACHE_KEY    = "nexora_products_cache";

function readCache(): ApiProduct[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    // Reuse the same cache the shop uses — TTL already handled there
    return Array.isArray(entry.data) ? entry.data : null;
  } catch { return null; }
}

function apiToProduct(p: ApiProduct): Product {
  return {
    id:            String(p.id),
    dbId:          p.id,
    name:          p.name,
    category:      p.category as never,
    price:         p.price,
    originalPrice: undefined,
    image:         p.imageUrl?.startsWith("http") ? p.imageUrl : (p.imageUrl ? `${API_BASE}${p.imageUrl}` : FALLBACK_IMAGE),
    description:   p.description ?? "",
    badge:         p.badge ?? undefined,
    stock:         p.stockQuantity,
    rating:        p.rating,
    reviews:       p.reviews,
    specs:         {},
  };
}

export default function FeaturedSection() {
  const { addToCart }  = useCart();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [added,    setAdded]    = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // ── 1. Show cache immediately ──────────────────────────────
      const cached = readCache();
      if (cached && cached.length > 0) {
        const sorted = [...cached].sort((a, b) => {
          if (a.badge && !b.badge) return -1;
          if (!a.badge && b.badge) return 1;
          return b.stockQuantity - a.stockQuantity;
        });
        setFeatured(sorted.slice(0, 4).map(apiToProduct));
      }

      // ── 2. Try live API ────────────────────────────────────────
      try {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${API_BASE}/api/products`, {
          credentials: "include",
          signal:       controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) return;
        const ps: ApiProduct[] = await res.json();
        const sorted = [...ps].sort((a, b) => {
          if (a.badge && !b.badge) return -1;
          if (!a.badge && b.badge) return 1;
          return b.stockQuantity - a.stockQuantity;
        });
        setFeatured(sorted.slice(0, 4).map(apiToProduct));
      } catch {
        // Live API failed — cached result above is already shown, nothing more to do
      }
    }
    load();
  }, []);

  if (featured.length === 0) return null;

  const handleAdd = (product: Product, btn: HTMLButtonElement) => {
    if (product.stock === 0) return;
    addToCart(product, 1);
    setAdded(product.id);
    flyToCart(btn, product.image);
    setTimeout(() => setAdded(null), 1800);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Featured Products</h2>
        <Link href="/shop" className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1">
          See all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {featured.map((product) => (
          <div key={product.id} className="group border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all bg-white">
            <Link href={`/shop/${product.id}`}>
              <div className="relative aspect-square bg-gray-50 overflow-hidden">
                <Image
                  src={product.image} alt={product.name} fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, 25vw"
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                />
                {product.badge && (
                  <span className={`absolute top-2.5 left-2.5 text-white text-[10px] font-semibold px-2 py-1 rounded-full ${
                    product.badge === "Out of Stock" ? "bg-red-500" :
                    product.badge === "Low Stock"    ? "bg-orange-500" : "bg-gray-900"
                  }`}>
                    {product.badge}
                  </span>
                )}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="text-xs font-semibold text-gray-500">Out of Stock</span>
                  </div>
                )}
              </div>
            </Link>
            <div className="p-3.5">
              <Link href={`/shop/${product.id}`}>
                <p className="text-xs font-medium text-gray-900 line-clamp-2 mb-1 hover:underline">{product.name}</p>
              </Link>
              <p className="text-sm font-semibold text-gray-900 mb-3">{formatCurrency(product.price)}</p>
              <button
                onClick={(e) => handleAdd(product, e.currentTarget)}
                disabled={product.stock === 0}
                className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                  added === product.id
                    ? "bg-green-600 text-white"
                    : product.stock === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-900 text-white hover:bg-gray-700"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {added === product.id ? "Added!" : product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
