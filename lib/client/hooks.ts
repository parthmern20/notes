"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable
}

interface HotkeyOptions {
  enabled?: boolean
  /** Fire even while focus is in an input/editor (e.g. mod+s). */
  allowInInputs?: boolean
  preventDefault?: boolean
}

/**
 * Binds keyboard shortcuts. Combos look like "mod+k", "shift+?", "1", "space", "escape".
 * "mod" is ⌘ on macOS and Ctrl elsewhere.
 */
export function useHotkeys(
  combos: string | string[],
  handler: (event: KeyboardEvent) => void,
  { enabled = true, allowInInputs = false, preventDefault = true }: HotkeyOptions = {},
) {
  const handlerRef = useRef(handler)
  handlerRef.current = handler
  const key = Array.isArray(combos) ? combos.join("|") : combos

  useEffect(() => {
    if (!enabled) return
    const parsed = key.split("|").map((combo) => {
      const parts = combo.toLowerCase().split("+")
      return {
        key: parts[parts.length - 1],
        mod: parts.includes("mod"),
        shift: parts.includes("shift"),
        alt: parts.includes("alt"),
      }
    })
    const onKey = (e: KeyboardEvent) => {
      if (!allowInInputs && isTypingTarget(e.target)) return
      const pressed = e.key === " " ? "space" : e.key.toLowerCase()
      const mod = e.metaKey || e.ctrlKey
      const match = parsed.some(
        (p) =>
          p.key === pressed &&
          p.mod === mod &&
          p.alt === e.altKey &&
          (p.shift === e.shiftKey || (!p.mod && !p.alt && pressed.length === 1 && !/[a-z0-9]/.test(pressed))),
      )
      if (!match) return
      if (preventDefault) e.preventDefault()
      handlerRef.current(e)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [key, enabled, allowInInputs, preventDefault])
}

export function useDebounced<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const noopSubscribe = () => () => {}

/** True only after hydration — for UI that depends on browser-only state. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeStorage(key: string, value: unknown) {
  try {
    if (value === undefined) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode, quota) — these values are conveniences only.
  }
}

/** A per-browser preference persisted to localStorage (read after hydration, written on change). */
export function useStoredState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial)
  useEffect(() => {
    setValue(readStorage(key, initial))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next
        writeStorage(key, resolved)
        return resolved
      })
    },
    [key],
  )
  return [value, update] as const
}
