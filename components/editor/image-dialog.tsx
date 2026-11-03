"use client"

import { useRef, useState, type DragEvent } from "react"
import type { Editor } from "@tiptap/core"
import { ImagePlus, Link2, Upload } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/overlays"
import { Field, Input } from "@/components/ui/primitives"
import { Segmented } from "@/components/ui/segmented"

const MAX_INPUT_BYTES = 12 * 1024 * 1024
const MAX_EDGE = 1600

/** Reads an image file, downscaling large raster images so notes stay small. */
export async function imageFileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image.")
  if (file.size > MAX_INPUT_BYTES) throw new Error("Images must be smaller than 12 MB.")
  const original = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Couldn't read that image."))
    reader.readAsDataURL(file)
  })
  // Keep animation/vector formats as-is.
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    if (file.size > 2 * 1024 * 1024) throw new Error("GIF and SVG images must be under 2 MB.")
    return original
  }
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error("Couldn't decode that image."))
    el.src = original
  })
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
  if (scale === 1 && file.size < 400 * 1024) return original
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height)
  const webp = canvas.toDataURL("image/webp", 0.86)
  return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/jpeg", 0.86)
}

export function ImageDialog({ editor, open, onOpenChange }: { editor: Editor | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [mode, setMode] = useState<"upload" | "url">("upload")
  const [url, setUrl] = useState("")
  const [alt, setAlt] = useState("")
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const insert = (src: string) => {
    editor?.chain().focus().setImage({ src, alt: alt.trim() || undefined }).run()
    setUrl("")
    setAlt("")
    onOpenChange(false)
  }

  const fromFile = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      insert(await imageFileToDataUrl(file))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add that image")
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void fromFile(e.dataTransfer.files?.[0])
  }

  const validUrl = /^https?:\/\/\S+$/i.test(url.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader
          icon={<ImagePlus />}
          title="Add an image"
          description="Diagrams and screenshots make revision faster. Tip: paste a screenshot straight into the editor."
        />
        <div className="grid gap-4">
          <Segmented
            value={mode}
            onChange={setMode}
            options={[
              { value: "upload", label: "Upload", icon: <Upload /> },
              { value: "url", label: "From URL", icon: <Link2 /> },
            ]}
          />
          {mode === "upload" ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              disabled={busy}
              className={cn(
                "grid place-items-center gap-2 rounded-2xl border-2 border-dashed border-border-strong px-6 py-10 text-center transition-colors hover:border-primary hover:bg-primary-soft",
                dragging && "border-primary bg-primary-soft",
              )}
            >
              <Upload className="size-6 text-primary-ink" />
              <span className="text-sm font-medium">{busy ? "Optimising image…" : "Click to choose, or drop an image here"}</span>
              <span className="text-xs text-fg-3">PNG, JPG, WebP, GIF or SVG · large images are resized automatically</span>
            </button>
          ) : (
            <Field label="Image URL" htmlFor="img-url">
              <Input id="img-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/diagram.png" autoFocus />
            </Field>
          )}
          <Field label="Alt text" htmlFor="img-alt" hint="Describes the image for screen readers and when it can't load.">
            <Input id="img-alt" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. VPC architecture with public and private subnets" />
          </Field>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void fromFile(e.target.files?.[0] ?? undefined)} />
        </div>
        {mode === "url" && (
          <DialogFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={!validUrl} onClick={() => insert(url.trim())}>
              Insert image
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
