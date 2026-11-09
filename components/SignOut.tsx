import { getT } from '@/lib/lang';

export function SignOut() {
  const t = getT();
  return (
    <form action="/auth/signout" method="post">
      <button className="btn ghost">{t('বের হোন', 'Log out')}</button>
    </form>
  );
}
