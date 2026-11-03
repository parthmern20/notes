"use client"

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react"
import { TriangleAlert } from "lucide-react"
import { Button } from "./button"
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "./overlays"

interface ConfirmOptions {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: "danger" | "default"
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/** Provides an awaitable confirm dialog: `if (await confirm({...})) doIt()`. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [open, setOpen] = useState(false)
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts)
    setOpen(true)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const settle = (value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOpen(false)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(o) => !o && settle(false)}>
        <DialogContent size="sm" hideClose>
          {options && (
            <>
              <DialogHeader
                title={options.title}
                description={options.description}
                icon={options.tone === "danger" ? <TriangleAlert /> : undefined}
              />
              <DialogFooter className="mt-2">
                <Button variant="secondary" onClick={() => settle(false)}>
                  {options.cancelLabel ?? "Cancel"}
                </Button>
                <Button variant={options.tone === "danger" ? "danger" : "primary"} onClick={() => settle(true)} autoFocus>
                  {options.confirmLabel ?? "Confirm"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>")
  return ctx
}
