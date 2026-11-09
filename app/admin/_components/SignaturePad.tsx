'use client';
import { useEffect, useRef, useState } from 'react';

/** আঙুল বা মাউস দিয়ে স্বাক্ষর; ফর্মে hidden input হিসেবে PNG data URL পাঠায় */
export function SignaturePad({ name = 'signature', label = 'স্বাক্ষর' }: { name?: string; label?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState('');
  useEffect(() => {
    const c = canvas.current!;
    const r = c.getBoundingClientRect();
    c.width = r.width * 2; c.height = r.height * 2;
    const x = c.getContext('2d')!;
    x.scale(2, 2); x.lineWidth = 2.2; x.lineCap = 'round'; x.strokeStyle = '#111';
    let drawing = false;
    const pos = (e: PointerEvent) => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top] as const; };
    const down = (e: PointerEvent) => { drawing = true; c.setPointerCapture(e.pointerId); x.beginPath(); x.moveTo(...pos(e)); };
    const move = (e: PointerEvent) => { if (!drawing) return; x.lineTo(...pos(e)); x.stroke(); };
    const up = () => { if (drawing) setValue(c.toDataURL('image/png')); drawing = false; };
    c.addEventListener('pointerdown', down); c.addEventListener('pointermove', move); c.addEventListener('pointerup', up);
    return () => { c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up); };
  }, []);
  const clear = () => { const c = canvas.current!; c.getContext('2d')!.clearRect(0, 0, c.width, c.height); setValue(''); };
  return (
    <div className="f">
      <span className="lbl">{label}</span>
      <canvas ref={canvas} className="sig" aria-label={label} />
      <input type="hidden" name={name} value={value} />
      <button type="button" className="btn sm" onClick={clear} style={{ marginTop: 6 }}>মুছুন</button>
    </div>
  );
}
