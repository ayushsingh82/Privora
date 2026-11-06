export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#f59e0b" />
      {/* a "P" whose bowl is a closed circle: private, sealed */}
      <path d="M11 24V8h6.2a5 5 0 0 1 0 10H11" stroke="#1a1100" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="21.5" cy="22.5" r="2" fill="#1a1100" />
    </svg>
  );
}
