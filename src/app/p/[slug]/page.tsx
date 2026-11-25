import type { Metadata } from 'next'
import { PublicCvViewer } from '@/components/public/public-cv-viewer'
import { BRAND } from '@/config/brand'
import { getSaasDb } from '@/server/db/store'
import { migrateToV2 } from '@/types/schema'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps<'/p/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const link = await getSaasDb().getPublicLink(slug)
  if (!link || !link.isActive) {
    return { title: `Không tìm thấy hồ sơ | ${BRAND.name}` }
  }
  if (link.passcodeHash) {
    return {
      title: `Hồ sơ bảo mật (${slug}) | ${BRAND.name}`,
      openGraph: {
        title: `Hồ sơ bảo mật trên ${BRAND.name}`,
        description: 'Nhập mã PIN để xem hồ sơ ứng viên.',
      },
      twitter: { card: 'summary_large_image' },
    }
  }
  const doc = migrateToV2(JSON.parse(link.docSnapshotJson))
  const name = doc.data.name.trim() || doc.title
  const title = `${name} — ${doc.data.role || 'CV Trực tuyến'}`
  const description = `Xem và tải CV khổ A4 của ${name} trên ${BRAND.name}.`
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function PublicCvPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { slug } = await params
  const { ref } = await searchParams
  const link = await getSaasDb().getPublicLink(slug)

  if (!link || !link.isActive) {
    return <PublicCvViewer slug={slug} refTag={ref} initialDoc={null} initialProtected={false} notFound />
  }

  if (link.passcodeHash) {
    return <PublicCvViewer slug={slug} refTag={ref} initialDoc={null} initialProtected />
  }

  const doc = migrateToV2(JSON.parse(link.docSnapshotJson))
  if (link.hidePhone) doc.data.phone = ''
  if (link.hideEmail) doc.data.email = ''

  return <PublicCvViewer slug={slug} refTag={ref} initialDoc={doc} initialProtected={false} />
}
