"use client"

import { useState, type ReactNode } from "react"
import type { Editor } from "@tiptap/core"
import { useEditorState } from "@tiptap/react"
import {
  Baseline,
  ChevronDown,
  Code,
  CodeXml,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Info,
  Italic,
  Link2,
  List,
  ListIndentDecrease,
  ListIndentIncrease,
  ListOrdered,
  ListTodo,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  SquareTerminal,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignJustify,
  TextAlignStart,
  Underline,
  Undo2,
  Unlink,
  type LucideIcon,
} from "lucide-react"
import { useMounted } from "@/lib/client/hooks"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
} from "@/components/ui/overlays"
import { Input } from "@/components/ui/primitives"
import { CALLOUT_ORDER, CALLOUTS, HIGHLIGHTS, TEXT_COLORS } from "./blocks"
import { BoldIcon } from "./icons"

function useModKey() {
  const mounted = useMounted()
  return mounted && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"
}

const btnClass =
  "grid size-8 shrink-0 place-items-center rounded-lg text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-[17px]"
const activeClass = "bg-primary-soft text-primary-ink hover:bg-primary-soft hover:text-primary-ink"

function TB({
  label,
  shortcut,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip content={label} shortcut={shortcut}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={cn(btnClass, active && activeClass)}
      >
        {children}
      </button>
    </Tooltip>
  )
}

const Sep = () => <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />

const ALIGN_ICONS: Record<"left" | "center" | "right" | "justify", LucideIcon> = {
  left: TextAlignStart,
  center: TextAlignCenter,
  right: TextAlignEnd,
  justify: TextAlignJustify,
}

export function normalizeUrl(raw: string): string | null {
  const url = raw.trim()
  if (!url) return null
  if (/^(https?:|mailto:)/i.test(url) || url.startsWith("/") || url.startsWith("#")) return url
  if (/^[\w-]+(\.[\w-]+)+([/?#:].*)?$/i.test(url)) return `https://${url}`
  return null
}

function LinkControl({ editor, active }: { editor: Editor; active: boolean }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [error, setError] = useState(false)

  const apply = () => {
    const href = normalizeUrl(url)
    if (!href) {
      setError(true)
      return
    }
    if (editor.state.selection.empty && !editor.isActive("link")) {
      editor.chain().focus().insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run()
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run()
    }
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setUrl((editor.getAttributes("link").href as string) ?? "")
          setError(false)
        }
        setOpen(o)
      }}
    >
      <Tooltip content="Link" shortcut="Ctrl K">
        <PopoverTrigger asChild>
          <button type="button" aria-label="Link" className={cn(btnClass, active && activeClass)}>
            <Link2 />
          </button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-80" onCloseAutoFocus={(e) => e.preventDefault()}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            apply()
          }}
          className="grid gap-2"
        >
          <label className="text-xs font-medium text-fg-2" htmlFor="link-url">
            Link URL
          </label>
          <Input
            id="link-url"
            autoFocus
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(false)
            }}
            placeholder="https://docs.aws.amazon.com/…"
            aria-invalid={error}
            className={cn(error && "border-danger focus:border-danger")}
          />
          {error && <p className="text-xs text-danger-ink">Enter a web address such as https://example.com</p>}
          <div className="flex justify-end gap-2 pt-1">
            {active && (
              <Button
                size="sm"
                variant="danger-ghost"
                onClick={() => {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run()
                  setOpen(false)
                }}
              >
                <Unlink /> Remove
              </Button>
            )}
            <Button size="sm" variant="primary" type="submit">
              Apply
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}

function ColorControl({
  editor,
  kind,
  current,
}: {
  editor: Editor
  kind: "text" | "highlight"
  current?: string
}) {
  const palette = kind === "text" ? TEXT_COLORS : HIGHLIGHTS
  const label = kind === "text" ? "Text colour" : "Highlight"
  return (
    <Popover>
      <Tooltip content={label} shortcut={kind === "highlight" ? "Ctrl Shift H" : undefined}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={label} className={cn(btnClass, "relative", current && activeClass)}>
            {kind === "text" ? <Baseline /> : <Highlighter />}
            <span
              className="absolute bottom-1 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full"
              style={{ background: current ?? (kind === "text" ? "var(--fg-3)" : "transparent") }}
            />
          </button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="w-56 p-2.5" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div className="mb-2 text-xs font-medium text-fg-2">{label}</div>
        <div className="grid grid-cols-6 gap-1.5">
          {palette.map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={c.name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                kind === "text"
                  ? editor.chain().focus().setColor(c.value).run()
                  : editor.chain().focus().setHighlight({ color: c.value }).run()
              }
              className={cn(
                "grid size-7 place-items-center rounded-md border border-border transition-transform hover:scale-110",
                current === c.value && "ring-2 ring-primary ring-offset-1 ring-offset-[var(--surface)]",
              )}
              style={kind === "text" ? undefined : { background: c.value }}
            >
              {kind === "text" && (
                <span className="text-sm font-bold" style={{ color: c.value }}>
                  A
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() =>
            kind === "text" ? editor.chain().focus().unsetColor().run() : editor.chain().focus().unsetHighlight().run()
          }
          className="mt-2 w-full rounded-md py-1.5 text-xs font-medium text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg"
        >
          {kind === "text" ? "Default colour" : "Remove highlight"}
        </button>
      </PopoverContent>
    </Popover>
  )
}

export function EditorToolbar({ editor, onImage, className }: { editor: Editor | null; onImage: () => void; className?: string }) {
  const mod = useModKey()
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return null
      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        code: e.isActive("code"),
        sub: e.isActive("subscript"),
        sup: e.isActive("superscript"),
        heading: ([1, 2, 3] as const).find((level) => e.isActive("heading", { level })) ?? 0,
        bullet: e.isActive("bulletList"),
        ordered: e.isActive("orderedList"),
        task: e.isActive("taskList"),
        quote: e.isActive("blockquote"),
        codeBlock: e.isActive("codeBlock"),
        terminal: e.isActive("terminal"),
        callout: e.isActive("callout"),
        table: e.isActive("table"),
        link: e.isActive("link"),
        align: ((["center", "right", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ?? "left") as keyof typeof ALIGN_ICONS,
        color: e.getAttributes("textStyle").color as string | undefined,
        highlight: e.getAttributes("highlight").color as string | undefined,
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
        canSink: e.can().sinkListItem("listItem") || e.can().sinkListItem("taskItem"),
        canLift: e.can().liftListItem("listItem") || e.can().liftListItem("taskItem"),
      }
    },
  })

  if (!editor || !s) {
    return <div className={cn("h-12 border-b border-border", className)} />
  }

  const chain = () => editor.chain().focus()
  const blockLabel = s.heading ? `Heading ${s.heading}` : "Paragraph"
  const AlignIcon = ALIGN_ICONS[s.align] ?? TextAlignStart
  const inList = s.bullet || s.ordered || s.task

  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className={cn(
        "flex flex-wrap items-center gap-0.5 border-b border-border bg-[color-mix(in_oklab,var(--surface)_88%,transparent)] px-2 py-1.5 backdrop-blur-xl max-sm:flex-nowrap max-sm:overflow-x-auto",
        className,
      )}
    >
      <TB label="Undo" shortcut={`${mod} Z`} disabled={!s.canUndo} onClick={() => chain().undo().run()}>
        <Undo2 />
      </TB>
      <TB label="Redo" shortcut={`${mod} Shift Z`} disabled={!s.canRedo} onClick={() => chain().redo().run()}>
        <Redo2 />
      </TB>
      <Sep />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            className="inline-flex h-8 w-[118px] shrink-0 items-center justify-between gap-1 rounded-lg px-2 text-[13px] font-medium text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg"
          >
            {blockLabel}
            <ChevronDown className="size-3.5 opacity-60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-44" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuItem icon={<Pilcrow />} shortcut={`${mod} Alt 0`} onSelect={() => chain().setParagraph().run()}>
            Paragraph
          </DropdownMenuItem>
          <DropdownMenuItem icon={<Heading1 />} shortcut={`${mod} Alt 1`} onSelect={() => chain().toggleHeading({ level: 1 }).run()}>
            <span className="text-base font-semibold">Heading 1</span>
          </DropdownMenuItem>
          <DropdownMenuItem icon={<Heading2 />} shortcut={`${mod} Alt 2`} onSelect={() => chain().toggleHeading({ level: 2 }).run()}>
            <span className="font-semibold">Heading 2</span>
          </DropdownMenuItem>
          <DropdownMenuItem icon={<Heading3 />} shortcut={`${mod} Alt 3`} onSelect={() => chain().toggleHeading({ level: 3 }).run()}>
            <span className="text-[13px] font-semibold">Heading 3</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sep />

      <TB label="Bold" shortcut={`${mod} B`} active={s.bold} onClick={() => chain().toggleBold().run()}>
        <BoldIcon />
      </TB>
      <TB label="Italic" shortcut={`${mod} I`} active={s.italic} onClick={() => chain().toggleItalic().run()}>
        <Italic />
      </TB>
      <TB label="Underline" shortcut={`${mod} U`} active={s.underline} onClick={() => chain().toggleUnderline().run()}>
        <Underline />
      </TB>
      <TB label="Strikethrough" shortcut={`${mod} Shift S`} active={s.strike} onClick={() => chain().toggleStrike().run()}>
        <Strikethrough />
      </TB>
      <ColorControl editor={editor} kind="text" current={s.color} />
      <ColorControl editor={editor} kind="highlight" current={s.highlight} />
      <Sep />

      <TB label="Inline code" shortcut={`${mod} E`} active={s.code} onClick={() => chain().toggleCode().run()}>
        <Code />
      </TB>
      <TB label="Subscript" shortcut={`${mod} ,`} active={s.sub} onClick={() => chain().toggleSubscript().run()}>
        <Subscript />
      </TB>
      <TB label="Superscript" shortcut={`${mod} .`} active={s.sup} onClick={() => chain().toggleSuperscript().run()}>
        <Superscript />
      </TB>
      <DropdownMenu>
        <Tooltip content="Align">
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Align" onMouseDown={(e) => e.preventDefault()} className={cn(btnClass, "w-10 gap-0.5 grid-flow-col")}>
              <AlignIcon />
              <ChevronDown className="!size-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="start" className="min-w-40" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuItem icon={<TextAlignStart />} onSelect={() => chain().setTextAlign("left").run()}>
            Align left
          </DropdownMenuItem>
          <DropdownMenuItem icon={<TextAlignCenter />} onSelect={() => chain().setTextAlign("center").run()}>
            Center
          </DropdownMenuItem>
          <DropdownMenuItem icon={<TextAlignEnd />} onSelect={() => chain().setTextAlign("right").run()}>
            Align right
          </DropdownMenuItem>
          <DropdownMenuItem icon={<TextAlignJustify />} onSelect={() => chain().setTextAlign("justify").run()}>
            Justify
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Sep />

      <TB label="Bulleted list" shortcut={`${mod} Shift 8`} active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
        <List />
      </TB>
      <TB label="Numbered list" shortcut={`${mod} Shift 7`} active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
        <ListOrdered />
      </TB>
      <TB label="Checklist" shortcut={`${mod} Shift 9`} active={s.task} onClick={() => chain().toggleTaskList().run()}>
        <ListTodo />
      </TB>
      {inList && (
        <>
          <TB
            label="Outdent"
            shortcut="Shift Tab"
            disabled={!s.canLift}
            onClick={() => (s.task ? chain().liftListItem("taskItem").run() : chain().liftListItem("listItem").run())}
          >
            <ListIndentDecrease />
          </TB>
          <TB
            label="Indent"
            shortcut="Tab"
            disabled={!s.canSink}
            onClick={() => (s.task ? chain().sinkListItem("taskItem").run() : chain().sinkListItem("listItem").run())}
          >
            <ListIndentIncrease />
          </TB>
        </>
      )}
      <Sep />

      <TB label="Quote" shortcut={`${mod} Shift B`} active={s.quote} onClick={() => chain().toggleBlockquote().run()}>
        <Quote />
      </TB>
      <DropdownMenu>
        <Tooltip content="Callout">
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Callout" onMouseDown={(e) => e.preventDefault()} className={cn(btnClass, s.callout && activeClass)}>
              <Info />
            </button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="start" className="min-w-44" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuLabel>Callout</DropdownMenuLabel>
          {CALLOUT_ORDER.map((v) => {
            const { icon: Icon, label } = CALLOUTS[v]
            return (
              <DropdownMenuItem
                key={v}
                icon={<Icon />}
                onSelect={() =>
                  s.callout ? chain().updateAttributes("callout", { variant: v }).run() : chain().setCallout({ variant: v }).run()
                }
              >
                {label}
              </DropdownMenuItem>
            )
          })}
          {s.callout && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => chain().lift("callout").run()}>Remove callout</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <TB label="Code snippet" shortcut={`${mod} Alt C`} active={s.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
        <CodeXml />
      </TB>
      <TB
        label="Terminal command"
        shortcut={`${mod} Alt T`}
        active={s.terminal}
        onClick={() => (s.terminal ? undefined : chain().setTerminal().run())}
      >
        <SquareTerminal />
      </TB>
      <Sep />

      <LinkControl editor={editor} active={s.link} />
      <TB label="Image" onClick={onImage}>
        <ImagePlus />
      </TB>
      <DropdownMenu>
        <Tooltip content="Table">
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Table" onMouseDown={(e) => e.preventDefault()} className={cn(btnClass, s.table && activeClass)}>
              <Table />
            </button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="start" className="min-w-52" onCloseAutoFocus={(e) => e.preventDefault()}>
          {!s.table ? (
            <DropdownMenuItem icon={<Table />} onSelect={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
              Insert 3 × 3 table
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuLabel>Rows</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => chain().addRowBefore().run()}>Add row above</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => chain().addRowAfter().run()}>Add row below</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => chain().deleteRow().run()}>Delete row</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => chain().addColumnBefore().run()}>Add column left</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => chain().addColumnAfter().run()}>Add column right</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => chain().deleteColumn().run()}>Delete column</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => chain().toggleHeaderRow().run()}>Toggle header row</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => chain().mergeOrSplit().run()}>Merge / split cells</DropdownMenuItem>
              <DropdownMenuItem tone="danger" onSelect={() => chain().deleteTable().run()}>
                Delete table
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <TB label="Divider" onClick={() => chain().setHorizontalRule().run()}>
        <Minus />
      </TB>
      <Sep />
      <TB label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
        <RemoveFormatting />
      </TB>
    </div>
  )
}
