import type { MetadataRoute } from 'next'
import { BRAND } from '@/config/brand'
import { CV_TEMPLATES } from '@/data/cv-templates'
import { LETTER_TEMPLATES } from '@/data/letter-templates'

const BASE_URL = `https://${BRAND.domain}`

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: { path: string; priority: number }[] = [
    { path: '', priority: 1.0 },
    { path: '/mau-cv', priority: 0.9 },
    { path: '/thu-xin-viec', priority: 0.85 },
    { path: '/mau-thu-xin-viec', priority: 0.85 },
    { path: '/viet-cv-voi-ai', priority: 0.8 },
    { path: '/theo-doi-ung-tuyen', priority: 0.8 },
    { path: '/bang-gia', priority: 0.75 },
    { path: '/ve-chung-toi', priority: 0.6 },
    { path: '/dieu-khoan', priority: 0.4 },
    { path: '/bao-mat', priority: 0.4 },
    { path: '/thong-tin-phap-ly', priority: 0.4 },
  ]

  const cvTemplateRoutes = CV_TEMPLATES.map((t) => ({
    url: `${BASE_URL}/mau-cv/${t.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const letterTemplateRoutes = LETTER_TEMPLATES.map((t) => ({
    url: `${BASE_URL}/mau-thu-xin-viec/${t.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.75,
  }))

  return [
    ...staticRoutes.map((r) => ({
      url: `${BASE_URL}${r.path}`,
      changeFrequency: 'weekly' as const,
      priority: r.priority,
    })),
    ...cvTemplateRoutes,
    ...letterTemplateRoutes,
  ]
}
