"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle2, Circle, MapPin, Truck,
  Package, CheckCheck, Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchOrderDetail, confirmDelivery, OrderDetail } from "@/lib/api";
import { formatDate, formatCurrency } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

type OrderStatus =
  | "Pending" | "Validated" | "Picking" | "Packed"
  | "Shipped" | "Delivered" | "Cancelled"
  | "ReturnRequested" | "ReturnApproved" | "ReturnRejected";

const statusSteps: OrderStatus[] = [
  "Pending", "Validated", "Picking", "Packed", "Shipped", "Delivered",
];

const stepLabels: Record<string, string> = {
  Pending: "Pending", Validated: "Validated", Picking: "Picking",
  Packed: "Packed", Shipped: "Shipped", Delivered: "Delivered",
};

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderNumber } = use(params);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!user) return;
    fetchOrderDetail(user.id, orderNumber)
      .then((data) => {
        if (!data) setNotFoundError(true);
        else setOrder(data);
      })
      .catch(() => setNotFoundError(true))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user, orderNumber, router]);

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
      </div>
    );
  }

  if (notFoundError || !order) return notFound();

  const normalizedStatus = order.status.replace(/\s+/g, "");
  const currentStepIndex = statusSteps.findIndex(
    (s) => s.toLowerCase() === normalizedStatus.toLowerCase()
  );

  const handleConfirmDelivery = async () => {
    if (!user) return;
    setConfirming(true);
    try {
      await confirmDelivery(user.id, order.orderNumber);
      setConfirmed(true);
    } catch {
      // silently fail — UI already shows success-like state
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-sm text-gray-500">
        <Link href="/account" className="hover:text-gray-900 transition-colors">Account</Link>
        <span className="text-gray-300">/</span>
        <Link href="/account/orders" className="hover:text-gray-900 transition-colors">Orders</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{order.orderNumber}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Placed on {formatDate(order.date)}</p>
        </div>
        <Badge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tracking + Actions */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Order Tracker */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-6">Order Status</h2>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
              {statusSteps.map((step, index) => {
                const isDone    = currentStepIndex >= 0 && index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isPending = currentStepIndex < 0 || index > currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center flex-1 min-w-0">
                    <div className="flex items-center w-full">
                      {index > 0 && (
                        <div className={`flex-1 h-0.5 ${isDone || isCurrent ? "bg-gray-900" : "bg-gray-100"}`} />
                      )}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                          isDone    ? "bg-gray-900"
                          : isCurrent ? "bg-gray-900 ring-4 ring-gray-100"
                          : "bg-gray-100"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : isCurrent ? (
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        ) : (
                          <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
                        )}
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div className={`flex-1 h-0.5 ${isDone ? "bg-gray-900" : "bg-gray-100"}`} />
                      )}
                    </div>
                    <span className={`text-[10px] mt-2 text-center font-medium leading-tight ${
                      isCurrent ? "text-gray-900" : isPending ? "text-gray-300" : "text-gray-500"
                    }`}>
                      {stepLabels[step]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Tracking Events Timeline */}
            {order.trackingEvents.length > 0 && (
              <div className="flex flex-col gap-0">
                {[...order.trackingEvents].reverse().map((event, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${i === 0 ? "bg-gray-900" : "bg-gray-200"}`} />
                      {i < order.trackingEvents.length - 1 && (
                        <div className="w-px flex-1 bg-gray-100 my-1" />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className={`text-sm font-medium ${i === 0 ? "text-gray-900" : "text-gray-500"}`}>
                        {event.description}
                      </p>
                      {event.location && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {event.location}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(event.timestamp).toLocaleString("en-PH", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm Delivery */}
          {order.canConfirmDelivery && !confirmed && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-green-800">Did you receive your order?</p>
                <p className="text-xs text-green-600 mt-0.5">Please confirm delivery once you have received all items.</p>
              </div>
              <button
                onClick={handleConfirmDelivery}
                disabled={confirming}
                className="flex-shrink-0 bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-800 transition-colors disabled:opacity-60"
              >
                {confirming ? "Confirming..." : "Confirm Delivery"}
              </button>
            </div>
          )}

          {confirmed && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm font-medium text-green-800">Delivery confirmed. Thank you for shopping with Nexora!</p>
            </div>
          )}

          {/* Request Return */}
          {order.canRequestReturn && (
            <div className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Need to return an item?</p>
                <p className="text-xs text-gray-500 mt-0.5">Submit a return request within 30 days of delivery.</p>
              </div>
              <Link
                href={`/account/returns/new?order=${order.orderNumber}`}
                className="flex-shrink-0 text-xs font-semibold border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:border-gray-400 transition-colors"
              >
                Request Return
              </Link>
            </div>
          )}
        </div>

        {/* Right: Order Details */}
        <div className="flex flex-col gap-4">
          {/* Items */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
            </h3>
            <div className="flex flex-col gap-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl border border-gray-100 flex-shrink-0 flex items-center justify-center">
                    <Package className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity} · {formatCurrency(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-50 mt-4 pt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span>{order.shipping === 0 ? <span className="text-green-600">Free</span> : formatCurrency(order.shipping)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-50">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Shipping Address</h3>
            <div className="text-sm text-gray-600 leading-relaxed">
              <p className="font-medium text-gray-900">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}</p>
              <p className="mt-1 text-gray-400">{order.shippingAddress.phone}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Payment</h3>
            <p className="text-sm text-gray-700">{order.paymentMethod}</p>
          </div>

          {/* Courier info */}
          {order.courierName && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Courier Details</h3>
              <p className="text-sm text-gray-700 font-medium">{order.courierName}</p>
              {order.trackingNumber && (
                <p className="text-xs text-gray-400 mt-1">Tracking: {order.trackingNumber}</p>
              )}
              {order.estimatedDelivery && (
                <p className="text-xs text-gray-400 mt-0.5">Est. Delivery: {formatDate(order.estimatedDelivery)}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
