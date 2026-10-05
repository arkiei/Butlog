export function Logo({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true"><rect width="24" height="24" rx="7" fill="#D9480F" />
    <path d="M12 3.5 C8 3.5 5.2 10 5.2 14.2 C5.2 18.2 8.2 21 12 21 C15.8 21 18.8 18.2 18.8 14.2 C18.8 10 16 3.5 12 3.5 Z" fill="#FFF8EC" />
    <ellipse cx="12" cy="14.6" rx="3.4" ry="3.9" fill="#FFB703" /><circle cx="10.8" cy="13.1" r="0.9" fill="#FFE8A3" /></svg>;
}
