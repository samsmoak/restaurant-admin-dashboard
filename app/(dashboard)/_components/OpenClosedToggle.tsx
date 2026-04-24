"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import { isApiError } from "@/lib/api/client";

type Props = {
  variant?: "sidebar" | "card";
};

export default function OpenClosedToggle({ variant = "sidebar" }: Props) {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const toggleManualClosed = useRestaurantStore((s) => s.toggleManualClosed);
  const [loading, setLoading] = useState(false);

  if (!restaurant) return null;
  const closed = restaurant.manual_closed;

  const handleToggle = async (checked: boolean) => {
    const nextManualClosed = !checked;
    setLoading(true);
    try {
      await toggleManualClosed(nextManualClosed);
      toast.success(nextManualClosed ? "Orders paused" : "Open for orders");
    } catch (e) {
      toast.error(isApiError(e) ? e.error : "Could not update status.");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "sidebar") {
    return (
      <div
        className="mx-3 mb-3 mt-2 px-3 py-3 rounded-lg flex items-center justify-between"
        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2 h-2 rounded-none shrink-0"
            style={{ backgroundColor: closed ? "#DC2626" : "#10B981" }}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {closed ? "Paused" : "Accepting orders"}
            </p>
            <p className="text-[10px]" style={{ color: "#6B7280" }}>
              {closed ? "Manually closed" : "Following hours"}
            </p>
          </div>
        </div>
        <Switch
          checked={!closed}
          onCheckedChange={handleToggle}
          disabled={loading}
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4 flex items-center justify-between"
      style={{
        backgroundColor: closed ? "#FEF2F2" : "#F0FDF4",
        border: `1px solid ${closed ? "#DC2626" : "#BBF7D0"}`,
      }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-3 h-3 rounded-none"
          style={{ backgroundColor: closed ? "#DC2626" : "#10B981" }}
        />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>
            {closed ? "Paused — not accepting orders" : "Accepting orders"}
          </p>
          <p className="text-xs" style={{ color: "#4A4A4A" }}>
            {closed
              ? "Customers see a closed status on the landing page."
              : "Following the opening-hours schedule."}
          </p>
        </div>
      </div>
      <Switch
        checked={!closed}
        onCheckedChange={handleToggle}
        disabled={loading}
      />
    </div>
  );
}
