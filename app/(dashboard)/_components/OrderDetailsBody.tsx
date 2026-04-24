"use client";

import { formatDistanceToNow } from "date-fns";
import { Clock, Phone, MapPin, Truck, ShoppingBag } from "lucide-react";
import type {
  GoOrder as Order,
  GoOrderLine as OrderItem,
  GoOrderStatus as OrderStatus,
} from "@/lib/api/dto";

const STATUS_COLORS: Record<OrderStatus, { bg: string; fg: string }> = {
  new: { bg: "#FEF3C7", fg: "#92400E" },
  preparing: { bg: "#DBEAFE", fg: "#1E40AF" },
  ready: { bg: "#D1FAE5", fg: "#065F46" },
  completed: { bg: "#E5E7EB", fg: "#374151" },
  cancelled: { bg: "#FEE2E2", fg: "#991B1B" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-none uppercase tracking-wide"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {status}
    </span>
  );
}

export function formatMoney(n: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export default function OrderDetailsBody({
  order,
  currency = "USD",
  compact = false,
}: {
  order: Order;
  currency?: string;
  compact?: boolean;
}) {
  const itemCount = (order.items ?? []).reduce(
    (sum, it) => sum + (it.quantity || 0),
    0
  );

  return (
    <div className="space-y-3">
      {/* Header meta */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="font-mono text-sm font-bold tracking-tight"
            style={{ color: "#1E1E1E" }}
          >
            {order.order_number}
          </p>
          <div
            className="flex items-center gap-1.5 text-xs mt-0.5"
            style={{ color: "#4A4A4A" }}
          >
            <Clock size={11} />
            <span>
              {formatDistanceToNow(new Date(order.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Customer */}
      <div
        className="rounded-lg p-3 space-y-1.5"
        style={{ backgroundColor: "#F5F7FA" }}
      >
        <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>
          {order.customer_name}
        </p>
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: "#4A4A4A" }}
        >
          <Phone size={11} />
          <span>{order.customer_phone}</span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-none"
            style={{
              backgroundColor:
                order.order_type === "delivery" ? "#EFF6FF" : "#F0FDF4",
              color: order.order_type === "delivery" ? "#1D4ED8" : "#166534",
            }}
          >
            {order.order_type === "delivery" ? (
              <Truck size={11} />
            ) : (
              <ShoppingBag size={11} />
            )}
            {order.order_type === "delivery" ? "Delivery" : "Pickup"}
          </span>
          {order.payment_status === "paid" && (
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-none"
              style={{ backgroundColor: "#F0FDF4", color: "#166534" }}
            >
              Paid
            </span>
          )}
        </div>
        {order.order_type === "delivery" && order.delivery_address && (
          <div
            className="flex items-start gap-1.5 text-xs pt-1"
            style={{ color: "#4A4A4A" }}
          >
            <MapPin size={11} className="mt-0.5 shrink-0" />
            <span>{order.delivery_address}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: "#6B7280" }}
        >
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </p>
        <ul className="space-y-1.5">
          {(order.items ?? []).map((it: OrderItem, idx) => (
            <li
              key={idx}
              className="flex items-start justify-between gap-2 text-sm"
            >
              <div className="min-w-0">
                <p style={{ color: "#1E1E1E" }}>
                  <span className="font-semibold">{it.quantity}×</span> {it.name}
                  {it.selected_size ? ` (${it.selected_size.name})` : ""}
                </p>
                {it.selected_extras && it.selected_extras.length > 0 && (
                  <p
                    className="text-xs"
                    style={{ color: "#4A4A4A" }}
                  >
                    + {it.selected_extras.map((e) => e.name).join(", ")}
                  </p>
                )}
                {it.special_instructions && (
                  <p
                    className="text-xs italic"
                    style={{ color: "#6B7280" }}
                  >
                    “{it.special_instructions}”
                  </p>
                )}
              </div>
              <span
                className="text-sm tabular-nums shrink-0"
                style={{ color: "#1E1E1E" }}
              >
                {formatMoney(it.item_total, currency)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Totals */}
      {!compact && (
        <div
          className="pt-2 space-y-1 text-sm"
          style={{ borderTop: "1px solid #E5E7EB" }}
        >
          <div
            className="flex justify-between"
            style={{ color: "#4A4A4A" }}
          >
            <span>Subtotal</span>
            <span>{formatMoney(order.subtotal, currency)}</span>
          </div>
          {order.delivery_fee > 0 && (
            <div
              className="flex justify-between"
              style={{ color: "#4A4A4A" }}
            >
              <span>Delivery fee</span>
              <span>{formatMoney(order.delivery_fee, currency)}</span>
            </div>
          )}
          <div
            className="flex justify-between font-bold pt-1"
            style={{ color: "#1E1E1E" }}
          >
            <span>Total</span>
            <span>{formatMoney(order.total, currency)}</span>
          </div>
        </div>
      )}

      {order.special_instructions && (
        <div
          className="rounded-lg p-2.5 text-xs"
          style={{ backgroundColor: "#FFFBEB", color: "#92400E" }}
        >
          <span className="font-semibold">Note: </span>
          {order.special_instructions}
        </div>
      )}
    </div>
  );
}
