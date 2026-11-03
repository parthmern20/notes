"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Flame, Menu, Plus, Search } from "lucide-react"
import { useStats } from "@/lib/client/api"
import { useMounted, useStoredState } from "@/lib/client/hooks"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, SheetContent, Tooltip } from "@/components/ui/overlays"
import { Kbd } from "@/components/ui/primitives"
import { ThemeToggle } from "./brand"
import { useAppUI } from "./app-ui"
import { SidebarContent } from "./sidebar"

function StreakChip() {
  const { data } = useStats(30)
  const streak = data?.streak.current ?? 0
  if (!data) return null
  return (
    <Tooltip content={data.streak.activeToday ? "You studied today — keep it going!" : "Study today to extend your streak"}>
      <Link
        href="/"
        className={cn(
          "hidden h-8 items-center gap-1.5 rounded-full border px-2.5 text-[13px] font-semibold tabular-nums sm:inline-flex",
          streak > 0
            ? "border-[color-mix(in_oklab,#fb923c_35%,transparent)] bg-[color-mix(in_oklab,#fb923c_10%,transparent)] text-[#c2560c] dark:text-[#fdba74]"
            : "border-border bg-surface text-fg-3",
        )}
      >
        <Flame className={cn("size-4", streak > 0 && "animate-flicker text-[#f97316]")} />
        {streak}
        <span className="font-medium">{streak === 1 ? "day" : "days"}</span>
      </Link>
    </Tooltip>
  )
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { openPalette } = useAppUI()
  const mounted = useMounted()
  const isMac = mounted && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border/70 bg-[color-mix(in_oklab,var(--bg)_78%,transparent)] px-4 backdrop-blur-xl sm:gap-3 sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu />
      </Button>
      <button
        type="button"
        onClick={openPalette}
        className="group flex h-9 w-full max-w-md items-center gap-2.5 rounded-[10px] border border-border bg-surface px-3 text-left text-sm text-fg-3 shadow-soft transition-[border-color,box-shadow] hover:border-border-strong hover:shadow-card"
      >
        <Search className="size-4 shrink-0 transition-colors group-hover:text-primary-ink" />
        <span className="flex-1 truncate">Search notes, skills, commands…</span>
        <span className="hidden items-center gap-0.5 sm:flex">
          <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <div className="ml-auto flex items-center gap-1.5">
        <StreakChip />
        <ThemeToggle />
        <Link href="/notes/new" className={buttonVariants({ variant: "primary", className: "max-sm:size-9 max-sm:px-0" })}>
          <Plus />
          <span className="max-sm:sr-only">New note</span>
        </Link>
      </div>
    </header>
  )
}

const FOCUS_ROUTES = ["/revise/session", "/revise/flashcards"]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const mounted = useMounted()
  const [collapsed, setCollapsed] = useStoredState("mnemo:sidebar-collapsed", false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMobileOpen(false), [pathname])

  if (FOCUS_ROUTES.some((r) => pathname.startsWith(r))) {
    return <main className="min-h-dvh">{children}</main>
  }

  return (
    <div className="flex min-h-dvh">
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 border-r border-border bg-[color-mix(in_oklab,var(--surface)_72%,transparent)] backdrop-blur-xl lg:block",
          mounted && "transition-[width] duration-300 ease-out",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} layoutPrefix="desktop" />
      </aside>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent title="Navigation">
          <SidebarContent layoutPrefix="mobile" onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Dialog>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  )
}
