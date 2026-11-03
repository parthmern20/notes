"use client"

import { motion } from "motion/react"

// Re-mounts on every navigation, giving each page a soft entrance. No filter/transform is left
// behind once settled, so fixed/sticky descendants keep their normal containing block.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
