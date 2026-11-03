"use client"

import { useRef, useState } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Bot, Database, Download, Keyboard, Monitor, Moon, Palette, ShieldCheck, Sun, Upload, Zap } from "lucide-react"
import { api, errorMessage, revalidateNotesData, useMeta, useSkills } from "@/lib/client/api"
import { useMounted } from "@/lib/client/hooks"
import { APP_NAME } from "@/lib/config"
import type { BackupFile } from "@/lib/types"
import { usePreferences } from "@/components/providers"
import { useAppUI } from "@/components/shell/app-ui"
import { Button } from "@/components/ui/button"
import { useConfirm } from "@/components/ui/confirm"
import { Switch } from "@/components/ui/overlays"
import { Badge, Card, CardHeader, PageHeader } from "@/components/ui/primitives"
import { Segmented } from "@/components/ui/segmented"

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        {description && <div className="mt-0.5 text-[13px] text-fg-3">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const mounted = useMounted()
  const { reduceMotion, setReduceMotion } = usePreferences()
  const { openShortcuts } = useAppUI()
  const { data: meta } = useMeta()
  const { data: skills } = useSkills()
  const confirm = useConfirm()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  const exportBackup = () => {
    window.location.href = "/api/backup"
    toast.success("Preparing your backup download…")
  }

  const importBackup = async (file?: File) => {
    if (!file) return
    try {
      const data = JSON.parse(await file.text()) as BackupFile
      if (data?.app !== "mnemo" || data.version !== 1) throw new Error("This isn't a Mnemo backup file.")
      const ok = await confirm({
        title: "Restore this backup?",
        description: `It contains ${data.skills.length} skills, ${data.notes.length} notes and ${data.reviews.length} reviews. Matching items are overwritten; nothing else is deleted.`,
        confirmLabel: "Restore",
      })
      if (!ok) return
      setImporting(true)
      const res = await api.importBackup(data)
      await revalidateNotesData()
      toast.success(`Restored ${res.skills} skills and ${res.notes} notes`)
    } catch (err) {
      toast.error(err instanceof SyntaxError ? "That file isn't valid JSON." : errorMessage(err))
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader title="Settings" description={`Personalise ${APP_NAME} and keep your notes safe.`} />

      <Card>
        <CardHeader icon={<Palette />} title="Appearance" />
        <div className="divide-y divide-border">
          <Row title="Theme" description="Follow your system or pick one.">
            {mounted && (
              <Segmented
                value={(theme as "light" | "dark" | "system") ?? "system"}
                onChange={setTheme}
                ariaLabel="Theme"
                options={[
                  { value: "light", label: "Light", icon: <Sun /> },
                  { value: "dark", label: "Dark", icon: <Moon /> },
                  { value: "system", label: "System", icon: <Monitor /> },
                ]}
              />
            )}
          </Row>
          <Row title="Reduce motion" description="Turns off animations and transitions. Your OS setting is respected automatically.">
            <Switch checked={reduceMotion} onCheckedChange={setReduceMotion} aria-label="Reduce motion" />
          </Row>
        </div>
      </Card>

      <Card>
        <CardHeader icon={<ShieldCheck />} title="Backup & restore" description="Your notes live in MongoDB. Keep a copy you control." />
        <div className="divide-y divide-border">
          <Row title="Export everything" description="Downloads skills, notes, flashcards and review history as a JSON file.">
            <Button onClick={exportBackup}>
              <Download /> Download backup
            </Button>
          </Row>
          <Row title="Restore from backup" description="Upload a backup file exported from Mnemo.">
            <Button onClick={() => fileRef.current?.click()} loading={importing}>
              {!importing && <Upload />} Choose file
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => void importBackup(e.target.files?.[0])} />
          </Row>
        </div>
      </Card>

      <Card>
        <CardHeader icon={<Bot />} title="AI assistant" description="Drafts key takeaways and flashcards from your notes." />
        <div className="divide-y divide-border">
          <Row title="Status" description={meta?.ai ? `Using ${meta.aiModel}. Generation only runs when you click “Generate with AI”.` : "Add ANTHROPIC_API_KEY to your .env file and restart the app to enable it."}>
            {meta ? meta.ai ? <Badge tone="success">Enabled</Badge> : <Badge>Not configured</Badge> : null}
          </Row>
        </div>
      </Card>

      <Card>
        <CardHeader icon={<Database />} title="Data" />
        <div className="divide-y divide-border">
          <Row title="Database" description="Set with MONGODB_URI and MONGODB_DB in .env.">
            <code className="rounded-md bg-surface-2 px-2 py-1 font-mono text-xs">{meta?.database ?? "—"}</code>
          </Row>
          <Row title="Skills" description="Total skills in this workspace.">
            <span className="text-sm font-semibold tabular-nums">{skills?.length ?? "—"}</span>
          </Row>
        </div>
      </Card>

      <Card>
        <CardHeader icon={<Zap />} title="Productivity" />
        <div className="divide-y divide-border">
          <Row title="Keyboard shortcuts" description="Ctrl K search, N new note, R revise, / for blocks in the editor.">
            <Button onClick={openShortcuts}>
              <Keyboard /> View shortcuts
            </Button>
          </Row>
        </div>
      </Card>
    </div>
  )
}
