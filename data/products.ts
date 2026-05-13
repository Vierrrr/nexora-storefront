// ─── Product type ──────────────────────────────────────────────────────────────
// Used across the storefront (CartContext, ProductCard, FeaturedSection, etc.)

export type Category =
  | "Smartphones"
  | "Laptops"
  | "Audio"
  | "Cameras"
  | "Accessories"
  | "Gaming"
  | "Wearables"
  | "Tablets"
  | string; // allow arbitrary API categories

export interface Product {
  id: string;
  /** Numeric DB primary key — used when placing orders via the API */
  dbId?: number;
  name: string;
  category: Category;
  price: number;
  /** Original / strikethrough price, if on sale */
  originalPrice?: number;
  image: string;
  description: string;
  badge?: string;
  stock: number;
  rating: number;
  reviews: number;
  specs: Record<string, string | number>;
}

// ─── Categories (shown on the homepage) ────────────────────────────────────────

export const categories: { name: Category; icon: string; count: number }[] = [
  { name: "Smartphones", icon: "📱", count: 0 },
  { name: "Laptops",     icon: "💻", count: 0 },
  { name: "Audio",       icon: "🎧", count: 0 },
  { name: "Cameras",     icon: "📷", count: 0 },
  { name: "Accessories", icon: "🔌", count: 0 },
  { name: "Gaming",      icon: "🎮", count: 0 },
];

// ─── Static product list (fallback / SSG seed) ─────────────────────────────────
// The live data is fetched from the backend API at runtime.
// This array is kept lean — add entries here only if you need SSG/SSR fallbacks.

export const products: Product[] = [];
