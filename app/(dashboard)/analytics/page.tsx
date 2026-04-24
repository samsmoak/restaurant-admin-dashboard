"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ordersApi } from "@/lib/api/endpoints";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import type { GoOrder as Order } from "@/lib/api/dto";
import RevenueChart from "../_components/RevenueChart";
import { formatMoney } from "../_components/OrderDetailsBody";

type Range = "today" | "7d" | "30d";

const RANGES: Array<{ key: Range; label: string }> = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
];

function getWindow(range: Range): { since: Date; windowMs: number } {
  const now = new Date();
  const since = new Date(now);
  if (range === "today") {
    since.setHours(0, 0, 0, 0);
  } else if (range === "7d") {
    since.setDate(since.getDate() - 7);
  } else {
    since.setDate(since.getDate() - 30);
  }
  return { since, windowMs: now.getTime() - since.getTime() };
}

function changePct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

type Metrics = {
  revenue: number;
  orders: number;
  aov: number;
  completionRate: number;
};

function computeMetrics(orders: Order[]): Metrics {
  const active = orders.filter((o) => o.status !== "cancelled");
  const revenue = active.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const count = active.length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const total = orders.length;
  return {
    revenue,
    orders: count,
    aov: count > 0 ? revenue / count : 0,
    completionRate: total > 0 ? (completed / total) * 100 : 0,
  };
}

function bucketRevenue(
  orders: Order[],
  range: Range,
  since: Date
): Array<{ label: string; revenue: number }> {
  if (range === "today") {
    const buckets = new Array(24).fill(0);
    orders.forEach((o) => {
      if (o.status === "cancelled") return;
      const h = new Date(o.created_at).getHours();
      buckets[h] += Number(o.total || 0);
    });
    return buckets.map((rev, h) => ({ label: `${h}:00`, revenue: rev }));
  }

  const days = range === "7d" ? 7 : 30;
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(since);
    d.setDate(d.getDate() + (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    map.set(key, 0);
  }
  orders.forEach((o) => {
    if (o.status === "cancelled") return;
    const key = o.created_at.slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + Number(o.total || 0));
  });
  return Array.from(map.entries()).map(([date, rev]) => ({
    label: new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    revenue: rev,
  }));
}

function topItems(orders: Order[], limit = 5) {
  const counts = new Map<string, number>();
  orders.forEach((o) => {
    if (o.status === "cancelled") return;
    (o.items ?? []).forEach((it) => {
      counts.set(it.name, (counts.get(it.name) ?? 0) + (it.quantity || 0));
    });
  });
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("7d");
  const [orders, setOrders] = useState<Order[]>([]);
  const [prevOrders, setPrevOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const restaurant = useRestaurantStore((s) => s.restaurant);
  const fetchRestaurant = useRestaurantStore((s) => s.fetch);
  const currency = restaurant?.currency ?? "USD";

  useEffect(() => {
    if (!restaurant) void fetchRestaurant();
  }, [restaurant, fetchRestaurant]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const { since, windowMs } = getWindow(range);
    const prevSince = new Date(since.getTime() - windowMs);

    (async () => {
      try {
        const [currRes, prevRes] = await Promise.all([
          ordersApi.analytics(since.getTime(), undefined),
          ordersApi.analytics(prevSince.getTime(), since.getTime()),
        ]);
        if (cancelled) return;
        setOrders(currRes.orders);
        setPrevOrders(prevRes.orders);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [range]);

  const { since } = useMemo(() => getWindow(range), [range]);
  const metrics = useMemo(() => computeMetrics(orders), [orders]);
  const prevMetrics = useMemo(() => computeMetrics(prevOrders), [prevOrders]);
  const chartData = useMemo(
    () => bucketRevenue(orders, range, since),
    [orders, range, since]
  );
  const top = useMemo(() => topItems(orders), [orders]);

  return (
    <div className="space-y-5">
      <div
        className="inline-flex rounded-lg p-1"
        style={{ backgroundColor: "#F1F5F9" }}
      >
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
            style={{
              backgroundColor: range === r.key ? "#FFFFFF" : "transparent",
              color: range === r.key ? "#1E1E1E" : "#4A4A4A",
              boxShadow:
                range === r.key ? "0 1px 2px rgba(15,23,42,0.06)" : "none",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Revenue"
          value={formatMoney(metrics.revenue, currency)}
          change={changePct(metrics.revenue, prevMetrics.revenue)}
          loading={loading}
        />
        <KpiCard
          label="Orders"
          value={metrics.orders.toString()}
          change={changePct(metrics.orders, prevMetrics.orders)}
          loading={loading}
        />
        <KpiCard
          label="Avg order value"
          value={formatMoney(metrics.aov, currency)}
          change={changePct(metrics.aov, prevMetrics.aov)}
          loading={loading}
        />
        <KpiCard
          label="Completion rate"
          value={`${metrics.completionRate.toFixed(0)}%`}
          change={changePct(metrics.completionRate, prevMetrics.completionRate)}
          loading={loading}
          suffix="pp"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <section
          className="lg:col-span-2 rounded-xl p-5"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>
              Revenue
            </h3>
            <span className="text-xs" style={{ color: "#4A4A4A" }}>
              {range === "today" ? "by hour" : "by day"}
            </span>
          </div>
          {loading ? (
            <div
              className="h-64 flex items-center justify-center"
              style={{ color: "#6B7280" }}
            >
              Loading…
            </div>
          ) : orders.length === 0 ? (
            <div
              className="h-64 flex items-center justify-center text-sm"
              style={{ color: "#6B7280" }}
            >
              No orders in this range.
            </div>
          ) : (
            <RevenueChart data={chartData} currency={currency} />
          )}
        </section>

        <section
          className="rounded-xl p-5"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "#1E1E1E" }}
          >
            Top items
          </h3>
          {loading ? (
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Loading…
            </p>
          ) : top.length === 0 ? (
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Nothing sold yet.
            </p>
          ) : (
            <ol className="space-y-2.5">
              {top.map((t, i) => (
                <li
                  key={t.name}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-5 h-5 rounded-none flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: "#FEF3C7",
                        color: "#92400E",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      className="text-sm truncate"
                      style={{ color: "#1E1E1E" }}
                    >
                      {t.name}
                    </span>
                  </div>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: "#4A4A4A" }}
                  >
                    ×{t.count}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  change,
  loading,
  suffix,
}: {
  label: string;
  value: string;
  change: number;
  loading: boolean;
  suffix?: string;
}) {
  const up = change > 1;
  const down = change < -1;
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  const color = up ? "#10B981" : down ? "#DC2626" : "#6B7280";
  const bg = up ? "#F0FDF4" : down ? "#FEF2F2" : "#F5F7FA";

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "#6B7280" }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-bold mt-1 tabular-nums"
        style={{ color: "#1E1E1E" }}
      >
        {loading ? "—" : value}
      </p>
      <div
        className="inline-flex items-center gap-1 text-xs font-semibold mt-2 px-2 py-0.5 rounded-none"
        style={{ backgroundColor: bg, color }}
      >
        <Icon size={11} />
        <span>
          {loading
            ? "—"
            : `${change >= 0 ? "+" : ""}${change.toFixed(0)}${suffix ?? "%"}`}
        </span>
      </div>
    </div>
  );
}
