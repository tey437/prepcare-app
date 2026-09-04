import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

function generateSlug() {
  return `${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

export function JobProfileNew() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [criteria, setCriteria] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setLoading(true);

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("org_id")
      .eq("auth_user_id", user.id)
      .single();

    if (orgError || !org) {
      setError("Couldn't find your organization.");
      setLoading(false);
      return;
    }

    const { data: profile, error: insertError } = await supabase
      .from("job_profiles")
      .insert({
        org_id: org.org_id,
        title,
        criteria,
        interview_link: generateSlug(),
      })
      .select()
      .single();

    setLoading(false);
    if (insertError || !profile) {
      setError(insertError?.message ?? "Could not create job profile.");
      return;
    }
    navigate(`/job-profiles/${profile.job_profile_id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="eyebrow">New job profile</p>
      <h1 className="mt-1 text-3xl font-semibold">What role are you screening for?</h1>
      <p className="mt-2 text-sm text-ink-soft">
        PrepCare uses this title and criteria to shape the adaptive interview questions and
        the role-alignment score.
      </p>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="card mt-8 space-y-5 p-6"
      >
        <div>
          <label className="field-label">Role title</label>
          <input
            className="field-input"
            required
            placeholder="e.g. Junior Accountant"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Criteria &amp; competencies to test</label>
          <textarea
            className="field-input min-h-[140px]"
            required
            placeholder="e.g. Basic reconciliation, attention to detail under deadline pressure, comfort with spreadsheets, clear written communication…"
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating…" : "Create job profile & generate link"}
        </button>
      </motion.form>
    </div>
  );
}
