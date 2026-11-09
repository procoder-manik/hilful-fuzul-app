import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/schema';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/portal', '/login', '/auth'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
