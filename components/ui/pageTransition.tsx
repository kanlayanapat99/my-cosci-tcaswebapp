"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 5,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 1.0,
      }}
    >
      {children}
    </motion.div>
  );
}