"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ExternalLink, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import {
  useSubscriptionStore,
  isSubscriptionActive,
} from "@/lib/stores/subscription.store";
import { isApiError } from "@/lib/api/client";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type StatusConfig = {
  label: string;
  bg: string;
  color: string;
  icon: React.ReactNode;
};

function statusConfig(status: string, setupFeePaid: boolean): StatusConfig {
  if (!setupFeePaid) {
    return {
      label: "Setup fee pending",
      bg: "#FEF9C3",
      color: "#854D0E",
      icon: <Clock size={13} />,
    };
  }
  switch (status) {
    case "active":
    case "trialing":
      return {
        label: status === "trialing" ? "Trial" : "Active",
        bg: "#DCFCE7",
        color: "#166534",
        icon: <CheckCircle2 size={13} />,
      };
    case "past_due":
      return {
        label: "Past due",
        bg: "#FEF9C3",
        color: "#854D0E",
        icon: <AlertCircle size={13} />,
      };
    case "canceled":
      return {
        label: "Canceled",
        bg: "#FEE2E2",
        color: "#991B1B",
        icon: <AlertCircle size={13} />,
      };
    default:
      return {
        label: "Inactive",
        bg: "#F3F4F6",
        color: "#374151",
        icon: <Clock size={13} />,
      };
  }
}

export default function BillingPage() {
  const router = useRouter();
  const subscription = useSubscriptionStore((s) => s.subscription);
  const loading = useSubscriptionStore((s) => s.loading);
  const fetchSubscription = useSubscriptionStore((s) => s.fetch);
  const openPortal = useSubscriptionStore((s) => s.openPortal);

  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  const handlePortal = async () => {
    setPortalError(null);
    setPortalLoading(true);
    try {
      const url = await openPortal(window.location.href);
      window.location.href = url;
    } catch (e) {
      setPortalLoading(false);
      setPortalError(
        isApiError(e) ? e.error : "Could not open portal. Please try again."
      );
    }
  };

  const handleActivate = () => {
    router.push("/pricing");
  };

  if (loading && !subscription) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2
          size={24}
          className="animate-spin"
          style={{ color: "#0F2B4D" }}
        />
      </div>
    );
  }

  const sub = subscription;
  const active = sub ? isSubscriptionActive(sub) : false;
  const cfg = sub
    ? statusConfig(sub.subscription_status, sub.setup_fee_paid)
    : statusConfig("none", false);

  return (
    <div className="max-w-2xl">
      {/* Status card */}
      <div
        className="p-6 mb-4"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 flex items-center justify-center"
              style={{ backgroundColor: "#F5F7FA" }}
            >
              <CreditCard size={20} style={{ color: "#0F2B4D" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>
                Restoro Professional
              </p>
              <p className="text-xs" style={{ color: "#4A4A4A" }}>
                $2,000 setup · $79 / month
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold shrink-0"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {cfg.icon}
            {cfg.label}
          </div>
        </div>

        {/* Detail rows */}
        <div
          className="space-y-3 mb-6 pt-4"
          style={{ borderTop: "1px solid #E5E7EB" }}
        >
          <DetailRow
            label="Setup fee"
            value={sub?.setup_fee_paid ? "Paid" : "Not paid"}
            valueColor={sub?.setup_fee_paid ? "#16A34A" : "#DC2626"}
          />
          <DetailRow
            label="Subscription"
            value={
              sub?.subscription_status
                ? sub.subscription_status.charAt(0).toUpperCase() +
                  sub.subscription_status.slice(1)
                : "None"
            }
          />
          <DetailRow
            label="Current period ends"
            value={formatDate(sub?.current_period_end)}
          />
        </div>

        {/* Error */}
        {portalError && (
          <div
            className="mb-4 px-4 py-3 text-sm"
            style={{
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#DC2626",
            }}
          >
            {portalError}
          </div>
        )}

        {/* Actions */}
        {active ? (
          <button
            type="button"
            onClick={handlePortal}
            disabled={portalLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0F2B4D", color: "#FFFFFF" }}
          >
            {portalLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ExternalLink size={14} />
            )}
            Manage subscription
          </button>
        ) : (
          <button
            type="button"
            onClick={handleActivate}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: "#0F2B4D", color: "#FFFFFF" }}
          >
            Activate subscription
          </button>
        )}
      </div>

      {/* What's included */}
      {active && (
        <div
          className="p-6"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E7EB" }}
        >
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: "#1E1E1E" }}
          >
            What&apos;s included
          </p>
          <ul className="space-y-2">
            {[
              "Live orders dashboard with real-time updates",
              "Full menu & category management",
              "Analytics — revenue, trends, top items",
              "Team management & staff invites",
              "Customer-facing ordering site",
              "Unlimited orders, no per-order fees",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm"
                style={{ color: "#4A4A4A" }}
              >
                <span
                  className="w-4 h-4 flex items-center justify-center shrink-0"
                  style={{ color: "#16A34A" }}
                >
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: "#4A4A4A" }}>{label}</span>
      <span
        className="font-medium"
        style={{ color: valueColor ?? "#1E1E1E" }}
      >
        {value}
      </span>
    </div>
  );
}
