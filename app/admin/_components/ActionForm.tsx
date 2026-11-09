'use client';
import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { ActionState } from '@/lib/guard';

type Props = {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  resetOnSuccess?: boolean;
  confirm?: string;
};

/** সার্ভার অ্যাকশনের ফলাফল (সফল/ভুল) বার্তাসহ দেখানোর সাধারণ ফর্ম */
export function ActionForm({ action, children, className, style, resetOnSuccess, confirm }: Props) {
  const [state, formAction] = useFormState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      style={style}
      onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}
    >
      {state.error && <div className="notice" role="alert">{state.error}</div>}
      {state.ok && <div className="notice ok" role="status">{state.ok}</div>}
      {children}
    </form>
  );
}

export function Submit({ children, className = 'btn pri', pendingText = 'সংরক্ষণ হচ্ছে...' }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending}>{pending ? pendingText : children}</button>;
}

/** ছোট বাটন-ফর্ম (ফ্রিজ, মুছুন ইত্যাদি), চাইলে নিশ্চিতকরণ জিজ্ঞাসা করে */
export function ConfirmButton({ action, label, confirm, className = 'btn', title }: { action: (fd: FormData) => Promise<void>; label: React.ReactNode; confirm?: string; className?: string; title?: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }} style={{ display: 'inline' }}>
      <ButtonInner className={className} title={title}>{label}</ButtonInner>
    </form>
  );
}
function ButtonInner({ children, className, title }: { children: React.ReactNode; className: string; title?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} disabled={pending} title={title} aria-label={title}>{pending ? '...' : children}</button>;
}
