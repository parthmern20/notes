"use client"

import { CloudOff, RefreshCw } from "lucide-react"
import { errorMessage } from "@/lib/client/api"
import { Button } from "./button"
import { EmptyState } from "./primitives"

export function ErrorState({ error, onRetry, title = "Couldn't load this" }: { error: unknown; onRetry?: () => void; title?: string }) {
  return (
    <EmptyState
      className="min-h-[50vh]"
      icon={<CloudOff />}
      title={title}
      description={errorMessage(error)}
      action={
        onRetry && (
          <Button variant="primary" onClick={onRetry}>
            <RefreshCw /> Try again
          </Button>
        )
      }
    />
  )
}
