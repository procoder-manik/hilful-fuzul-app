import type { Metadata } from 'next';
import { ConfirmButton } from '../../_components/ActionForm';
import { deleteMessage, markMessage } from '../../actions/content';
import { requirePage } from '@/lib/guard';
import { bn, fd } from '@/lib/format';
import { PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'বার্তা' };

export default async function Messages() {
  const { supabase } = await requirePage(['admin', 'editor', 'treasurer']);
  const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200);
  const rows = data ?? [];
  return (
    <>
      <PageHead title="যোগাযোগ বার্তা" sub={`${bn(rows.filter((m) => !m.is_read).length)}টি নতুন বার্তা`} />
      {rows.length === 0 && <div className="card muted">ওয়েবসাইটের যোগাযোগ ফর্ম থেকে এখনো কোনো বার্তা আসেনি।</div>}
      <div className="grid" style={{ gap: 12 }}>
        {rows.map((m) => (
          <div key={m.id} className={`card ${m.is_read ? '' : 'unread'}`}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div><b>{m.name}</b> {m.phone && <a className="muted small" href={`tel:${m.phone}`}>{bn(m.phone)}</a>} <span className="badge b-info">{m.subject}</span></div>
              <span className="muted small">{fd(m.created_at)}</span>
            </div>
            <p style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>{m.message}</p>
            <div className="acts" style={{ justifyContent: 'flex-start' }}>
              <ConfirmButton action={markMessage.bind(null, m.id, !m.is_read)} className="btn sm" label={m.is_read ? 'অপঠিত করুন' : 'পড়া হয়েছে'} />
              <ConfirmButton action={deleteMessage.bind(null, m.id)} className="btn sm danger" label="মুছুন" confirm="বার্তাটি মুছবেন?" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
