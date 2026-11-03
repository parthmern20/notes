"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Editor } from "@tiptap/core"
import { EditorContent, useEditor, useEditorState } from "@tiptap/react"
import { toast } from "sonner"
import type { DocNode } from "@/lib/doc"
import { cn } from "@/lib/utils"
import { Kbd, Skeleton } from "@/components/ui/primitives"
import { BubbleToolbar } from "./bubble-toolbar"
import { buildExtensions } from "./extensions"
import { slashBridge } from "./extensions/slash-command"
import { ImageDialog, imageFileToDataUrl } from "./image-dialog"
import { EditorToolbar } from "./toolbar"

export function RichEditor({
  initialContent,
  onChange,
  onReady,
  placeholder,
  toolbarClassName,
  className,
}: {
  initialContent: DocNode
  onChange: (doc: DocNode) => void
  onReady?: (editor: Editor) => void
  placeholder?: string
  toolbarClassName?: string
  className?: string
}) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const editorRef = useRef<Editor | null>(null)
  const [imageOpen, setImageOpen] = useState(false)
  const extensions = useMemo(() => buildExtensions({ placeholder }), [placeholder])

  const insertImages = (editor: Editor, files: File[], pos?: number) => {
    for (const file of files) {
      imageFileToDataUrl(file)
        .then((src) => {
          const chain = editor.chain().focus()
          ;(pos !== undefined ? chain.insertContentAt(pos, { type: "image", attrs: { src } }) : chain.setImage({ src })).run()
        })
        .catch((err: Error) => toast.error(err.message))
    }
  }

  const editor = useEditor({
    extensions,
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "prose-note", "aria-label": "Note content", spellcheck: "true" },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"))
        if (!files.length || !editorRef.current) return false
        event.preventDefault()
        insertImages(editorRef.current, files)
        return true
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved || !editorRef.current) return false
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"))
        if (!files.length) return false
        event.preventDefault()
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        insertImages(editorRef.current, files, pos)
        return true
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current(editor.getJSON() as DocNode),
  })

  editorRef.current = editor

  useEffect(() => {
    if (editor) onReady?.(editor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  useEffect(() => {
    slashBridge.openImage = () => setImageOpen(true)
    return () => {
      slashBridge.openImage = undefined
    }
  }, [])

  const words =
    useEditorState({
      editor,
      selector: ({ editor: e }) => (e ? (e.storage.characterCount.words() as number) : 0),
    }) ?? 0

  return (
    <div className={cn("rounded-2xl border border-border bg-surface shadow-card", className)}>
      <EditorToolbar editor={editor} onImage={() => setImageOpen(true)} className={cn("sticky z-20 rounded-t-2xl", toolbarClassName)} />
      {editor && <BubbleToolbar editor={editor} />}
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="grid gap-3 p-8">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      )}
      <div className="flex items-center gap-3 rounded-b-2xl border-t border-border bg-surface-2/50 px-4 py-2 text-xs text-fg-3">
        <span className="tabular-nums">
          {words.toLocaleString()} {words === 1 ? "word" : "words"} · {Math.max(1, Math.round(words / 200))} min read
        </span>
        <span className="ml-auto hidden items-center gap-1.5 sm:flex">
          Press <Kbd>/</Kbd> for blocks · select text to format
        </span>
      </div>
      <ImageDialog editor={editor} open={imageOpen} onOpenChange={setImageOpen} />
    </div>
  )
}
