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
          className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
          style={{ backgroundColor: "#111318", color: "#FFFFFF" }}
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      }
    >
      {error && (
        <div
          className="text-sm px-4 py-2.5 rounded-lg"
          style={{ backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}
        >
          {error}
        </div>
      )}

      <form id="step-hours" onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "#0F172A" }}>
            Currency *
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full h-10 px-3 text-sm rounded-lg outline-none"
            style={{ border: "1px solid #E2E8F0", color: "#0F172A", backgroundColor: "#FFFFFF" }}
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
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }}
        >
          {DAYS.map(({ key, label }, idx) => {
            const day = hours[key] ?? { open: "09:00", close: "22:00", closed: false };
            return (
              <div
                key={key}
                className="grid grid-cols-[110px_1fr_auto] items-center gap-3 px-4 py-3"
                style={{
                  borderTop: idx === 0 ? "none" : "1px solid #F1F5F9",
                  backgroundColor: day.closed ? "#F8FAFC" : "#FFFFFF",
                }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ color: day.closed ? "#94A3B8" : "#0F172A" }}
                >
                  {label}
                </span>
                <div className="flex items-center gap-2 justify-end">
                  <input
                    type="time"
                    value={day.open}
                    onChange={(e) => updateHour(key, "open", e.target.value)}
                    disabled={day.closed}
                    className="px-2.5 py-1.5 rounded text-sm outline-none"
                    style={{
                      border: "1px solid #E2E8F0",
                      maxWidth: 110,
                      opacity: day.closed ? 0.4 : 1,
                    }}
                  />
                  <span className="text-xs" style={{ color: "#94A3B8" }}>
                    to
                  </span>
                  <input
                    type="time"
                    value={day.close}
                    onChange={(e) => updateHour(key, "close", e.target.value)}
                    disabled={day.closed}
                    className="px-2.5 py-1.5 rounded text-sm outline-none"
                    style={{
                      border: "1px solid #E2E8F0",
                      maxWidth: 110,
                      opacity: day.closed ? 0.4 : 1,
                    }}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-medium pl-2">
                  <span style={{ color: day.closed ? "#DC2626" : "#64748B" }}>
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
