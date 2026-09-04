import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { startInterview } from "@/lib/conversationEngine";

const SUGGESTED_ROLES = [
  "Junior Accountant",
  "Customer Service Agent",
  "IT Support Technician",
  "Bank Teller",
  "Sales Associate",
  "Software Developer",
];

export function Practice() {
  const [role, setRole] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleStart(chosenRole: string) {
    if (!chosenRole.trim()) return;
    setStarting(true);
    setError(null);
    try {
      const { interviewId, engine } = await startInterview({ mode: "practice", practiceRole: chosenRole });
      // Pass the opening question along directly — the interview session
      // screen can't fetch it itself (candidates can't read the transcript
      // table directly, by design), so it has to be handed off here.
      navigate(`/interview-session/${interviewId}`, {
        state: { question: engine.next_question, turnNo: engine.turn_no ?? 1 },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the practice session.");
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="eyebrow">Practice Mode</p>
        <h1 className="mt-1 text-3xl font-semibold">Rehearse with nothing on the line</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Pick a target role. This session is private — no recruiter will ever see it.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card mt-8 p-6"
      >
        <label className="field-label">Target role or industry</label>
        <input
          className="field-input"
          placeholder="e.g. Junior Accountant"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_ROLES.map((r, i) => (
            <motion.button
              key={r}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.04 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRole(r)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                role === r
                  ? "border-moss bg-moss-light text-moss-dark"
                  : "border-line text-ink-soft hover:border-moss hover:text-moss-dark"
              }`}
            >
              {r}
            </motion.button>
          ))}
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          onClick={() => handleStart(role)}
          disabled={!role.trim() || starting}
          className="btn-accent mt-6 w-full"
        >
          {starting ? "Starting…" : "Start practice interview"}
        </button>
      </motion.div>
    </div>
  );
}
