// Helpers for the rich-text document format (ProseMirror/Tiptap JSON), shared by server and client.

export interface DocMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface DocNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: DocNode[]
  marks?: DocMark[]
  text?: string
}

export const EMPTY_DOC: DocNode = { type: "doc", content: [{ type: "paragraph" }] }

export type Shell = "bash" | "zsh" | "powershell" | "cmd"

export const SHELLS: Record<Shell, { label: string; prompt: string; comment: RegExp; continuation: RegExp }> = {
  bash: { label: "Bash", prompt: "$", comment: /^\s*#/, continuation: /\\\s*$/ },
  zsh: { label: "Zsh", prompt: "❯", comment: /^\s*#/, continuation: /\\\s*$/ },
  powershell: { label: "PowerShell", prompt: "PS>", comment: /^\s*#/, continuation: /`\s*$/ },
  cmd: { label: "CMD", prompt: ">", comment: /^\s*(rem\s|::)/i, continuation: /\^\s*$/ },
}

export function shellOf(value: unknown): Shell {
  return typeof value === "string" && value in SHELLS ? (value as Shell) : "bash"
}

export interface TerminalLineInfo {
  text: string
  kind: "command" | "comment" | "continuation" | "blank"
}

/** Classifies terminal lines so prompts are drawn only before real commands. */
export function classifyTerminalLines(lines: string[], shell: Shell): TerminalLineInfo[] {
  const spec = SHELLS[shell]
  let continues = false
  return lines.map((text) => {
    let kind: TerminalLineInfo["kind"]
    if (continues) kind = "continuation"
    else if (!text.trim()) kind = "blank"
    else if (spec.comment.test(text)) kind = "comment"
    else kind = "command"
    continues = kind !== "comment" && kind !== "blank" && spec.continuation.test(text)
    return { text, kind }
  })
}

/** Groups continuation lines with their command, dropping comments — what you'd paste into a shell. */
export function terminalCommands(lines: string[], shell: Shell): string[] {
  const out: string[] = []
  for (const line of classifyTerminalLines(lines, shell)) {
    if (line.kind === "command") out.push(line.text)
    else if (line.kind === "continuation" && out.length) out[out.length - 1] += "\n" + line.text
  }
  return out
}

export function terminalLinesOf(node: DocNode): string[] {
  return (node.content ?? []).map((line) => (line.content ?? []).map((t) => t.text ?? "").join(""))
}

const INLINE_TYPES = new Set(["text", "hardBreak"])

export function docToText(node?: DocNode | null): string {
  if (!node) return ""
  if (node.type === "text") return node.text ?? ""
  if (node.type === "hardBreak") return "\n"
  const children = node.content ?? []
  if (!children.length) return ""
  const inline = children.every((c) => INLINE_TYPES.has(c.type ?? ""))
  return children.map(docToText).join(inline ? "" : "\n")
}

export function walk(node: DocNode, visit: (node: DocNode, parent: DocNode | null) => void, parent: DocNode | null = null) {
  visit(node, parent)
  for (const child of node.content ?? []) walk(child, visit, node)
}

export interface DocStats {
  words: number
  readingMinutes: number
  codeBlocks: number
  commands: number
}

export function docStats(doc: DocNode, text = docToText(doc)): DocStats {
  let codeBlocks = 0
  let commands = 0
  walk(doc, (node) => {
    if (node.type === "codeBlock") codeBlocks += 1
    if (node.type === "terminal") {
      const shell = shellOf(node.attrs?.shell)
      commands += terminalCommands(terminalLinesOf(node), shell).length
    }
  })
  const words = text.split(/\s+/).filter(Boolean).length
  return { words, readingMinutes: Math.max(1, Math.round(words / 200)), codeBlocks, commands }
}

export interface ExtractedSnippet {
  kind: "code" | "terminal"
  language: string
  code: string
  heading: string | null
}

export function extractSnippets(doc: DocNode): ExtractedSnippet[] {
  const out: ExtractedSnippet[] = []
  let heading: string | null = null
  walk(doc, (node) => {
    if (node.type === "heading") heading = docToText(node).trim() || heading
    if (node.type === "codeBlock") {
      const code = docToText(node)
      if (code.trim()) out.push({ kind: "code", language: String(node.attrs?.language || "plaintext"), code, heading })
    }
    if (node.type === "terminal") {
      const code = terminalLinesOf(node).join("\n")
      if (code.trim()) out.push({ kind: "terminal", language: shellOf(node.attrs?.shell), code, heading })
    }
  })
  return out
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 64) || "section"
  )
}

/** Stateful slugger so the reader and the table of contents assign identical heading ids. */
export function createSlugger() {
  const seen = new Map<string, number>()
  return (text: string) => {
    const base = slugify(text)
    const n = seen.get(base) ?? 0
    seen.set(base, n + 1)
    return n ? `${base}-${n}` : base
  }
}

export interface HeadingInfo {
  id: string
  text: string
  level: number
}

export function extractHeadings(doc: DocNode): HeadingInfo[] {
  const slug = createSlugger()
  const out: HeadingInfo[] = []
  walk(doc, (node) => {
    if (node.type !== "heading") return
    const text = docToText(node).trim()
    if (!text) return
    out.push({ id: slug(text), text, level: Number(node.attrs?.level ?? 2) })
  })
  return out
}

export function excerptOf(text: string, length = 180): string {
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length > length ? clean.slice(0, length).replace(/\s+\S*$/, "") + "…" : clean
}

/** Text around the first match of `query`, for search results. */
export function matchContext(text: string, query: string, radius = 60): string {
  const clean = text.replace(/\s+/g, " ").trim()
  const at = clean.toLowerCase().indexOf(query.toLowerCase())
  if (at < 0) return excerptOf(clean, radius * 2)
  const start = Math.max(0, at - radius)
  const end = Math.min(clean.length, at + query.length + radius)
  return (start > 0 ? "…" : "") + clean.slice(start, end).trim() + (end < clean.length ? "…" : "")
}

export function isDocEmpty(doc?: DocNode | null): boolean {
  if (!doc) return true
  let empty = true
  walk(doc, (node) => {
    if (!empty) return
    if (node.type === "text" && node.text?.trim()) empty = false
    if (node.type && ["image", "codeBlock", "terminal", "table", "horizontalRule"].includes(node.type)) empty = false
  })
  return empty
}

// ───────────── Markdown serialisation (export + AI prompt input) ─────────────

interface MarkdownOptions {
  images?: boolean
}

function inlineMd(nodes: DocNode[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === "hardBreak") return "  \n"
      if (n.type !== "text") return docToText(n)
      let text = n.text ?? ""
      const marks = n.marks ?? []
      const has = (t: string) => marks.some((m) => m.type === t)
      if (has("code")) return "`" + text + "`"
      if (has("bold")) text = `**${text}**`
      if (has("italic")) text = `_${text}_`
      if (has("strike")) text = `~~${text}~~`
      const link = marks.find((m) => m.type === "link")
      if (link?.attrs?.href) text = `[${text}](${String(link.attrs.href)})`
      return text
    })
    .join("")
}

function listItemMd(item: DocNode, marker: string, indent: string, opts: MarkdownOptions): string {
  const [first, ...rest] = item.content ?? []
  const head = first?.type === "paragraph" ? inlineMd(first.content) : first ? blockMd(first, indent + "  ", opts) : ""
  const tail = rest.map((child) => blockMd(child, indent + "  ", opts)).filter(Boolean)
  return [`${indent}${marker} ${head}`, ...tail].join("\n")
}

function blockMd(node: DocNode, indent: string, opts: MarkdownOptions): string {
  const children = node.content ?? []
  switch (node.type) {
    case "paragraph":
      return indent + inlineMd(children)
    case "heading":
      return "#".repeat(Number(node.attrs?.level ?? 2)) + " " + inlineMd(children)
    case "bulletList":
      return children.map((li) => listItemMd(li, "-", indent, opts)).join("\n")
    case "orderedList": {
      const start = Number(node.attrs?.start ?? 1)
      return children.map((li, i) => listItemMd(li, `${start + i}.`, indent, opts)).join("\n")
    }
    case "taskList":
      return children.map((li) => listItemMd(li, li.attrs?.checked ? "- [x]" : "- [ ]", indent, opts)).join("\n")
    case "blockquote":
      return blocksMd(children, "", opts)
        .split("\n")
        .map((l) => `${indent}> ${l}`)
        .join("\n")
    case "callout": {
      const body = blocksMd(children, "", opts)
      const variant = String(node.attrs?.variant ?? "info").toUpperCase()
      return [`> [!${variant}]`, ...body.split("\n").map((l) => `> ${l}`)].join("\n")
    }
    case "codeBlock":
      return "```" + String(node.attrs?.language ?? "") + "\n" + docToText(node) + "\n```"
    case "terminal": {
      const shell = shellOf(node.attrs?.shell)
      const fence = shell === "powershell" ? "powershell" : shell === "cmd" ? "bat" : "bash"
      return "```" + fence + "\n" + terminalLinesOf(node).join("\n") + "\n```"
    }
    case "horizontalRule":
      return "---"
    case "image":
      return opts.images === false ? "" : `![${String(node.attrs?.alt ?? "")}](${String(node.attrs?.src ?? "")})`
    case "table": {
      const rows = children.map((row) =>
        (row.content ?? []).map((cell) => docToText(cell).replace(/\n/g, " ").replace(/\|/g, "\\|")),
      )
      if (!rows.length) return ""
      const cols = Math.max(...rows.map((r) => r.length))
      const line = (cells: string[]) => "| " + Array.from({ length: cols }, (_, i) => cells[i] ?? "").join(" | ") + " |"
      return [line(rows[0]), line(Array(cols).fill("---")), ...rows.slice(1).map(line)].join("\n")
    }
    default:
      return blocksMd(children, indent, opts)
  }
}

function blocksMd(nodes: DocNode[], indent: string, opts: MarkdownOptions): string {
  return nodes
    .map((n) => blockMd(n, indent, opts))
    .filter((s) => s.trim() !== "")
    .join("\n\n")
}

export function docToMarkdown(doc: DocNode, opts: MarkdownOptions = {}): string {
  return blocksMd(doc.content ?? [], "", opts).trim() + "\n"
}
