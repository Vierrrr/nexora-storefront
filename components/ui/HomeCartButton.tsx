"use client";

import { useCart } from "@/context/CartContext";
import { Product } from "@/data/products";
import ProductCard from "./ProductCard";

export default function HomeCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  return <ProductCard product={product} onAddToCart={addToCart} />;
}
