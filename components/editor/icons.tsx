import type { SVGProps } from "react"

/** Lucide 1.x ships no "bold" glyph; this matches its 24px grid and 2px stroke. */
export function BoldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M6 12h8a4 4 0 0 0 0-8H7a1 1 0 0 0-1 1z" />
      <path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1z" />
    </svg>
  )
}
