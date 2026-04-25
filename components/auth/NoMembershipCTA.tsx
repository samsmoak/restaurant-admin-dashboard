"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Rendered on the login surfaces (email + Google) when the signed-in user
 * has zero restaurant memberships. Replaces the dead-end "ask your owner"
 * error string with two clear next-steps so brand-new users can self-serve
 * onto the platform instead of bouncing.
 *
 * `onTryAgain` resets the surrounding flow back to its initial state so the
 * user can attempt with a different account from the same screen.
 */
export default function NoMembershipCTA({
  onTryAgain,
  variant = "card",
}: {
  onTryAgain?: () => void;
  variant?: "card" | "inline";
}) {
  const padding = variant === "card" ? "p-5" : "p-4";
  return (
    <div
      className={padding}
      style={{
        backgroundColor: "#F5F7FA",
        border: "1px solid #E5E7EB",
        borderRadius: 6,
      }}
    >
      <p className="text-sm font-semibold mb-1" style={{ color: "#1E1E1E" }}>
        This account isn&apos;t linked to a restaurant yet.
      </p>
      <p className="text-xs mb-4" style={{ color: "#4A4A4A" }}>
        Get set up in a few minutes — no invite needed.
      </p>

      <Link
        href="/onboard"
        className="w-full inline-flex items-center justify-center gap-2 py-2.5 font-semibold text-sm transition-all hover:opacity-90"
        style={{
          backgroundColor: "#0F2B4D",
          color: "#FFFFFF",
          borderRadius: 6,
        }}
      >
        Create a restaurant
        <ArrowRight size={14} />
      </Link>

      {onTryAgain && (
        <p
          className="text-xs text-center mt-3 pt-3"
          style={{ color: "#4A4A4A", borderTop: "1px solid #E5E7EB" }}
        >
          Wrong account?{" "}
          <button
            type="button"
            onClick={onTryAgain}
            className="font-semibold underline"
            style={{ color: "#0F2B4D" }}
          >
            Try a different one
          </button>
          .
        </p>
      )}
    </div>
  );
}
