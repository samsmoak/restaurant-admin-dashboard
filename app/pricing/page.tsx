"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth.store";
import {
  useSubscriptionStore,
  isSubscriptionActive,
} from "@/lib/stores/subscription.store";
import { isApiError } from "@/lib/api/client";

const FEATURES = [
  "Live orders dashboard with real-time updates",
  "Full menu & category management",
  "Analytics — revenue, trends, top items",
  "Team management & staff invites",
  "Customer-facing ordering site included",
  "Unlimited orders, no per-order fees",
];

export default function PricingPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const subscription = useSubscriptionStore((s) => s.subscription);
  const subLoading = useSubscriptionStore((s) => s.loading);
  const fetchSubscription = useSubscriptionStore((s) => s.fetch);
  const createSetupCheckout = useSubscriptionStore(
    (s) => s.createSetupCheckout
  );
  const createSubscriptionCheckout = useSubscriptionStore(
    (s) => s.createSubscriptionCheckout
  );

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Require auth — bounce to login if no token
  useEffect(() => {
    const init = async () => {
      await Promise.resolve(useAuthStore.persist.rehydrate());
      if (!useAuthStore.getState().token) {
        router.replace("/login");
      }
    };
    void init();
  }, [router]);

  // Always re-fetch on mount so returning from Stripe shows updated status
  useEffect(() => {
    if (!token) return;
    void fetchSubscription();
  }, [token, fetchSubscription]);

  // Auto-redirect once fully active
  useEffect(() => {
    if (subscription && isSubscriptionActive(subscription)) {
      router.replace("/");
    }
  }, [subscription, router]);

  const setupFeePaid = subscription?.setup_fee_paid ?? false;
  const subscriptionActive =
    subscription?.subscription_status === "active" ||
    subscription?.subscription_status === "trialing";

  const step1Done = setupFeePaid;
  const step2Done = subscriptionActive;

  const handleCheckout = async () => {
    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      const returnUrl = window.location.href;
      let url: string;
      if (!setupFeePaid) {
        url = await createSetupCheckout(returnUrl);
      } else {
        url = await createSubscriptionCheckout(returnUrl);
      }
      window.location.href = url;
    } catch (e) {
      setCheckoutLoading(false);
      setCheckoutError(
        isApiError(e) ? e.error : "Something went wrong. Please try again."
      );
    }
  };

  const isLoading = subLoading && !subscription;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#F5F7FA" }}
    >
      {/* Logo / header */}
      <div className="flex items-center gap-3 mb-10">
        <div
          className="w-10 h-10 flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: "#0F2B4D", color: "#FFFFFF" }}
        >
          R
        </div>
        <span className="text-xl font-bold" style={{ color: "#0F2B4D" }}>
          Restoro
        </span>
      </div>

      <div className="w-full max-w-lg">
        {/* Title */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: "#1E1E1E" }}
          >
            Activate your restaurant
          </h1>
          <p className="text-sm" style={{ color: "#4A4A4A" }}>
            Two quick steps to get your restaurant live and taking orders.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-6">
          <StepPill
            number={1}
            label="Setup fee"
            done={step1Done}
            active={!step1Done}
          />
          <div
            className="flex-1 h-px"
            style={{
              backgroundColor: step1Done ? "#0F2B4D" : "#E5E7EB",
            }}
          />
          <StepPill
            number={2}
            label="Monthly plan"
            done={step2Done}
            active={step1Done && !step2Done}
          />
        </div>

        {/* Plan card */}
        <div
          className="p-8"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
          }}
        >
          {/* Pricing */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="text-4xl font-bold"
                style={{ color: "#0F2B4D" }}
              >
                $2,000
              </span>
              <span className="text-sm font-medium" style={{ color: "#4A4A4A" }}>
                one-time setup
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="text-2xl font-bold"
                style={{ color: "#1E1E1E" }}
              >
                $79
              </span>
              <span className="text-sm" style={{ color: "#4A4A4A" }}>
                / month thereafter
              </span>
            </div>
          </div>

          {/* Divider */}
          <div
            className="mb-6"
            style={{ borderTop: "1px solid #E5E7EB" }}
          />

          {/* Features */}
          <ul className="space-y-3 mb-8">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span
                  className="mt-0.5 w-5 h-5 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#0F2B4D", color: "#FFFFFF" }}
                >
                  <Check size={12} strokeWidth={3} />
                </span>
                <span className="text-sm" style={{ color: "#1E1E1E" }}>
                  {f}
                </span>
              </li>
            ))}
          </ul>

          {/* Error */}
          {checkoutError && (
            <div
              className="mb-4 px-4 py-3 text-sm"
              style={{
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#DC2626",
              }}
            >
              {checkoutError}
            </div>
          )}

          {/* CTA button */}
          {isLoading ? (
            <div className="flex justify-center py-3">
              <Loader2
                size={22}
                className="animate-spin"
                style={{ color: "#0F2B4D" }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutLoading || step2Done}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#0F2B4D", color: "#FFFFFF" }}
            >
              {checkoutLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  {!setupFeePaid ? (
                    <>
                      Pay setup fee — $2,000
                      <ChevronRight size={16} />
                    </>
                  ) : !subscriptionActive ? (
                    <>
                      Subscribe — $79/month
                      <ChevronRight size={16} />
                    </>
                  ) : (
                    "Subscription active"
                  )}
                </>
              )}
            </button>
          )}

          {/* Step context note */}
          {!isLoading && (
            <p
              className="text-xs text-center mt-3"
              style={{ color: "#4A4A4A" }}
            >
              {!setupFeePaid
                ? "Step 1 of 2 — You'll be taken to a secure Stripe checkout."
                : !subscriptionActive
                ? "Step 2 of 2 — Set up your $79/month subscription to go live."
                : "Both steps complete. Redirecting you to your dashboard…"}
            </p>
          )}
        </div>

        {/* Footer note */}
        <p
          className="text-xs text-center mt-6"
          style={{ color: "#4A4A4A" }}
        >
          Payments are processed securely by Stripe. Cancel your subscription
          any time from your billing settings.
        </p>
      </div>
    </div>
  );
}

function StepPill({
  number,
  label,
  done,
  active,
}: {
  number: number;
  label: string;
  done: boolean;
  active: boolean;
}) {
  const bg = done || active ? "#0F2B4D" : "#E5E7EB";
  const color = done || active ? "#FFFFFF" : "#4A4A4A";
  const labelColor = done || active ? "#1E1E1E" : "#4A4A4A";

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        className="w-7 h-7 flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: bg, color }}
      >
        {done ? <Check size={12} strokeWidth={3} /> : number}
      </div>
      <span className="text-sm font-medium" style={{ color: labelColor }}>
        {label}
      </span>
    </div>
  );
}
