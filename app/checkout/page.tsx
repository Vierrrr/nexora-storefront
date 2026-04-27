"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CheckCircle2, Lock, Loader2, CreditCard } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { placeOrder, createPaymentIntent } from "@/lib/api";
import StripePaymentForm from "@/components/ui/StripePaymentForm";

const SHIPPING_THRESHOLD = 2000;
const SHIPPING_FEE       = 150;

// Load Stripe outside render to avoid re-creating on every render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router   = useRouter();
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total    = subtotal + shipping;

  const [form, setForm] = useState({
    fullName: "", email: "", phone: "",
    address: "", city: "", province: "", zip: "",
    paymentMethod: "cod",
  });

  const [step,         setStep]         = useState<"form" | "success">("form");
  const [loading,      setLoading]      = useState(false);
  const [orderNumber,  setOrderNumber]  = useState("");
  const [error,        setError]        = useState("");

  // Stripe state
  const [clientSecret,    setClientSecret]    = useState<string | null>(null);
  const [stripeLoading,   setStripeLoading]   = useState(false);
  const [stripeError,     setStripeError]     = useState("");

  // Pre-fill from user profile
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        fullName: user.name  || prev.fullName,
        email:    user.email || prev.email,
        phone:    user.phone || prev.phone,
      }));
    }
  }, [user]);

  // When payment method switches to "card", create a PaymentIntent
  useEffect(() => {
    if (form.paymentMethod !== "card") {
      setClientSecret(null);
      setStripeError("");
      return;
    }
    if (total <= 0) return;

    let cancelled = false;
    setStripeLoading(true);
    setStripeError("");

    createPaymentIntent(total, form.fullName || user?.name, `nexora-${Date.now()}`)
      .then(({ clientSecret }) => { if (!cancelled) setClientSecret(clientSecret); })
      .catch(err => { if (!cancelled) setStripeError(err.message ?? "Could not initialize payment."); })
      .finally(() => { if (!cancelled) setStripeLoading(false); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.paymentMethod, total]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Build order items from cart
  const buildItems = () =>
    items
      .map(({ product, quantity }) => ({
        productId: product.dbId ?? Number(product.id),
        quantity,
      }))
      .filter(i => i.productId > 0);

  // COD / GCash submit (no Stripe)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await placeOrder({
        customerId:    user?.id,
        fullName:      form.fullName,
        email:         form.email,
        phone:         form.phone,
        address:       form.address,
        city:          form.city,
        province:      form.province,
        zip:           form.zip,
        paymentMethod: form.paymentMethod,
        items:         buildItems(),
      });
      setOrderNumber(result.orderNumber);
      clearCart();
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  // Called by StripePaymentForm when Stripe confirms payment successfully
  const handleStripeSuccess = async (paymentIntentId: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await placeOrder({
        customerId:      user?.id,
        fullName:        form.fullName,
        email:           form.email,
        phone:           form.phone,
        address:         form.address,
        city:            form.city,
        province:        form.province,
        zip:             form.zip,
        paymentMethod:   "stripe",
        paymentIntentId: paymentIntentId,
        items:           buildItems(),
      });
      setOrderNumber(result.orderNumber);
      clearCart();
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Order placement failed after payment.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-32 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Order Placed!</h1>
        {orderNumber && (
          <p className="text-sm font-mono bg-gray-100 inline-block px-3 py-1 rounded-lg text-gray-700 mb-3">
            {orderNumber}
          </p>
        )}
        <p className="text-gray-500 text-sm mb-1">Your order has been received and is being processed.</p>
        <p className="text-gray-400 text-xs mb-8">You&apos;ll receive a confirmation shortly.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => router.push("/account/orders")}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
            View My Orders
          </button>
          <button onClick={() => router.push("/shop")}
            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold hover:border-gray-400 transition-colors">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // ── Auth guard ─────────────────────────────────────────────────
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-32 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Lock className="w-7 h-7 text-gray-500" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h1>
        <p className="text-gray-500 text-sm mb-6">Please log in to complete your purchase.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => router.push("/login?redirect=/checkout")}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors">
            Log In
          </button>
          <button onClick={() => router.push("/register?redirect=/checkout")}
            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold hover:border-gray-400 transition-colors">
            Create Account
          </button>
        </div>
      </div>
    );
  }

  if (!authLoading && items.length === 0) { router.push("/cart"); return null; }

  const isCardPayment = form.paymentMethod === "card";

  // ── Main checkout ──────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <form onSubmit={handleSubmit} id="checkout-form">
            {/* Shipping Info */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Shipping Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "fullName", label: "Full Name",      placeholder: "Maria Santos",          type: "text",  col: 2 },
                  { name: "email",    label: "Email Address",  placeholder: "maria@example.com",     type: "email", col: 1 },
                  { name: "phone",    label: "Phone Number",   placeholder: "+63 917 123 4567",      type: "tel",   col: 1 },
                  { name: "address",  label: "Street Address", placeholder: "123 Rizal Street",      type: "text",  col: 2 },
                  { name: "city",     label: "City",           placeholder: "Makati City",           type: "text",  col: 1 },
                  { name: "province", label: "Province",       placeholder: "Metro Manila",          type: "text",  col: 1 },
                  { name: "zip",      label: "ZIP Code",       placeholder: "1200",                  type: "text",  col: 1 },
                ].map((field) => (
                  <div key={field.name} className={field.col === 2 ? "sm:col-span-2" : ""}>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{field.label}</label>
                    <input
                      type={field.type} name={field.name}
                      placeholder={field.placeholder}
                      value={form[field.name as keyof typeof form]}
                      onChange={handleChange} required
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Payment Method</h2>
              <div className="flex flex-col gap-3">
                {[
                  { value: "cod",   label: "Cash on Delivery",    desc: "Pay when your order arrives",       icon: "💵" },
                  { value: "gcash", label: "GCash",               desc: "Pay via GCash e-wallet",            icon: "📱" },
                  { value: "card",  label: "Credit / Debit Card", desc: "Visa, Mastercard — secured by Stripe", icon: "💳" },
                ].map((method) => (
                  <label key={method.value}
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
                      form.paymentMethod === method.value
                        ? method.value === "card" ? "border-[#635bff] bg-[#f5f4ff]" : "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input type="radio" name="paymentMethod" value={method.value}
                      checked={form.paymentMethod === method.value}
                      onChange={handleChange} className="accent-gray-900" />
                    <span className="text-xl">{method.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{method.label}</p>
                      <p className="text-xs text-gray-500">{method.desc}</p>
                    </div>
                    {method.value === "card" && (
                      <CreditCard className="w-4 h-4 text-[#635bff] ml-auto flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          </form>

          {/* ── Stripe Card Form (shown when card is selected) ── */}
          {isCardPayment && (
            <div className="bg-white border border-gray-100 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#635bff]" /> Card Details
              </h2>

              {stripeLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" /> Initializing secure payment…
                </div>
              ) : stripeError ? (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  ⚠️ {stripeError}
                  <br /><span className="text-xs text-gray-400">Make sure your Stripe keys are configured in appsettings.json and .env.local</span>
                </div>
              ) : clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: { colorPrimary: "#635bff", borderRadius: "12px" },
                    },
                  }}
                >
                  <StripePaymentForm onPaymentSuccess={handleStripeSuccess} loading={loading} />
                </Elements>
              ) : null}
            </div>
          )}

          {/* ── Error & COD/GCash submit button ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          {!isCardPayment && (
            <button type="submit" form="checkout-form" disabled={loading}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order…</> : "Place Order"}
            </button>
          )}
        </div>

        {/* ── Order Summary ── */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-2xl p-5 sticky top-24">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="flex flex-col gap-3 mb-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3">
                  <div className="relative w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                    <Image src={product.image} alt={product.name} fill className="object-cover" sizes="48px" />
                    <span className="absolute -top-1 -right-1 bg-gray-700 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 font-medium line-clamp-2">{product.name}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(product.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? <span className="text-green-600">Free</span> : formatCurrency(shipping)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-semibold text-gray-900">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
