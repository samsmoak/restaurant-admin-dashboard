"use client";

import OnboardWizard from "./OnboardWizard";

export default function OnboardPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ backgroundColor: "#F5F7FA" }}
    >
      <div className="w-full">
        <OnboardWizard />
      </div>
    </main>
  );
}
