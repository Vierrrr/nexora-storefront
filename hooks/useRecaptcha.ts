"use client";

/**
 * hooks/useRecaptcha.ts
 * Custom hook that wraps react-google-recaptcha-v3's useGoogleReCaptcha
 * with a simpler API: just call `getToken(action)` to get a v3 token.
 * Returns an empty string if reCAPTCHA is not configured or fails.
 */

import { useCallback } from "react";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export function useRecaptcha() {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getToken = useCallback(
    async (action: string = "default"): Promise<string> => {
      if (!executeRecaptcha) return "";
      try {
        const token = await executeRecaptcha(action);
        return token ?? "";
      } catch {
        // reCAPTCHA failed — return empty, backend will fail-open
        return "";
      }
    },
    [executeRecaptcha]
  );

  const isReady = !!executeRecaptcha;

  return { getToken, isReady };
}
