import { NoteView } from "@/components/views/note-view"

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <NoteView id={id} />
}
