import { mergeAttributes, Node } from "@tiptap/core"
import { Fragment, Slice } from "@tiptap/pm/model"
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { classifyTerminalLines, shellOf } from "@/lib/doc"
import { TerminalView } from "../node-views"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    terminal: {
      /** Turns the selection (or an empty line) into a terminal block, one command per line. */
      setTerminal: (attrs?: { shell?: string }) => ReturnType
    }
  }
}

// Prompts people copy from docs along with commands: "$ ", "❯ ", "PS> ", "PS C:\repo> ", "C:\> ".
const COPIED_PROMPT = /^\s*(?:\$|❯|PS(?: [^>\n]*)?>|[A-Za-z]:\\[^>\n]*>)\s+/

export const TerminalLine = Node.create({
  name: "terminalLine",
  content: "text*",
  marks: "",
  code: true,
  defining: true,
  parseHTML() {
    return [{ tag: "div[data-terminal-line]", preserveWhitespace: "full" }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-terminal-line": "", class: "term-line" }), 0]
  },
})

export const Terminal = Node.create({
  name: "terminal",
  group: "block",
  content: "terminalLine+",
  defining: true,
  isolating: true,
  // Runs before the core keymap, whose Enter would insert a newline character inside code nodes.
  priority: 1000,

  addAttributes() {
    return {
      shell: {
        default: "bash",
        parseHTML: (el) => shellOf(el.getAttribute("data-shell")),
        renderHTML: (attrs) => ({ "data-shell": attrs.shell }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-terminal]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-terminal": "", class: "terminal" }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(TerminalView)
  },

  addCommands() {
    return {
      setTerminal:
        (attrs) =>
        ({ state, commands }) => {
          const { from, to, empty } = state.selection
          const text = empty ? "" : state.doc.textBetween(from, to, "\n")
          const lines = text.split("\n").map((l) => l.replace(COPIED_PROMPT, ""))
          return commands.insertContentAt(
            { from, to },
            {
              type: this.name,
              attrs: { shell: attrs?.shell ?? "bash" },
              content: lines.map((l) => (l ? { type: "terminalLine", content: [{ type: "text", text: l }] } : { type: "terminalLine" })),
            },
          )
        },
    }
  },

  addKeyboardShortcuts() {
    const inLine = () => this.editor.state.selection.$from.parent.type.name === "terminalLine"

    const exitBelow = () => {
      const { state } = this.editor
      const { $from } = state.selection
      if ($from.parent.type.name !== "terminalLine") return false
      return this.editor
        .chain()
        .command(({ tr }) => {
          const after = $from.after(-1)
          tr.insert(after, state.schema.nodes.paragraph.create())
          tr.setSelection(TextSelection.create(tr.doc, after + 1))
          return true
        })
        .run()
    }

    return {
      "Mod-Alt-t": () => this.editor.commands.setTerminal(),
      "Mod-Enter": exitBelow,
      Enter: () => {
        const { state } = this.editor
        const { $from, empty } = state.selection
        if ($from.parent.type.name !== "terminalLine") return false
        const terminal = $from.node(-1)
        const isLast = $from.index(-1) === terminal.childCount - 1
        // Enter on an empty last line leaves the block (like pressing Enter twice in a list).
        if (empty && isLast && $from.parent.content.size === 0 && terminal.childCount > 1) {
          return this.editor
            .chain()
            .command(({ tr }) => {
              tr.delete($from.before(), $from.after())
              const after = tr.mapping.map($from.after(-1))
              tr.insert(after, state.schema.nodes.paragraph.create())
              tr.setSelection(TextSelection.create(tr.doc, after + 1))
              return true
            })
            .run()
        }
        return this.editor.commands.splitBlock()
      },
      Backspace: () => {
        const { state } = this.editor
        const { $from, empty } = state.selection
        if (!empty || $from.parent.type.name !== "terminalLine" || $from.parentOffset !== 0) return false
        const terminal = $from.node(-1)
        if (terminal.childCount === 1 && $from.parent.content.size === 0) {
          return this.editor
            .chain()
            .command(({ tr }) => {
              const pos = $from.before(-1)
              tr.replaceWith(pos, pos + terminal.nodeSize, state.schema.nodes.paragraph.create())
              tr.setSelection(TextSelection.create(tr.doc, pos + 1))
              return true
            })
            .run()
        }
        // At the start of the first line, don't merge the command into the block above.
        return $from.index(-1) === 0
      },
      Tab: () => (inLine() ? this.editor.commands.insertContent("  ") : false),
      "Shift-Tab": () => inLine(),
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("terminalLines"),
        props: {
          // Mark comment and continuation lines so CSS can drop their prompt.
          decorations: (state) => {
            const decos: Decoration[] = []
            state.doc.descendants((node, pos) => {
              if (node.type.name !== "terminal") return true
              const lines: string[] = []
              node.forEach((line) => lines.push(line.textContent))
              const info = classifyTerminalLines(lines, shellOf(node.attrs.shell))
              node.forEach((line, offset, index) => {
                const kind = info[index]?.kind
                if (kind === "comment" || kind === "continuation") {
                  const from = pos + 1 + offset
                  decos.push(Decoration.node(from, from + line.nodeSize, { class: `is-${kind}` }))
                }
              })
              return false
            })
            return DecorationSet.create(state.doc, decos)
          },

          // Multi-line pastes become one line node per command, with copied prompts removed.
          handlePaste: (view, event) => {
            const { $from } = view.state.selection
            if ($from.parent.type.name !== "terminalLine") return false
            const text = event.clipboardData?.getData("text/plain")
            if (text == null) return false
            const lines = text
              .replace(/\r\n?/g, "\n")
              .replace(/\n+$/, "")
              .split("\n")
              .map((l) => l.replace(COPIED_PROMPT, ""))
            const { schema, tr } = view.state
            if (lines.length === 1) {
              tr.insertText(lines[0])
            } else {
              const nodes = lines.map((l) => schema.nodes.terminalLine.create(null, l ? schema.text(l) : null))
              tr.replaceSelection(new Slice(Fragment.from(nodes), 1, 1))
            }
            view.dispatch(tr.scrollIntoView())
            return true
          },

          // Copying several lines yields one command per line (not blank-line separated paragraphs).
          clipboardTextSerializer: (slice) => {
            let onlyTerminal = true
            slice.content.forEach((n) => {
              if (n.type.name !== "terminalLine" && n.type.name !== "terminal") onlyTerminal = false
            })
            if (!onlyTerminal) return ""
            const lines: string[] = []
            slice.content.forEach((n) => {
              if (n.type.name === "terminal") n.forEach((l) => lines.push(l.textContent))
              else lines.push(n.textContent)
            })
            return lines.join("\n")
          },
        },
      }),
    ]
  },
})
