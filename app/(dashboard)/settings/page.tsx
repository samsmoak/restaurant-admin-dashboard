"use client";

import { useEffect } from "react";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import SettingsForm from "./SettingsForm";

export default function SettingsPage() {
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const loading = useRestaurantStore((s) => s.loading);
  const error = useRestaurantStore((s) => s.error);
  const fetchRestaurant = useRestaurantStore((s) => s.fetch);

  useEffect(() => {
    void fetchRestaurant();
  }, [fetchRestaurant]);

  if (error) {
    return (
      <div className="max-w-3xl">
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#991B1B" }}>
            Could not load restaurant settings
          </p>
          <p className="text-sm mt-1" style={{ color: "#B91C1C" }}>
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-3xl">
        <p style={{ color: "#64748B" }}>{loading ? "Loading…" : "No restaurant."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <SettingsForm settings={restaurant} />
    </div>
  );
}
