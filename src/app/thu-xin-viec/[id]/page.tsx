import type { Metadata } from 'next'
import { LetterEditor } from '@/components/letter/letter-editor'

export const metadata: Metadata = {
  title: 'Soạn thư xin việc',
  robots: { index: false },
}

export default async function LetterEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LetterEditor id={id} />
}
