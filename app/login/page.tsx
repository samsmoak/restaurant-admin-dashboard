"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import { isApiError } from "@/lib/api/client";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { STUDIO_HOME } from "@/lib/studio";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");

  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>(initialError ?? "");
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div
        className="w-full max-w-md rounded-2xl p-8 shadow-lg"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: "#111318", color: "#E8A045" }}
          >
            E&F
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#0F172A" }}>
            Restaurant Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            Sign in to manage your restaurant
          </p>
        </div>

        {error && (
          <div
            className="text-sm px-4 py-3 rounded-lg mb-4"
            style={{
              backgroundColor: "#FEF2F2",
              color: "#DC2626",
              border: "1px solid #FECACA",
            }}
          >
            {error}
          </div>
        )}

        {/* OAuth */}
        <div className="mb-2">
          <GoogleAuthButton next={STUDIO_HOME} />
        </div>
        <p
          className="text-xs text-center mt-2 mb-4"
          style={{ color: "#64748B" }}
        >
          Only existing restaurant admins can use Google sign-in. New owners
          need an invite.
        </p>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
          <span
            className="text-xs font-semibold tracking-[0.2em]"
            style={{ color: "#94A3B8" }}
          >
            OR
          </span>
          <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "#0F172A" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                border: "1px solid #E2E8F0",
                color: "#0F172A",
                backgroundColor: "#FFFFFF",
              }}
              placeholder="admin@restaurant.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1.5"
              style={{ color: "#0F172A" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{
                border: "1px solid #E2E8F0",
                color: "#0F172A",
                backgroundColor: "#FFFFFF",
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
            style={{ backgroundColor: "#111318", color: "#FFFFFF" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}
