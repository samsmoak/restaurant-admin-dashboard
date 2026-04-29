"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import { isApiError } from "@/lib/api/client";
import { STUDIO_HOME } from "@/lib/studio";
import FullScreenLoader from "@/app/_components/FullScreenLoader";
import ProgressBar, { type Step } from "./_components/ProgressBar";
import StepAccount from "./steps/StepAccount";
import StepRestaurant from "./steps/StepRestaurant";
import StepLocation from "./steps/StepLocation";
import StepHours from "./steps/StepHours";
import StepBranding from "./steps/StepBranding";

const STEPS: Step[] = [
  { key: "account", title: "Account" },
  { key: "restaurant", title: "Restaurant" },
  { key: "location", title: "Location" },
  { key: "hours", title: "Hours" },
  { key: "branding", title: "Branding" },
];

export default function OnboardWizard() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);

  const token = useAuthStore((s) => s.token);
  const activate = useAuthStore((s) => s.activate);
  const signout = useAuthStore((s) => s.signout);
  const fetchMine = useRestaurantStore((s) => s.fetchMine);
  const restaurant = useRestaurantStore((s) => s.restaurant);

  // On first mount: hydrate auth + figure out which step to resume at.
  useEffect(() => {
    let cancelled = false;
    const go = async () => {
      setInitError(null);
      setReady(false);
      try {
        // Rehydrate persisted zustand state (token lives in localStorage).
        await Promise.resolve(useAuthStore.persist.rehydrate());

        const freshToken = useAuthStore.getState().token;
        if (!freshToken) {
          if (cancelled) return;
          setIndex(0);
          setReady(true);
          return;
        }

        // Signed in — see if they already own a restaurant.
        const mine = await fetchMine();
        if (cancelled) return;
        if (mine.length === 0) {
          setIndex(1);
          setReady(true);
          return;
        }
        const r = mine[0];
        if (!useAuthStore.getState().activeRestaurantId) {
          await activate(r.id);
          if (cancelled) return;
        }
        await useRestaurantStore.getState().fetch();
        if (cancelled) return;

        const completed = new Set(r.onboarding_completed_steps ?? []);
        if (completed.has("branding")) {
          router.replace("/billing");
          return;
        }
        if (!completed.has("restaurant")) setIndex(1);
        else if (!completed.has("location")) setIndex(2);
        else if (!completed.has("hours")) setIndex(3);
        else setIndex(4);
        setReady(true);
      } catch (e) {
        if (cancelled) return;
        // 401 is handled globally by the API client (clears token, navigates
        // to /login) — don't render an error card for that case.
        if (isApiError(e) && e.status === 401) return;
        setInitError(
          isApiError(e) ? e.error : "We couldn't load your account. Please try again."
        );
        setReady(true);
      }
    };
    void go();
    return () => {
      cancelled = true;
    };
  }, [activate, fetchMine, router, retryNonce]);

  const completedKeys = useMemo(() => {
    const set = new Set<string>();
    if (token) set.add("account");
    for (const s of restaurant?.onboarding_completed_steps ?? []) set.add(s);
    return set;
  }, [token, restaurant]);

  const goNext = () => setIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setIndex((i) => Math.max(i - 1, 0));
  const finish = () => {
    router.replace("/billing");
  };

  if (!ready) {
    return <FullScreenLoader />;
  }

  if (initError) {
    return <InitErrorCard error={initError} onRetry={() => setRetryNonce((n) => n + 1)} onSignOut={async () => {
      await signout();
      router.replace("/login");
    }} />;
  }

  return (
    <div className="max-w-xl mx-auto">
      <header className="text-center mb-6">
        <div
          className="w-12 h-12 mx-auto mb-3 flex items-center justify-center text-xl font-bold"
          style={{ backgroundColor: "#0F2B4D", color: "#FFFFFF" }}
        >
          S
        </div>
        <h1 className="text-3xl font-bold" style={{ color: "#1E1E1E" }}>
          Let&apos;s set up your restaurant
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "#4A4A4A" }}>
          5 quick steps. You can leave and come back — your progress is saved.
        </p>
      </header>
      <ProgressBar steps={STEPS} currentIndex={index} completedKeys={completedKeys} />
      <AnimatePresence mode="wait">
        {index === 0 && <StepAccount key="account" onDone={goNext} />}
        {index === 1 && (
          <StepRestaurant
            key="restaurant"
            onDone={goNext}
            onBack={token ? undefined : goBack}
            initialName={restaurant?.name}
            initialPhone={restaurant?.phone}
          />
        )}
        {index === 2 && (
          <StepLocation
            key="location"
            onDone={goNext}
            onBack={goBack}
            initial={{
              formatted_address: restaurant?.formatted_address,
              latitude: restaurant?.latitude,
              longitude: restaurant?.longitude,
              place_id: restaurant?.place_id,
            }}
          />
        )}
        {index === 3 && (
          <StepHours
            key="hours"
            onDone={goNext}
            onBack={goBack}
            initial={{ hours: restaurant?.opening_hours, currency: restaurant?.currency }}
          />
        )}
        {index === 4 && (
          <StepBranding
            key="branding"
            onDone={finish}
            onBack={goBack}
            initialLogoUrl={restaurant?.logo_url ?? null}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function InitErrorCard({
  error,
  onRetry,
  onSignOut,
}: {
  error: string;
  onRetry: () => void;
  onSignOut: () => void;
}) {
  return (
    <div className="max-w-md mx-auto">
      <div
        className="p-7 text-center"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
      >
        <div
          className="w-11 h-11 mx-auto mb-3 flex items-center justify-center text-base font-bold"
          style={{ backgroundColor: "#0F2B4D", color: "#FFFFFF" }}
        >
          S
        </div>
        <h2 className="text-lg font-bold" style={{ color: "#1E1E1E" }}>
          Something went wrong
        </h2>
        <p className="text-sm mt-2" style={{ color: "#4A4A4A" }}>
          {error}
        </p>
        <div className="flex flex-col gap-2 mt-5">
          <button
            type="button"
            onClick={onRetry}
            className="w-full py-2.5 font-semibold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: "#0F2B4D", color: "#FFFFFF", borderRadius: 6 }}
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2.5 font-semibold text-sm transition-colors hover:bg-slate-50"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#1E1E1E",
              border: "1px solid #E5E7EB",
              borderRadius: 6,
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
