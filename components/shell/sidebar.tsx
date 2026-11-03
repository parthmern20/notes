"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import {
  BookOpen,
  Keyboard,
  Layers,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Repeat,
  Settings,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { useSkills } from "@/lib/client/api"
import { APP_NAME } from "@/lib/config"
import { cn } from "@/lib/utils"
import { SkillDot } from "@/components/skills/skill-visuals"
import { Tooltip } from "@/components/ui/overlays"
import { LogoMark } from "./brand"
import { useAppUI } from "./app-ui"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  match: (path: string) => boolean
  badge?: "notes" | "cards"
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, match: (p) => p === "/" },
  { href: "/skills", label: "Skills", icon: Layers, match: (p) => p === "/skills" },
  { href: "/notes", label: "All notes", icon: BookOpen, match: (p) => p.startsWith("/notes") },
  { href: "/revise", label: "Revise", icon: Repeat, match: (p) => p === "/revise" || p.startsWith("/revise/session"), badge: "notes" },
  { href: "/revise/flashcards", label: "Flashcards", icon: Zap, match: (p) => p.startsWith("/revise/flashcards"), badge: "cards" },
]

const pill = { type: "spring", bounce: 0.15, duration: 0.45 } as const

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  badge,
  layoutPrefix,
  onNavigate,
}: {
  href: string
  label: string
  icon: LucideIcon
  active: boolean
  collapsed: boolean
  badge?: number
  layoutPrefix: string
  onNavigate?: () => void
}) {
  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative isolate flex h-9 items-center gap-3 rounded-[10px] px-2.5 text-[13.5px] font-medium transition-colors",
        active ? "text-fg" : "text-fg-3 hover:bg-surface-2 hover:text-fg",
        collapsed && "justify-center px-0",
      )}
    >
      {active && (
        <motion.span
          layoutId={`${layoutPrefix}-nav`}
          transition={pill}
          className="absolute inset-0 -z-10 rounded-[10px] border border-border bg-surface shadow-soft"
        />
      )}
      <Icon className={cn("size-[18px] shrink-0", active && "text-primary-ink")} />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!!badge && (
        <span
          className={cn(
            "grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10.5px] font-semibold leading-5 text-primary-fg tabular-nums",
            collapsed && "absolute -right-1 -top-1 min-w-4 px-1 text-[9px] leading-4",
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  )
  return collapsed ? (
    <Tooltip content={label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  )
}

export function SidebarContent({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  layoutPrefix,
}: {
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
  layoutPrefix: string
}) {
  const pathname = usePathname()
  const { data: skills } = useSkills()
  const { openSkillDialog, openShortcuts } = useAppUI()
  const dueNotes = skills?.reduce((n, s) => n + s.stats.due, 0) ?? 0
  const dueCards = skills?.reduce((n, s) => n + s.stats.cardsDue, 0) ?? 0

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("flex h-16 shrink-0 items-center gap-2.5 px-4", collapsed && "justify-center px-0")}>
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5" aria-label={`${APP_NAME} home`}>
          <LogoMark className="size-8 drop-shadow-[0_6px_14px_rgb(91_76_240/0.45)]" />
          {!collapsed && (
            <span className="text-[17px] font-semibold tracking-tight">
              {APP_NAME}
              <span className="text-primary-ink">.</span>
            </span>
          )}
        </Link>
      </div>

      <nav className={cn("grid gap-0.5 px-3", collapsed && "px-3.5")} aria-label="Main">
        {NAV.map((item) => (
          <NavLink
            key={item.href}
            {...item}
            active={item.match(pathname)}
            collapsed={collapsed}
            badge={item.badge === "notes" ? dueNotes : item.badge === "cards" ? dueCards : undefined}
            layoutPrefix={layoutPrefix}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        {!collapsed && (
          <div className="flex items-center justify-between px-5 pb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-3">Your skills</span>
            <Tooltip content="New skill">
              <button
                type="button"
                onClick={() => openSkillDialog()}
                className="grid size-6 place-items-center rounded-md text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg"
                aria-label="New skill"
              >
                <Plus className="size-3.5" />
              </button>
            </Tooltip>
          </div>
        )}
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-3 pb-3", collapsed && "px-3.5")}>
          {skills?.length === 0 && !collapsed && (
            <button
              type="button"
              onClick={() => openSkillDialog()}
              className="mt-1 flex w-full items-center gap-2 rounded-[10px] border border-dashed border-border-strong px-3 py-2.5 text-left text-[13px] text-fg-3 transition-colors hover:border-primary hover:text-primary-ink"
            >
              <Plus className="size-4" /> Create your first skill
            </button>
          )}
          <div className="grid gap-0.5">
            {skills?.map((s) => {
              const href = `/skills/${s.id}`
              const active = pathname === href
              const row = (
                <Link
                  key={s.id}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors",
                    active ? "bg-surface-2 font-medium text-fg" : "text-fg-2 hover:bg-surface-2 hover:text-fg",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <SkillDot color={s.color} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{s.name}</span>
                      <span className="text-[11px] tabular-nums text-fg-3">{s.stats.notes}</span>
                    </>
                  )}
                </Link>
              )
              return collapsed ? (
                <Tooltip key={s.id} content={s.name} side="right">
                  {row}
                </Tooltip>
              ) : (
                row
              )
            })}
          </div>
        </div>
      </div>

      <div className={cn("grid gap-0.5 border-t border-border p-3", collapsed && "px-3.5")}>
        <NavLink
          href="/settings"
          label="Settings & backup"
          icon={Settings}
          active={pathname.startsWith("/settings")}
          collapsed={collapsed}
          layoutPrefix={layoutPrefix}
          onNavigate={onNavigate}
        />
        <div className={cn("flex items-center gap-0.5", collapsed && "flex-col")}>
          <button
            type="button"
            onClick={openShortcuts}
            className={cn(
              "flex h-9 flex-1 items-center gap-3 rounded-[10px] px-2.5 text-[13.5px] font-medium text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg",
              collapsed && "w-full justify-center px-0",
            )}
            aria-label="Keyboard shortcuts"
          >
            <Keyboard className="size-[18px]" />
            {!collapsed && "Shortcuts"}
          </button>
          {onToggleCollapse && (
            <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="right">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="grid size-9 place-items-center rounded-[10px] text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <PanelLeft className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}
