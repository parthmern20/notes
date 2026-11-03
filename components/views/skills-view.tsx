"use client"

import { Layers, Plus } from "lucide-react"
import { useSkills } from "@/lib/client/api"
import { Stagger, StaggerItem } from "@/components/motion/motion"
import { useAppUI } from "@/components/shell/app-ui"
import { SkillCard } from "@/components/skills/skill-card"
import { Button } from "@/components/ui/button"
import { EmptyState, PageHeader, Skeleton } from "@/components/ui/primitives"
import { ErrorState } from "@/components/ui/states"

export function SkillsView() {
  const { data: skills, error, mutate } = useSkills()
  const { openSkillDialog } = useAppUI()

  if (error && !skills) return <ErrorState error={error} onRetry={() => mutate()} title="Couldn't load your skills" />

  const totalNotes = skills?.reduce((n, s) => n + s.stats.notes, 0) ?? 0

  return (
    <div className="grid gap-8">
      <PageHeader
        title="Skills"
        description={skills ? `${skills.length} ${skills.length === 1 ? "skill" : "skills"} · ${totalNotes} notes` : "Everything you're learning, organised."}
        actions={
          <Button variant="primary" onClick={() => openSkillDialog()}>
            <Plus /> New skill
          </Button>
        }
      />
      {!skills ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <EmptyState
          icon={<Layers />}
          title="Create your first skill"
          description="A skill groups related notes — like “AWS”, “Docker” or “Data Structures”. You'll track mastery and revise each one separately."
          action={
            <Button variant="primary" onClick={() => openSkillDialog()}>
              <Plus /> New skill
            </Button>
          }
        />
      ) : (
        <Stagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {skills.map((s) => (
            <StaggerItem key={s.id} className="h-full">
              <SkillCard skill={s} />
            </StaggerItem>
          ))}
          <StaggerItem>
            <button
              type="button"
              onClick={() => openSkillDialog()}
              className="group grid h-full min-h-56 w-full place-items-center rounded-2xl border-2 border-dashed border-border-strong text-fg-3 transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary-ink"
            >
              <span className="grid justify-items-center gap-2">
                <span className="grid size-12 place-items-center rounded-2xl border border-border bg-surface transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110">
                  <Plus className="size-5" />
                </span>
                <span className="text-sm font-medium">Add a skill</span>
              </span>
            </button>
          </StaggerItem>
        </Stagger>
      )}
    </div>
  )
}
