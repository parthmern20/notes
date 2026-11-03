import Link from "next/link"
import { Compass } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/primitives"

export default function NotFound() {
  return (
    <EmptyState
      className="min-h-[60vh]"
      icon={<Compass />}
      title="This page wandered off"
      description="The note or skill you're looking for doesn't exist — it may have been deleted."
      action={
        <Link href="/" className={buttonVariants({ variant: "primary" })}>
          Back to dashboard
        </Link>
      }
    />
  )
}
