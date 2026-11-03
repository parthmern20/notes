import type { CSSProperties } from "react"

// Each identity colour carries a base hue plus ink steps that keep text/icons legible on light and dark surfaces.
export const SKILL_COLORS = {
  violet: { label: "Violet", base: "#8b5cf6", light: "#6d28d9", dark: "#c4b5fd" },
  indigo: { label: "Indigo", base: "#6366f1", light: "#4338ca", dark: "#a5b4fc" },
  blue: { label: "Blue", base: "#3b82f6", light: "#1d4ed8", dark: "#93c5fd" },
  sky: { label: "Sky", base: "#0ea5e9", light: "#0369a1", dark: "#7dd3fc" },
  cyan: { label: "Cyan", base: "#06b6d4", light: "#0e7490", dark: "#67e8f9" },
  teal: { label: "Teal", base: "#14b8a6", light: "#0f766e", dark: "#5eead4" },
  emerald: { label: "Emerald", base: "#10b981", light: "#047857", dark: "#6ee7b7" },
  lime: { label: "Lime", base: "#84cc16", light: "#4d7c0f", dark: "#bef264" },
  amber: { label: "Amber", base: "#f59e0b", light: "#b45309", dark: "#fcd34d" },
  orange: { label: "Orange", base: "#f97316", light: "#c2410c", dark: "#fdba74" },
  rose: { label: "Rose", base: "#f43f5e", light: "#be123c", dark: "#fda4af" },
  pink: { label: "Pink", base: "#ec4899", light: "#be185d", dark: "#f9a8d4" },
  fuchsia: { label: "Fuchsia", base: "#d946ef", light: "#a21caf", dark: "#f0abfc" },
  slate: { label: "Slate", base: "#64748b", light: "#334155", dark: "#cbd5e1" },
} as const

export type SkillColor = keyof typeof SKILL_COLORS
export const SKILL_COLOR_KEYS = Object.keys(SKILL_COLORS) as SkillColor[]

export const SKILL_ICON_KEYS = [
  "code",
  "terminal",
  "cloud",
  "database",
  "server",
  "cpu",
  "network",
  "shield",
  "git",
  "container",
  "globe",
  "smartphone",
  "layers",
  "boxes",
  "bot",
  "brain",
  "book",
  "graduation",
  "rocket",
  "lightbulb",
  "sparkles",
  "zap",
  "target",
  "atom",
  "flask",
  "calculator",
  "chart",
  "briefcase",
  "languages",
  "pen",
  "palette",
  "music",
  "camera",
  "dumbbell",
  "heart",
  "leaf",
  "compass",
  "puzzle",
] as const

export type SkillIconKey = (typeof SKILL_ICON_KEYS)[number]

export function colorOf(key: string) {
  return SKILL_COLORS[(key in SKILL_COLORS ? key : "violet") as SkillColor]
}

export function skillStyle(key: string): CSSProperties {
  const c = colorOf(key)
  return { "--skill": c.base, "--skill-l": c.light, "--skill-d": c.dark } as CSSProperties
}
