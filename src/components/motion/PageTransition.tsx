"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";

export type PageTransitionProps = {
  children: React.ReactNode;
  className?: string;
};

/** Fade + slight rise on mount. No-op when the user prefers reduced motion. */
export function PageTransition({ children, className }: PageTransitionProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.32,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export type StaggerListProps<T> = {
  items: T[];
  keyFn: (item: T, index: number) => React.Key;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
  /** Seconds between successive children. */
  stagger?: number;
};

/** Staggered fade-in for list items. Respects prefers-reduced-motion. */
export function StaggerList<T>({
  items,
  keyFn,
  render,
  className,
  stagger = 0.05,
}: StaggerListProps<T>) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: reduce ? 0 : stagger },
        },
      }}
    >
      {items.map((item, i) => (
        <motion.div
          key={keyFn(item, i)}
          variants={{
            hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 6 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: reduce ? 0 : 0.28,
                ease: [0.16, 1, 0.3, 1],
              },
            },
          }}
        >
          {render(item, i)}
        </motion.div>
      ))}
    </motion.div>
  );
}
