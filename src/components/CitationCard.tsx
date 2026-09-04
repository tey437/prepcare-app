import type { TranscriptEntry } from "@/lib/types";

interface CitationCardProps {
  entry: TranscriptEntry | undefined;
}

/**
 * The signature element of PrepCare's UI: every score is grounded in a quotable
 * moment from the transcript, tagged like a citation rather than presented as a
 * bare number. This is what makes a client's ranking auditable.
 */
export function CitationCard({ entry }: CitationCardProps) {
  if (!entry) {
    return (
      <p className="rounded-lg border border-dashed border-line px-3 py-2 font-mono text-xs text-ink-faint">
        No citation available for this score.
      </p>
    );
  }
  return (
    <div className="rounded-lg border-l-2 border-moss bg-moss-light/60 px-4 py-3">
      <span className="font-mono text-[11px] uppercase tracking-wider text-moss-dark">
        Turn {entry.turn_no.toString().padStart(2, "0")}
      </span>
      <p className="mt-1 text-sm text-ink-soft">
        <span className="font-medium text-ink">Q:</span> {entry.question}
      </p>
      {entry.answer && (
        <p className="mt-1 text-sm italic text-ink-soft">“{entry.answer}”</p>
      )}
    </div>
  );
}
