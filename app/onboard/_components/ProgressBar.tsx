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
                  className="flex items-center justify-center text-xs font-bold"
                  style={{
                    width: 32,
                    height: 32,
                    backgroundColor: done ? "#0F2B4D" : active ? "#0F2B4D" : "#E5E7EB",
                    color: done || active ? "#FFFFFF" : "#4A4A4A",
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
                    className="absolute"
                    style={{
                      inset: -4,
                      border: "2px solid #0F2B4D",
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                  />
                )}
              </div>
              <span
                className="hidden sm:inline text-xs font-medium truncate"
                style={{ color: active ? "#1E1E1E" : "#6B7280" }}
              >
                {step.title}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Filled bar */}
      <div
        className="relative h-1.5 overflow-hidden"
        style={{ backgroundColor: "#E5E7EB" }}
      >
        <motion.div
          className="absolute inset-y-0 left-0"
          style={{ backgroundColor: "#0F2B4D" }}
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
        />
      </div>
    </div>
  );
}
