"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import { ordersApi } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/client";
import type { GoOrder } from "@/lib/api/dto";
import HistoryView from "./HistoryView";

type Range = "today" | "7d" | "30d" | "all";

function computeSinceMs(range: Range): number | undefined {
  const now = Date.now();
  if (range === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (range === "7d") return now - 7 * 24 * 60 * 60 * 1000;
  if (range === "30d") return now - 30 * 24 * 60 * 60 * 1000;
  return undefined;
}

export default function OrderHistoryPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const searchParams = useSearchParams();
  const rangeParam = searchParams.get("range") as Range | null;
  const range: Range =
    rangeParam && ["today", "7d", "30d", "all"].includes(rangeParam)
      ? rangeParam
      : "7d";

  const restaurant = useRestaurantStore((s) => s.restaurant);
  const fetchRestaurant = useRestaurantStore((s) => s.fetch);

  const [orders, setOrders] = useState<GoOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurant) void fetchRestaurant();
  }, [restaurant, fetchRestaurant]);

  useEffect(() => {
    let cancelled = false;
    const since = computeSinceMs(range);
    setError(null);
    ordersApi
      .analytics(since, undefined)
      .then((resp) => {
        if (!cancelled) setOrders(resp.orders);
      })
      .catch((e) => {
        if (!cancelled) setError(isApiError(e) ? e.error : "Could not load orders");
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const currency = restaurant?.currency ?? "USD";

  if (error) {
    return (
      <p className="text-sm" style={{ color: "#DC2626" }}>
        Could not load orders: {error}
      </p>
    );
  }
  return <HistoryView orders={orders} range={range} currency={currency} />;
}
