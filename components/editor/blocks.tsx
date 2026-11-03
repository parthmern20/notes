import { createElement, type ReactNode } from "react"
import { createLowlight, common } from "lowlight"
import dockerfile from "highlight.js/lib/languages/dockerfile"
import nginx from "highlight.js/lib/languages/nginx"
import powershell from "highlight.js/lib/languages/powershell"
import { Info, Lightbulb, OctagonAlert, Star, StickyNote, TriangleAlert, type LucideIcon } from "lucide-react"

export const lowlight = createLowlight(common)
lowlight.register({ dockerfile, nginx, powershell })

export const LANGUAGES: { id: string; label: string; color: string }[] = [
  { id: "plaintext", label: "Plain text", color: "#8b95a7" },
  { id: "bash", label: "Bash", color: "#4eaa25" },
  { id: "powershell", label: "PowerShell", color: "#2f6fd6" },
  { id: "javascript", label: "JavaScript", color: "#f1d84b" },
  { id: "typescript", label: "TypeScript", color: "#3178c6" },
  { id: "python", label: "Python", color: "#4b8bbe" },
  { id: "java", label: "Java", color: "#e76f00" },
  { id: "csharp", label: "C#", color: "#9b4f96" },
  { id: "cpp", label: "C++", color: "#00599c" },
  { id: "c", label: "C", color: "#7f8fa6" },
  { id: "go", label: "Go", color: "#00add8" },
  { id: "rust", label: "Rust", color: "#dea584" },
  { id: "kotlin", label: "Kotlin", color: "#a97bff" },
  { id: "swift", label: "Swift", color: "#f05138" },
  { id: "php", label: "PHP", color: "#777bb4" },
  { id: "ruby", label: "Ruby", color: "#cc342d" },
  { id: "sql", label: "SQL", color: "#e38c00" },
  { id: "json", label: "JSON", color: "#cbcb41" },
  { id: "yaml", label: "YAML", color: "#cb171e" },
  { id: "xml", label: "HTML / XML", color: "#e34c26" },
  { id: "css", label: "CSS", color: "#2965f1" },
  { id: "scss", label: "SCSS", color: "#c6538c" },
  { id: "markdown", label: "Markdown", color: "#8b95a7" },
  { id: "dockerfile", label: "Dockerfile", color: "#2496ed" },
  { id: "nginx", label: "Nginx", color: "#009639" },
  { id: "ini", label: "INI / TOML", color: "#8b95a7" },
  { id: "graphql", label: "GraphQL", color: "#e10098" },
  { id: "diff", label: "Diff", color: "#8b95a7" },
  { id: "makefile", label: "Makefile", color: "#6d8086" },
  { id: "lua", label: "Lua", color: "#000080" },
  { id: "r", label: "R", color: "#276dc3" },
]

export function languageMeta(id: string) {
  return LANGUAGES.find((l) => l.id === id) ?? { id, label: id || "Plain text", color: "#8b95a7" }
}

export const SHELL_OPTIONS = [
  { id: "bash", label: "Bash" },
  { id: "zsh", label: "Zsh" },
  { id: "powershell", label: "PowerShell" },
  { id: "cmd", label: "CMD" },
] as const

export type CalloutVariant = "info" | "tip" | "warning" | "danger" | "note" | "important"

export const CALLOUTS: Record<CalloutVariant, { label: string; icon: LucideIcon }> = {
  info: { label: "Info", icon: Info },
  tip: { label: "Tip", icon: Lightbulb },
  important: { label: "Remember", icon: Star },
  warning: { label: "Warning", icon: TriangleAlert },
  danger: { label: "Gotcha", icon: OctagonAlert },
  note: { label: "Note", icon: StickyNote },
}

export const CALLOUT_ORDER = Object.keys(CALLOUTS) as CalloutVariant[]

export function calloutOf(value: unknown): CalloutVariant {
  return typeof value === "string" && value in CALLOUTS ? (value as CalloutVariant) : "info"
}

// Theme-adaptive palettes for text colour and highlights (CSS variables flip with the theme).
export const TEXT_COLORS = ["red", "orange", "amber", "green", "teal", "blue", "violet", "pink", "gray"].map((c) => ({
  name: c,
  value: `var(--tc-${c})`,
}))

export const HIGHLIGHTS = ["yellow", "green", "blue", "pink", "purple", "orange"].map((c) => ({
  name: c,
  value: `var(--hl-${c})`,
}))

const SAFE_COLOR = /^(var\(--(tc|hl)-[a-z]+\)|#[0-9a-f]{3,8}|rgba?\([\d\s.,/%]+\))$/i

/** Only palette variables and literal colours reach a style attribute. */
export function safeColor(value: unknown): string | undefined {
  return typeof value === "string" && SAFE_COLOR.test(value.trim()) ? value.trim() : undefined
}

// ───────────── Syntax highlighting to React (used by the reader) ─────────────

interface HastText {
  type: "text"
  value: string
}
interface HastElement {
  type: "element"
  tagName: string
  properties?: { className?: string[] | string }
  children: HastNode[]
}
interface HastRoot {
  type: "root"
  children: HastNode[]
}
type HastNode = HastText | HastElement | HastRoot

function hastToReact(node: HastNode, key: number): ReactNode {
  if (node.type === "text") return node.value
  if (node.type === "element") {
    const cls = node.properties?.className
    return createElement(
      node.tagName,
      { key, className: Array.isArray(cls) ? cls.join(" ") : cls },
      node.children.map((c, i) => hastToReact(c, i)),
    )
  }
  return node.children.map((c, i) => hastToReact(c, i))
}

export function highlightCode(code: string, language: string): ReactNode {
  if (!language || language === "plaintext" || !lowlight.registered(language)) return code
  try {
    return hastToReact(lowlight.highlight(language, code) as unknown as HastNode, 0)
  } catch {
    return code
  }
}
