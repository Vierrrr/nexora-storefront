"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, ChevronUp, ChevronDown, LayoutGrid, List, Star, WifiOff, RefreshCw } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";
import { useProductsOffline, type DataSource } from "@/lib/useProductsOffline";
import { FALLBACK_IMAGE, type ApiProduct } from "@/lib/useProducts";
import { flyToCart } from "@/lib/flyToCart";
import Image from "next/image";
import Link from "next/link";

const MAX_PRICE = 100000;
const MIN_PRICE = 0;
type SortOption = "default" | "price-asc" | "price-desc" | "rating";
type ViewMode = "grid" | "list";

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 py-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full mb-3">
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-700">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function ProductCard({ product, onAddToCart }: {
  product:    ApiProduct;
  onAddToCart: (p: ApiProduct, btn: HTMLButtonElement) => void;
}) {
  const img   = product.imageUrl || (product.images?.[0]) || FALLBACK_IMAGE;
  const isOut = product.stockQuantity === 0;
  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200">
      <Link href={`/shop/${product.id}`}>
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image src={img} alt={product.name} fill
            className={`object-cover group-hover:scale-105 transition-transform duration-300 ${isOut ? "opacity-50" : ""}`}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw" />
          {product.badge && (
            <span className={`absolute top-3 left-3 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              product.badge === "Out of Stock" ? "bg-red-500" :
              product.badge === "Low Stock" ? "bg-orange-500" : "bg-gray-900"}`}>
              {product.badge}
            </span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <p className="text-xs text-gray-400 mb-1">{product.category}</p>
        <Link href={`/shop/${product.id}`}>
          <h3 className="text-sm font-medium text-gray-900 leading-snug hover:text-gray-600 transition-colors line-clamp-2">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 mt-2">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-gray-600 font-medium">{product.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-base font-semibold text-gray-900">{formatCurrency(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through ml-2">{formatCurrency(product.originalPrice)}</span>
            )}
          </div>
          <button
            onClick={(e) => onAddToCart(product, e.currentTarget)}
            disabled={isOut}
            className="text-xs font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {isOut ? "Sold Out" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Offline banner shown when source is not "live"
function OfflineBanner({ source, error, onRetry }: { source: DataSource; error: string | null; onRetry: () => void }) {
  if (source === "live") return null;
  const isSeed  = source === "seed";
  const message = isSeed
    ? "Backend is offline. Showing sample data."
    : "Backend is offline. Showing cached products from your last visit.";
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-6 text-sm ${
      isSeed
        ? "bg-red-50 border border-red-100 text-red-700"
        : "bg-amber-50 border border-amber-100 text-amber-700"
    }`}>
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <span>{error || message}</span>
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 text-xs font-semibold underline-offset-2 hover:underline flex-shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </button>
    </div>
  );
}

export default function ShopContent() {
  const searchParams  = useSearchParams();
  const { addToCart } = useCart();
  const { products, loading, error, source, categories, refetch } = useProductsOffline();

  const [search, setSearch]               = useState(() => searchParams.get("search") || "");
  const [selectedCategory, setCategory]   = useState(() => searchParams.get("category") || "");
  const [maxPrice, setMaxPrice]           = useState(MAX_PRICE);
  const [inStockOnly, setInStockOnly]     = useState(false);
  const [sortBy, setSortBy]               = useState<SortOption>("default");
  const [viewMode, setViewMode]           = useState<ViewMode>("grid");

  const hasFilters = !!selectedCategory || maxPrice < MAX_PRICE || inStockOnly || !!search;
  const clearAll = () => { setCategory(""); setMaxPrice(MAX_PRICE); setInStockOnly(false); setSearch(""); setSortBy("default"); };

  // Convert ApiProduct to CartContext-compatible shape
  const toCartProduct = (p: ApiProduct) => ({
    id: String(p.id),
    dbId: p.id,
    name: p.name,
    category: p.category as never,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.imageUrl || FALLBACK_IMAGE,
    description: p.description || "",
    specs: {},
    stock: p.stockQuantity,
    rating: p.rating,
    reviews: p.reviews,
    badge: p.badge,
  });

  const filtered = useMemo(() => {
    let result = [...products];
    if (selectedCategory) result = result.filter(p => p.category === selectedCategory);
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()));
    result = result.filter(p => p.price <= maxPrice);
    if (inStockOnly) result = result.filter(p => p.stockQuantity > 0);
    if (sortBy === "price-asc")  result.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") result.sort((a, b) => b.price - a.price);
    if (sortBy === "rating")     result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [products, search, selectedCategory, maxPrice, inStockOnly, sortBy]);

  if (loading && products.length === 0) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse mb-2" />
      <div className="flex gap-8 mt-10">
        <div className="hidden lg:flex flex-col w-60 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />)}
        </div>
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
        <p className="text-sm text-gray-400 mt-1">
          {products.length} items
          {source === "cache" && <span className="ml-2 text-amber-500 font-medium">(cached)</span>}
          {source === "seed"  && <span className="ml-2 text-red-400 font-medium">(offline)</span>}
        </p>
      </div>

      {/* Offline / cache banner */}
      <OfflineBanner source={source} error={error} onRetry={refetch} />

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 flex-shrink-0">
          <div className="mb-4"><h2 className="text-base font-semibold text-gray-900">Filters</h2></div>
          <button onClick={clearAll} disabled={!hasFilters}
            className={`flex items-center justify-center gap-2 w-full border rounded-lg py-2.5 text-sm font-medium mb-4 transition-colors ${hasFilters ? "border-gray-300 text-gray-700 hover:border-gray-500" : "border-gray-100 text-gray-300 cursor-default"}`}>
            <X className="w-3.5 h-3.5" /> Clear All Filters
          </button>

          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors" />
          </div>

          <FilterSection title="Categories">
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" checked={!selectedCategory} onChange={() => setCategory("")}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900 cursor-pointer" />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium">All Categories</span>
              </label>
              {categories.map(cat => (
                <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={selectedCategory === cat} onChange={() => setCategory(selectedCategory === cat ? "" : cat)}
                    className="w-4 h-4 rounded border-gray-300 accent-gray-900 cursor-pointer" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{cat}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Price Range">
            <input type="range" min={MIN_PRICE} max={MAX_PRICE} step={500} value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))} className="w-full accent-gray-900 cursor-pointer" />
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-gray-500">{formatCurrency(MIN_PRICE)}</span>
              <span className="text-xs font-medium text-gray-700">Up to {formatCurrency(maxPrice)}</span>
            </div>
          </FilterSection>

          <FilterSection title="Availability">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" checked={inStockOnly} onChange={e => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-gray-900 cursor-pointer" />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">In Stock Only</span>
            </label>
          </FilterSection>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Mobile category chips */}
          <div className="lg:hidden flex flex-wrap gap-2 mb-5">
            <button onClick={() => setCategory("")}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${!selectedCategory ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}>
              All
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(selectedCategory === cat ? "" : cat)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${selectedCategory === cat ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}>
                {cat}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <p className="text-sm text-gray-500">
              Showing <span className="font-semibold text-gray-900">{filtered.length}</span> {filtered.length === 1 ? "product" : "products"}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode("grid")} className={`p-2 transition-colors ${viewMode === "grid" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-700"}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-700"}`}><List className="w-4 h-4" /></button>
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-400 bg-white">
                <option value="default">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-24 bg-gray-50 rounded-2xl">
              <p className="text-sm font-medium text-gray-500">No products match your filters.</p>
              <button onClick={clearAll} className="mt-3 text-sm text-gray-900 underline underline-offset-2">Clear all filters</button>
            </div>
          )}

          {/* Grid */}
          {filtered.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={(p2, btn) => {
                    addToCart(toCartProduct(p2));
                    flyToCart(btn, p2.imageUrl || p2.images?.[0]);
                  }}
                />
              ))}
            </div>
          )}

          {/* List */}
          {filtered.length > 0 && viewMode === "list" && (
            <div className="flex flex-col gap-3">
              {filtered.map(p => (
                <div key={p.id} className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all">
                  <Link href={`/shop/${p.id}`} className="relative w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={p.imageUrl || FALLBACK_IMAGE} alt={p.name} fill className="object-cover" sizes="96px" />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">{p.category}</p>
                      <Link href={`/shop/${p.id}`}><h3 className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-gray-600">{p.name}</h3></Link>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600 font-medium">{p.rating.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">({p.reviews})</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-semibold text-gray-900">{formatCurrency(p.price)}</span>
                      <button
                        onClick={(e) => {
                          addToCart(toCartProduct(p));
                          flyToCart(e.currentTarget, p.imageUrl || p.images?.[0]);
                        }}
                        disabled={p.stockQuantity === 0}
                        className="text-xs font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-40">
                        {p.stockQuantity === 0 ? "Sold Out" : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
