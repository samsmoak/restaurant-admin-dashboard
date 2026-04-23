"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Point = { label: string; revenue: number };

export default function RevenueChart({
  data,
  currency = "USD",
}: {
  data: Point[];
  currency?: string;
}) {
  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="label"
          stroke="#94A3B8"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#E2E8F0" }}
        />
        <YAxis
          stroke="#94A3B8"
          tick={{ fontSize: 11 }}
          tickFormatter={fmt}
          tickLine={false}
          axisLine={{ stroke: "#E2E8F0" }}
        />
        <Tooltip
          formatter={(value) => [fmt(Number(value) || 0), "Revenue"]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #E2E8F0",
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#FF5A3C"
          strokeWidth={2.5}
          dot={{ fill: "#FF5A3C", r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
