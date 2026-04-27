"use client";

import { useState, useEffect } from "react";
import { API_BASE } from "./api";

// Product shape returned by the backend API
export interface ApiProduct {
  id: number;             // Real DB id — used as productId in orders
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  sku?: string;
  imageUrl?: string;
  description?: string;
  badge?: string;
  rating: number;
  reviews: number;
}

// Fallback image for products without imageUrl
export const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&q=80";

export function useProducts() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`${API_BASE}/api/products`, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data: ApiProduct[]) => {
        if (!cancelled) {
          setProducts(data);
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // Derived list of unique categories
  const categories = [...new Set(products.map(p => p.category))].sort();

  return { products, loading, error, categories };
}

// Server-side product fetch (for use in page.tsx server components)
export async function fetchProductsServer(): Promise<ApiProduct[]> {
  try {
    const res = await fetch(`${API_BASE}/api/products`, {
      next: { revalidate: 30 }, // Cache for 30 seconds
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
