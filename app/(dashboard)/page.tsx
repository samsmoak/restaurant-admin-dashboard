"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Volume2,
  VolumeX,
  Check,
  Flame,
  PackageCheck,
  Truck,
  X,
} from "lucide-react";
import { useOrdersStore } from "@/lib/stores/orders.store";
import { Button } from "@/components/ui/button";
import type { GoOrder as Order, GoOrderStatus as OrderStatus } from "@/lib/api/dto";
import OrderDetailsBody from "./_components/OrderDetailsBody";

const COLUMNS: Array<{
  key: OrderStatus;
  label: string;
  accent: string;
  accentBg: string;
}> = [
  { key: "new", label: "New", accent: "#92400E", accentBg: "#FEF3C7" },
  { key: "preparing", label: "Preparing", accent: "#1E40AF", accentBg: "#DBEAFE" },
  { key: "ready", label: "Ready", accent: "#065F46", accentBg: "#D1FAE5" },
];

// Small beep generated on demand — no extra asset needed.
function playBeep() {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.start();
    o.stop(ctx.currentTime + 0.55);
  } catch {
    // Ignore — audio may be blocked until user interaction.
  }
}

export default function LiveOrdersPage() {
  const orders = useOrdersStore((s) => s.orders);
  const loading = useOrdersStore((s) => s.loading);
  const updateOrderStatus = useOrdersStore((s) => s.updateStatus);
  const attach = useOrdersStore((s) => s.attach);
  const detach = useOrdersStore((s) => s.detach);

  useEffect(() => {
    attach();
    return () => detach();
  }, [attach, detach]);

  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ef:live-orders:muted") === "true";
  });

  const lastNewCount = useRef<number | null>(null);
  useEffect(() => {
    const count = orders.filter((o) => o.status === "new").length;
    if (lastNewCount.current !== null && count > lastNewCount.current) {
      if (!muted) playBeep();
    }
    lastNewCount.current = count;
  }, [orders, muted]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      if (typeof window !== "undefined") {
        localStorage.setItem("ef:live-orders:muted", next ? "true" : "false");
      }
      return next;
    });
  };

  const handleAdvance = async (orderId: string, to: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, to);
      toast.success(`Moved to ${to}`);
    } catch {
      toast.error("Could not update order status.");
    }
  };

  const grouped: Record<OrderStatus, Order[]> = {
    new: orders.filter((o) => o.status === "new"),
    preparing: orders.filter((o) => o.status === "preparing"),
    ready: orders.filter((o) => o.status === "ready"),
    completed: [],
    delivered: [],
    cancelled: [],
  };

  const openCount = grouped.new.length + grouped.preparing.length + grouped.ready.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#4A4A4A" }}>
          {loading
            ? "Loading…"
            : `${openCount} open order${openCount === 1 ? "" : "s"}`}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleMute}
          className="gap-2"
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          {muted ? "Sound off" : "Sound on"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <Column
            key={col.key}
            label={col.label}
            accent={col.accent}
            accentBg={col.accentBg}
            count={grouped[col.key].length}
          >
            {grouped[col.key].length === 0 ? (
              <EmptyColumn status={col.key} />
            ) : (
              grouped[col.key].map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAdvance={handleAdvance}
                />
              ))
            )}
          </Column>
        ))}
      </div>
    </div>
  );
}

function Column({
  label,
  count,
  accent,
  accentBg,
  children,
}: {
  label: string;
  count: number;
  accent: string;
  accentBg: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl p-3 flex flex-col min-h-[60vh]"
      style={{ backgroundColor: "#F5F7FA", border: "1px solid #E5E7EB" }}
    >
      <header className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>
          {label}
        </h2>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-none"
          style={{ backgroundColor: accentBg, color: accent }}
        >
          {count}
        </span>
      </header>
      <div className="flex-1 space-y-2.5">{children}</div>
    </section>
  );
}

function EmptyColumn({ status }: { status: OrderStatus }) {
  const msg =
    status === "new"
      ? "No new orders — you're all caught up."
      : status === "preparing"
        ? "Nothing in the kitchen right now."
        : "Nothing ready for pickup yet.";
  return (
    <p className="text-xs text-center py-8 px-3" style={{ color: "#6B7280" }}>
      {msg}
    </p>
  );
}

function OrderCard({
  order,
  onAdvance,
}: {
  order: Order;
  onAdvance: (id: string, to: OrderStatus) => Promise<void>;
}) {
  return (
    <article
      className="rounded-lg p-3 bg-white shadow-sm"
      style={{ border: "1px solid #E5E7EB" }}
    >
      <OrderDetailsBody order={order} compact />

      <div className="flex items-center gap-2 mt-3">
        {order.status === "new" && (
          <>
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => onAdvance(order.id, "preparing")}
              style={{ backgroundColor: "#1E40AF", color: "#FFFFFF" }}
            >
              <Flame size={13} />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAdvance(order.id, "cancelled")}
              title="Cancel order"
            >
              <X size={14} />
            </Button>
          </>
        )}
        {order.status === "preparing" && (
          <Button
            size="sm"
            className="w-full gap-1.5"
            onClick={() => onAdvance(order.id, "ready")}
            style={{ backgroundColor: "#065F46", color: "#FFFFFF" }}
          >
            <PackageCheck size={13} />
            Mark ready
          </Button>
        )}
        {order.status === "ready" && (
          order.order_type === "delivery" ? (
            <Button
              size="sm"
              className="w-full gap-1.5"
              onClick={() => onAdvance(order.id, "delivered")}
              style={{ backgroundColor: "#0E7490", color: "#FFFFFF" }}
            >
              <Truck size={13} />
              Mark as Delivered
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full gap-1.5"
              onClick={() => onAdvance(order.id, "completed")}
              style={{ backgroundColor: "#0F2B4D", color: "#FFFFFF" }}
            >
              <Check size={13} />
              Complete
            </Button>
          )
        )}
      </div>
    </article>
  );
}
