"use client";

/**
 * Google sign-in button (admin side). Uses Google Identity Services to get an
 * ID token, then forwards to the Go `/api/auth/google`. After sign-in, if the
 * user has exactly one admin membership, the store auto-activates it.
 */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useAuthStore } from "@/lib/stores/auth.store";
import { isApiError } from "@/lib/api/client";

type Props = { next: string; label?: string };
type GISCredentialResponse = { credential: string };

// The Google Identity Services library attaches `google.accounts` to window.
// We avoid declaring a module-level `google` global here because @types/google.maps
// (pulled in by @react-google-maps/api) already owns that identifier.
type GISAccountsId = {
  initialize: (opts: {
    client_id: string;
    callback: (r: GISCredentialResponse) => void;
  }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
  prompt: () => void;
};

function getGISAccounts(): GISAccountsId | null {
  if (typeof window === "undefined") return null;
  const g = (window as unknown as { google?: { accounts?: { id?: GISAccountsId } } }).google;
  return g?.accounts?.id ?? null;
}

export default function GoogleAuthButton({ next, label }: Props) {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signInWithGoogle);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID?.trim() ?? "";

  useEffect(() => {
    if (!clientId || !ready) return;
    const gisId = getGISAccounts();
    if (!gisId) return;

    gisId.initialize({
      client_id: clientId,
      callback: async (resp: GISCredentialResponse) => {
        if (!resp?.credential) return;
        setError(null);
        try {
          await signIn(resp.credential);
          const { memberships, activeRestaurantId } = useAuthStore.getState();
          if (memberships.length === 0) {
            setError("This account is not a restaurant admin.");
            return;
          }
          if (!activeRestaurantId && memberships.length > 1) {
            router.push("/onboard/select");
            return;
          }
          router.push(next);
          router.refresh();
        } catch (e) {
          setError(isApiError(e) ? e.error : "Google sign-in failed");
        }
      },
    });

    if (buttonRef.current) {
      gisId.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "pill",
        text: label === "Sign up with Google" ? "signup_with" : "continue_with",
        logo_alignment: "left",
      });
    }
  }, [clientId, ready, label, next, router, signIn]);

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        title="NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID is not set"
        className="w-full py-3 rounded-full font-semibold text-sm opacity-60 cursor-not-allowed"
        style={{
          backgroundColor: "#FFFFFF",
          color: "#1A1A1A",
          border: "1.5px solid #ECECEC",
        }}
      >
        Google sign-in not configured
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      {error && (
        <div
          className="text-sm px-4 py-2.5 rounded-lg"
          style={{
            backgroundColor: "rgba(220, 38, 38, 0.08)",
            color: "#B91C1C",
            border: "1px solid rgba(220, 38, 38, 0.25)",
          }}
        >
          {error}
        </div>
      )}
      <div ref={buttonRef} className="flex justify-center" />
    </div>
  );
}
