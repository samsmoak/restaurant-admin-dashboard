"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/endpoints";
import { setStoredToken, isApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { STUDIO_LOGIN, STUDIO_ONBOARD } from "@/lib/studio";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import {
  adminOnboardSchema,
  type AdminOnboardFormData,
} from "@/lib/utils/validators";

export default function OnboardForm({ invite }: { invite: string }) {
  const router = useRouter();
  const [form, setForm] = useState<AdminOnboardFormData>({
    fullName: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalizePath = `${STUDIO_ONBOARD}/finalize?invite=${encodeURIComponent(invite)}`;

  const update =
    <K extends keyof AdminOnboardFormData>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = adminOnboardSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setLoading(true);
    try {
      // Create a base customer user (the Go backend reuses customer signup
      // for admin onboarding; the invite claim promotes the user to admin).
      const signupResp = await authApi.signupCustomer({
        full_name: parsed.data.fullName,
        email: parsed.data.email,
        phone: "0000000000",
        password: parsed.data.password,
      });
      setStoredToken(signupResp.token);
      // Immediately claim the invite — the Go backend returns a
      // restaurant-scoped admin token.
      const result = await authApi.finalize(invite);
      setStoredToken(result.token);
      useAuthStore.setState({
        token: result.token,
        activeRestaurantId: result.restaurant_id,
        activeRestaurantSlug: result.restaurant_slug,
        activeRole: result.role,
      });
      router.push(finalizePath);
      router.refresh();
    } catch (e) {
      setError(isApiError(e) ? e.error : "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div
          className="text-sm px-4 py-3 rounded-lg"
          style={{
            backgroundColor: "#FEF2F2",
            color: "#DC2626",
            border: "1px solid #FECACA",
          }}
        >
          {error}
        </div>
      )}

      {/* Google */}
      <GoogleAuthButton next={finalizePath} label="Sign up with Google" />

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

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full name">
          <input
            type="text"
            value={form.fullName}
            onChange={update("fullName")}
            required
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{
              border: "1px solid #E2E8F0",
              color: "#0F172A",
              backgroundColor: "#FFFFFF",
            }}
            placeholder="Alex Rivera"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={update("email")}
            required
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{
              border: "1px solid #E2E8F0",
              color: "#0F172A",
              backgroundColor: "#FFFFFF",
            }}
            placeholder="owner@restaurant.com"
          />
        </Field>

        <Field label="Password (10+ chars)">
          <input
            type="password"
            value={form.password}
            onChange={update("password")}
            required
            autoComplete="new-password"
            minLength={10}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{
              border: "1px solid #E2E8F0",
              color: "#0F172A",
              backgroundColor: "#FFFFFF",
            }}
            placeholder="••••••••••"
          />
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
          style={{ backgroundColor: "#111318", color: "#FFFFFF" }}
        >
          {loading ? "Creating account..." : "Create Admin Account"}
        </button>

        <p className="text-xs text-center" style={{ color: "#64748B" }}>
          Already have an account?{" "}
          <a
            href={STUDIO_LOGIN}
            className="font-medium underline"
            style={{ color: "#0F172A" }}
          >
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: "#0F172A" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
