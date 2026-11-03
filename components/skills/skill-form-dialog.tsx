"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Check, Layers } from "lucide-react"
import { motion } from "motion/react"
import { toast } from "sonner"
import { api, errorMessage, revalidate } from "@/lib/client/api"
import { SKILL_COLOR_KEYS, SKILL_COLORS, SKILL_ICON_KEYS, skillStyle, type SkillColor, type SkillIconKey } from "@/lib/skill-meta"
import type { SkillDTO } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/overlays"
import { Field, Input, Textarea } from "@/components/ui/primitives"
import { SKILL_ICONS, SkillIcon } from "./skill-visuals"

const SUGGESTIONS: { name: string; icon: SkillIconKey; color: SkillColor }[] = [
  { name: "AWS", icon: "cloud", color: "orange" },
  { name: "Docker", icon: "container", color: "sky" },
  { name: "Kubernetes", icon: "boxes", color: "blue" },
  { name: "Git", icon: "git", color: "rose" },
  { name: "Linux", icon: "terminal", color: "amber" },
  { name: "Python", icon: "code", color: "emerald" },
  { name: "SQL", icon: "database", color: "indigo" },
  { name: "System Design", icon: "network", color: "violet" },
]

export function SkillFormDialog({
  open,
  onOpenChange,
  skill,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  skill?: SkillDTO
  onSaved?: (skill: SkillDTO) => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState<SkillColor>("violet")
  const [icon, setIcon] = useState<SkillIconKey>("code")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(skill?.name ?? "")
    setDescription(skill?.description ?? "")
    setColor((skill?.color as SkillColor) ?? SKILL_COLOR_KEYS[Math.floor(Math.random() * 8)])
    setIcon((skill?.icon as SkillIconKey) ?? "code")
  }, [open, skill])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const input = { name: name.trim(), description: description.trim(), color, icon }
      const saved = skill ? await api.updateSkill(skill.id, input) : await api.createSkill(input)
      toast.success(skill ? "Skill updated" : `“${saved.name}” is ready for notes`)
      await revalidate("/api/skills", "/api/stats")
      onSaved?.(saved)
      onOpenChange(false)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader
          icon={<Layers />}
          title={skill ? "Edit skill" : "New skill"}
          description="Skills group your notes — one per technology, subject or certification you're learning."
        />
        <form onSubmit={submit} className="grid gap-5">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2/60 p-4" style={skillStyle(color)}>
            <motion.div key={`${icon}-${color}`} initial={{ scale: 0.7, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 380, damping: 18 }}>
              <SkillIcon icon={icon} color={color} size="lg" solid />
            </motion.div>
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold tracking-tight">{name.trim() || "Your skill"}</div>
              <div className="truncate text-sm text-fg-3">{description.trim() || "A short description helps when you revise"}</div>
            </div>
          </div>

          {!skill && (
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    setName(s.name)
                    setIcon(s.icon)
                    setColor(s.color)
                  }}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-xs font-medium text-fg-2 transition-colors hover:border-border-strong hover:text-fg"
                >
                  <SkillIcon icon={s.icon} color={s.color} size="xs" className="size-4 rounded [&_svg]:size-2.5" />
                  {s.name}
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="skill-name">
              <Input
                id="skill-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. AWS Cloud Practitioner"
                maxLength={60}
                autoFocus
                required
              />
            </Field>
            <Field label="Description" htmlFor="skill-desc" hint="Optional">
              <Textarea
                id="skill-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you learning and why?"
                maxLength={280}
                className="min-h-9 py-1.5"
                rows={1}
              />
            </Field>
          </div>

          <div className="grid gap-2">
            <span className="text-[13px] font-medium text-fg-2">Colour</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
              {SKILL_COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={color === key}
                  aria-label={SKILL_COLORS[key].label}
                  title={SKILL_COLORS[key].label}
                  onClick={() => setColor(key)}
                  className={cn(
                    "grid size-8 place-items-center rounded-full transition-transform hover:scale-110",
                    color === key && "ring-2 ring-[var(--fg)] ring-offset-2 ring-offset-[var(--surface)]",
                  )}
                  style={{ background: SKILL_COLORS[key].base }}
                >
                  {color === key && <Check className="size-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-[13px] font-medium text-fg-2">Icon</span>
            <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-[repeat(13,minmax(0,1fr))]" role="radiogroup" aria-label="Icon">
              {SKILL_ICON_KEYS.map((key) => {
                const Icon = SKILL_ICONS[key]
                const active = icon === key
                return (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={key}
                    title={key}
                    onClick={() => setIcon(key)}
                    style={skillStyle(color)}
                    className={cn(
                      "skill-scope grid aspect-square place-items-center rounded-lg border transition-all [&_svg]:size-[18px]",
                      active
                        ? "border-transparent bg-[var(--skill-soft)] text-[var(--skill-ink)] ring-2 ring-[var(--skill)]"
                        : "border-border text-fg-3 hover:border-border-strong hover:text-fg",
                    )}
                  >
                    <Icon />
                  </button>
                )
              })}
            </div>
          </div>

          <DialogFooter className="mt-1">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} disabled={!name.trim()}>
              {skill ? "Save changes" : "Create skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
