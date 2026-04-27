import { Product } from "@/data/products";
import { formatCurrency } from "@/lib/utils";
import { Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200">
      {/* Image */}
      <Link href={`/shop/${product.id}`}>
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {product.badge && (
            <span className="absolute top-3 left-3 bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
              {product.badge}
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-gray-400 mb-1">{product.category}</p>
        <Link href={`/shop/${product.id}`}>
          <h3 className="text-sm font-medium text-gray-900 leading-snug hover:text-gray-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-xs text-gray-600 font-medium">{product.rating}</span>
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>

        {/* Price + Action */}
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-base font-semibold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through ml-2">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {onAddToCart && (
            <button
              onClick={() => onAddToCart(product)}
              className="text-xs font-medium bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
