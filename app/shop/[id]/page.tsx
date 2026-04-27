"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Star, ShoppingCart, ShieldCheck, Truck } from "lucide-react";
import { products } from "@/data/products";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useState } from "react";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = products.find((p) => p.id === id);
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) notFound();

  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAdd = () => {
    addToCart(product, qty);
    setAdded(true);
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
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          {product.badge && (
            <span className="absolute top-4 left-4 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
              {product.badge}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-2">
            {product.category}
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3 leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${s <= Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">{product.rating}</span>
            <span className="text-sm text-gray-400">({product.reviews} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-semibold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-base text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            {product.description}
          </p>

          {/* Stock */}
          <p className="text-xs text-gray-500 mb-5">
            {product.stock > 10
              ? `${product.stock} in stock`
              : product.stock > 0
              ? `Only ${product.stock} left`
              : "Out of stock"}
          </p>

          {/* Quantity */}
          <div className="flex items-center gap-3 mb-5">
            <span className="text-sm text-gray-600">Qty:</span>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg"
              >
                −
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button
                onClick={() => setQty(Math.min(product.stock, qty + 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all ${
                added
                  ? "bg-green-600 text-white"
                  : "bg-gray-900 text-white hover:bg-gray-700"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <ShoppingCart className="w-4 h-4" />
              {added ? "Added to Cart!" : "Add to Cart"}
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
              <Truck className="w-4 h-4 text-gray-400" />
              Free shipping on orders over ₱2,000
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <ShieldCheck className="w-4 h-4 text-gray-400" />
              30-day hassle-free returns
            </div>
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className="mb-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-5">Specifications</h2>
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          {Object.entries(product.specs).map(([key, val], i) => (
            <div
              key={key}
              className={`flex items-start px-5 py-3.5 ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
            >
              <span className="text-sm text-gray-500 w-40 flex-shrink-0">{key}</span>
              <span className="text-sm text-gray-900">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-5">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map((p) => (
              <Link key={p.id} href={`/shop/${p.id}`}>
                <div className="group border border-gray-100 rounded-2xl overflow-hidden hover:shadow-md transition-all">
                  <div className="relative aspect-square bg-gray-50">
                    <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="25vw" />
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
    </div>
  );
}
