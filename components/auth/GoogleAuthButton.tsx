"use client";

/**
 * Google sign-in button (admin side). Uses Google Identity Services to get an
 * ID token, then forwards to the Go `/api/auth/google`. After sign-in, if the
 * user has exactly one admin membership, the store auto-activates it.
 */

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useAuthStore } from "@/lib/stores/auth.store";
import { isApiError } from "@/lib/api/client";
import NoMembershipCTA from "@/components/auth/NoMembershipCTA";

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
  const signIn = useAuthStore((s) => s.signInWithGoogle);
  const [error, setError] = useState<string | null>(null);
  const [noMembership, setNoMembership] = useState(false);
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
        setNoMembership(false);
        try {
          await signIn(resp.credential);
          const { memberships, activeRestaurantId } = useAuthStore.getState();
          // On the signup wizard (next === "/onboard"), having zero memberships
          // is the expected state — the user is in the middle of creating one.
          // Just advance the wizard by reloading /onboard so its init effect
          // sees the new token and moves to step 2 (Restaurant).
          if (memberships.length === 0 && next !== "/onboard") {
            setNoMembership(true);
            return;
          }
          if (!activeRestaurantId && memberships.length > 1) {
            window.location.assign("/onboard/select");
            return;
          }
          window.location.assign(next);
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
        shape: "rectangular",
        text: label === "Sign up with Google" ? "signup_with" : "continue_with",
        logo_alignment: "left",
        width: buttonRef.current.offsetWidth || 320,
      });
    }
  }, [clientId, ready, label, next, signIn]);

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        title="NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID is not set"
        className="w-full py-3 font-semibold text-sm opacity-60 cursor-not-allowed"
        style={{
          backgroundColor: "#FFFFFF",
          color: "#1E1E1E",
          border: "1px solid #E5E7EB",
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
      {noMembership ? (
        <NoMembershipCTA
          variant="inline"
          onTryAgain={async () => {
            await useAuthStore.getState().signout();
            setNoMembership(false);
          }}
        />
      ) : (
        <>
          {error && (
            <div
              className="text-sm px-4 py-2.5"
              style={{
                backgroundColor: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #DC2626",
              }}
            >
              {error}
            </div>
          )}
          <div ref={buttonRef} className="flex justify-center" />
        </>
      )}
    </div>
  );
}
