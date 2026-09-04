import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { ScoreBar } from "@/components/ScoreBar";
import type { Interview, Score } from "@/lib/types";

export function Scorecard() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!interviewId) return;
    (async () => {
      setLoading(true);
      const { data: interviewRow } = await supabase
        .from("interviews")
        .select("*")
        .eq("interview_id", interviewId)
        .single();
      setInterview(interviewRow ?? null);

      const { data: scoreRow } = await supabase
        .from("scores")
        .select("*")
        .eq("interview_id", interviewId)
        .maybeSingle();
      setScore(scoreRow ?? null);
      setLoading(false);
    })();
  }, [interviewId]);

  if (loading)
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="flex items-center gap-3 text-ink-faint">
          <span className="h-2 w-2 animate-ping rounded-full bg-moss" />
          Scoring your interview…
        </div>
      </div>
    );
  if (!interview || !score)
    return (
      <p className="mx-auto max-w-2xl px-6 py-16 text-ink-faint">
        This scorecard isn't ready yet. If you just finished, give it a moment and refresh.
      </p>
    );

  const isPractice = interview.mode === "practice";

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="eyebrow">{isPractice ? "Private practice scorecard" : "Interview complete"}</p>
        <h1 className="mt-1 text-3xl font-semibold">
          {isPractice ? "Here's how you did" : "Thanks — your interview has been submitted"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {isPractice
            ? "This is visible only to you. No recruiter can see this session."
            : "The hiring team will review your responses alongside other candidates."}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="card mt-8 space-y-5 p-6"
      >
        {isPractice ? (
          <>
            <ScoreBar label="Speaking pace" value={score.wpm} suffix=" wpm" delay={0.1} />
            <ScoreBar label="STAR structure adherence" value={score.star_adherence} delay={0.25} />
            <div>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm font-medium text-ink-soft">Filler-word rate</span>
                <span className="font-mono text-sm text-ink">
                  {score.filler_rate != null ? `${score.filler_rate.toFixed(1)}%` : "—"}
                </span>
              </div>
              <p className="text-xs text-ink-faint">Share of words that were "um", "like", "you know", etc.</p>
            </div>
          </>
        ) : (
          <>
            <ScoreBar label="Competency" value={score.competency} delay={0.1} />
            <ScoreBar label="Soft skills" value={score.soft_skills} delay={0.25} />
            <ScoreBar label="Role alignment" value={score.role_alignment} delay={0.4} />
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex gap-3"
      >
        <Link to="/" className="btn-secondary">
          Back to home
        </Link>
        {isPractice && (
          <Link to="/practice" className="btn-accent">
            Practice again
          </Link>
        )}
      </motion.div>
    </div>
  );
}
