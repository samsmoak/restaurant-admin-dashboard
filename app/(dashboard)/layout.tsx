"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardList,
  FolderOpen,
  UtensilsCrossed,
  BarChart3,
  Settings,
  CreditCard,
  Menu,
  X,
  ChevronUp,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { STUDIO_HOME, studioPath } from "@/lib/studio";
import { useStudioStore } from "@/lib/stores/studio.store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import {
  useSubscriptionStore,
  isSubscriptionActive,
} from "@/lib/stores/subscription.store";
import FullScreenLoader from "@/app/_components/FullScreenLoader";
import OpenClosedToggle from "./_components/OpenClosedToggle";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: STUDIO_HOME, label: "Live Orders", icon: ClipboardList, exact: true },
  { href: studioPath("history"), label: "Order History", icon: FolderOpen },
  { href: studioPath("menu"), label: "Menu Management", icon: UtensilsCrossed },
  { href: studioPath("analytics"), label: "Analytics", icon: BarChart3 },
  { href: studioPath("settings"), label: "Settings", icon: Settings },
  { href: studioPath("billing"), label: "Billing", icon: CreditCard },
];

export default function StudioAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarOpen = useStudioStore((s) => s.sidebarOpen);
  const setSidebarOpen = useStudioStore((s) => s.setSidebarOpen);

  const token = useAuthStore((s) => s.token);
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const activeRole = useAuthStore((s) => s.activeRole);
  const user = useAuthStore((s) => s.user);
  const signout = useAuthStore((s) => s.signout);

  const restaurant = useRestaurantStore((s) => s.restaurant);
  const fetchRestaurant = useRestaurantStore((s) => s.fetch);

  const subscription = useSubscriptionStore((s) => s.subscription);
  const subLoading = useSubscriptionStore((s) => s.loading);
  const fetchSubscription = useSubscriptionStore((s) => s.fetch);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    Promise.resolve(useAuthStore.persist.rehydrate()).then(() =>
      setHydrated(true)
    );
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push("/login");
      return;
    }
    if (!activeRestaurantId) {
      router.push("/onboard");
      return;
    }
    if (!restaurant) void fetchRestaurant();
    if (!subscription && !subLoading) void fetchSubscription();
    if (subscription && !isSubscriptionActive(subscription)) {
      router.push("/pricing");
    }
  }, [hydrated, token, activeRestaurantId, restaurant, subscription, subLoading, fetchRestaurant, fetchSubscription, router]);

  const handleSignOut = async () => {
    await signout();
    router.push("/login");
  };

  const handleSettings = () => {
    router.push(studioPath("settings"));
    setSidebarOpen(false);
  };

  if (!hydrated || !token || !activeRestaurantId) {
    return <FullScreenLoader />;
  }
  // Show loader while subscription is being fetched for the first time
  if (subLoading && !subscription) {
    return <FullScreenLoader />;
  }
  // Prevent dashboard flash while redirect to /pricing is in flight
  if (subscription && !isSubscriptionActive(subscription)) {
    return <FullScreenLoader />;
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const currentPage = NAV_ITEMS.find((item) => isActive(item.href, item.exact));
  const pageTitle = currentPage?.label ?? "Studio";

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: "#F5F7FA" }}
    >
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-60 z-40"
        style={{ backgroundColor: "#0F2B4D" }}
      >
        <SidebarContent
          pathname={pathname}
          restaurantName={restaurant?.name}
          showRestaurantToggle={!!restaurant}
          onNavigate={() => setSidebarOpen(false)}
          user={user}
          role={activeRole}
          onSignOut={handleSignOut}
          onSettings={handleSettings}
        />
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="absolute top-0 left-0 h-full w-60 flex flex-col"
            style={{ backgroundColor: "#0F2B4D" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-white/60"
            >
              <X size={20} />
            </button>
            <SidebarContent
              pathname={pathname}
              showRestaurantToggle={!!restaurant}
              onNavigate={() => setSidebarOpen(false)}
              user={user}
              role={activeRole}
              onSignOut={handleSignOut}
              onSettings={handleSettings}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-60">
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-6 py-4"
          style={{
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #111111",
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
              style={{ color: "#1E1E1E" }}
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-semibold" style={{ color: "#1E1E1E" }}>
              {pageTitle}
            </h1>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  pathname,
  restaurantName,
  showRestaurantToggle,
  onNavigate,
  user,
  role,
  onSignOut,
  onSettings,
}: {
  pathname: string;
  restaurantName?: string;
  showRestaurantToggle: boolean;
  onNavigate: () => void;
  user: { full_name?: string; email?: string } | null;
  role: string | null;
  onSignOut: () => void;
  onSettings: () => void;
}) {
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <div
        className="px-6 py-6"
        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: "#FFFFFF", color: "#0F2B4D" }}
          >
            R
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">Restoro</p>
            <p
              className="text-xs truncate"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
              title={restaurantName ?? undefined}
            >
              {restaurantName ?? "Studio"}
            </p>
          </div>
        </div>
      </div>

      {showRestaurantToggle && <OpenClosedToggle variant="sidebar" />}

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              prefetch
              className="flex items-center gap-3 px-3 py-2.5 text-sm transition-all"
              style={{
                backgroundColor: active
                  ? "rgba(255, 255, 255, 0.08)"
                  : "transparent",
                color: active ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                borderLeft: active
                  ? "3px solid #FFFFFF"
                  : "3px solid transparent",
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <ProfileChip
        user={user}
        role={role}
        onSignOut={onSignOut}
        onSettings={onSettings}
      />
    </>
  );
}

function ProfileChip({
  user,
  role,
  onSignOut,
  onSettings,
}: {
  user: { full_name?: string; email?: string } | null;
  role: string | null;
  onSignOut: () => void;
  onSettings: () => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayName = user?.full_name?.trim() || user?.email || "Account";
  const initial = (displayName[0] ?? "A").toUpperCase();
  const subtitle = role ? role.charAt(0).toUpperCase() + role.slice(1) : user?.email ?? "";

  useEffect(() => {
    if (!open) return;
    const onClickAway = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative px-3 py-3"
      style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}
    >
      {open && (
        <div
          className="absolute left-3 right-3 bottom-full mb-2"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSettings();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-left transition-colors hover:bg-slate-50"
            style={{ color: "#1E1E1E" }}
          >
            <Settings size={14} />
            Account settings
          </button>
          <div style={{ borderTop: "1px solid #E5E7EB" }} />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-left transition-colors hover:bg-slate-50"
            style={{ color: "#DC2626" }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-2 py-2 transition-colors hover:bg-white/5"
      >
        <div
          className="w-9 h-9 flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: "#FFFFFF", color: "#0F2B4D" }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-white truncate">
            {displayName}
          </p>
          {subtitle && (
            <p
              className="text-xs truncate"
              style={{ color: "rgba(255, 255, 255, 0.6)" }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <ChevronUp
          size={16}
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            transform: open ? "rotate(0deg)" : "rotate(180deg)",
            transition: "transform 0.15s",
          }}
        />
      </button>
    </div>
  );
}
