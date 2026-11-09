import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const ext = (type: string) => (type.split('/')[1] || 'bin').replace('jpeg', 'jpg').replace('svg+xml', 'svg');

/** media বাকেটে ছবি আপলোড করে পাবলিক লিংক ফেরত দেয় (ফাইল না থাকলে null) */
export async function uploadMedia(supabase: SupabaseClient, file: FormDataEntryValue | null, folder: string): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 3 * 1024 * 1024) throw new Error('ছবির আকার ৩ MB এর কম হতে হবে');
  if (!ALLOWED.includes(file.type)) throw new Error('শুধু JPG, PNG বা WebP ছবি আপলোড করা যাবে');
  const path = `${folder}/${crypto.randomUUID()}.${ext(file.type)}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
}

/** স্বাক্ষরের ছবি (data URL) গোপন documents বাকেটে রাখে, path ফেরত দেয় */
export async function uploadSignature(supabase: SupabaseClient, dataUrl: string, folder: string): Promise<string | null> {
  if (!dataUrl.startsWith('data:image/png;base64,')) return null;
  const bytes = Buffer.from(dataUrl.split(',')[1], 'base64');
  if (bytes.length > 500_000) throw new Error('স্বাক্ষরের ছবি অনেক বড়');
  const path = `${folder}/${crypto.randomUUID()}.png`;
  const { error } = await supabase.storage.from('documents').upload(path, bytes, { contentType: 'image/png' });
  if (error) throw error;
  return path;
}

/** প্রিন্টের সময় গোপন স্বাক্ষর দেখানোর জন্য ১০ মিনিটের লিংক */
export async function signedUrl(supabase: SupabaseClient, path: string | null | undefined) {
  if (!path) return null;
  const { data } = await supabase.storage.from('documents').createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}
