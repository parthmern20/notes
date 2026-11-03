"use client"

import { ChevronDown, SquareTerminal } from "lucide-react"
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { shellOf, terminalCommands } from "@/lib/doc"
import { CopyButton } from "@/components/ui/copy-button"
import { CALLOUT_ORDER, CALLOUTS, calloutOf, LANGUAGES, languageMeta, SHELL_OPTIONS } from "./blocks"

const selectClass =
  "cursor-pointer appearance-none rounded-md bg-transparent py-0.5 pl-1 pr-5 text-xs font-medium text-[#c7d0e6] outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-default disabled:hover:bg-transparent [&>option]:bg-[#141a2b] [&>option]:text-white"

const copyClass = "text-[#8f9bb8] hover:bg-white/10 hover:text-white"

export function CodeBlockView({ node, updateAttributes, editor }: NodeViewProps) {
  const language = (node.attrs.language as string) || "plaintext"
  const meta = languageMeta(language)
  return (
    <NodeViewWrapper className="code-block" data-language={language}>
      <div className="code-block__header" contentEditable={false}>
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: meta.color }} />
        <span className="relative inline-flex items-center">
          <select
            aria-label="Code language"
            value={language}
            disabled={!editor.isEditable}
            onChange={(e) => updateAttributes({ language: e.target.value })}
            className={selectClass}
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1 size-3 opacity-60" />
        </span>
        <span className="ml-auto" />
        <CopyButton getText={() => node.textContent} label="Copy" className={copyClass} />
      </div>
      <pre spellCheck={false}>
        <NodeViewContent<"code"> as="code" className={`hljs language-${language}`} />
      </pre>
    </NodeViewWrapper>
  )
}

export function TerminalView({ node, updateAttributes, editor }: NodeViewProps) {
  const shell = shellOf(node.attrs.shell)
  const lines = () => {
    const out: string[] = []
    node.forEach((l) => out.push(l.textContent))
    return out
  }
  return (
    <NodeViewWrapper className="terminal" data-shell={shell}>
      <div className="terminal__bar" contentEditable={false}>
        <span className="terminal__dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <SquareTerminal className="ml-1 size-3.5 text-[#8b95a7]" />
        <span className="relative inline-flex items-center">
          <select
            aria-label="Shell"
            value={shell}
            disabled={!editor.isEditable}
            onChange={(e) => updateAttributes({ shell: e.target.value })}
            className={selectClass}
          >
            {SHELL_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1 size-3 opacity-60" />
        </span>
        <span className="ml-auto" />
        <CopyButton getText={() => terminalCommands(lines(), shell).join("\n")} label="Copy" title="Copy commands" className={copyClass} />
      </div>
      <NodeViewContent className="terminal__body" spellCheck={false} />
    </NodeViewWrapper>
  )
}

export function CalloutView({ node, updateAttributes, editor }: NodeViewProps) {
  const variant = calloutOf(node.attrs.variant)
  const { icon: Icon, label } = CALLOUTS[variant]
  const cycle = () => {
    const next = CALLOUT_ORDER[(CALLOUT_ORDER.indexOf(variant) + 1) % CALLOUT_ORDER.length]
    updateAttributes({ variant: next })
  }
  return (
    <NodeViewWrapper className="callout" data-variant={variant}>
      <button
        type="button"
        contentEditable={false}
        onClick={cycle}
        disabled={!editor.isEditable}
        title="Change callout type"
        className="callout__icon h-fit rounded-md transition-transform enabled:hover:scale-110"
      >
        <Icon className="size-[18px]" />
      </button>
      <div className="callout__body">
        <div className="callout__label select-none" contentEditable={false}>
          {label}
        </div>
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  )
}
