import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface DemoTurn {
  turn: string;
  question: string;
  answer: string;
  verdict: "deeper" | "clarify";
  score: { label: string; value: number };
}

const TURNS: DemoTurn[] = [
  {
    turn: "01",
    question: "Tell me about a time you had to fix a mistake under a deadline.",
    answer:
      "I found a ledger mismatch two hours before close, traced it to a duplicated entry, and flagged it before submitting the reconciled report.",
    verdict: "deeper",
    score: { label: "Role alignment", value: 88 },
  },
  {
    turn: "02",
    question: "What exactly made you suspect a duplicate rather than a calculation error?",
    answer:
      "The totals matched by exactly one line item's value, which usually means a repeated row rather than a formula issue.",
    verdict: "deeper",
    score: { label: "Competency", value: 91 },
  },
  {
    turn: "03",
    question: "How did you communicate the issue to your supervisor?",
    answer:
      "I sent a short note with the discrepancy, the row I removed, and the corrected total before the deadline.",
    verdict: "clarify",
    score: { label: "Soft skills", value: 79 },
  },
];

const CYCLE_MS = 4800;

export function LiveDemo() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"question" | "answer" | "score">("question");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("answer"), 900);
    const t2 = setTimeout(() => setPhase("score"), 2400);
    const t3 = setTimeout(() => {
      setIndex((i) => (i + 1) % TURNS.length);
      setPhase("question");
    }, CYCLE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [index]);

  const current = TURNS[index];

  return (
    <div className="relative w-full max-w-md">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] bg-moss/20 blur-3xl" />

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-widest text-white/40">
            Live adaptive interview
          </span>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
            </span>
            <span className="font-mono text-[11px] text-white/40">turn {current.turn}</span>
          </div>
        </div>

        <div className="mt-4 min-h-[210px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.turn}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-[15px] font-medium leading-snug text-white">
                {current.question}
              </p>

              <AnimatePresence>
                {(phase === "answer" || phase === "score") && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.4 }}
                    className="mt-3 border-l-2 border-amber/60 pl-3 text-sm italic text-white/70"
                  >
                    "{current.answer}"
                  </motion.p>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {phase === "score" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5"
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                        current.verdict === "deeper"
                          ? "bg-moss/30 text-moss-light"
                          : "bg-amber/20 text-amber"
                      }`}
                    >
                      {current.verdict === "deeper" ? "Probing deeper" : "Asking to clarify"}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-white/50">{current.score.label}</span>
                      <ScoreDial value={current.score.value} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex gap-1.5">
          {TURNS.map((t, i) => (
            <div key={t.turn} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              {i === index && (
                <motion.div
                  key={index + "-" + phase}
                  className="h-full rounded-full bg-amber"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: CYCLE_MS / 1000, ease: "linear" }}
                />
              )}
              {i < index && <div className="h-full w-full rounded-full bg-white/25" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreDial({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(value * progress));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className="font-mono text-sm font-semibold text-white">{display}</span>;
}
