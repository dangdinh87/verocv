'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { listCvs } from '@/lib/cv-repository'
import { createLetterFromTemplate, saveLetterDocument } from '@/lib/storage'

export function UseLetterTemplateButton({ slug }: { slug: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const use = async () => {
    setBusy(true)
    // The newest CV supplies the sender details; with no CV they stay as bracketed placeholders.
    const [latestCv] = await listCvs()
    const doc = createLetterFromTemplate(slug, undefined, latestCv)
    saveLetterDocument(doc)
    router.push(`/thu-xin-viec/${doc.id}`)
  }

  return (
    <Button onClick={() => void use()} disabled={busy} size="lg">
      {busy ? 'Đang tạo thư…' : 'Dùng mẫu này'}
    </Button>
  )
}
