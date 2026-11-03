import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight"
import { Highlight } from "@tiptap/extension-highlight"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table"
import { TextAlign } from "@tiptap/extension-text-align"
import { Color, TextStyle } from "@tiptap/extension-text-style"
import { CharacterCount, Placeholder } from "@tiptap/extensions"
import { ReactNodeViewRenderer } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { lowlight } from "../blocks"
import { CodeBlockView } from "../node-views"
import { Callout } from "./callout"
import { SlashCommand } from "./slash-command"
import { Terminal, TerminalLine } from "./terminal"

const isSafeUrl = (url: string) => /^(https?:|mailto:|\/|#)/i.test(url.trim())

export function buildExtensions({ placeholder }: { placeholder?: string } = {}) {
  return [
    StarterKit.configure({
      codeBlock: false,
      heading: { levels: [1, 2, 3] },
      dropcursor: { color: "var(--primary)", width: 2 },
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: "https",
        protocols: ["http", "https", "mailto"],
        isAllowedUri: (url, ctx) => ctx.defaultValidate(url) && isSafeUrl(url),
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      },
    }),
    CodeBlockLowlight.extend({
      addNodeView() {
        return ReactNodeViewRenderer(CodeBlockView)
      },
    }).configure({ lowlight, defaultLanguage: "plaintext", enableTabIndentation: true, tabSize: 2 }),
    Terminal,
    TerminalLine,
    Callout,
    Highlight.configure({ multicolor: true }),
    TextStyle,
    Color,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Subscript,
    Superscript,
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: false }),
    TableRow,
    TableHeader,
    TableCell,
    Image.configure({ allowBase64: true }),
    Placeholder.configure({
      includeChildren: false,
      placeholder: ({ node }) =>
        node.type.name === "heading" ? `Heading ${node.attrs.level}` : (placeholder ?? "Start writing, or press “/” to insert a block…"),
    }),
    CharacterCount,
    SlashCommand,
  ]
}
