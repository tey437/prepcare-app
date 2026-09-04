export function ListeningPulse() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-signal" />
      <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-signal [animation-delay:0.6s]" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-signal" />
    </span>
  );
}
