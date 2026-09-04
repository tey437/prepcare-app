import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import type { Interview, JobProfile, Score } from "@/lib/types";

interface RankedCandidate extends Interview {
  score: Score | null;
  aggregate: number;
}

export function JobProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [candidates, setCandidates] = useState<RankedCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: jobProfile } = await supabase
        .from("job_profiles")
        .select("*")
        .eq("job_profile_id", id)
        .single();
      setProfile(jobProfile ?? null);

      const { data: interviews } = await supabase
        .from("interviews")
        .select("*")
        .eq("job_profile_id", id)
        .eq("status", "completed")
        .eq("mode", "live");

      const interviewIds = (interviews ?? []).map((i) => i.interview_id);
      let scores: Score[] = [];
      if (interviewIds.length > 0) {
        const { data: scoreRows } = await supabase
          .from("scores")
          .select("*")
          .in("interview_id", interviewIds);
        scores = scoreRows ?? [];
      }

      const ranked: RankedCandidate[] = (interviews ?? []).map((interview) => {
        const score = scores.find((s) => s.interview_id === interview.interview_id) ?? null;
        const aggregate = score
          ? Math.round(
              ((score.competency ?? 0) + (score.soft_skills ?? 0) + (score.role_alignment ?? 0)) / 3
            )
          : 0;
        return { ...interview, score, aggregate };
      });
      ranked.sort((a, b) => b.aggregate - a.aggregate);

      setCandidates(ranked);
      setLoading(false);
    })();
  }, [id]);

  const interviewUrl = profile ? `${window.location.origin}/interview/${profile.interview_link}` : "";

  function copyLink() {
    navigator.clipboard.writeText(interviewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading)
    return (
      <div className="mx-auto max-w-6xl space-y-4 px-6 py-12">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-48 w-full" />
      </div>
    );
  if (!profile) return <p className="mx-auto max-w-6xl px-6 py-12 text-ink-faint">Job profile not found.</p>;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="eyebrow">Job profile</p>
      <h1 className="mt-1 text-3xl font-semibold">{profile.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">{profile.criteria}</p>

      <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-faint">Shareable interview link</p>
          <p className="truncate font-mono text-sm text-ink">{interviewUrl}</p>
        </div>
        <button onClick={copyLink} className="btn-secondary relative shrink-0 overflow-hidden">
          <motion.span
            key={copied ? "copied" : "copy"}
            initial={{ y: copied ? 12 : -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {copied ? "Copied!" : "Copy link"}
          </motion.span>
        </button>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Candidate ranking</h2>
      {candidates.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">
          No completed interviews yet. Share the link above to start collecting candidates.
        </p>
      ) : (
        <div className="card mt-4 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper text-left text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Competency</th>
                <th className="px-4 py-3">Soft skills</th>
                <th className="px-4 py-3">Role alignment</th>
                <th className="px-4 py-3">Aggregate</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => (
                <motion.tr
                  key={c.interview_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="border-b border-line last:border-0 hover:bg-paper/60"
                >
                  <td className="px-4 py-3 font-medium">{c.candidate_name || "Anonymous"}</td>
                  <td className="px-4 py-3 font-mono">{c.score?.competency ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">{c.score?.soft_skills ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">{c.score?.role_alignment ?? "—"}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-moss-dark">{c.aggregate}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/interviews/${c.interview_id}/transcript`}
                      className="link-underline font-medium text-moss-dark"
                    >
                      View transcript →
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
