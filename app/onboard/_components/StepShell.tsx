"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

/**
 * Wraps a single wizard step with a consistent header, animated content area,
 * and footer. Individual steps pass their own footer (typically a submit
 * button) as `footer`.
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
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-medium mb-3 transition-colors hover:opacity-70"
            style={{ color: "#64748B" }}
          >
            <ChevronLeft size={14} />
            Back
          </button>
        )}
        {eyebrow && (
          <p
            className="text-xs tracking-[0.25em] uppercase font-semibold mb-1.5"
            style={{ color: "#FF5A3C" }}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className="text-2xl font-bold"
          style={{ color: "#0F172A", fontFamily: "var(--font-playfair, serif)" }}
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm mt-1.5" style={{ color: "#64748B" }}>
            {description}
          </p>
        )}
      </header>

      <div className="flex flex-col gap-4">{children}</div>

      <footer className="pt-2">{footer}</footer>
    </motion.div>
  );
}
