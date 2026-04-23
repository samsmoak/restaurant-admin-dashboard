"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import { STUDIO_HOME } from "@/lib/studio";
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

  const token = useAuthStore((s) => s.token);
  const activate = useAuthStore((s) => s.activate);
  const fetchMine = useRestaurantStore((s) => s.fetchMine);
  const restaurant = useRestaurantStore((s) => s.restaurant);

  // On first mount: hydrate auth + figure out which step to resume at.
  useEffect(() => {
    const go = async () => {
      // Rehydrate persisted zustand state (token lives in localStorage).
      const authPersist = useAuthStore.persist;
      const p = authPersist.rehydrate();
      if (p && typeof (p as Promise<unknown>).then === "function") {
        await (p as Promise<unknown>);
      }

      const freshToken = useAuthStore.getState().token;
      if (!freshToken) {
        setIndex(0);
        setReady(true);
        return;
      }

      // Signed in — see if they already own a restaurant.
      const mine = await fetchMine();
      if (mine.length === 0) {
        setIndex(1);
        setReady(true);
        return;
      }
      const r = mine[0];
      // Make sure the admin JWT is scoped so subsequent steps can PATCH.
      if (!useAuthStore.getState().activeRestaurantId) {
        await activate(r.id);
      }
      // Fetch full restaurant so store is hydrated for downstream steps.
      await useRestaurantStore.getState().fetch();

      const completed = new Set(r.onboarding_completed_steps ?? []);
      if (completed.has("branding")) {
        // All five steps done — send to the dashboard.
        router.replace(STUDIO_HOME);
        return;
      }
      // Skip past completed middle steps.
      if (!completed.has("restaurant")) setIndex(1);
      else if (!completed.has("location")) setIndex(2);
      else if (!completed.has("hours")) setIndex(3);
      else setIndex(4);
      setReady(true);
    };
    void go();
  }, [activate, fetchMine, router]);

  const completedKeys = useMemo(() => {
    const set = new Set<string>();
    if (token) set.add("account");
    for (const s of restaurant?.onboarding_completed_steps ?? []) set.add(s);
    return set;
  }, [token, restaurant]);

  const goNext = () => setIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setIndex((i) => Math.max(i - 1, 0));
  const finish = () => {
    router.replace(STUDIO_HOME);
    router.refresh();
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          className="rounded-full"
          style={{
            width: 32,
            height: 32,
            border: "3px solid #E2E8F0",
            borderTopColor: "#FF5A3C",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
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
