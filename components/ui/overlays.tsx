"use client"

import type { ComponentProps, ReactNode } from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Dialog as D, DropdownMenu as DM, Popover as P, Select as S, Switch as Sw, Tooltip as T } from "radix-ui"
import { cn } from "@/lib/utils"

// ───────────── Dialog ─────────────

export const Dialog = D.Root
export const DialogTrigger = D.Trigger
export const DialogClose = D.Close

const dialogSizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }

export function DialogContent({
  className,
  children,
  size = "md",
  hideClose,
  ...props
}: ComponentProps<typeof D.Content> & { size?: keyof typeof dialogSizes; hideClose?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay className="anim-overlay fixed inset-0 z-50 bg-[rgb(6_8_16/0.55)] backdrop-blur-[3px]" />
      <D.Content
        className={cn(
          "anim-dialog fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-pop outline-none",
          dialogSizes[size],
          className,
        )}
        {...props}
      >
        {children}
        {!hideClose && (
          <D.Close
            className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-lg text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label="Close"
          >
            <X className="size-4" />
          </D.Close>
        )}
      </D.Content>
    </D.Portal>
  )
}

export function DialogHeader({ title, description, icon }: { title: ReactNode; description?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start gap-3 pr-8">
      {icon && (
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-ink [&_svg]:size-5">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <D.Title className="text-[17px] font-semibold tracking-tight">{title}</D.Title>
        {description ? (
          <D.Description className="mt-1 text-sm leading-relaxed text-fg-3">{description}</D.Description>
        ) : (
          <D.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</D.Description>
        )}
      </div>
    </div>
  )
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
}

/** Left-hand drawer used for navigation on small screens. */
export function SheetContent({ className, children, title, ...props }: ComponentProps<typeof D.Content> & { title: string }) {
  return (
    <D.Portal>
      <D.Overlay className="anim-overlay fixed inset-0 z-50 bg-[rgb(6_8_16/0.5)] backdrop-blur-[2px]" />
      <D.Content
        className={cn(
          "anim-sheet fixed inset-y-0 left-0 z-50 flex w-[290px] max-w-[85vw] flex-col border-r border-border bg-surface shadow-pop outline-none",
          className,
        )}
        {...props}
      >
        <D.Title className="sr-only">{title}</D.Title>
        <D.Description className="sr-only">{title}</D.Description>
        {children}
      </D.Content>
    </D.Portal>
  )
}

// ───────────── Dropdown menu ─────────────

export const DropdownMenu = DM.Root
export const DropdownMenuTrigger = DM.Trigger

export function DropdownMenuContent({ className, align = "end", sideOffset = 6, ...props }: ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "anim-pop z-50 min-w-48 rounded-xl border border-border bg-surface p-1 shadow-pop outline-none",
          className,
        )}
        {...props}
      />
    </DM.Portal>
  )
}

export function DropdownMenuItem({
  className,
  icon,
  shortcut,
  tone,
  children,
  ...props
}: ComponentProps<typeof DM.Item> & { icon?: ReactNode; shortcut?: string; tone?: "danger" }) {
  return (
    <DM.Item
      className={cn(
        "flex h-8 cursor-pointer select-none items-center gap-2.5 rounded-lg px-2 text-[13px] text-fg outline-none transition-colors data-[disabled]:pointer-events-none data-[highlighted]:bg-surface-2 data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-fg-3",
        tone === "danger" && "text-danger-ink data-[highlighted]:bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] [&_svg]:text-danger-ink",
        className,
      )}
      {...props}
    >
      {icon}
      <span className="flex-1 truncate">{children}</span>
      {shortcut && <span className="text-[11px] text-fg-3">{shortcut}</span>}
    </DM.Item>
  )
}

export function DropdownMenuSeparator() {
  return <DM.Separator className="-mx-1 my-1 h-px bg-border" />
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <DM.Label className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-3">{children}</DM.Label>
}

// ───────────── Popover ─────────────

export const Popover = P.Root
export const PopoverTrigger = P.Trigger
export const PopoverClose = P.Close

export function PopoverContent({ className, align = "start", sideOffset = 8, ...props }: ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "anim-pop z-50 rounded-xl border border-border bg-surface p-3 shadow-pop outline-none",
          className,
        )}
        {...props}
      />
    </P.Portal>
  )
}

// ───────────── Tooltip ─────────────

export const TooltipProvider = T.Provider

export function Tooltip({
  content,
  children,
  side = "top",
  shortcut,
}: {
  content: ReactNode
  children: ReactNode
  side?: "top" | "bottom" | "left" | "right"
  shortcut?: string
}) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          side={side}
          sideOffset={6}
          className="anim-pop z-[60] flex items-center gap-2 rounded-lg bg-fg px-2 py-1 text-xs font-medium text-bg shadow-pop"
        >
          {content}
          {shortcut && <span className="rounded bg-bg/15 px-1 font-mono text-[10px] text-bg/80">{shortcut}</span>}
        </T.Content>
      </T.Portal>
    </T.Root>
  )
}

// ───────────── Select ─────────────

export interface SelectOption<V extends string> {
  value: V
  label: string
  icon?: ReactNode
  hint?: string
}

export function Select<V extends string>({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  size = "md",
  ariaLabel,
  disabled,
}: {
  value: V | undefined
  onValueChange: (value: V) => void
  options: SelectOption<V>[]
  placeholder?: string
  className?: string
  size?: "sm" | "md"
  ariaLabel?: string
  disabled?: boolean
}) {
  return (
    <S.Root value={value} onValueChange={(v) => onValueChange(v as V)} disabled={disabled}>
      <S.Trigger
        aria-label={ariaLabel}
        className={cn(
          "inline-flex min-w-0 items-center justify-between gap-2 rounded-[10px] border border-border bg-surface px-3 text-sm text-fg shadow-soft outline-none transition-[border-color,box-shadow] hover:border-border-strong focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-[var(--primary-soft)] data-[placeholder]:text-fg-3 [&_svg]:size-4",
          size === "sm" ? "h-8 text-[13px]" : "h-9",
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          <S.Value placeholder={placeholder} />
        </span>
        <S.Icon className="shrink-0 text-fg-3">
          <ChevronDown />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content
          position="popper"
          sideOffset={6}
          className="anim-pop z-50 max-h-[min(360px,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-surface shadow-pop"
        >
          <S.Viewport className="p-1">
            {options.map((o) => (
              <S.Item
                key={o.value}
                value={o.value}
                className="relative flex h-8 cursor-pointer select-none items-center gap-2 rounded-lg pl-2 pr-8 text-[13px] text-fg outline-none data-[highlighted]:bg-surface-2 [&_svg]:size-4"
              >
                {o.icon}
                <S.ItemText>{o.label}</S.ItemText>
                {o.hint && <span className="ml-auto text-[11px] text-fg-3">{o.hint}</span>}
                <S.ItemIndicator className="absolute right-2 text-primary-ink">
                  <Check />
                </S.ItemIndicator>
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  )
}

// ───────────── Switch ─────────────

export function Switch({ className, ...props }: ComponentProps<typeof Sw.Root>) {
  return (
    <Sw.Root
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-surface-3 shadow-inner outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--ring)] data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <Sw.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-md transition-transform duration-200 data-[state=checked]:translate-x-[18px]" />
    </Sw.Root>
  )
}
