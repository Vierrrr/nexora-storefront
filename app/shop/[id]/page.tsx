"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, ShoppingCart, ShieldCheck, Truck, Package, ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { API_BASE } from "@/lib/api";
import { FALLBACK_IMAGE, type ApiProduct } from "@/lib/useProducts";
import { flyToCart } from "@/lib/flyToCart";

// Map API product → CartContext Product shape
function toCartProduct(p: ApiProduct) {
  return {
    id:            String(p.id),
    dbId:          p.id,
    name:          p.name,
    category:      p.category as never,
    price:         p.price,
    originalPrice: p.originalPrice,
    image:         p.imageUrl || FALLBACK_IMAGE,
    description:   p.description || "",
    badge:         p.badge,
    stock:         p.stockQuantity,
    rating:        p.rating,
    reviews:       p.reviews,
    specs:         {} as Record<string, string | number>,
  };
}

// ── Image Carousel ────────────────────────────────────────────────
function ProductCarousel({ images, name }: { images: string[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const total = images.length;

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  if (total === 0) {
    return (
      <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden flex items-center justify-center">
        <span className="text-gray-300 text-sm">No image</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden group">
        <Image
          key={current}
          src={images[current]}
          alt={`${name} — image ${current + 1}`}
          fill
          className="object-cover transition-opacity duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={current === 0}
        />

        {total > 1 && (
          <>
            {/* Prev */}
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            {/* Next */}
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === current ? "bg-white w-4" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails strip (only if multiple images) */}
      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                i === current
                  ? "border-gray-900 opacity-100"
                  : "border-transparent opacity-60 hover:opacity-90"
              }`}
            >
              <Image src={src} alt={`Thumbnail ${i + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { addToCart } = useCart();

  const [product, setProduct]           = useState<ApiProduct | null>(null);
  const [related, setRelated]           = useState<ApiProduct[]>([]);
  const [loading, setLoading]           = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [qty, setQty]                   = useState(1);
  const [added, setAdded]               = useState(false);

  const CACHE_KEY = "nexora_products_cache";

  function readCachedProduct(productId: number): ApiProduct | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      const list: ApiProduct[] = entry.data ?? [];
      return list.find((p) => p.id === productId) ?? null;
    } catch { return null; }
  }

  useEffect(() => {
    const numericId = parseInt(id, 10);
    setLoading(true);

    async function load() {
      // ── 1. Try to show cached product immediately ────────────────
      const cached = readCachedProduct(numericId);
      if (cached) {
        setProduct(cached);
        setLoading(false); // show something right away
      }

      // ── 2. Fetch live from API ───────────────────────────────────
      try {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`${API_BASE}/api/products/${id}`, {
          credentials: "include",
          signal:       controller.signal,
        });
        clearTimeout(timeout);

        if (res.status === 404) {
          // Product genuinely not found (even in cache) → 404 page
          if (!cached) setNotFoundFlag(true);
          return;
        }
        if (!res.ok) throw new Error("fetch failed");
        const data: ApiProduct = await res.json();
        setProduct(data);

        // fetch related from same endpoint
        const allRes = await fetch(`${API_BASE}/api/products`, { credentials: "include" });
        if (allRes.ok) {
          const all: ApiProduct[] = await allRes.json();
          setRelated(all.filter((p) => p.category === data.category && p.id !== data.id).slice(0, 4));
        }
      } catch {
        // API unreachable — if we have a cached product just keep showing it,
        // otherwise try related from cache too
        if (!cached) setNotFoundFlag(true);
        try {
          const raw  = localStorage.getItem(CACHE_KEY);
          const all: ApiProduct[] = raw ? (JSON.parse(raw).data ?? []) : [];
          if (cached) {
            setRelated(all.filter((p) => p.category === cached.category && p.id !== cached.id).slice(0, 4));
          }
        } catch { /* ignore */ }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // Build the images array for the carousel
  // Priority: product.images[] (from multi-upload) → imageUrl (primary) → fallback
  function getCarouselImages(p: ApiProduct): string[] {
    const extras = p.images?.filter(Boolean) ?? [];
    const primary = p.imageUrl || "";
    // Deduplicate: put primary first, then extras (excluding primary if duplicate)
    if (extras.length > 0) {
      const unique = [primary, ...extras.filter(u => u !== primary)].filter(Boolean);
      return unique.length > 0 ? unique : [FALLBACK_IMAGE];
    }
    return primary ? [primary] : [FALLBACK_IMAGE];
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-5 w-32 bg-gray-100 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
          <div className="flex flex-col gap-4 pt-4">
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-1/4 bg-gray-200 rounded animate-pulse" />
            <div className="space-y-2 mt-4">
              <div className="h-3 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-4/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFoundFlag || !product) notFound();

  const isOut = product!.stockQuantity === 0;
  const carouselImages = getCarouselImages(product!);

  const handleAdd = (btn?: HTMLButtonElement) => {
    addToCart(toCartProduct(product!), qty);
    setAdded(true);
    if (btn) flyToCart(btn, product!.imageUrl || product!.images?.[0]);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* ── Image Carousel ── */}
        <ProductCarousel images={carouselImages} name={product!.name} />

        {/* ── Info Panel ── */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
            {product!.category}
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3 leading-tight">
            {product!.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(product!.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">{product!.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-400">({product!.reviews} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-semibold text-gray-900">
              {formatCurrency(product!.price)}
            </span>
            {product!.originalPrice && (
              <span className="text-base text-gray-400 line-through">
                {formatCurrency(product!.originalPrice)}
              </span>
            )}
          </div>

          {product!.description && (
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{product!.description}</p>
          )}

          {/* Stock */}
          <p className={`text-xs font-medium mb-5 ${isOut ? "text-red-500" : product!.stockQuantity <= 10 ? "text-orange-500" : "text-green-600"}`}>
            {isOut
              ? "Out of stock"
              : product!.stockQuantity <= 10
              ? `Only ${product!.stockQuantity} left in stock`
              : `${product!.stockQuantity} in stock`}
          </p>

          {product!.sku && (
            <p className="text-xs text-gray-400 mb-4">SKU: <span className="font-mono">{product!.sku}</span></p>
          )}

          {/* Qty */}
          {!isOut && (
            <div className="flex items-center gap-3 mb-5">
              <span className="text-sm text-gray-600">Qty:</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg">−</button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button onClick={() => setQty(Math.min(product!.stockQuantity, qty + 1))}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg">+</button>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={(e) => handleAdd(e.currentTarget)}
              disabled={isOut}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                added ? "bg-green-600 text-white" : "bg-gray-900 text-white hover:bg-gray-700"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ShoppingCart className="w-4 h-4" />
              {isOut ? "Out of Stock" : added ? "Added to Cart!" : "Add to Cart"}
            </button>
            <Link
              href="/checkout"
              className="flex-1 flex items-center justify-center py-3 px-6 rounded-xl text-sm font-semibold border border-gray-200 text-gray-900 hover:border-gray-400 transition-colors"
            >
              Buy Now
            </Link>
          </div>

          {/* Perks */}
          <div className="border-t border-gray-100 pt-6 flex flex-col gap-3">
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Truck className="w-4 h-4 text-gray-400" /> Free shipping on orders over ₱2,000
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <ShieldCheck className="w-4 h-4 text-gray-400" /> 30-day hassle-free returns
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-5">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <Link key={p.id} href={`/shop/${p.id}`}>
                <div className="group border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all">
                  <div className="relative aspect-square bg-gray-50">
                    <Image
                      src={p.imageUrl || (p.images?.[0]) || FALLBACK_IMAGE}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="25vw"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{p.name}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{formatCurrency(p.price)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {related.length === 0 && !loading && (
        <div className="text-center py-10 text-gray-400 text-sm flex flex-col items-center gap-2">
          <Package className="w-8 h-8 opacity-30" />
          <span>No related products found.</span>
        </div>
      )}
    </div>
  );
}
