import type { Metadata } from 'next';
import { ActionForm, Submit } from '../../../_components/ActionForm';
import { MemberFields } from '../MemberFields';
import { createMember } from '../../../actions/members';
import { MONEY, requirePage } from '@/lib/guard';
import { PageHead } from '@/lib/ui';

export const metadata: Metadata = { title: 'নতুন সদস্য' };

export default async function NewMember() {
  await requirePage(MONEY);
  return (
    <>
      <PageHead title="নতুন সদস্য" sub="অফিসে সরাসরি আসা সদস্যদের জন্য। অনলাইন আবেদন অনুমোদন করতে আবেদন পেজে যান।" />
      <ActionForm action={createMember} className="card" style={{ maxWidth: 820 }}>
        <MemberFields isNew />
        <Submit>সদস্য তৈরি করুন (Create member)</Submit>
      </ActionForm>
    </>
  );
}
