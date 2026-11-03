"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Keyboard } from "lucide-react"
import { useHotkeys } from "@/lib/client/hooks"
import type { SkillDTO } from "@/lib/types"
import { SkillFormDialog } from "@/components/skills/skill-form-dialog"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/overlays"
import { Kbd } from "@/components/ui/primitives"
import { CommandPalette } from "./command-palette"

interface AppUI {
  openSkillDialog: (skill?: SkillDTO, onSaved?: (skill: SkillDTO) => void) => void
  openPalette: () => void
  openShortcuts: () => void
}

const AppUIContext = createContext<AppUI | null>(null)

const SHORTCUTS: { group: string; items: [string[], string][] }[] = [
  {
    group: "Everywhere",
    items: [
      [["Ctrl", "K"], "Search & command palette"],
      [["N"], "New note"],
      [["R"], "Start a revision session"],
      [["?"], "Show keyboard shortcuts"],
    ],
  },
  {
    group: "Editor",
    items: [
      [["Ctrl", "S"], "Save note"],
      [["/"], "Insert block (heading, code, terminal, callout…)"],
      [["Ctrl", "Alt", "C"], "Code block"],
      [["Ctrl", "Alt", "T"], "Terminal command block"],
      [["Ctrl", "Shift", "H"], "Highlight"],
      [["Ctrl", "E"], "Inline code"],
    ],
  },
  {
    group: "Revision",
    items: [
      [["Space"], "Reveal note / flip flashcard"],
      [["1", "–", "4"], "Rate: Again · Hard · Good · Easy"],
      [["Esc"], "Leave the session"],
    ],
  },
]

export function AppUIProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [skillDialog, setSkillDialog] = useState<{ open: boolean; skill?: SkillDTO; onSaved?: (s: SkillDTO) => void }>({
    open: false,
  })
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const openSkillDialog = useCallback((skill?: SkillDTO, onSaved?: (s: SkillDTO) => void) => {
    setSkillDialog({ open: true, skill, onSaved })
  }, [])
  const openPalette = useCallback(() => setPaletteOpen(true), [])
  const openShortcuts = useCallback(() => setShortcutsOpen(true), [])

  const overlayOpen = paletteOpen || shortcutsOpen || skillDialog.open
  const inSession = pathname.startsWith("/revise/session") || pathname.startsWith("/revise/flashcards")

  useHotkeys("mod+k", () => setPaletteOpen((o) => !o), { allowInInputs: true })
  useHotkeys("?", () => setShortcutsOpen(true), { enabled: !overlayOpen })
  useHotkeys("n", () => router.push("/notes/new"), { enabled: !overlayOpen && !inSession })
  useHotkeys("r", () => router.push("/revise/session"), { enabled: !overlayOpen && !inSession })

  const value = useMemo(() => ({ openSkillDialog, openPalette, openShortcuts }), [openSkillDialog, openPalette, openShortcuts])

  return (
    <AppUIContext.Provider value={value}>
      {children}
      <SkillFormDialog
        open={skillDialog.open}
        skill={skillDialog.skill}
        onSaved={skillDialog.onSaved}
        onOpenChange={(open) => setSkillDialog((s) => ({ ...s, open }))}
      />
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNewSkill={() => openSkillDialog()}
        onShortcuts={openShortcuts}
      />
      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent size="md">
          <DialogHeader icon={<Keyboard />} title="Keyboard shortcuts" description="Move fast without leaving the keyboard." />
          <div className="grid gap-5">
            {SHORTCUTS.map((section) => (
              <div key={section.group}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-3">{section.group}</div>
                <div className="divide-y divide-border rounded-xl border border-border">
                  {section.items.map(([keys, label]) => (
                    <div key={label} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
                      <span className="text-fg-2">{label}</span>
                      <span className="flex shrink-0 items-center gap-1">
                        {keys.map((k) => (k === "–" ? <span key={k} className="text-fg-3">–</span> : <Kbd key={k}>{k}</Kbd>))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppUIContext.Provider>
  )
}

export function useAppUI(): AppUI {
  const ctx = useContext(AppUIContext)
  if (!ctx) throw new Error("useAppUI must be used inside <AppUIProvider>")
  return ctx
}
