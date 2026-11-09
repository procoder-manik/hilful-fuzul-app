import { Blocks } from './Blocks';
import { PageTitle } from '../cards';
import { cleanBlocks } from '@/lib/blocks';
import { defaultBlocks } from '@/lib/builtin-content';
import { publicClient } from '@/lib/supabase/public';

/**
 * আগে থেকে তৈরি পেজের মোড়ক: অ্যাডমিন পেজ বিল্ডারে সাজালে (এবং "ব্যবহার করুন" টিক থাকলে) সেই সাজ দেখায়,
 * না হলে আগের মতোই হেডার এলাকা ও পেজের কন্টেন্ট। children হলো পেজের মূল কন্টেন্ট, যা বিল্ডারে "পেজের মূল কন্টেন্ট" কম্পোনেন্ট হয়ে বসে।
 */
export async function BuiltinPage({ slug, title, sub, children }: { slug: string; title: string; sub?: string; children?: React.ReactNode }) {
  let blocks = null as ReturnType<typeof cleanBlocks> | null;
  try {
    const { data } = await publicClient().from('pages').select('blocks, seo').eq('slug', slug).maybeSingle();
    const seo = (data?.seo ?? {}) as { draft?: boolean };
    if (data && !seo.draft) { const b = cleanBlocks(data.blocks); if (b.length) blocks = b; }
  } catch { /* ডিফল্ট চেহারা */ }
  if (!blocks) {
    const d = defaultBlocks(slug);
    if (d) return <Blocks blocks={d} pageTitle={title} />;
    return <><PageTitle title={title} sub={sub} />{children}</>;
  }
  // আগের সংস্করণে সাজানো পেজে "মূল কন্টেন্ট" থাকলে এখন সেটি সম্পাদনাযোগ্য ডিফল্ট কম্পোনেন্ট দিয়ে বদলে যায়
  const d = defaultBlocks(slug);
  const merged = children || !d ? blocks : blocks.flatMap((b) => (b.type === 'page_body' ? d.filter((x) => x.type !== 'page_header') : [b]));
  return <Blocks blocks={merged} pageTitle={title} body={children} />;
}
