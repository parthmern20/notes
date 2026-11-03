import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const compactFmt = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })
const fullFmt = new Intl.NumberFormat("en")

/** Full figures below 10,000, compact above (1,284 / 12.9K). */
export function formatNumber(n: number): string {
  return Math.abs(n) < 10_000 ? fullFmt.format(Math.round(n)) : compactFmt.format(n)
}

export function plural(n: number, one: string, many = one + "s"): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`
}

export function formatMinutes(minutes: number): string {
  if (minutes < 1) return minutes > 0 ? "<1m" : "0m"
  if (minutes < 60) return `${Math.round(minutes)}m`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m ? `${h}h ${m}m` : `${h}h`
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function greeting(date = new Date()): string {
  const h = date.getHours()
  if (h < 5) return "Burning the midnight oil"
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

export function normalizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}._+#-]/gu, "")
    .slice(0, 32)
}

export function downloadFile(filename: string, contents: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([contents], { type }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function safeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 80) || "note"
}
