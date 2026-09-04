import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { LiveDemo } from "@/components/LiveDemo";

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: EASE_OUT },
  }),
};

export function Home() {
  const [link, setLink] = useState("");
  const navigate = useNavigate();

  function handleOpenLink(e: React.FormEvent) {
    e.preventDefault();
    const slug = link.trim().split("/").filter(Boolean).pop();
    if (slug) navigate(`/interview/${slug}`);
  }

  return (
    <div>
      {/* ---------------- HERO (dark) ---------------- */}
      <section className="relative overflow-hidden bg-ink bg-grain">
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-moss/25 blur-[100px] animate-float-slow" />
        <div className="pointer-events-none absolute -right-24 top-40 h-72 w-72 rounded-full bg-amber/15 blur-[100px] animate-float-slow [animation-delay:2s]" />

        <div className="relative mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:grid-cols-2 sm:items-center sm:py-28">
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
            <motion.p variants={fadeUp} custom={0} className="eyebrow-onDark">
              Conversational AI interviews
            </motion.p>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="mt-3 text-balance text-4xl font-semibold leading-[1.08] text-white sm:text-5xl"
            >
              An interview that adapts to{" "}
              <span className="font-display italic text-amber">what you actually said.</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mt-5 max-w-md text-white/65">
              PrepCare interviews candidates the way a good recruiter does — a deeper follow-up
              when an answer is strong, a clarifying question when it isn't. Every score a
              recruiter sees traces back to the exact line of the transcript that produced it.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-wrap gap-3">
              <a href="#candidate" className="btn-accent">
                I'm a candidate
              </a>
              <a href="/register" className="btn-secondary !border-white/20 !bg-transparent !text-white hover:!border-white">
                I'm hiring
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center sm:justify-end"
          >
            <LiveDemo />
          </motion.div>
        </div>
      </section>

      {/* ---------------- HOW IT WORKS (light) ---------------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="eyebrow"
        >
          How it interviews
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.05 }}
          className="mt-2 max-w-xl text-3xl font-semibold"
        >
          Three things a script-based interview can't do.
        </motion.h2>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            {
              title: "It adapts",
              body: "A strong answer earns a deeper follow-up. A thin one earns a fair chance to clarify — never an instant low mark.",
            },
            {
              title: "It cites",
              body: "Every competency, soft-skill, and role-alignment score links to the exact transcript line that justifies it.",
            },
            {
              title: "It coaches",
              body: "Candidates can rehearse in Practice Mode and get private feedback on pace, filler words, and STAR structure.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="card-interactive p-6"
            >
              <span className="font-mono text-xs text-moss">0{i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------------- PROOF BAND (dark) ---------------- */}
      <section className="relative overflow-hidden bg-ink py-20">
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-amber/10 blur-[110px]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="eyebrow-onDark"
          >
            No black-box scores
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-3 text-3xl font-semibold text-white sm:text-4xl"
          >
            "Role alignment: 86" means nothing on its own.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-white/60"
          >
            So PrepCare never shows one without the line of the transcript that earned it —
            a recruiter is one click from the evidence, always.
          </motion.p>
        </div>
      </section>

      {/* ---------------- CTA CARDS (light) ---------------- */}
      <section id="candidate" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold">Have an interview link?</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Paste the link a recruiter shared with you to begin your interview.
            </p>
            <form onSubmit={handleOpenLink} className="mt-4 flex gap-2">
              <input
                className="field-input"
                placeholder="Paste your interview link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
              <button type="submit" className="btn-primary shrink-0">
                Open
              </button>
            </form>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card p-6"
          >
            <h2 className="text-xl font-semibold">Just want to practice?</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Rehearse against a target industry or role with nothing on the line. You'll get a
              private scorecard on pace, filler words, and STAR structure.
            </p>
            <a href="/practice" className="btn-accent mt-4">
              Enter Practice Mode
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
