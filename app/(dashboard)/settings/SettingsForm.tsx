"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, ImageIcon, Copy } from "lucide-react";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import { useUploadsStore } from "@/lib/stores/uploads.store";
import { isApiError } from "@/lib/api/client";
import { Switch } from "@/components/ui/switch";
import OpenClosedToggle from "../_components/OpenClosedToggle";
import type { GoRestaurant } from "@/lib/api/dto";

type OpeningHours = GoRestaurant["opening_hours"];

const DAYS: Array<{ key: keyof OpeningHours; label: string }> = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export default function SettingsForm({
  settings,
}: {
  settings: GoRestaurant;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const updateRestaurant = useRestaurantStore((s) => s.update);
  const presignAndPut = useUploadsStore((s) => s.presignAndPut);

  const [form, setForm] = useState({
    name: settings.name ?? "",
    phone: settings.phone ?? "",
    address: settings.address ?? "",
    delivery_fee: String(settings.delivery_fee ?? 0),
    min_order_amount: String(settings.min_order_amount ?? 0),
    estimated_pickup_time: String(settings.estimated_pickup_time ?? 20),
    estimated_delivery_time: String(settings.estimated_delivery_time ?? 45),
    currency: settings.currency ?? "USD",
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(settings.logo_url ?? null);
  const [hours, setHours] = useState<OpeningHours>(
    (settings.opening_hours as OpeningHours) ?? {}
  );

  const updateText =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const updateHour = (
    day: keyof OpeningHours,
    field: "open" | "close" | "closed",
    value: string | boolean
  ) => {
    setHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const publicUrl = await presignAndPut("logos", file);
      if (!publicUrl) {
        toast.error("Upload failed.");
        return;
      }
      await updateRestaurant({
        name: form.name.trim() || "My Restaurant",
        logo_url: publicUrl,
        phone: form.phone.trim(),
        formatted_address: form.address.trim(),
        delivery_fee: Number(form.delivery_fee) || 0,
        min_order_amount: Number(form.min_order_amount) || 0,
        estimated_pickup_time: Number(form.estimated_pickup_time) || 20,
        estimated_delivery_time: Number(form.estimated_delivery_time) || 45,
        currency: form.currency.trim() || "USD",
        opening_hours: hours,
      });
      setLogoUrl(publicUrl);
      toast.success("Logo updated!");
    } catch (err) {
      toast.error(isApiError(err) ? err.error : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveLogo = async () => {
    setUploading(true);
    try {
      await updateRestaurant({
        name: form.name.trim() || "My Restaurant",
        logo_url: "",
        phone: form.phone.trim(),
        formatted_address: form.address.trim(),
        delivery_fee: Number(form.delivery_fee) || 0,
        min_order_amount: Number(form.min_order_amount) || 0,
        estimated_pickup_time: Number(form.estimated_pickup_time) || 20,
        estimated_delivery_time: Number(form.estimated_delivery_time) || 45,
        currency: form.currency.trim() || "USD",
        opening_hours: hours,
      });
      setLogoUrl(null);
      toast.success("Logo removed.");
    } catch (err) {
      toast.error(isApiError(err) ? err.error : "Could not remove logo.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateRestaurant({
        name: form.name.trim() || "My Restaurant",
        logo_url: logoUrl ?? "",
        phone: form.phone.trim(),
        formatted_address: form.address.trim(),
        delivery_fee: Number(form.delivery_fee) || 0,
        min_order_amount: Number(form.min_order_amount) || 0,
        estimated_pickup_time: Number(form.estimated_pickup_time) || 20,
        estimated_delivery_time: Number(form.estimated_delivery_time) || 45,
        currency: form.currency.trim() || "USD",
        opening_hours: hours,
      });
      toast.success("Settings saved!");
    } catch (err) {
      toast.error(isApiError(err) ? err.error : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Logo section */}
      <Section title="Branding" description="The logo shown across the site.">
        <div className="flex items-center gap-5">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
            style={{
              backgroundColor: "#F8FAFC",
              border: "1.5px dashed #CBD5E1",
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon size={28} style={{ color: "#94A3B8" }} />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
              style={{ backgroundColor: "#111318", color: "#FFFFFF" }}
            >
              <Upload size={15} />
              {uploading ? "Uploading…" : logoUrl ? "Replace logo" : "Upload logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{ color: "#DC2626" }}
              >
                <Trash2 size={14} />
                Remove
              </button>
            )}
            <p className="text-xs" style={{ color: "#94A3B8" }}>
              PNG or JPG, up to 5 MB.
            </p>
          </div>
        </div>
      </Section>

      {/* Info */}
      <Section
        title="Restaurant information"
        description="Shown in the header, footer, and order emails."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StudioField label="Restaurant name">
            <input
              type="text"
              value={form.name}
              onChange={updateText("name")}
              className="studio-input"
            />
          </StudioField>
          <StudioField label="Phone number">
            <input
              type="tel"
              value={form.phone}
              onChange={updateText("phone")}
              className="studio-input"
              placeholder="(555) 123-4567"
            />
          </StudioField>
          <StudioField label="Address" fullWidth>
            <input
              type="text"
              value={form.address}
              onChange={updateText("address")}
              className="studio-input"
              placeholder="123 Main St, Springfield"
            />
          </StudioField>
          <StudioField label="Currency">
            <select
              value={form.currency}
              onChange={updateText("currency")}
              className="studio-input"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="CAD">CAD</option>
              <option value="AUD">AUD</option>
            </select>
          </StudioField>
        </div>
      </Section>

      {/* Ordering */}
      <Section
        title="Ordering"
        description="Fees, minimums, and prep times shown to customers."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StudioField label="Delivery fee">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.delivery_fee}
              onChange={updateText("delivery_fee")}
              className="studio-input"
            />
          </StudioField>
          <StudioField label="Minimum order amount">
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.min_order_amount}
              onChange={updateText("min_order_amount")}
              className="studio-input"
            />
          </StudioField>
          <StudioField label="Pickup time (min)">
            <input
              type="number"
              min="0"
              value={form.estimated_pickup_time}
              onChange={updateText("estimated_pickup_time")}
              className="studio-input"
            />
          </StudioField>
          <StudioField label="Delivery time (min)">
            <input
              type="number"
              min="0"
              value={form.estimated_delivery_time}
              onChange={updateText("estimated_delivery_time")}
              className="studio-input"
            />
          </StudioField>
        </div>
      </Section>

      {/* Accepting orders (manual override) */}
      <Section
        title="Accepting orders right now"
        description="Overrides the weekly schedule — use when the kitchen is closed unexpectedly."
      >
        <OpenClosedToggle variant="card" />
      </Section>

      {/* Hours */}
      <Section
        title="Opening hours"
        description="Drives the live 'Open now' pill on the customer site."
      >
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              const mon = hours.monday;
              if (!mon) return;
              setHours((prev) => ({
                ...prev,
                tuesday: { ...mon },
                wednesday: { ...mon },
                thursday: { ...mon },
                friday: { ...mon },
              }));
              toast.success("Copied Monday hours to the weekdays.");
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            style={{
              color: "#475569",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
            }}
          >
            <Copy size={12} />
            Copy Monday to weekdays
          </button>
        </div>

        <div
          className="rounded-lg overflow-hidden"
          style={{ border: "1px solid #F1F5F9" }}
        >
          {DAYS.map(({ key, label }, idx) => {
            const day = hours[key] ?? {
              open: "09:00",
              close: "22:00",
              closed: false,
            };
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
                    className="studio-input"
                    style={{
                      maxWidth: 120,
                      opacity: day.closed ? 0.4 : 1,
                    }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: day.closed ? "#CBD5E1" : "#94A3B8" }}
                  >
                    to
                  </span>
                  <input
                    type="time"
                    value={day.close}
                    onChange={(e) => updateHour(key, "close", e.target.value)}
                    disabled={day.closed}
                    className="studio-input"
                    style={{
                      maxWidth: 120,
                      opacity: day.closed ? 0.4 : 1,
                    }}
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer pl-2"
                  style={{ color: day.closed ? "#DC2626" : "#64748B" }}
                >
                  <span>{day.closed ? "Closed" : "Open"}</span>
                  <Switch
                    checked={!day.closed}
                    onCheckedChange={(v) => updateHour(key, "closed", !v)}
                  />
                </label>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
          style={{ backgroundColor: "#111318", color: "#FFFFFF" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <style jsx global>{`
        .studio-input {
          width: 100%;
          padding: 0.6rem 0.9rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          outline: none;
          background-color: #ffffff;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .studio-input:focus {
          border-color: #0f172a;
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.06);
        }
      `}</style>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl border p-6"
      style={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" }}
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold" style={{ color: "#0F172A" }}>
          {title}
        </h2>
        {description && (
          <p className="text-xs mt-1" style={{ color: "#64748B" }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function StudioField({
  label,
  fullWidth,
  children,
}: {
  label: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <label
        className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
        style={{ color: "#64748B" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
