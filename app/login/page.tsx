"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Mail } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { isApiError } from "@/lib/api/client";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { STUDIO_HOME } from "@/lib/studio";
import FullScreenLoader from "@/app/_components/FullScreenLoader";

type Mode = "choose" | "email";

const BTN_RADIUS = 6;

export default function LoginPage() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");

  const login = useAuthStore((s) => s.login);
  const token = useAuthStore((s) => s.token);
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);

  const [mode, setMode] = useState<Mode>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>(initialError ?? "");
  const [loading, setLoading] = useState(false);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    Promise.resolve(useAuthStore.persist.rehydrate()).then(() =>
      setHydrated(true)
    );
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (token && activeRestaurantId) {
      router.replace(STUDIO_HOME);
    }
  }, [hydrated, token, activeRestaurantId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      const { memberships, activeRestaurantId, signout } = useAuthStore.getState();
      if (memberships.length === 0) {
        await signout();
        setError(
          "This account is not a restaurant admin. Ask your owner for an invite."
        );
        setLoading(false);
        return;
      }
      if (!activeRestaurantId && memberships.length > 1) {
        router.push("/onboard/select");
        return;
      }
      router.push(STUDIO_HOME);
      router.refresh();
    } catch (e) {
      setError(isApiError(e) ? e.error : "An unexpected error occurred");
      setLoading(false);
    }
  };

  if (!hydrated || (token && activeRestaurantId)) {
    return <FullScreenLoader />;
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#F5F7FA" }}
    >
      <div
        className="w-full max-w-sm p-7"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E7EB",
        }}
      >
        <div className="text-center mb-7">
          <div
            className="w-11 h-11 mx-auto mb-3 flex items-center justify-center text-base font-bold"
            style={{ backgroundColor: "#0F2B4D", color: "#FFFFFF" }}
          >
            R
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#1E1E1E" }}>
            Welcome back
          </h1>
          <p className="text-xs mt-1" style={{ color: "#4A4A4A" }}>
            Sign in to manage your restaurant
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

        {mode === "choose" ? (
          <div className="space-y-3">
            <GoogleAuthButton next={STUDIO_HOME} />

            <button
              type="button"
              onClick={() => setMode("email")}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 font-semibold text-sm transition-all hover:opacity-90"
              style={{
                backgroundColor: "#0F2B4D",
                color: "#FFFFFF",
                borderRadius: BTN_RADIUS,
              }}
            >
              <Mail size={15} />
              Sign in with Email
            </button>

            <p className="text-xs text-center pt-1" style={{ color: "#4A4A4A" }}>
              Only existing restaurant admins can use Google sign-in.
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setMode("choose");
                setError("");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:underline mb-4"
              style={{ color: "#4A4A4A" }}
            >
              <ChevronLeft size={14} />
              Back to options
            </button>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "#4A4A4A" }}
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#0F2B4D]"
                  style={{
                    border: "1px solid #E5E7EB",
                    color: "#1E1E1E",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 4,
                  }}
                  placeholder="admin@restaurant.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: "#4A4A4A" }}
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#0F2B4D]"
                  style={{
                    border: "1px solid #E5E7EB",
                    color: "#1E1E1E",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 4,
                  }}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 font-semibold text-sm transition-all disabled:opacity-50 hover:opacity-90 mt-1"
                style={{
                  backgroundColor: "#0F2B4D",
                  color: "#FFFFFF",
                  borderRadius: BTN_RADIUS,
                }}
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </>
        )}

        <p
          className="text-xs text-center mt-5 pt-4"
          style={{ color: "#4A4A4A", borderTop: "1px solid #E5E7EB" }}
        >
          New here?{" "}
          <a
            href="/onboard"
            className="font-semibold underline"
            style={{ color: "#0F2B4D" }}
          >
            Create your restaurant account
          </a>
        </p>
      </div>
    </main>
  );
}
