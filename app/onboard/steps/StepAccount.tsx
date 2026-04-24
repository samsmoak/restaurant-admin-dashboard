"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Loader2, Mail } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { authApi } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/client";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import StepShell from "../_components/StepShell";

type Mode = "choose" | "email";

const BTN_RADIUS = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function looksLikeEmailExists(err: unknown): boolean {
  if (!isApiError(err)) return false;
  if (err.status === 409) return true;
  const msg = err.error.toLowerCase();
  return (
    msg.includes("already") ||
    msg.includes("exists") ||
    msg.includes("registered") ||
    msg.includes("duplicate")
  );
}

export default function StepAccount({ onDone }: { onDone: () => void }) {
  const signup = useAuthStore((s) => s.signup);

  const [mode, setMode] = useState<Mode>("choose");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);
  // Tracks the most recent in-flight check so older results can be discarded.
  const checkSeqRef = useRef(0);

  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setError(null);
    setEmailExists(false);
    setEmailChecking(false);
  };

  // Debounced background check while the user types. All state changes happen
  // inside the deferred timer body so the effect itself does no synchronous
  // setState (avoids cascading-render warnings). Submit-time check is separate
  // (see `submit` below) so we never race a key-press with the POST.
  useEffect(() => {
    if (mode !== "email") return;
    const trimmed = email.trim();
    const seq = ++checkSeqRef.current;
    const timer = window.setTimeout(async () => {
      if (seq !== checkSeqRef.current) return;
      if (!trimmed || !EMAIL_RE.test(trimmed)) {
        setEmailExists(false);
        setEmailChecking(false);
        return;
      }
      setEmailChecking(true);
      try {
        const res = await authApi.checkEmailAvailable(trimmed);
        if (seq !== checkSeqRef.current) return;
        setEmailExists(!res.available);
        setError((prev) => {
          if (!res.available) return "An account with this email already exists.";
          if (prev === "An account with this email already exists.") return null;
          return prev;
        });
      } catch {
        // Endpoint missing or network blip — ignore. Submit-time 409 catch is the safety net.
      } finally {
        if (seq === checkSeqRef.current) setEmailChecking(false);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [email, mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailExists(false);

    if (fullName.trim().length < 2) return setError("Full name is required.");
    const emailTrim = email.trim();
    if (!EMAIL_RE.test(emailTrim)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");

    setSubmitting(true);
    try {
      // Pre-flight: cheap, anonymous, no password sent. Best-effort — if the
      // endpoint is missing or fails, we fall through to the real signup call
      // and rely on the 409 catch below.
      try {
        const res = await authApi.checkEmailAvailable(emailTrim);
        if (!res.available) {
          setEmailExists(true);
          setError("An account with this email already exists.");
          setSubmitting(false);
          emailInputRef.current?.focus();
          return;
        }
      } catch {
        /* swallow — handled by submit-time 409 catch */
      }

      await signup({
        full_name: fullName.trim(),
        email: emailTrim,
        phone: "0000000000",
        password,
      });
      onDone();
    } catch (e) {
      if (looksLikeEmailExists(e)) {
        setEmailExists(true);
        setError("An account with this email already exists.");
        emailInputRef.current?.focus();
      } else {
        setError(isApiError(e) ? e.error : "Could not create account.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepShell
      eyebrow="Step 1 of 5"
      title="Create your admin account"
      description={
        mode === "choose"
          ? "Choose how you'd like to sign up."
          : "You'll use this to manage orders, menu, and settings."
      }
      footer={
        mode === "email" ? (
          <button
            form="step-account"
            type="submit"
            disabled={submitting || emailExists}
            className="inline-flex items-center justify-center px-5 py-2 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{
              backgroundColor: "#0F2B4D",
              color: "#FFFFFF",
              borderRadius: BTN_RADIUS,
              minWidth: 132,
            }}
          >
            {submitting ? "Creating…" : "Create account"}
          </button>
        ) : null
      }
    >
      {mode === "choose" ? (
        <div className="space-y-3">
          <GoogleAuthButton next="/onboard" label="Sign up with Google" />

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
            Sign up with Email
          </button>

          <p className="text-xs text-center pt-2" style={{ color: "#4A4A4A" }}>
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold underline"
              style={{ color: "#0F2B4D" }}
            >
              Sign in
            </a>
          </p>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setMode("choose");
              resetForm();
            }}
            className="inline-flex items-center gap-1 self-start text-xs font-semibold transition-colors hover:underline"
            style={{ color: "#4A4A4A" }}
          >
            <ChevronLeft size={14} />
            Back to options
          </button>

          <form id="step-account" onSubmit={submit} className="space-y-3" noValidate>
            {error && (
              <div
                className="text-sm px-4 py-2.5"
                style={{
                  backgroundColor: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #DC2626",
                  borderRadius: 4,
                }}
              >
                <p className="font-medium">{error}</p>
                {emailExists && (
                  <p className="text-xs mt-1.5" style={{ color: "#7F1D1D" }}>
                    Already have an account?{" "}
                    <a
                      href="/login"
                      className="font-semibold underline"
                      style={{ color: "#DC2626" }}
                    >
                      Sign in instead →
                    </a>
                  </p>
                )}
              </div>
            )}

            <Field label="Full name">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#0F2B4D]"
                style={{
                  border: "1px solid #E5E7EB",
                  color: "#1E1E1E",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 4,
                }}
                placeholder="Alex Rivera"
              />
            </Field>

            <Field label="Email">
              <div className="relative">
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailExists) {
                      setEmailExists(false);
                      if (error === "An account with this email already exists.") {
                        setError(null);
                      }
                    }
                  }}
                  className="w-full px-3.5 py-2.5 pr-9 text-sm outline-none transition-colors focus:border-[#0F2B4D]"
                  style={{
                    border: emailExists ? "1px solid #DC2626" : "1px solid #E5E7EB",
                    color: "#1E1E1E",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 4,
                  }}
                  placeholder="owner@restaurant.com"
                  aria-invalid={emailExists}
                />
                {emailChecking && (
                  <Loader2
                    size={14}
                    className="animate-spin absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#6B7280" }}
                  />
                )}
              </div>
            </Field>

            <Field label="Password">
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#0F2B4D]"
                style={{
                  border: "1px solid #E5E7EB",
                  color: "#1E1E1E",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 4,
                }}
                placeholder="At least 8 characters"
              />
            </Field>

            <Field label="Confirm password">
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#0F2B4D]"
                style={{
                  border: "1px solid #E5E7EB",
                  color: "#1E1E1E",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 4,
                }}
                placeholder="Re-enter password"
              />
            </Field>

            <p className="text-xs text-center pt-1" style={{ color: "#4A4A4A" }}>
              Already have an account?{" "}
              <a
                href="/login"
                className="font-semibold underline"
                style={{ color: "#0F2B4D" }}
              >
                Sign in
              </a>
            </p>
          </form>
        </>
      )}
    </StepShell>
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
        className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
        style={{ color: "#4A4A4A" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
