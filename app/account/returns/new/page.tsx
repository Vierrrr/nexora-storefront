"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { mockOrders } from "@/data/orders";
import { useEffect } from "react";

const reasons = [
  "Defective Product",
  "Wrong Item Received",
  "Item Not as Described",
  "Damaged During Shipping",
  "Changed My Mind",
  "Duplicate Order",
  "Other",
];

export default function NewReturnPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    orderNumber: "",
    item: "",
    reason: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const eligibleOrders = mockOrders.filter((o) => o.canRequestReturn);

  const selectedOrder = mockOrders.find((o) => o.orderNumber === form.orderNumber);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Reset item when order changes
    if (e.target.name === "orderNumber") setForm((f) => ({ ...f, orderNumber: e.target.value, item: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-32 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Return Request Submitted</h1>
        <p className="text-sm text-gray-500 mb-8">
          Your request has been received. Our team will review it and respond within 1–2 business days.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account/returns"
            className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            View My Returns
          </Link>
          <Link
            href="/account/orders"
            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold hover:border-gray-400 transition-colors"
          >
            My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-sm text-gray-500">
        <Link href="/account" className="hover:text-gray-900 transition-colors">Account</Link>
        <span className="text-gray-300">/</span>
        <Link href="/account/returns" className="hover:text-gray-900 transition-colors">Returns</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">New Request</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Request a Return</h1>
      <p className="text-sm text-gray-500 mb-8">
        Fill out the form below. Returns are accepted within 30 days of delivery.
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-5">
        {/* Select Order */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Order</label>
          {eligibleOrders.length === 0 ? (
            <p className="text-sm text-gray-400">No eligible orders for return.</p>
          ) : (
            <select
              name="orderNumber"
              value={form.orderNumber}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors bg-white"
            >
              <option value="">Select an order</option>
              {eligibleOrders.map((o) => (
                <option key={o.id} value={o.orderNumber}>
                  {o.orderNumber} — {new Date(o.date).toLocaleDateString("en-PH")}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Select Item */}
        {selectedOrder && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Item to Return</label>
            <select
              name="item"
              value={form.item}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors bg-white"
            >
              <option value="">Select an item</option>
              {selectedOrder.items.map((item) => (
                <option key={item.productId} value={item.name}>
                  {item.name} (Qty: {item.quantity})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reason */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Reason for Return</label>
          <select
            name="reason"
            value={form.reason}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors bg-white"
          >
            <option value="">Select a reason</option>
            {reasons.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Additional Details <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the issue in detail..."
            rows={4}
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors resize-none"
          />
        </div>

        {/* Policy note */}
        <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 leading-relaxed">
          By submitting this request, you agree to our <span className="text-gray-700 font-medium">Return Policy</span>.
          Our team will review your request within 1–2 business days and contact you with the next steps.
        </div>

        <div className="flex gap-3">
          <Link
            href="/account/returns"
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 text-sm font-semibold py-3 rounded-xl hover:border-gray-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || eligibleOrders.length === 0}
            className="flex-1 bg-gray-900 text-white text-sm font-semibold py-3 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Return Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
