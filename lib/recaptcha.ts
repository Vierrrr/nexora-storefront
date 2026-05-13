/**
 * lib/recaptcha.ts
 * Utilities for reCAPTCHA v3 validation on Next.js API routes
 * and shared constants used across the storefront.
 */

export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

/** Minimum score thresholds per action */
export const RECAPTCHA_THRESHOLDS: Record<string, number> = {
  login:    0.3,  // lenient — first failed attempt may have lower score
  register: 0.4,
  default:  0.3,
};

/**
 * Validates a reCAPTCHA v3 token from a Next.js API route.
 * Falls back to `true` (allow) if the secret is not set or Google is unreachable.
 */
export async function verifyRecaptchaToken(
  token: string,
  action: string = "default"
): Promise<{ valid: boolean; score: number; error?: string }> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  // Skip validation if secret not configured (dev/test environments)
  if (!secret) return { valid: true, score: 1 };

  // Empty token → score 0 but still allow (fail-open)
  if (!token) return { valid: true, score: 0, error: "no_token" };

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }).toString(),
    });

    if (!res.ok) return { valid: true, score: 0, error: "google_error" };

    const data: {
      success: boolean;
      score?: number;
      action?: string;
      "error-codes"?: string[];
    } = await res.json();

    const score     = data.score ?? 0;
    const threshold = RECAPTCHA_THRESHOLDS[action] ?? RECAPTCHA_THRESHOLDS.default;
    const valid     = data.success && score >= threshold;

    return { valid, score };
  } catch {
    // Network error → fail open
    return { valid: true, score: 0, error: "network_error" };
  }
}

/** Simple client-side rate limiting using sessionStorage */
export function checkClientRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  if (typeof window === "undefined") return { allowed: true, remaining: maxAttempts, resetIn: 0 };

  const storageKey = `rl_${key}`;
  const now = Date.now();

  try {
    const stored = sessionStorage.getItem(storageKey);
    const data: { attempts: number; windowStart: number } = stored
      ? JSON.parse(stored)
      : { attempts: 0, windowStart: now };

    // Reset if window has passed
    if (now - data.windowStart > windowMs) {
      data.attempts    = 0;
      data.windowStart = now;
    }

    data.attempts++;
    sessionStorage.setItem(storageKey, JSON.stringify(data));

    const remaining = Math.max(0, maxAttempts - data.attempts);
    const resetIn   = Math.max(0, data.windowStart + windowMs - now);

    return { allowed: data.attempts <= maxAttempts, remaining, resetIn };
  } catch {
    return { allowed: true, remaining: maxAttempts, resetIn: 0 };
  }
}
