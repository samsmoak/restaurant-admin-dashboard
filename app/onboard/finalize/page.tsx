"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { STUDIO_HOME, STUDIO_LOGIN } from "@/lib/studio";
import { isApiError } from "@/lib/api/client";

export default function OnboardFinalizePage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invite = searchParams.get("invite");
  const token = useAuthStore((s) => s.token);
  const hydrate = useAuthStore((s) => s.hydrate);
  const finalize = useAuthStore((s) => s.finalize);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!invite) return;
    if (!token) {
      router.push(`${STUDIO_LOGIN}?error=${encodeURIComponent("Please sign in to finish onboarding")}`);
      return;
    }
    // If onboard/OnboardForm already finalized, `activeRestaurantId` is set —
    // go straight to the studio.
    const state = useAuthStore.getState();
    if (state.activeRestaurantId) {
      router.push(STUDIO_HOME);
      return;
    }
    void (async () => {
      try {
        await finalize(invite);
        router.push(STUDIO_HOME);
      } catch (e) {
        const msg = isApiError(e) ? e.error : "Could not finish onboarding";
        router.push(`${STUDIO_LOGIN}?error=${encodeURIComponent(msg)}`);
      }
    })();
  }, [invite, token, finalize, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-sm" style={{ color: "#64748B" }}>
        Finalizing your admin setup…
      </p>
    </main>
  );
}
