'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { createCv, saveCv } from '@/lib/cv-repository'

export function UseTemplateButton({ slug }: { slug: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const use = async () => {
    setBusy(true)
    const doc = createCv({ templateSlug: slug })
    await saveCv(doc)
    router.push(`/cv/${doc.id}`)
  }

  return (
    <Button onClick={() => void use()} disabled={busy} size="lg">
      {busy ? 'Đang tạo CV…' : 'Dùng mẫu này'}
    </Button>
  )
}
