"use client";

import { useState } from "react";
import { Search, MapPin, CheckCircle2, Package, Truck, CheckCheck, Clock } from "lucide-react";
import { trackOrder, TrackingResponse } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

// Maps backend status string to a progress step index
const STATUS_STEPS = ["Pending", "Validated", "Picking", "Packed", "Shipped", "Delivered"];

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex(s => s.toLowerCase() === status.toLowerCase());
  return idx === -1 ? 0 : idx;
}

const STEP_ICONS = [Clock, CheckCircle2, Package, Package, Truck, CheckCheck];

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending:   "bg-yellow-50 text-yellow-700 border-yellow-200",
    validated: "bg-blue-50 text-blue-700 border-blue-200",
    picking:   "bg-purple-50 text-purple-700 border-purple-200",
    packed:    "bg-indigo-50 text-indigo-700 border-indigo-200",
    shipped:   "bg-cyan-50 text-cyan-700 border-cyan-200",
    delivered: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    restocked: "bg-gray-50 text-gray-700 border-gray-200",
  };
  const cls = colors[status.toLowerCase()] ?? "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {status}
    </span>
  );
}

export default function TrackPage() {
  const [query, setQuery]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [result, setResult]     = useState<TrackingResponse | null>(null);
  const [error, setError]       = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setSearched(false);
    setError("");
    setResult(null);

    try {
      const data = await trackOrder(q);
      setResult(data);
      setSearched(true);
    } catch {
      setError("Could not connect to the tracking service. Please try again.");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const currentStep = result ? getStepIndex(result.status) : -1;
  const isCancelled = result?.status.toLowerCase() === "cancelled";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-500 text-sm">
          Enter your order number (e.g. <span className="font-mono font-medium">ORD-2041</span>) or courier tracking number.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSearched(false); }}
            placeholder="e.g. ORD-2041 or JT99281234PH"
            className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
        <button type="submit" disabled={loading}
          className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60">
          {loading ? "Searching..." : "Track"}
        </button>
      </form>

      {/* API error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6">
          ⚠️ {error}
        </div>
      )}

      {/* Not found */}
      {searched && !result && !error && (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <p className="text-sm font-medium text-gray-700">Order not found</p>
          <p className="text-xs text-gray-400 mt-1">Please check your order number and try again.</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex flex-col gap-5">

          {/* Order Header */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-gray-900">{result.orderNumber}</p>
              <p className="text-xs text-gray-400 mt-0.5">Ship to: <span className="text-gray-600 font-medium">{result.shipToName}</span>, {result.shipToCity}</p>
              {result.courierName && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {result.courierName}
                  {result.trackingNumber && ` · ${result.trackingNumber}`}
                </p>
              )}
              {result.estimatedDelivery && (
                <p className="text-xs text-gray-500 mt-1">
                  Est. Delivery: <span className="font-medium text-gray-700">
                    {new Date(result.estimatedDelivery).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </p>
              )}
            </div>
            <StatusBadge status={result.status} />
          </div>

          {/* Progress Steps */}
          {!isCancelled && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-6">Shipment Progress</h2>
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, index) => {
                  const Icon = STEP_ICONS[index];
                  const isDone    = index < currentStep;
                  const isCurrent = index === currentStep;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1 min-w-0">
                      <div className="flex items-center w-full">
                        {index > 0 && (
                          <div className={`flex-1 h-0.5 ${isDone || isCurrent ? "bg-gray-900" : "bg-gray-100"}`} />
                        )}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isDone ? "bg-gray-900" : isCurrent ? "bg-gray-900 ring-4 ring-gray-100" : "bg-gray-100"}`}>
                          <Icon className={`w-4 h-4 ${isDone || isCurrent ? "text-white" : "text-gray-300"}`} />
                        </div>
                        {index < STATUS_STEPS.length - 1 && (
                          <div className={`flex-1 h-0.5 ${isDone ? "bg-gray-900" : "bg-gray-100"}`} />
                        )}
                      </div>
                      <span className={`text-[10px] mt-2 text-center font-medium leading-tight ${
                        isCurrent ? "text-gray-900" : index < currentStep ? "text-gray-500" : "text-gray-300"}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          {result.timeline.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-5">Tracking History</h2>
              <div className="flex flex-col gap-0">
                {[...result.timeline].reverse().map((event, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${i === 0 ? "bg-gray-900" : "bg-gray-200"}`} />
                      {i < result.timeline.length - 1 && <div className="w-px flex-1 bg-gray-100 my-1" />}
                    </div>
                    <div className="pb-5">
                      <p className={`text-sm font-medium ${i === 0 ? "text-gray-900" : "text-gray-500"}`}>
                        {event.status} — {event.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {new Date(event.timestamp).toLocaleString("en-PH", {
                          month: "short", day: "numeric", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          {result.items.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Items in this order</h2>
              <div className="flex flex-col gap-3">
                {result.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold text-gray-900 flex-shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="text-xs text-gray-500">Order Total</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(result.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
