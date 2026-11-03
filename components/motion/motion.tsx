"use client"

import { useEffect, useRef, type ComponentProps, type MouseEvent, type ReactNode } from "react"
import { motion, useInView, useMotionValue, useReducedMotion, useSpring, type Variants } from "motion/react"
import { cn } from "@/lib/utils"

/** Counts up to `value` with a spring when it scrolls into view. */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("en"),
  className,
}: {
  value: number
  format?: (n: number) => string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-20px" })
  const reduce = useReducedMotion()
  const mv = useMotionValue(0)
  const spring = useSpring(mv, { stiffness: 70, damping: 18, mass: 0.9 })
  const formatRef = useRef(format)
  formatRef.current = format

  useEffect(() => {
    if (reduce) {
      // No count-up with reduced motion: show the final value right away, in or out of view.
      spring.jump(value)
      if (ref.current) ref.current.textContent = formatRef.current(value)
      return
    }
    if (inView) mv.set(value)
  }, [inView, value, reduce, mv, spring])

  useEffect(
    () =>
      spring.on("change", (v) => {
        if (ref.current) ref.current.textContent = formatRef.current(v)
      }),
    [spring],
  )

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  )
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
}

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 260, damping: 26 } },
}

/** Container whose <StaggerItem> children cascade in. */
export function Stagger({ className, children, ...props }: ComponentProps<typeof motion.div>) {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className={className} {...props}>
      {children}
    </motion.div>
  )
}

export function StaggerItem({ className, children, ...props }: ComponentProps<typeof motion.div>) {
  return (
    <motion.div variants={itemVariants} className={className} {...props}>
      {children}
    </motion.div>
  )
}

/** Sets --mx/--my on hover so `.spotlight` cards light up under the cursor. */
export function spotlightHandlers() {
  return {
    onMouseMove: (e: MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`)
      e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`)
    },
  }
}

export function Spotlight({ className, children, ...props }: ComponentProps<"div"> & { children: ReactNode }) {
  return (
    <div className={cn("spotlight", className)} {...spotlightHandlers()} {...props}>
      {children}
    </div>
  )
}
