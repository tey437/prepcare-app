import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { CitationCard } from "@/components/CitationCard";
import { ScoreBar } from "@/components/ScoreBar";
import type { Interview, Score, TranscriptEntry } from "@/lib/types";

export function InterviewTranscript() {
  const { id } = useParams<{ id: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: interviewRow } = await supabase
        .from("interviews")
        .select("*")
        .eq("interview_id", id)
        .single();
      setInterview(interviewRow ?? null);

      const { data: transcriptRows } = await supabase
        .from("transcript_entries")
        .select("*")
        .eq("interview_id", id)
        .order("turn_no", { ascending: true });
      setEntries(transcriptRows ?? []);

      const { data: scoreRow } = await supabase
        .from("scores")
        .select("*")
        .eq("interview_id", id)
        .maybeSingle();
      setScore(scoreRow ?? null);

      setLoading(false);
    })();
  }, [id]);

  if (loading)
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-6 py-12">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-24 w-full" />
      </div>
    );
  if (!interview) return <p className="mx-auto max-w-4xl px-6 py-12 text-ink-faint">Interview not found.</p>;

  const citedEntry = entries.find((e) => e.entry_id === score?.cited_entry_id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="eyebrow">Transcript</p>
      <h1 className="mt-1 text-3xl font-semibold">{interview.candidate_name || "Anonymous candidate"}</h1>

      {score && (
        <div className="card mt-6 grid gap-5 p-6 sm:grid-cols-3">
          <ScoreBar label="Competency" value={score.competency} />
          <ScoreBar label="Soft skills" value={score.soft_skills} delay={0.1} />
          <ScoreBar label="Role alignment" value={score.role_alignment} delay={0.2} />
          <div className="sm:col-span-3">
            <p className="mb-2 text-sm font-medium text-ink-soft">Primary evidence for this score</p>
            <CitationCard entry={citedEntry} />
          </div>
        </div>
      )}

      <h2 className="mt-10 text-xl font-semibold">Full conversation</h2>
      <div className="mt-4 space-y-4">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.entry_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.04 }}
            className="card p-5"
          >
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              Turn {entry.turn_no.toString().padStart(2, "0")}
            </span>
            <p className="mt-1 font-medium text-ink">{entry.question}</p>
            {entry.answer && <p className="mt-2 text-ink-soft">{entry.answer}</p>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
