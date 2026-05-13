"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "./api";
import type { ApiProduct } from "./useProducts";

// ─────────────────────────────────────────────────────────────────
// Cache key & TTL
// ─────────────────────────────────────────────────────────────────
const CACHE_KEY     = "nexora_products_cache";
const CACHE_TTL_MS  = 1000 * 60 * 60; // 1 hour

interface CacheEntry {
  data:      ApiProduct[];
  savedAt:   number; // Date.now()
}

// ─────────────────────────────────────────────────────────────────
// Read / Write localStorage cache (safe — SSR won't crash)
// ─────────────────────────────────────────────────────────────────
function readCache(): ApiProduct[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    // Honour TTL so stale data eventually expires
    if (Date.now() - entry.savedAt > CACHE_TTL_MS) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(data: ApiProduct[]): void {
  try {
    const entry: CacheEntry = { data, savedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

// ─────────────────────────────────────────────────────────────────
// Static seed data — shown when BOTH the API AND the cache are
// unavailable (e.g. first offline visit on a fresh browser).
// Extend this array to match your real catalogue.
// ─────────────────────────────────────────────────────────────────
export const SEED_PRODUCTS: ApiProduct[] = [
  {
    id: 1,
    name: "Sample Product",
    category: "General",
    price: 999,
    stockQuantity: 10,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80",
    description: "Live data is currently unavailable. This is a sample placeholder.",
    badge: undefined,
    rating: 4.5,
    reviews: 0,
    images: [],
  },
];

// ─────────────────────────────────────────────────────────────────
// Status type
// ─────────────────────────────────────────────────────────────────
export type DataSource = "live" | "cache" | "seed";

export interface UseProductsOfflineResult {
  products:   ApiProduct[];
  loading:    boolean;
  error:      string | null;
  source:     DataSource;
  categories: string[];
  refetch:    () => void;
}

// ─────────────────────────────────────────────────────────────────
// Hook — stale-while-revalidate + offline fallback
// ─────────────────────────────────────────────────────────────────
export function useProductsOffline(): UseProductsOfflineResult {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [source,   setSource]   = useState<DataSource>("live");
  const [tick,     setTick]     = useState(0); // increment to trigger refetch

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      // ── Step 1: serve cache immediately (stale-while-revalidate) ──
      const cached = readCache();
      if (cached && cached.length > 0) {
        if (!cancelled) {
          setProducts(cached);
          setSource("cache");
          setLoading(false); // show cached data instantly
        }
      }

      // ── Step 2: try the live API ───────────────────────────────────
      try {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const res = await fetch(`${API_BASE}/api/products`, {
          credentials: "include",
          signal:       controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data: ApiProduct[] = await res.json();
        if (!cancelled) {
          setProducts(data);
          setSource("live");
          setError(null);
          writeCache(data); // persist for next offline visit
        }
      } catch (err) {
        if (cancelled) return;

        // ── Step 3: fall back to localStorage cache ──────────────────
        const fallback = readCache(); // re-read (may have been written above)
        if (fallback && fallback.length > 0) {
          setProducts(fallback);
          setSource("cache");
          setError(null); // don't show error when cache is available
        } else {
          // ── Step 4: absolute last resort — static seed data ─────────
          setProducts(SEED_PRODUCTS);
          setSource("seed");
          setError(
            err instanceof Error && err.name === "AbortError"
              ? "Backend is offline. Showing cached data."
              : "Could not reach the server. Showing offline data."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [tick]);

  const categories = [...new Set(products.map((p) => p.category))].sort();
  const refetch    = () => setTick((t) => t + 1);

  return { products, loading, error, source, categories, refetch };
}
