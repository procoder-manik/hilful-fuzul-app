import type { MetadataRoute } from 'next';
import { publicClient } from '@/lib/supabase/public';
import { siteUrl } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = siteUrl();
  const now = new Date();
  const fixed: [string, number, MetadataRoute.Sitemap[number]['changeFrequency']][] = [
    ['', 1, 'daily'], ['/transparency', 0.9, 'daily'], ['/services', 0.8, 'monthly'], ['/join', 0.9, 'monthly'], ['/events', 0.8, 'weekly'],
    ['/library', 0.7, 'weekly'], ['/news', 0.7, 'weekly'], ['/about', 0.6, 'yearly'], ['/committee', 0.5, 'yearly'], ['/members', 0.5, 'weekly'], ['/contact', 0.6, 'yearly'],
    ['/support', 0.6, 'monthly'], ['/form', 0.4, 'yearly'], ['/terms', 0.3, 'yearly'], ['/privacy', 0.3, 'yearly'],
  ];
  const { data: posts } = await publicClient().from('posts').select('id, published_on').eq('is_published', true).limit(500);
  return [
    ...fixed.map(([p, priority, changeFrequency]) => ({ url: url + p, lastModified: now, changeFrequency, priority })),
    ...(posts ?? []).map((p) => ({ url: `${url}/news/${p.id}`, lastModified: new Date(p.published_on), changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];
}
