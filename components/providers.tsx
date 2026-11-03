"use client"

import { createContext, useContext, useEffect, type CSSProperties, type ReactNode } from "react"
import { MotionConfig } from "motion/react"
import { ThemeProvider, useTheme } from "next-themes"
import { Toaster } from "sonner"
import { SWRConfig, type SWRConfiguration } from "swr"
import { ApiError, fetcher } from "@/lib/client/api"
import { useStoredState } from "@/lib/client/hooks"
import { AppUIProvider } from "@/components/shell/app-ui"
import { ConfirmProvider } from "@/components/ui/confirm"
import { TooltipProvider } from "@/components/ui/overlays"

const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  dedupingInterval: 1500,
  errorRetryCount: 2,
  // Client errors (404, validation) won't fix themselves — only retry network and server failures.
  shouldRetryOnError: (err: unknown) => !(err instanceof ApiError) || err.status === 0 || err.status >= 500,
}

interface Preferences {
  reduceMotion: boolean
  setReduceMotion: (value: boolean) => void
}

const PreferencesContext = createContext<Preferences>({ reduceMotion: false, setReduceMotion: () => {} })
export const usePreferences = () => useContext(PreferencesContext)

function PreferencesProvider({ children }: { children: ReactNode }) {
  const [reduceMotion, setReduceMotion] = useStoredState("mnemo:reduce-motion", false)
  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reduceMotion)
  }, [reduceMotion])
  return (
    <PreferencesContext.Provider value={{ reduceMotion, setReduceMotion }}>
      <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>{children}</MotionConfig>
    </PreferencesContext.Provider>
  )
}

function ThemedToaster() {
  const { resolvedTheme } = useTheme()
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="bottom-right"
      closeButton
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--fg)",
          "--normal-border": "var(--border)",
        } as CSSProperties
      }
      toastOptions={{ classNames: { toast: "!rounded-xl !shadow-pop", description: "!text-fg-3" } }}
    />
  )
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <PreferencesProvider>
        <SWRConfig value={swrConfig}>
          <TooltipProvider delayDuration={250} skipDelayDuration={120}>
            <ConfirmProvider>
              <AppUIProvider>{children}</AppUIProvider>
              <ThemedToaster />
            </ConfirmProvider>
          </TooltipProvider>
        </SWRConfig>
      </PreferencesProvider>
    </ThemeProvider>
  )
}
