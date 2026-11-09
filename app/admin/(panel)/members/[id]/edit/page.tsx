import type { Metadata } from 'next';
import { decRow } from '@/lib/crypto';
import { notFound } from 'next/navigation';
import { ActionForm, Submit } from '../../../../_components/ActionForm';
import { MemberFields } from '../../MemberFields';
import { updateMember } from '../../../../actions/members';
import { MONEY, requirePage } from '@/lib/guard';
import { PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'সদস্য সম্পাদনা' };

export default async function EditMember({ params }: { params: { id: string } }) {
  const { supabase } = await requirePage(MONEY);
  const { data: m0 } = await supabase.from('members').select('*').eq('id', params.id).single();
  if (!m0) notFound();
  const m = decRow(m0);
  return (
    <>
      <PageHead title="সদস্য সম্পাদনা" sub={`${m.member_no}, ${m.name}`} />
      <ActionForm action={updateMember.bind(null, m.id)} className="card" style={{ maxWidth: 820 }}>
        <MemberFields m={m} />
        <Submit>পরিবর্তন সংরক্ষণ করুন (Save changes)</Submit>
      </ActionForm>
    </>
  );
}
