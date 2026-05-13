"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, Eye, EyeOff, ShieldCheck } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "@/context/AuthContext";
import { checkClientRateLimit } from "@/lib/recaptcha";
import { Suspense } from "react";

const RECAPTCHA_V2_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

function LoginForm() {
  const { login, error: authError } = useAuth();
  const router                       = useRouter();
  const searchParams                 = useSearchParams();
  const redirect                     = searchParams.get("redirect") || "/account";
  const recaptchaRef                 = useRef<ReCAPTCHA>(null);

  const [form, setForm]       = useState({ email: "", password: "" });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [captchaError, setCaptchaError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCaptchaError("");

    // Client-side rate limiting
    const rl = checkClientRateLimit("login", 10, 5 * 60 * 1000);
    if (!rl.allowed) { setRateLimited(true); return; }

    // After first failure, reCAPTCHA v2 is required
    let token = "";
    if (attempts > 0) {
      token = recaptchaRef.current?.getValue() ?? "";
      if (!token) {
        setCaptchaError("Please complete the reCAPTCHA verification before signing in.");
        return;
      }
    }

    setLoading(true);
    const ok = await login(form.email, form.password, token);
    setLoading(false);

    if (ok) {
      router.push(redirect);
    } else {
      setAttempts((a) => a + 1);
      recaptchaRef.current?.reset(); // Reset after failed attempt
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">Nexora</span>
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

          {rateLimited && (
            <div className="bg-amber-50 border border-amber-100 text-amber-700 text-sm rounded-xl px-4 py-3 mb-5">
              Too many login attempts. Please wait 5 minutes before trying again.
            </div>
          )}

          {authError && !rateLimited && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
              {authError}
              {attempts >= 1 && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Please complete the reCAPTCHA below to continue
                </p>
              )}
            </div>
          )}

          {captchaError && (
            <div className="bg-orange-50 border border-orange-100 text-orange-600 text-sm rounded-xl px-4 py-3 mb-5">
              {captchaError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="maria@example.com"
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* reCAPTCHA v2 — shown after first failed attempt */}
            {attempts > 0 && RECAPTCHA_V2_KEY && (
              <div className="flex justify-center">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_V2_KEY}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || rateLimited}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60 mt-1"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Don&apos;t have an account?{" "}
          <Link
            href={`/register${redirect !== "/account" ? `?redirect=${redirect}` : ""}`}
            className="text-gray-900 font-medium hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <LoginForm />
    </Suspense>
  );
}
