"use client";

import { motion } from "framer-motion";

/**
 * GlassButton — liquid-glass pill button with hover/tap spring.
 * variant: "glass" (default) | "solid" (light bg, dark text).
 */
export default function GlassButton({
  children,
  variant = "glass",
  className = "",
  as = "button",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors";
  const look =
    variant === "solid"
      ? "bg-white text-black hover:bg-white/90"
      : "liquid-glass text-white hover:bg-white/5";
  const Comp = motion[as] || motion.button;
  return (
    <Comp
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${base} ${look} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}
