"use client";

import { type Variants, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { fadeUp } from "@/lib/animations";

type AnimateOnScrollProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: Variants;
};

export function AnimateOnScroll({
  children,
  className,
  delay = 0,
  variant = fadeUp,
}: AnimateOnScrollProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variant}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
