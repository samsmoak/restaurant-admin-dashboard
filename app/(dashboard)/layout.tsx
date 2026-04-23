"use client";

import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FolderOpen,
  UtensilsCrossed,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  UserPlus,
} from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { STUDIO_HOME, studioPath } from "@/lib/studio";
import { useStudioStore } from "@/lib/stores/studio.store";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useRestaurantStore } from "@/lib/stores/restaurant.store";
import OpenClosedToggle from "./_components/OpenClosedToggle";

const NAV_ITEMS = [
  { href: STUDIO_HOME, label: "Live Orders", icon: ClipboardList, exact: true },
  { href: studioPath("history"), label: "Order History", icon: FolderOpen },
  { href: studioPath("menu"), label: "Menu Management", icon: UtensilsCrossed },
  { href: studioPath("analytics"), label: "Analytics", icon: BarChart3 },
  { href: studioPath("team"), label: "Team", icon: UserPlus },
  { href: studioPath("settings"), label: "Settings", icon: Settings },
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

  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);
  const activeRestaurantId = useAuthStore((s) => s.activeRestaurantId);
  const signout = useAuthStore((s) => s.signout);

  const restaurant = useRestaurantStore((s) => s.restaurant);
  const fetchRestaurant = useRestaurantStore((s) => s.fetch);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (!activeRestaurantId) {
      // token has no restaurant scope — send to picker / onboard
      router.push("/onboard");
      return;
    }
    if (!restaurant) void fetchRestaurant();
  }, [token, activeRestaurantId, restaurant, fetchRestaurant, router]);

  const handleSignOut = async () => {
    await signout();
    router.push("/login");
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <>
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: "#E8A045", color: "#111318" }}
          >
            E&F
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Ember & Forge</p>
            <p className="text-xs" style={{ color: "#64748B" }}>
              Studio
            </p>
          </div>
        </div>
      </div>

      {restaurant && <OpenClosedToggle variant="sidebar" />}

      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: active
                  ? "rgba(232, 160, 69, 0.1)"
                  : "transparent",
                color: active ? "#E8A045" : "#94A3B8",
                borderLeft: active
                  ? "3px solid #E8A045"
                  : "3px solid transparent",
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-all hover:bg-white/5"
          style={{ color: "#94A3B8" }}
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </>
  );

  const currentPage = NAV_ITEMS.find((item) => isActive(item.href, item.exact));
  const pageTitle = currentPage?.label ?? "Studio";

  return (
    <div className="flex min-h-screen">
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen w-60 z-40"
        style={{ backgroundColor: "#111318" }}
      >
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <aside
            className="absolute top-0 left-0 h-full w-60 flex flex-col"
            style={{ backgroundColor: "#111318" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-white/60"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-60">
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b"
          style={{
            backgroundColor: "#FFFFFF",
            borderColor: "#E2E8F0",
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
              style={{ color: "#0F172A" }}
            >
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-semibold" style={{ color: "#0F172A" }}>
              {pageTitle}
            </h1>
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
