import { SkillDetailView } from "@/components/views/skill-detail-view"

export default async function SkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SkillDetailView id={id} />
}
