import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { calloutOf, type CalloutVariant } from "../blocks"
import { CalloutView } from "../node-views"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (attrs?: { variant?: CalloutVariant }) => ReturnType
      toggleCallout: (attrs?: { variant?: CalloutVariant }) => ReturnType
    }
  }
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "info",
        parseHTML: (el) => calloutOf(el.getAttribute("data-variant")),
        renderHTML: (attrs) => ({ "data-variant": attrs.variant }),
      },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-callout": "", class: "callout" }),
      ["div", { class: "callout__body" }, 0],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView)
  },

  addCommands() {
    return {
      setCallout:
        (attrs) =>
        ({ commands }) =>
          commands.wrapIn(this.name, { variant: attrs?.variant ?? "info" }),
      toggleCallout:
        (attrs) =>
        ({ commands, editor }) =>
          editor.isActive(this.name) ? commands.lift(this.name) : commands.wrapIn(this.name, { variant: attrs?.variant ?? "info" }),
    }
  },
})
