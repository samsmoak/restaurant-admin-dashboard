import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Savorar",
    default: "Dashboard | Savorar",
  },
  description: "Savorar — Restaurant management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const showEnvBanner =
    process.env.NODE_ENV !== "production" &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === "your_supabase_project_url");

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}
        style={{ backgroundColor: "#F8F9FA", color: "#0F172A" }}
      >
        {showEnvBanner && (
          <div
            role="status"
            className="fixed bottom-3 right-3 z-10000 max-w-sm text-xs px-4 py-3 rounded-lg shadow-lg"
            style={{
              backgroundColor: "#1a1205",
              color: "#E8A045",
              border: "1px solid rgba(232,160,69,0.5)",
              fontFamily: "var(--font-space-grotesk)",
            }}
          >
            <strong className="block mb-1">Supabase not configured</strong>
            <span style={{ color: "#BFB7A8" }}>
              Fill in <code>.env.local</code> (Supabase URL, anon key,
              service-role key) to enable the dashboard.
            </span>
          </div>
        )}
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
