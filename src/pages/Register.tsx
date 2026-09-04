import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export function Register() {
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // The organization row is now created automatically by a database
    // trigger (see supabase/migrations/0002_auto_create_org.sql), reading
    // org_name/sector out of this signup's user metadata. That means this
    // signup no longer needs to do its own insert, or worry about whether
    // a session is fully ready yet — it can't get "stuck" the way it used to.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { org_name: name, sector: sector || null },
      },
    });

    setLoading(false);

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Could not create your account.");
      return;
    }

    if (!data.session) {
      // Email confirmation is still required on this Supabase project.
      setError(
        "Your account was created! If you're not redirected automatically, this Supabase project still requires email confirmation — go to Authentication → Sign In / Providers → Email in your Supabase dashboard and turn off 'Send a confirmation email', then log in normally."
      );
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-16">
      <p className="eyebrow">Client account</p>
      <h1 className="mt-2 text-3xl font-semibold">Create your PrepCare account</h1>
      <p className="mt-2 text-sm text-ink-soft">
        For recruiters and HR teams. Candidates never need an account.
      </p>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="card mt-8 space-y-4 p-6"
      >
        <div>
          <label className="field-label">Organization name</label>
          <input className="field-input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="field-label">Sector (optional)</label>
          <input
            className="field-input"
            placeholder="e.g. Banking"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Work email</label>
          <input
            type="email"
            className="field-input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Password</label>
          <input
            type="password"
            minLength={8}
            className="field-input"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </motion.form>

      <p className="mt-4 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-moss-dark hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
