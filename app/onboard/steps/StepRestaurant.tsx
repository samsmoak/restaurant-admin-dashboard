"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import { isApiError } from "@/lib/api/client";
import StepShell from "../_components/StepShell";

export default function StepRestaurant({
  onDone,
  onBack,
  initialName,
  initialPhone,
}: {
  onDone: () => void;
  onBack?: () => void;
  initialName?: string;
  initialPhone?: string;
}) {
  const createRestaurant = useRestaurantStore((s) => s.createRestaurant);
  const activate = useAuthStore((s) => s.activate);
  const markStepComplete = useRestaurantStore((s) => s.markStepComplete);

  const [name, setName] = useState(initialName ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError("Restaurant name is required.");
    if (phone.trim().length < 7) return setError("Restaurant phone is required.");

    setSubmitting(true);
    try {
      const r = await createRestaurant({
        name: name.trim(),
        phone: phone.trim(),
      });
      // Scope the admin JWT to this new restaurant.
      await activate(r.id);
      // The backend already marked `restaurant` as complete on creation, but
      // call mark-step to be defensive (idempotent).
      await markStepComplete("restaurant");
      onDone();
    } catch (e) {
      setError(isApiError(e) ? e.error : "Could not create restaurant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepShell
      eyebrow="Step 2 of 5"
      title="Your restaurant"
      description="We'll use this on your customer-facing menu, order emails, and the dashboard."
      onBack={onBack}
      footer={
        <button
          form="step-restaurant"
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center px-5 py-2 font-semibold text-sm transition-all disabled:opacity-50 hover:opacity-90"
          style={{
            backgroundColor: "#0F2B4D",
            color: "#FFFFFF",
            borderRadius: 6,
            minWidth: 132,
          }}
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      }
    >
      {error && (
        <div
          className="text-sm px-3.5 py-2.5"
          style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #DC2626", borderRadius: 4 }}
        >
          {error}
        </div>
      )}
      <form id="step-restaurant" onSubmit={submit} className="space-y-3">
        <Field label="Restaurant name">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#0F2B4D]"
            style={{ border: "1px solid #E5E7EB", color: "#1E1E1E", backgroundColor: "#FFFFFF", borderRadius: 4 }}
            placeholder="Ember & Forge"
          />
        </Field>
        <Field label="Phone number">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#0F2B4D]"
            style={{ border: "1px solid #E5E7EB", color: "#1E1E1E", backgroundColor: "#FFFFFF", borderRadius: 4 }}
            placeholder="(555) 123-4567"
          />
        </Field>
      </form>
    </StepShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "#4A4A4A" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
