"use client";

import OnboardWizard from "./OnboardWizard";

export default function OnboardPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{
        background:
          "radial-gradient(circle at 0% 0%, #FFF7EC 0%, transparent 45%)," +
          "radial-gradient(circle at 100% 100%, #FFEEE6 0%, transparent 45%)," +
          "#FFFFFF",
      }}
    >
      <header className="text-center mb-6">
        <div
          className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-xl font-bold"
          style={{ backgroundColor: "#111318", color: "#E8A045" }}
        >
          E&F
        </div>
        <h1
          className="text-3xl font-bold"
          style={{ color: "#0F172A", fontFamily: "var(--font-playfair, serif)" }}
        >
          Let's set up your restaurant
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "#64748B" }}>
          5 quick steps. You can leave and come back — your progress is saved.
        </p>
      </header>

      <div className="w-full">
        <OnboardWizard />
      </div>
    </main>
  );
}
