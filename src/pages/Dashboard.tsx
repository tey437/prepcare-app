import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import type { JobProfile } from "@/lib/types";

interface JobProfileWithCounts extends JobProfile {
  interview_count?: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [orgName, setOrgName] = useState<string>("");
  const [profiles, setProfiles] = useState<JobProfileWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("org_id, name")
        .eq("auth_user_id", user.id)
        .single();

      if (orgError || !org) {
        setError("Couldn't load your organization. Try refreshing.");
        setLoading(false);
        return;
      }
      setOrgName(org.name);

      const { data: jobProfiles, error: profilesError } = await supabase
        .from("job_profiles")
        .select("*")
        .eq("org_id", org.org_id)
        .order("created_at", { ascending: false });

      if (profilesError) {
        setError(profilesError.message);
      } else {
        setProfiles(jobProfiles ?? []);
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{orgName || "Dashboard"}</p>
          <h1 className="mt-1 text-3xl font-semibold">Job profiles</h1>
        </div>
        <Link to="/job-profiles/new" className="btn-primary">
          + New job profile
        </Link>
      </div>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card space-y-3 p-5">
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mt-10 p-10 text-center"
        >
          <p className="text-ink-soft">No job profiles yet.</p>
          <Link to="/job-profiles/new" className="btn-accent mt-4 inline-flex">
            Create your first job profile
          </Link>
        </motion.div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p, i) => (
            <motion.div
              key={p.job_profile_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to={`/job-profiles/${p.job_profile_id}`} className="card-interactive block p-5">
                <h2 className="font-display text-lg font-semibold">{p.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{p.criteria}</p>
                <p className="mt-4 font-mono text-xs text-ink-faint">
                  Created {new Date(p.created_at).toLocaleDateString()}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
