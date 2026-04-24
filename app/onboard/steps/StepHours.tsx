"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import { isApiError } from "@/lib/api/client";
import type { GoRestaurant } from "@/lib/api/dto";
import StepShell from "../_components/StepShell";

const DAYS: Array<{ key: string; label: string }> = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const DEFAULT_HOURS: GoRestaurant["opening_hours"] = {
  monday: { open: "09:00", close: "22:00", closed: false },
  tuesday: { open: "09:00", close: "22:00", closed: false },
  wednesday: { open: "09:00", close: "22:00", closed: false },
  thursday: { open: "09:00", close: "22:00", closed: false },
  friday: { open: "09:00", close: "23:00", closed: false },
  saturday: { open: "10:00", close: "23:00", closed: false },
  sunday: { open: "10:00", close: "21:00", closed: false },
};

export default function StepHours({
  onDone,
  onBack,
  initial,
}: {
  onDone: () => void;
  onBack?: () => void;
  initial?: { hours?: GoRestaurant["opening_hours"]; currency?: string };
}) {
  const update = useRestaurantStore((s) => s.update);

  const [hours, setHours] = useState<GoRestaurant["opening_hours"]>(
    initial?.hours && Object.keys(initial.hours).length > 0 ? initial.hours : DEFAULT_HOURS
  );
  const [currency, setCurrency] = useState(initial?.currency ?? "USD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateHour = (
    day: string,
    field: "open" | "close" | "closed",
    value: string | boolean
  ) => {
    setHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await update({
        opening_hours: hours,
        currency,
        completed_step: "hours",
      });
      onDone();
    } catch (e) {
      setError(isApiError(e) ? e.error : "Could not save hours.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepShell
      eyebrow="Step 4 of 5"
      title="When are you open?"
      description="Customers can't order while you're closed. Toggle a day off to mark it closed."
      onBack={onBack}
      footer={
        <button
          form="step-hours"
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
          className="text-sm px-4 py-2.5"
          style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #DC2626" }}
        >
          {error}
        </div>
      )}

      <form id="step-hours" onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#1E1E1E" }}>
            Currency *
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full h-10 px-3 text-sm outline-none"
            style={{ border: "1px solid #E5E7EB", color: "#1E1E1E", backgroundColor: "#FFFFFF" }}
          >
            <option value="USD">USD — US Dollar</option>
            <option value="EUR">EUR — Euro</option>
            <option value="GBP">GBP — British Pound</option>
            <option value="CAD">CAD — Canadian Dollar</option>
            <option value="AUD">AUD — Australian Dollar</option>
            <option value="NGN">NGN — Nigerian Naira</option>
          </select>
        </div>

        <div
          className="overflow-hidden"
          style={{ border: "1px solid #E5E7EB", backgroundColor: "#FFFFFF" }}
        >
          {DAYS.map(({ key, label }, idx) => {
            const day = hours[key] ?? { open: "09:00", close: "22:00", closed: false };
            return (
              <div
                key={key}
                className="grid grid-cols-[110px_1fr_auto] items-center gap-3 px-4 py-3"
                style={{
                  borderTop: idx === 0 ? "none" : "1px solid #E5E7EB",
                  backgroundColor: day.closed ? "#F5F7FA" : "#FFFFFF",
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: day.closed ? "#6B7280" : "#1E1E1E" }}
                >
                  {label}
                </span>
                <div className="flex items-center gap-2 justify-end">
                  <input
                    type="time"
                    value={day.open}
                    onChange={(e) => updateHour(key, "open", e.target.value)}
                    disabled={day.closed}
                    className="px-2.5 py-1.5 text-sm outline-none"
                    style={{
                      border: "1px solid #E5E7EB",
                      maxWidth: 110,
                      opacity: day.closed ? 0.4 : 1,
                    }}
                  />
                  <span className="text-xs" style={{ color: "#6B7280" }}>
                    to
                  </span>
                  <input
                    type="time"
                    value={day.close}
                    onChange={(e) => updateHour(key, "close", e.target.value)}
                    disabled={day.closed}
                    className="px-2.5 py-1.5 text-sm outline-none"
                    style={{
                      border: "1px solid #E5E7EB",
                      maxWidth: 110,
                      opacity: day.closed ? 0.4 : 1,
                    }}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-medium pl-2">
                  <span style={{ color: day.closed ? "#DC2626" : "#4A4A4A" }}>
                    {day.closed ? "Closed" : "Open"}
                  </span>
                  <Switch
                    checked={!day.closed}
                    onCheckedChange={(v) => updateHour(key, "closed", !v)}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </form>
    </StepShell>
  );
}
