"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Package, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/ui/Badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { fetchMyOrders, API_BASE } from "@/lib/api";

interface OrderItem { name: string; quantity: number; price: number; }
interface Order {
  id: number; orderNumber: string; date: string; status: string;
  total: number; courierName?: string; trackingNumber?: string; items: OrderItem[];
}

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login?redirect=/account/orders"); return; }
    if (!user) return;
    fetchMyOrders(user.id)
      .then(setOrders)
      .catch(() => setError("Failed to load orders."))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/account" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Account</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-900 font-medium">My Orders</span>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Orders</h1>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-center text-sm text-red-500 py-16">{error}</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-24">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No orders yet.</p>
          <Link href="/shop" className="mt-4 inline-block text-sm font-medium text-gray-900 underline">Start Shopping</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.orderNumber}`}
              className="group block bg-white border border-gray-100 rounded-2xl p-5 hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Placed on {formatDate(order.date)}
                    {order.courierName ? ` · ${order.courierName}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={order.status} />
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {order.items.map((item, i) => (
                  <span key={i} className="text-xs bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg text-gray-700">
                    {item.quantity}× {item.name}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                <p className="text-xs text-gray-500">
                  {order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.reduce((s, i) => s + i.quantity, 0) > 1 ? "s" : ""}
                </p>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.total)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
