import {
  Atom,
  BookOpen,
  Bot,
  Boxes,
  Brain,
  Briefcase,
  Calculator,
  Camera,
  ChartColumn,
  Cloud,
  CodeXml,
  Compass,
  Container,
  Cpu,
  Database,
  Dumbbell,
  FlaskConical,
  GitBranch,
  Globe,
  GraduationCap,
  Headphones,
  Heart,
  Languages,
  Layers,
  Leaf,
  Lightbulb,
  Network,
  Palette,
  PenTool,
  Puzzle,
  Rocket,
  Server,
  Shield,
  Smartphone,
  Sparkles,
  SquareTerminal,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { skillStyle, type SkillIconKey } from "@/lib/skill-meta"
import { MASTERY_META } from "@/lib/srs"
import type { MasteryLevel } from "@/lib/types"
import { cn } from "@/lib/utils"

export const SKILL_ICONS: Record<SkillIconKey, LucideIcon> = {
  code: CodeXml,
  terminal: SquareTerminal,
  cloud: Cloud,
  database: Database,
  server: Server,
  cpu: Cpu,
  network: Network,
  shield: Shield,
  git: GitBranch,
  container: Container,
  globe: Globe,
  smartphone: Smartphone,
  layers: Layers,
  boxes: Boxes,
  bot: Bot,
  brain: Brain,
  book: BookOpen,
  graduation: GraduationCap,
  rocket: Rocket,
  lightbulb: Lightbulb,
  sparkles: Sparkles,
  zap: Zap,
  target: Target,
  atom: Atom,
  flask: FlaskConical,
  calculator: Calculator,
  chart: ChartColumn,
  briefcase: Briefcase,
  languages: Languages,
  pen: PenTool,
  palette: Palette,
  music: Headphones,
  camera: Camera,
  dumbbell: Dumbbell,
  heart: Heart,
  leaf: Leaf,
  compass: Compass,
  puzzle: Puzzle,
}

const tileSizes = {
  xs: "size-6 rounded-md [&_svg]:size-3.5",
  sm: "size-8 rounded-lg [&_svg]:size-4",
  md: "size-10 rounded-xl [&_svg]:size-5",
  lg: "size-14 rounded-2xl [&_svg]:size-7",
}

export function SkillIcon({
  icon,
  color,
  size = "md",
  solid = false,
  className,
}: {
  icon: string
  color: string
  size?: keyof typeof tileSizes
  solid?: boolean
  className?: string
}) {
  const Icon = SKILL_ICONS[icon as SkillIconKey] ?? BookOpen
  return (
    <span
      style={skillStyle(color)}
      className={cn(
        "skill-scope grid shrink-0 place-items-center",
        tileSizes[size],
        solid
          ? "bg-[linear-gradient(140deg,var(--skill),color-mix(in_oklab,var(--skill)_62%,black))] text-white shadow-[0_10px_24px_-10px_var(--skill),inset_0_1px_0_rgb(255_255_255/0.25)] [&_svg]:drop-shadow-[0_1px_1px_rgb(0_0_0/0.3)]"
          : "bg-[var(--skill-soft)] text-[var(--skill-ink)]",
        className,
      )}
    >
      <Icon />
    </span>
  )
}

export function SkillDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      style={skillStyle(color)}
      className={cn("skill-scope inline-block size-2 shrink-0 rounded-full bg-[var(--skill)] ring-2 ring-[var(--skill-soft)]", className)}
    />
  )
}

export function SkillChip({ name, color, className }: { name: string; color: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] max-w-full items-center gap-1.5 rounded-full border border-border bg-surface px-2 text-[11.5px] font-medium text-fg-2",
        className,
      )}
    >
      <SkillDot color={color} className="size-1.5 ring-0" />
      <span className="truncate">{name}</span>
    </span>
  )
}

export const MASTERY_COLOR: Record<MasteryLevel, string> = {
  new: "var(--mastery-new)",
  learning: "var(--mastery-learning)",
  familiar: "var(--mastery-familiar)",
  mastered: "var(--mastery-mastered)",
}

export function MasteryBadge({ level, className }: { level: MasteryLevel; className?: string }) {
  return (
    <span
      title={MASTERY_META[level].description}
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-full border border-border bg-surface px-2 text-[11.5px] font-medium text-fg-2",
        className,
      )}
    >
      <span className="size-1.5 rounded-full" style={{ background: MASTERY_COLOR[level] }} />
      {MASTERY_META[level].label}
    </span>
  )
}
