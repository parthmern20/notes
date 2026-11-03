"use client"

import { Fragment, useMemo, type CSSProperties, type MouseEvent, type ReactNode } from "react"
import { SquareTerminal } from "lucide-react"
import { classifyTerminalLines, createSlugger, docToText, shellOf, SHELLS, terminalCommands, terminalLinesOf, type DocNode, type Shell } from "@/lib/doc"
import { cn } from "@/lib/utils"
import { CopyButton } from "@/components/ui/copy-button"
import { CALLOUTS, calloutOf, highlightCode, languageMeta, safeColor, type CalloutVariant } from "@/components/editor/blocks"

const copyClass = "text-[#8f9bb8] hover:bg-white/10 hover:text-white"

function safeHref(value: unknown): string | undefined {
  const href = typeof value === "string" ? value.trim() : ""
  return /^(https?:|mailto:|\/|#)/i.test(href) ? href : undefined
}

function safeImageSrc(value: unknown): string | undefined {
  const src = typeof value === "string" ? value.trim() : ""
  return /^https?:\/\//i.test(src) || /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,/i.test(src) ? src : undefined
}

function alignStyle(value: unknown): CSSProperties | undefined {
  return value === "center" || value === "right" || value === "justify" ? { textAlign: value } : undefined
}

export function CodeBlock({ code, language }: { code: string; language: string }) {
  const meta = languageMeta(language)
  const highlighted = useMemo(() => highlightCode(code, language), [code, language])
  return (
    <div className="code-block recall-block" data-language={language}>
      <div className="code-block__header">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: meta.color }} />
        <span className="font-medium text-[#c7d0e6]">{meta.label}</span>
        <span className="ml-auto" />
        <CopyButton text={code} label="Copy" className={copyClass} />
      </div>
      <pre>
        <code className={`hljs language-${language}`}>{highlighted}</code>
      </pre>
    </div>
  )
}

export function TerminalBlock({ lines, shell }: { lines: string[]; shell: Shell }) {
  const info = classifyTerminalLines(lines, shell)
  const commands = terminalCommands(lines, shell)
  // The full command (with continuation lines) that starts on line i.
  const commandFrom = (i: number) => {
    const parts = [info[i].text]
    for (let j = i + 1; j < info.length && info[j].kind === "continuation"; j++) parts.push(info[j].text)
    return parts.join("\n")
  }
  return (
    <div className="terminal recall-block" data-shell={shell}>
      <div className="terminal__bar">
        <span className="terminal__dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <SquareTerminal className="ml-1 size-3.5" />
        <span className="font-medium text-[#c7d0e6]">{SHELLS[shell].label}</span>
        <span className="text-[#5d6779]">·</span>
        <span>
          {commands.length} {commands.length === 1 ? "command" : "commands"}
        </span>
        <span className="ml-auto" />
        <CopyButton text={commands.join("\n")} label="Copy all" title="Copy all commands" className={copyClass} />
      </div>
      <div className="terminal__body">
        {info.map((line, i) => (
          <div
            key={i}
            className={cn(
              "term-line group/line pr-9",
              line.kind === "comment" && "is-comment",
              line.kind === "continuation" && "is-continuation",
            )}
          >
            {line.text || " "}
            {line.kind === "command" && (
              <CopyButton
                text={commandFrom(i)}
                title="Copy this command"
                className={cn(copyClass, "absolute -top-0.5 right-0 h-6 px-1.5 opacity-0 focus-visible:opacity-100 group-hover/line:opacity-100")}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CalloutBlock({ variant, children }: { variant: CalloutVariant; children: ReactNode }) {
  const { icon: Icon, label } = CALLOUTS[variant]
  return (
    <div className="callout" data-variant={variant}>
      <span className="callout__icon">
        <Icon className="size-[18px]" />
      </span>
      <div className="callout__body">
        <div className="callout__label">{label}</div>
        {children}
      </div>
    </div>
  )
}

function renderText(node: DocNode, key: number): ReactNode {
  let el: ReactNode = node.text ?? ""
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        el = <strong>{el}</strong>
        break
      case "italic":
        el = <em>{el}</em>
        break
      case "underline":
        el = <u>{el}</u>
        break
      case "strike":
        el = <s>{el}</s>
        break
      case "code":
        el = <code className="inline-code">{el}</code>
        break
      case "subscript":
        el = <sub>{el}</sub>
        break
      case "superscript":
        el = <sup>{el}</sup>
        break
      case "highlight":
        el = <mark style={{ backgroundColor: safeColor(mark.attrs?.color) ?? "var(--hl-yellow)" }}>{el}</mark>
        break
      case "textStyle": {
        const color = safeColor(mark.attrs?.color)
        if (color) el = <span style={{ color }}>{el}</span>
        break
      }
      case "link": {
        const href = safeHref(mark.attrs?.href)
        if (href)
          el = (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow">
              {el}
            </a>
          )
        break
      }
    }
  }
  return <Fragment key={key}>{el}</Fragment>
}

interface RenderContext {
  slug: (text: string) => string
}

function renderNode(node: DocNode, key: number, ctx: RenderContext): ReactNode {
  const kids = () => (node.content ?? []).map((child, i) => renderNode(child, i, ctx))
  const attrs = node.attrs ?? {}
  switch (node.type) {
    case "text":
      return renderText(node, key)
    case "hardBreak":
      return <br key={key} />
    case "paragraph":
      return (
        <p key={key} style={alignStyle(attrs.textAlign)}>
          {kids()}
        </p>
      )
    case "heading": {
      const level = Math.min(3, Math.max(1, Number(attrs.level) || 2))
      const text = docToText(node).trim()
      const id = text ? ctx.slug(text) : undefined
      const style = alignStyle(attrs.textAlign)
      if (level === 1)
        return (
          <h1 key={key} id={id} style={style}>
            {kids()}
          </h1>
        )
      if (level === 2)
        return (
          <h2 key={key} id={id} style={style}>
            {kids()}
          </h2>
        )
      return (
        <h3 key={key} id={id} style={style}>
          {kids()}
        </h3>
      )
    }
    case "bulletList":
      return <ul key={key}>{kids()}</ul>
    case "orderedList":
      return (
        <ol key={key} start={Number(attrs.start) || 1}>
          {kids()}
        </ol>
      )
    case "listItem":
      return <li key={key}>{kids()}</li>
    case "taskList":
      return (
        <ul key={key} data-type="taskList">
          {kids()}
        </ul>
      )
    case "taskItem":
      return (
        <li key={key} data-checked={String(Boolean(attrs.checked))}>
          <label>
            <input type="checkbox" checked={Boolean(attrs.checked)} readOnly tabIndex={-1} aria-label={attrs.checked ? "Done" : "Not done"} />
          </label>
          <div>{kids()}</div>
        </li>
      )
    case "blockquote":
      return <blockquote key={key}>{kids()}</blockquote>
    case "horizontalRule":
      return <hr key={key} />
    case "image": {
      const src = safeImageSrc(attrs.src)
      // eslint-disable-next-line @next/next/no-img-element
      return src ? <img key={key} src={src} alt={String(attrs.alt ?? "")} loading="lazy" decoding="async" /> : null
    }
    case "codeBlock":
      return <CodeBlock key={key} code={docToText(node)} language={String(attrs.language || "plaintext")} />
    case "terminal":
      return <TerminalBlock key={key} lines={terminalLinesOf(node)} shell={shellOf(attrs.shell)} />
    case "callout":
      return (
        <CalloutBlock key={key} variant={calloutOf(attrs.variant)}>
          {kids()}
        </CalloutBlock>
      )
    case "table":
      return (
        <div key={key} className="table-wrap">
          <table>
            <tbody>{kids()}</tbody>
          </table>
        </div>
      )
    case "tableRow":
      return <tr key={key}>{kids()}</tr>
    case "tableHeader":
      return (
        <th key={key} colSpan={Number(attrs.colspan) || 1} rowSpan={Number(attrs.rowspan) || 1}>
          {kids()}
        </th>
      )
    case "tableCell":
      return (
        <td key={key} colSpan={Number(attrs.colspan) || 1} rowSpan={Number(attrs.rowspan) || 1}>
          {kids()}
        </td>
      )
    default:
      return <Fragment key={key}>{kids()}</Fragment>
  }
}

/**
 * Read-only rendering of a note. Shares `.prose-note` styles with the editor so a note looks
 * the same while writing and while revising. In recall mode, key terms and code stay blurred until clicked.
 */
export function NoteRenderer({ doc, recall = false, className }: { doc: DocNode; recall?: boolean; className?: string }) {
  const content = useMemo(() => {
    const ctx: RenderContext = { slug: createSlugger() }
    return (doc.content ?? []).map((node, i) => renderNode(node, i, ctx))
  }, [doc])

  const reveal = (e: MouseEvent<HTMLDivElement>) => {
    if (!recall) return
    const target = (e.target as HTMLElement).closest("mark, strong, code, .recall-block")
    if (target && !target.classList.contains("revealed")) {
      e.preventDefault()
      target.classList.add("revealed")
    }
  }

  return (
    <div className={cn("prose-note", recall && "recall-mode", className)} onClick={reveal}>
      {content}
    </div>
  )
}
