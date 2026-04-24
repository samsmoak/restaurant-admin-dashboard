"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

/**
 * Wraps a single wizard step with a consistent header, animated content area,
 * and a flex footer that puts Back (if available) on the left and whatever
 * the step passes as `footer` (usually the submit button) on the right.
 */
export default function StepShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  onBack,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onBack?: () => void;
}) {
  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className="flex flex-col gap-6"
    >
      <header>
        {eyebrow && (
          <p
            className="text-xs tracking-[0.25em] uppercase font-semibold mb-1.5"
            style={{ color: "#0F2B4D" }}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className="text-2xl font-bold"
          style={{ color: "#1E1E1E" }}
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm mt-1.5" style={{ color: "#4A4A4A" }}>
            {description}
          </p>
        )}
      </header>

      <div className="flex flex-col gap-4">{children}</div>

      <footer className="flex items-center justify-between gap-3 pt-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-all hover:bg-slate-50"
            style={{
              backgroundColor: "#FFFFFF",
              color: "#1E1E1E",
              border: "1px solid #E5E7EB",
              borderRadius: 6,
            }}
          >
            <ChevronLeft size={15} />
            Back
          </button>
        ) : (
          <span />
        )}
        <div className="flex-1 flex justify-end">{footer}</div>
      </footer>
    </motion.div>
  );
}
