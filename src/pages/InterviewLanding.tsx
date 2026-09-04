import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { startInterview } from "@/lib/conversationEngine";
import type { JobProfile } from "@/lib/types";

export function InterviewLanding() {
  const { interviewLink } = useParams<{ interviewLink: string }>();
  const [profile, setProfile] = useState<JobProfile | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!interviewLink) return;
    (async () => {
      const { data } = await supabase
        .from("job_profiles")
        .select("*")
        .eq("interview_link", interviewLink)
        .single();
      setProfile(data ?? null);
      setLoading(false);
    })();
  }, [interviewLink]);

  async function handleStart() {
    if (!profile) return;
    setStarting(true);
    setError(null);
    try {
      const { interviewId, engine } = await startInterview({
        mode: "live",
        jobProfileId: profile.job_profile_id,
        candidateName: candidateName || undefined,
      });
      // Pass the opening question along directly — the interview session
      // screen can't fetch it itself (candidates can't read the transcript
      // table directly, by design), so it has to be handed off here.
      navigate(`/interview-session/${interviewId}`, {
        state: { question: engine.next_question, turnNo: engine.turn_no ?? 1 },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the interview.");
      setStarting(false);
    }
  }

  if (loading) return <p className="mx-auto max-w-xl px-6 py-16 text-ink-faint">Loading…</p>;
  if (!profile)
    return (
      <p className="mx-auto max-w-xl px-6 py-16 text-ink-faint">
        This interview link isn't valid or has expired.
      </p>
    );

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <p className="eyebrow">Live interview</p>
      <h1 className="mt-1 text-3xl font-semibold">{profile.title}</h1>
      <p className="mt-2 text-sm text-ink-soft">{profile.criteria}</p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="card mt-8 p-6"
      >
        <h2 className="text-lg font-semibold">Before you begin</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
          <li>This interview is conducted and scored by an AI system, not a live recruiter.</li>
          <li>Your responses and transcript will be shared with the hiring team for this role.</li>
          <li>You can answer by voice or by typing at every step.</li>
        </ul>

        <div className="mt-5">
          <label className="field-label">Your name</label>
          <input
            className="field-input"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            placeholder="First and last name"
          />
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
          />
          I understand this interview is AI-conducted and consent to my responses being recorded
          and shared with the hiring team.
        </label>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={handleStart}
          disabled={!consented || !candidateName || starting}
          className="btn-accent mt-6 w-full"
        >
          {starting ? "Starting…" : "Begin interview"}
        </button>
      </motion.div>
    </div>
  );
}
