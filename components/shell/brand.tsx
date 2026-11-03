"use client"

import { useId } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useMounted } from "@/lib/client/hooks"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/overlays"

export function LogoMark({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b7cff" />
          <stop offset="0.55" stopColor="#5b4cf0" />
          <stop offset="1" stopColor="#1fb6f2" />
        </linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id}-g)`} />
      <rect x="1" y="1" width="30" height="15" rx="8" fill={`url(#${id}-s)`} />
      <path
        d="M9 22.5V11.6c0-.85.97-1.35 1.66-.85L16 14.6l5.34-3.85c.69-.5 1.66 0 1.66.85v10.9"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="21.4" r="1.7" fill="#fff" />
    </svg>
  )
}

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const Icon = !mounted ? Sun : resolvedTheme === "dark" ? Moon : Sun
  const options = [
    { value: "light", label: "Light", icon: <Sun /> },
    { value: "dark", label: "Dark", icon: <Moon /> },
    { value: "system", label: "System", icon: <Monitor /> },
  ]
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", size: "icon" })} aria-label="Change theme">
        <Icon className="transition-transform duration-500 hover:rotate-45" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-36">
        {options.map((o) => (
          <DropdownMenuItem
            key={o.value}
            icon={o.icon}
            onSelect={() => setTheme(o.value)}
            className={cn(mounted && theme === o.value && "bg-surface-2 font-medium")}
          >
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
