"use client"

import type { MouseEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNowStrict } from "date-fns"
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react"
import { toast } from "sonner"
import { BookOpen, Ellipsis, Pencil, Plus, Repeat, Trash, Zap } from "lucide-react"
import { api, errorMessage, revalidateNotesData } from "@/lib/client/api"
import { skillStyle } from "@/lib/skill-meta"
import type { SkillDTO } from "@/lib/types"
import { Meter } from "@/components/charts/mastery-charts"
import { useAppUI } from "@/components/shell/app-ui"
import { buttonVariants } from "@/components/ui/button"
import { useConfirm } from "@/components/ui/confirm"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/overlays"
import { SkillIcon } from "./skill-visuals"

export function useSkillActions() {
  const router = useRouter()
  const confirm = useConfirm()
  const { openSkillDialog } = useAppUI()
  const remove = async (skill: SkillDTO, after?: () => void) => {
    const ok = await confirm({
      title: `Delete “${skill.name}”?`,
      description:
        skill.stats.notes > 0
          ? `This permanently deletes the skill and its ${skill.stats.notes} ${skill.stats.notes === 1 ? "note" : "notes"} with their flashcards. Your study history stays.`
          : "This skill has no notes. It will be removed.",
      confirmLabel: "Delete skill",
      tone: "danger",
    })
    if (!ok) return
    try {
      await api.deleteSkill(skill.id)
      toast.success(`Deleted “${skill.name}”`)
      void revalidateNotesData()
      after?.()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }
  return { edit: (skill: SkillDTO) => openSkillDialog(skill), remove, newNote: (skill: SkillDTO) => router.push(`/notes/new?skill=${skill.id}`) }
}

/** Skill tile with a cursor-following tilt and spotlight. */
export function SkillCard({ skill }: { skill: SkillDTO }) {
  const { edit, remove, newNote } = useSkillActions()
  const rx = useSpring(useMotionValue(0), { stiffness: 220, damping: 20 })
  const ry = useSpring(useMotionValue(0), { stiffness: 220, damping: 20 })
  const mx = useMotionValue(50)
  const my = useMotionValue(50)
  const glow = useMotionTemplate`radial-gradient(380px circle at ${mx}% ${my}%, color-mix(in oklab, var(--skill) 16%, transparent), transparent 55%)`

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * 8)
    rx.set((0.5 - py) * 8)
    mx.set(px * 100)
    my.set(py * 100)
  }
  const onLeave = () => {
    rx.set(0)
    ry.set(0)
  }

  const s = skill.stats
  return (
    <div className="[perspective:1200px]">
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, ...skillStyle(skill.color) }}
        className="skill-scope group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow duration-300 [transform-style:preserve-3d] hover:shadow-pop"
      >
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glow }} />
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-[var(--skill-soft)] blur-2xl" />
        <Link href={`/skills/${skill.id}`} className="absolute inset-0 z-0" aria-label={`Open ${skill.name}`} />

        <div className="pointer-events-none relative z-10 flex items-start gap-4 p-5 pb-4">
          <SkillIcon icon={skill.icon} color={skill.color} size="lg" solid className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3" />
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="truncate text-lg font-semibold tracking-tight">{skill.name}</h3>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-fg-3">{skill.description || "No description"}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon-sm", className: "pointer-events-auto -mr-2 -mt-1" })} aria-label="Skill actions">
              <Ellipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem icon={<Plus />} onSelect={() => newNote(skill)}>
                New note
              </DropdownMenuItem>
              <DropdownMenuItem icon={<Pencil />} onSelect={() => edit(skill)}>
                Edit skill
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem icon={<Trash />} tone="danger" onSelect={() => void remove(skill)}>
                Delete skill
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="pointer-events-none relative z-10 grid grid-cols-3 gap-2 px-5 text-center">
          {[
            { icon: <BookOpen />, value: s.notes, label: "notes" },
            { icon: <Zap />, value: s.flashcards, label: "cards" },
            { icon: <Repeat />, value: s.due + s.cardsDue, label: "due", hot: s.due + s.cardsDue > 0 },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-surface-2 py-2">
              <div className={`flex items-center justify-center gap-1 text-base font-semibold tabular-nums ${m.hot ? "text-warning-ink" : ""}`}>{m.value}</div>
              <div className="text-[11px] text-fg-3">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none relative z-10 mt-auto grid gap-2 p-5 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-fg-3">Mastery</span>
            <span className="font-semibold tabular-nums">{s.mastery}%</span>
          </div>
          <Meter value={s.mastery} label={`${skill.name} mastery`} />
          <div className="mt-1 flex items-center justify-between text-xs text-fg-3">
            <span>{s.lastActivityAt ? `Active ${formatDistanceToNowStrict(new Date(s.lastActivityAt), { addSuffix: true })}` : "No activity yet"}</span>
            {s.due + s.cardsDue > 0 && (
              <Link href={`/revise/session?skill=${skill.id}`} className="pointer-events-auto font-medium text-primary-ink hover:underline">
                Revise now →
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
