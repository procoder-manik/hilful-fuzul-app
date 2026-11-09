import { PrintBar } from '../../../_components/PrintButton';
import { MemberFormDoc } from '../../MemberFormDoc';
import { getSettings } from '@/lib/settings';

export default async function BlankForm() {
  const s = await getSettings();
  return (<><PrintBar back="/admin/members" /><div className="doc"><MemberFormDoc s={s} /></div></>);
}
