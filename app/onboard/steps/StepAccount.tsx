"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { isApiError } from "@/lib/api/client";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import StepShell from "../_components/StepShell";

export default function StepAccount({ onDone }: { onDone: () => void }) {
  const signup = useAuthStore((s) => s.signup ?? (async () => {}));
  const login = useAuthStore((s) => s.login);

  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (fullName.trim().length < 2) return setError("Full name is required.");
      if (password.length < 8) return setError("Password must be at least 8 characters.");
      if (password !== confirm) return setError("Passwords don't match.");
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signup({
          full_name: fullName.trim(),
          email: email.trim(),
          // The Go backend demands a phone on customer signup; we collect the
          // real restaurant phone in step 2, so placeholder is fine for the
          // user record itself.
          phone: "0000000000",
          password,
        });
      } else {
        await login(email.trim(), password);
      }
      onDone();
    } catch (e) {
      setError(isApiError(e) ? e.error : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepShell
      eyebrow="Step 1 of 5"
      title="Create your admin account"
      description="You'll use this to manage orders, menu, and settings."
      footer={
        <button
          form="step-account"
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
          style={{ backgroundColor: "#111318", color: "#FFFFFF" }}
        >
          {submitting ? "Creating…" : mode === "signup" ? "Create account & continue" : "Sign in & continue"}
        </button>
      }
    >
      <GoogleAuthButton next="/onboard" label={mode === "signup" ? "Sign up with Google" : "Continue with Google"} />

      <div className="flex items-center gap-3 my-1">
        <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
        <span className="text-xs font-semibold tracking-[0.2em]" style={{ color: "#94A3B8" }}>
          OR
        </span>
        <div className="flex-1 h-px" style={{ background: "#E2E8F0" }} />
      </div>

      <form id="step-account" onSubmit={submit} className="space-y-3">
        {error && (
          <div
            className="text-sm px-4 py-2.5 rounded-lg"
            style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
          >
            {error}
          </div>
        )}

        {mode === "signup" && (
          <Field label="Full name *">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: "1px solid #E2E8F0", color: "#0F172A", backgroundColor: "#FFFFFF" }}
              placeholder="Alex Rivera"
            />
          </Field>
        )}

        <Field label="Email *">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: "1px solid #E2E8F0", color: "#0F172A", backgroundColor: "#FFFFFF" }}
            placeholder="owner@restaurant.com"
          />
        </Field>

        <Field label={mode === "signup" ? "Password (8+ chars) *" : "Password *"}>
          <input
            type="password"
            required
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={mode === "signup" ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={{ border: "1px solid #E2E8F0", color: "#0F172A", backgroundColor: "#FFFFFF" }}
            placeholder="••••••••"
          />
        </Field>

        {mode === "signup" && (
          <Field label="Confirm password *">
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ border: "1px solid #E2E8F0", color: "#0F172A", backgroundColor: "#FFFFFF" }}
              placeholder="••••••••"
            />
          </Field>
        )}

        <p className="text-xs text-center" style={{ color: "#64748B" }}>
          {mode === "signup" ? "Already have an account? " : "New here? "}
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode((m) => (m === "signup" ? "login" : "signup"));
            }}
            className="font-semibold underline"
            style={{ color: "#0F172A" }}
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </form>
    </StepShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
