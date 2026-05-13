"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, Eye, EyeOff } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useAuth } from "@/context/AuthContext";
import { checkClientRateLimit } from "@/lib/recaptcha";

const RECAPTCHA_V2_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

function RegisterForm() {
  const { register }  = useAuth();
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const redirect      = searchParams.get("redirect") || "/account";
  const recaptchaRef  = useRef<ReCAPTCHA>(null);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirm: "",
  });
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const validatePassword = (pw: string) => {
    if (pw.length < 12)          return "Password must be at least 12 characters.";
    if (pw.length > 64)          return "Password must be no more than 64 characters.";
    if (!/[A-Z]/.test(pw))      return "Password must contain at least 1 uppercase letter.";
    if (!/[a-z]/.test(pw))      return "Password must contain at least 1 lowercase letter.";
    if (!/[0-9]/.test(pw))      return "Password must contain at least 1 number.";
    if (!/[!@#$%^&*]/.test(pw)) return "Password must contain at least 1 special character (!@#$%^&*).";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const rl = checkClientRateLimit("register", 5, 10 * 60 * 1000);
    if (!rl.allowed) { setRateLimited(true); setError("Too many attempts. Please wait 10 minutes."); return; }

    const pwError = validatePassword(form.password);
    if (pwError) { setError(pwError); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }

    // reCAPTCHA always required on register
    const token = recaptchaRef.current?.getValue() ?? "";
    if (!token && RECAPTCHA_V2_KEY) {
      setError("Please complete the reCAPTCHA verification before registering.");
      return;
    }

    setLoading(true);
    const ok = await register(form.name, form.email, form.password, form.phone, token);
    setLoading(false);

    if (ok) {
      router.push(redirect);
    } else {
      setError("Registration failed. This email may already be in use.");
      recaptchaRef.current?.reset();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">Nexora</span>
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-6">Join Nexora to start shopping</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {[
              { name: "name",  label: "Full Name",    placeholder: "Maria Santos",      type: "text"  },
              { name: "email", label: "Email Address", placeholder: "maria@example.com", type: "email" },
              { name: "phone", label: "Phone Number",  placeholder: "+63 917 123 4567",  type: "tel"   },
            ].map((f) => (
              <div key={f.name}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  name={f.name}
                  placeholder={f.placeholder}
                  value={form[f.name as keyof typeof form]}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  name="password"
                  placeholder="Min. 12 characters"
                  value={form.password}
                  onChange={handleChange}
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
              <ul className="mt-2 space-y-0.5">
                {[
                  { ok: form.password.length >= 12,       label: "At least 12 characters"         },
                  { ok: /[A-Z]/.test(form.password),      label: "1 uppercase letter"              },
                  { ok: /[a-z]/.test(form.password),      label: "1 lowercase letter"              },
                  { ok: /[0-9]/.test(form.password),      label: "1 number"                        },
                  { ok: /[!@#$%^&*]/.test(form.password), label: "1 special character (!@#$%^&*)"  },
                ].map(({ ok, label }) => (
                  <li key={label} className={`text-[11px] flex items-center gap-1.5 ${
                    form.password.length === 0 ? "text-gray-400" : ok ? "text-green-600" : "text-red-500"
                  }`}>
                    <span>{form.password.length === 0 ? "○" : ok ? "✓" : "✗"}</span> {label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm Password</label>
              <input
                type="password"
                name="confirm"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {/* reCAPTCHA v2 — always shown on register */}
            {RECAPTCHA_V2_KEY && (
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
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link href={`/login${redirect !== "/account" ? `?redirect=${redirect}` : ""}`} className="text-gray-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <RegisterForm />
    </Suspense>
  );
}
