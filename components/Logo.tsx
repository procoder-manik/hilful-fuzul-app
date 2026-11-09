export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2.5l2.6 2.6h3.7v3.7L21 11.4l-2.7 2.7v3.7h-3.7L12 20.5l-2.6-2.7H5.7v-3.7L3 11.4l2.7-2.6V5.1h3.7z" />
      <path d="M8.5 14V9.5c1.3 0 2.5.4 3.5 1.2 1-.8 2.2-1.2 3.5-1.2V14c-1.3 0-2.5.4-3.5 1.2-1-.8-2.2-1.2-3.5-1.2z" />
    </svg>
  );
}
