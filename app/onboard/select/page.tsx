"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Building2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { isApiError } from "@/lib/api/client";
import { STUDIO_HOME } from "@/lib/studio";
import FullScreenLoader from "@/app/_components/FullScreenLoader";

export default function SelectMembershipPage() {
  const router = useRouter();

  const token = useAuthStore((s) => s.token);
  const memberships = useAuthStore((s) => s.memberships);
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const activate = useAuthStore((s) => s.activate);
  const signout = useAuthStore((s) => s.signout);

  const [hydrated, setHydrated] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.resolve(useAuthStore.persist.rehydrate()).then(() =>
      setHydrated(true)
    );
  }, []);

  // De-duplicate memberships by restaurant_id. The backend can return the same
  // (user, restaurant) pair multiple times if the memberships table has
  // duplicate rows; we always render at most one row per restaurant, preferring
  // the strongest role (owner > admin > staff) when roles conflict.
  const uniqueMemberships = useMemo(() => {
    const rank: Record<string, number> = { owner: 3, admin: 2, staff: 1 };
    const byId = new Map<string, (typeof memberships)[number]>();
    for (const m of memberships) {
      const existing = byId.get(m.restaurant_id);
      if (!existing || (rank[m.role] ?? 0) > (rank[existing.role] ?? 0)) {
        byId.set(m.restaurant_id, m);
      }
    }
    return Array.from(byId.values());
  }, [memberships]);

  // Routing decisions once hydrated.
  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      router.replace("/login");
      return;
    }
    if (uniqueMemberships.length === 0) {
      // No restaurant access — kick back to login with context.
      void (async () => {
        await signout();
        router.replace(
          "/login?error=" +
            encodeURIComponent("This account has no restaurant access.")
        );
      })();
      return;
    }
    if (activeRestaurantId) {
      // Already activated; nothing to choose.
      router.replace(STUDIO_HOME);
      return;
    }
    if (uniqueMemberships.length === 1) {
      // Auto-activate if there's effectively only one restaurant (after de-dup).
      void (async () => {
        try {
          await activate(uniqueMemberships[0].restaurant_id);
          router.replace(STUDIO_HOME);
        } catch (e) {
          setError(isApiError(e) ? e.error : "Could not activate restaurant.");
        }
      })();
    }
  }, [hydrated, token, uniqueMemberships, activeRestaurantId, activate, signout, router]);

  const showChooser = useMemo(() => {
    return (
      hydrated &&
      !!token &&
      uniqueMemberships.length > 1 &&
      !activeRestaurantId
    );
  }, [hydrated, token, uniqueMemberships.length, activeRestaurantId]);

  const onPick = async (restaurantId: string) => {
    setError(null);
    setActivatingId(restaurantId);
    try {
      await activate(restaurantId);
      router.replace(STUDIO_HOME);
    } catch (e) {
      setError(isApiError(e) ? e.error : "Could not activate restaurant.");
      setActivatingId(null);
    }
  };

  const onSignOutTo = async (target: "/login" | "/onboard") => {
    await signout();
    router.replace(target);
  };

  if (!showChooser) {
    return <FullScreenLoader />;
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: "#F5F7FA" }}
    >
      <div
        className="w-full max-w-md p-7"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E7EB",
        }}
      >
        <div className="text-center mb-6">
          <div
            className="w-11 h-11 mx-auto mb-3 flex items-center justify-center text-base font-bold"
            style={{ backgroundColor: "#0F2B4D", color: "#FFFFFF" }}
          >
            R
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#1E1E1E" }}>
            Choose a restaurant
          </h1>
          <p className="text-xs mt-1" style={{ color: "#4A4A4A" }}>
            You manage more than one. Pick the one you want to open.
          </p>
        </div>

        {error && (
          <div
            className="text-sm px-3.5 py-2.5 mb-4"
            style={{
              backgroundColor: "#FEF2F2",
              color: "#DC2626",
              border: "1px solid #DC2626",
              borderRadius: 4,
            }}
          >
            {error}
          </div>
        )}

        <ul className="space-y-2">
          {uniqueMemberships.map((m) => {
            const busy = activatingId === m.restaurant_id;
            const disabled = activatingId !== null && !busy;
            return (
              <li key={m.restaurant_id}>
                <button
                  type="button"
                  onClick={() => onPick(m.restaurant_id)}
                  disabled={disabled || busy}
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-slate-50 disabled:opacity-50"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5E7EB",
                    borderRadius: 6,
                    color: "#1E1E1E",
                  }}
                >
                  <div
                    className="w-9 h-9 flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#0F2B4D", color: "#FFFFFF" }}
                  >
                    <Building2 size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {m.restaurant_name || "Untitled restaurant"}
                    </p>
                    <p className="text-xs capitalize" style={{ color: "#4A4A4A" }}>
                      {m.role}
                    </p>
                  </div>
                  {busy ? (
                    <span className="text-xs font-semibold" style={{ color: "#4A4A4A" }}>
                      Opening…
                    </span>
                  ) : (
                    <ChevronRight size={16} style={{ color: "#6B7280" }} />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div
          className="text-xs text-center mt-6 pt-4 space-y-2"
          style={{ color: "#4A4A4A", borderTop: "1px solid #E5E7EB" }}
        >
          <p>
            Wrong account?{" "}
            <button
              type="button"
              onClick={() => void onSignOutTo("/login")}
              className="font-semibold underline"
              style={{ color: "#0F2B4D" }}
            >
              Sign in
            </button>{" "}
            with a different one.
          </p>
          <p>
            Want to add another restaurant?{" "}
            <button
              type="button"
              onClick={() => void onSignOutTo("/onboard")}
              className="font-semibold underline"
              style={{ color: "#0F2B4D" }}
            >
              Create a new account
            </button>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
