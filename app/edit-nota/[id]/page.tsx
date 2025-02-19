import { EditNota } from "@/components/edit-nota"

export default function EditNotaPage({ params }: { params: { id: string } }) {
  return <EditNota notaId={params.id} />
}

