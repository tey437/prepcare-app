import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    navigate("/dashboard");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-16">
      <p className="eyebrow">Client login</p>
      <h1 className="mt-2 text-3xl font-semibold">Welcome back</h1>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="card mt-8 space-y-4 p-6"
      >
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
            className="field-input"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Logging in…" : "Log in"}
        </button>
      </motion.form>

      <p className="mt-4 text-center text-sm text-ink-soft">
        Need an account?{" "}
        <Link to="/register" className="font-medium text-moss-dark hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
