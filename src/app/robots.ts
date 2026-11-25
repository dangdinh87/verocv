import type { MetadataRoute } from 'next'
import { BRAND } from '@/config/brand'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/cv/', '/thu-xin-viec/*/'],
    },
    sitemap: `https://${BRAND.domain}/sitemap.xml`,
  }
}
