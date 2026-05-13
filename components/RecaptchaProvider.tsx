"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

const RECAPTCHA_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

export default function RecaptchaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // If no key is configured, render children directly (dev/test mode)
  if (!RECAPTCHA_KEY) return <>{children}</>;

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={RECAPTCHA_KEY}
      scriptProps={{ async: true, defer: true }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
