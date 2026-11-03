"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { cn } from "@/lib/utils"

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the legacy path
  }
  // Clipboard API is unavailable on plain-HTTP origins (e.g. opening the app via a LAN IP).
  const area = document.createElement("textarea")
  area.value = text
  area.setAttribute("readonly", "")
  area.style.position = "fixed"
  area.style.opacity = "0"
  document.body.appendChild(area)
  area.select()
  const ok = document.execCommand("copy")
  area.remove()
  return ok
}

const iconMotion = {
  initial: { scale: 0.4, opacity: 0, rotate: -30 },
  animate: { scale: 1, opacity: 1, rotate: 0 },
  exit: { scale: 0.4, opacity: 0 },
  transition: { duration: 0.18 },
}

export function CopyButton({
  text,
  getText,
  label,
  className,
  title = "Copy",
}: {
  text?: string
  getText?: () => string
  label?: string
  className?: string
  title?: string
}) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const ok = await copyText(getText ? getText() : (text ?? ""))
    if (!ok) return
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={copied ? "Copied" : title}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors [&_svg]:size-3.5",
        className,
      )}
    >
      <span className="relative grid size-3.5 place-items-center">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span key="done" {...iconMotion} className="absolute text-[#3fb950]">
              <Check />
            </motion.span>
          ) : (
            <motion.span key="copy" {...iconMotion} className="absolute">
              <Copy />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  )
}
