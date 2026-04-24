"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Download, Search, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  GoOrder as Order,
  GoOrderStatus as OrderStatus,
  GoOrderType as OrderType,
} from "@/lib/api/dto";
import OrderDetailsBody, {
  StatusBadge,
  formatMoney,
} from "../_components/OrderDetailsBody";

type Range = "today" | "7d" | "30d" | "all";

const RANGES: Array<{ key: Range; label: string }> = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All" },
];

const STATUS_OPTIONS: Array<{ key: OrderStatus | "all"; label: string }> = [
  { key: "all", label: "All statuses" },
  { key: "new", label: "New" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function HistoryView({
  orders,
  range,
  currency,
}: {
  orders: Order[];
  range: Range;
  currency: string;
}) {
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [orderType, setOrderType] = useState<OrderType | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (orderType !== "all" && o.order_type !== orderType) return false;
      if (!q) return true;
      return (
        o.order_number.toLowerCase().includes(q) ||
        (o.customer_name ?? "").toLowerCase().includes(q) ||
        (o.customer_phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, status, orderType, search]);

  const handleExport = () => {
    const headers = [
      "Order Number",
      "Date",
      "Status",
      "Type",
      "Customer",
      "Phone",
      "Items",
      "Subtotal",
      "Delivery Fee",
      "Total",
    ];
    const rows = filtered.map((o) => {
      const itemCount = (o.items ?? []).reduce(
        (s, it) => s + (it.quantity || 0),
        0
      );
      return [
        o.order_number,
        new Date(o.created_at).toISOString(),
        o.status,
        o.order_type,
        o.customer_name,
        o.customer_phone,
        itemCount,
        o.subtotal,
        o.delivery_fee,
        o.total,
      ].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`);
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${range}-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Range tabs + export */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div
          className="inline-flex rounded-lg p-1"
          style={{ backgroundColor: "#F1F5F9" }}
        >
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`?range=${r.key}`}
              scroll={false}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              style={{
                backgroundColor: range === r.key ? "#FFFFFF" : "transparent",
                color: range === r.key ? "#1E1E1E" : "#4A4A4A",
                boxShadow:
                  range === r.key
                    ? "0 1px 2px rgba(15,23,42,0.06)"
                    : "none",
              }}
            >
              {r.label}
            </Link>
          ))}
        </div>
        <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#6B7280" }}
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order #, customer, phone…"
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}
          className="h-9 px-3 text-sm rounded-md"
          style={{ border: "1px solid #E5E7EB", color: "#1E1E1E" }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value as OrderType | "all")}
          className="h-9 px-3 text-sm rounded-md"
          style={{ border: "1px solid #E5E7EB", color: "#1E1E1E" }}
        >
          <option value="all">All types</option>
          <option value="pickup">Pickup</option>
          <option value="delivery">Delivery</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: "1px solid #E5E7EB", backgroundColor: "#FFFFFF" }}
      >
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <FileText
              size={24}
              className="mx-auto mb-2"
              style={{ color: "#6B7280" }}
            />
            <p className="text-sm" style={{ color: "#4A4A4A" }}>
              No orders match this filter.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wider"
                style={{ backgroundColor: "#F5F7FA", color: "#4A4A4A" }}
              >
                <Th>Order #</Th>
                <Th>Time</Th>
                <Th>Customer</Th>
                <Th>Type</Th>
                <Th align="right">Items</Th>
                <Th align="right">Total</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const itemCount = (o.items ?? []).reduce(
                  (s, it) => s + (it.quantity || 0),
                  0
                );
                return (
                  <tr
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className="cursor-pointer hover:bg-slate-50"
                    style={{ borderTop: "1px solid #F1F5F9" }}
                  >
                    <Td>
                      <span className="font-mono font-semibold">
                        {o.order_number}
                      </span>
                    </Td>
                    <Td>
                      <span style={{ color: "#4A4A4A" }}>
                        {format(new Date(o.created_at), "MMM d, h:mm a")}
                      </span>
                    </Td>
                    <Td>
                      <div className="min-w-0">
                        <p className="truncate">{o.customer_name}</p>
                        <p
                          className="text-xs truncate"
                          style={{ color: "#6B7280" }}
                        >
                          {o.customer_phone}
                        </p>
                      </div>
                    </Td>
                    <Td>
                      <span className="capitalize">{o.order_type}</span>
                    </Td>
                    <Td align="right">{itemCount}</Td>
                    <Td align="right">
                      <span className="font-semibold tabular-nums">
                        {formatMoney(o.total, currency)}
                      </span>
                    </Td>
                    <Td>
                      <StatusBadge status={o.status} />
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order details</DialogTitle>
          </DialogHeader>
          {selected && <OrderDetailsBody order={selected} currency={currency} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className="px-4 py-2.5 font-semibold"
      style={{ textAlign: align }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td
      className="px-4 py-3"
      style={{ textAlign: align, color: "#1E1E1E" }}
    >
      {children}
    </td>
  );
}
