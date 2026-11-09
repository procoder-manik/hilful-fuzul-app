import { Sidebar } from '../_components/Sidebar';
import { requirePage, ROLE_BN, STAFF } from '@/lib/guard';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requirePage(STAFF);
  const [{ count }, { count: unread }, { count: unknown }] = await Promise.all([
    supabase.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
    supabase.from('chat_logs').select('id', { count: 'exact', head: true }).eq('unanswered', true),
  ]);
  return (
    <div className="wrap admin">
      <aside>
        <div className="side-user"><b>{profile.full_name || user.email}</b><span className="muted small">{ROLE_BN[profile.role]}</span></div>
        <Sidebar role={profile.role} pending={count ?? 0} unread={unread ?? 0} unanswered={unknown ?? 0} />
      </aside>
      <div style={{ minWidth: 0 }}>{children}</div>
    </div>
  );
}
