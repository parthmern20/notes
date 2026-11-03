"use client"

import type { Editor } from "@tiptap/core"
import { TextSelection } from "@tiptap/pm/state"
import { useEditorState } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import { Code, Highlighter, Italic, Strikethrough, Underline } from "lucide-react"
import { cn } from "@/lib/utils"
import { BoldIcon } from "./icons"

const DEFAULT_HIGHLIGHT = "var(--hl-yellow)"

/** Floating formatting bar shown over a text selection. */
export function BubbleToolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      highlight: e.isActive("highlight"),
    }),
  })

  const items = [
    { key: "bold", label: "Bold", icon: <BoldIcon />, active: s.bold, run: () => editor.chain().focus().toggleBold().run() },
    { key: "italic", label: "Italic", icon: <Italic />, active: s.italic, run: () => editor.chain().focus().toggleItalic().run() },
    { key: "underline", label: "Underline", icon: <Underline />, active: s.underline, run: () => editor.chain().focus().toggleUnderline().run() },
    { key: "strike", label: "Strikethrough", icon: <Strikethrough />, active: s.strike, run: () => editor.chain().focus().toggleStrike().run() },
    { key: "code", label: "Inline code", icon: <Code />, active: s.code, run: () => editor.chain().focus().toggleCode().run() },
    {
      key: "highlight",
      label: "Highlight",
      icon: <Highlighter />,
      active: s.highlight,
      run: () => editor.chain().focus().toggleHighlight({ color: DEFAULT_HIGHLIGHT }).run(),
    },
  ]

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: "top", offset: 10, flip: true, shift: { padding: 8 } }}
      shouldShow={({ editor: e, state, from, to }) => {
        if (from === to || !(state.selection instanceof TextSelection)) return false
        if (e.isActive("codeBlock") || e.isActive("terminal") || e.isActive("image")) return false
        return state.doc.textBetween(from, to).trim().length > 0
      }}
      className="z-40 flex items-center gap-0.5 rounded-xl border border-border bg-surface p-1 shadow-pop"
    >
      {items.map((i) => (
        <button
          key={i.key}
          type="button"
          title={i.label}
          aria-label={i.label}
          aria-pressed={i.active}
          onMouseDown={(e) => e.preventDefault()}
          onClick={i.run}
          className={cn(
            "grid size-8 place-items-center rounded-lg text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg [&_svg]:size-4",
            i.active && "bg-primary-soft text-primary-ink",
          )}
        >
          {i.icon}
        </button>
      ))}
    </BubbleMenu>
  )
}
