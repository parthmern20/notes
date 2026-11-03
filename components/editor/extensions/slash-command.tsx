"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from "react"
import { Extension, type Editor, type Range } from "@tiptap/core"
import { PluginKey } from "@tiptap/pm/state"
import { ReactRenderer } from "@tiptap/react"
import Suggestion, { exitSuggestion, type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion"
import {
  CodeXml,
  Heading1,
  Heading2,
  Heading3,
  ImagePlus,
  Info,
  Lightbulb,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  OctagonAlert,
  Pilcrow,
  Quote,
  SquareTerminal,
  Star,
  Table,
  TriangleAlert,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface SlashItem {
  title: string
  description: string
  icon: ReactNode
  group: "Basic" | "Lists" | "Code" | "Callouts" | "Insert"
  keywords: string
  run: (editor: Editor, range: Range) => void
}

/** Opens the image picker owned by the editor UI (set by RichEditor). */
export const slashBridge: { openImage?: () => void } = {}

export const SLASH_ITEMS: SlashItem[] = [
  { group: "Basic", title: "Text", description: "Plain paragraph", icon: <Pilcrow />, keywords: "paragraph p", run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run() },
  { group: "Basic", title: "Heading 1", description: "Big section title", icon: <Heading1 />, keywords: "h1 title", run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 1 }).run() },
  { group: "Basic", title: "Heading 2", description: "Medium section title", icon: <Heading2 />, keywords: "h2 subtitle", run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run() },
  { group: "Basic", title: "Heading 3", description: "Small section title", icon: <Heading3 />, keywords: "h3", run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run() },
  { group: "Basic", title: "Quote", description: "Capture a quotation", icon: <Quote />, keywords: "blockquote", run: (e, r) => e.chain().focus().deleteRange(r).setBlockquote().run() },
  { group: "Lists", title: "Bulleted list", description: "Simple bullet points", icon: <List />, keywords: "ul unordered", run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run() },
  { group: "Lists", title: "Numbered list", description: "Steps in order", icon: <ListOrdered />, keywords: "ol ordered steps", run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run() },
  { group: "Lists", title: "Checklist", description: "Track tasks with checkboxes", icon: <ListTodo />, keywords: "todo task check", run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run() },
  { group: "Code", title: "Code snippet", description: "Syntax-highlighted code", icon: <CodeXml />, keywords: "code block program snippet", run: (e, r) => e.chain().focus().deleteRange(r).setCodeBlock({ language: "javascript" }).run() },
  { group: "Code", title: "Terminal command", description: "Shell / CLI commands with prompts", icon: <SquareTerminal />, keywords: "cli shell bash cmd powershell command terminal", run: (e, r) => e.chain().focus().deleteRange(r).setTerminal().run() },
  { group: "Callouts", title: "Info", description: "Highlight useful context", icon: <Info />, keywords: "callout note info", run: (e, r) => e.chain().focus().deleteRange(r).setCallout({ variant: "info" }).run() },
  { group: "Callouts", title: "Tip", description: "A helpful tip", icon: <Lightbulb />, keywords: "callout tip hint", run: (e, r) => e.chain().focus().deleteRange(r).setCallout({ variant: "tip" }).run() },
  { group: "Callouts", title: "Remember", description: "Must-know for revision", icon: <Star />, keywords: "callout important remember exam", run: (e, r) => e.chain().focus().deleteRange(r).setCallout({ variant: "important" }).run() },
  { group: "Callouts", title: "Warning", description: "Something to be careful with", icon: <TriangleAlert />, keywords: "callout warning caution", run: (e, r) => e.chain().focus().deleteRange(r).setCallout({ variant: "warning" }).run() },
  { group: "Callouts", title: "Gotcha", description: "Common mistake or trap", icon: <OctagonAlert />, keywords: "callout danger gotcha mistake error", run: (e, r) => e.chain().focus().deleteRange(r).setCallout({ variant: "danger" }).run() },
  { group: "Insert", title: "Table", description: "Compare things side by side", icon: <Table />, keywords: "grid comparison", run: (e, r) => e.chain().focus().deleteRange(r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { group: "Insert", title: "Image", description: "Upload or embed an image", icon: <ImagePlus />, keywords: "picture photo screenshot diagram", run: (e, r) => { e.chain().focus().deleteRange(r).run(); slashBridge.openImage?.() } },
  { group: "Insert", title: "Divider", description: "Separate sections", icon: <Minus />, keywords: "hr rule separator line", run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run() },
]

function filterItems(query: string): SlashItem[] {
  const q = query.toLowerCase().trim()
  if (!q) return SLASH_ITEMS
  return SLASH_ITEMS.filter((i) => `${i.title} ${i.keywords} ${i.group}`.toLowerCase().includes(q))
}

interface MenuHandle {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean
}

const SlashMenu = forwardRef<MenuHandle, SuggestionProps<SlashItem>>(function SlashMenu({ items, command }, ref) {
  const [selected, setSelected] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => setSelected(0), [items])
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${selected}"]`)?.scrollIntoView({ block: "nearest" })
  }, [selected])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (!items.length) return false
      if (event.key === "ArrowDown") {
        setSelected((s) => (s + 1) % items.length)
        return true
      }
      if (event.key === "ArrowUp") {
        setSelected((s) => (s - 1 + items.length) % items.length)
        return true
      }
      if (event.key === "Enter" || event.key === "Tab") {
        const item = items[selected]
        if (item) command(item)
        return true
      }
      return false
    },
  }))

  let lastGroup = ""
  return (
    <div
      ref={listRef}
      className="anim-pop max-h-[340px] w-[290px] overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-pop"
    >
      {items.length === 0 && <div className="px-3 py-6 text-center text-sm text-fg-3">No matching blocks</div>}
      {items.map((item, index) => {
        const header = item.group !== lastGroup ? (lastGroup = item.group) : null
        return (
          <div key={item.title}>
            {header && <div className="px-2 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-fg-3">{header}</div>}
            <button
              type="button"
              data-index={index}
              onMouseEnter={() => setSelected(index)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => command(item)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors",
                index === selected ? "bg-surface-2" : "hover:bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-fg-2 [&_svg]:size-[18px]",
                  index === selected && "border-transparent bg-primary-soft text-primary-ink",
                )}
              >
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-medium text-fg">{item.title}</span>
                <span className="block truncate text-xs text-fg-3">{item.description}</span>
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
})

const slashKey = new PluginKey("slashCommand")

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        pluginKey: slashKey,
        char: "/",
        allowSpaces: false,
        allow: ({ state, range }) => !state.doc.resolve(range.from).parent.type.spec.code,
        items: ({ query }) => filterItems(query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => {
          let renderer: ReactRenderer<MenuHandle, SuggestionProps<SlashItem>> | null = null

          const place = (props: SuggestionProps<SlashItem>) => {
            const rect = props.clientRect?.()
            const el = renderer?.element as HTMLElement | undefined
            if (!rect || !el) return
            const height = el.offsetHeight || 340
            const below = rect.bottom + 8
            const top = below + height > window.innerHeight - 8 ? Math.max(8, rect.top - height - 8) : below
            el.style.top = `${top}px`
            el.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 300))}px`
          }

          return {
            onStart: (props) => {
              renderer = new ReactRenderer(SlashMenu, { props, editor: props.editor })
              const el = renderer.element as HTMLElement
              el.style.position = "fixed"
              el.style.zIndex = "60"
              document.body.appendChild(el)
              requestAnimationFrame(() => place(props))
            },
            onUpdate: (props) => {
              renderer?.updateProps(props)
              requestAnimationFrame(() => place(props))
            },
            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                exitSuggestion(props.view, slashKey)
                return true
              }
              return renderer?.ref?.onKeyDown(props) ?? false
            },
            onExit: () => {
              renderer?.element.remove()
              renderer?.destroy()
              renderer = null
            },
          }
        },
      }),
    ]
  },
})
