export function Orb({ className = "" }: { className?: string }) {
  return <div className={`orb ${className}`.trim()} aria-hidden="true" />;
}
