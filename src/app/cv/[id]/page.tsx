import type { Metadata } from 'next'
import { CvEditor } from '@/components/cv/cv-editor'

export const metadata: Metadata = {
  title: 'Soạn CV',
  robots: { index: false },
}

export default async function CvEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CvEditor id={id} />
}
