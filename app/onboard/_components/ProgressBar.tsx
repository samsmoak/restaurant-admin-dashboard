"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export type Step = {
  key: string;
  title: string;
  subtitle?: string;
};

export default function ProgressBar({
  steps,
  currentIndex,
  completedKeys,
}: {
  steps: Step[];
  currentIndex: number;
  completedKeys: Set<string>;
}) {
  const total = steps.length;
  const percent = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <div className="mb-10">
      {/* Step pills */}
      <ol className="flex items-center justify-between gap-2 mb-4">
        {steps.map((step, idx) => {
          const done = completedKeys.has(step.key);
          const active = idx === currentIndex;
          return (
            <li key={step.key} className="flex-1 flex items-center gap-2 min-w-0">
              <div className="relative flex items-center justify-center shrink-0">
                <motion.div
                  className="rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: done ? "#10B981" : active ? "#111318" : "#E2E8F0",
                    color: done || active ? "#FFFFFF" : "#64748B",
                  }}
                  animate={{
                    scale: active ? 1.08 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {done ? <Check size={16} strokeWidth={3} /> : idx + 1}
                </motion.div>
                {active && !done && (
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      inset: -4,
                      border: "2px solid #E8A045",
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                  />
                )}
              </div>
              <span
                className="hidden sm:inline text-xs font-medium truncate"
                style={{ color: active ? "#0F172A" : "#94A3B8" }}
              >
                {step.title}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Filled bar */}
      <div
        className="relative h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "#E2E8F0" }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: "linear-gradient(90deg, #FFB627 0%, #FF5A3C 100%)",
          }}
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
        />
      </div>
    </div>
  );
}
