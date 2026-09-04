import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { submitAnswer } from "@/lib/conversationEngine";
import { ListeningPulse } from "@/components/ListeningPulse";
import type { TranscriptEntry } from "@/lib/types";

interface SpeechRecognitionResult {
  transcript: string;
}
interface SpeechRecognitionEvent extends Event {
  results: { [index: number]: { [index: number]: SpeechRecognitionResult } };
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

function getSpeechRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

const MAX_TURNS = 8;

export function InterviewSession() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<string>("Loading your first question…");
  const [turnNo, setTurnNo] = useState(1);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechSupported = typeof window !== "undefined" && "webkitSpeechRecognition" in window;

  useEffect(() => {
    if (!interviewId) return;
    (async () => {
      const { data } = await supabase
        .from("transcript_entries")
        .select("*")
        .eq("interview_id", interviewId)
        .order("turn_no", { ascending: true })
        .limit(1);
      const first = (data as TranscriptEntry[] | null)?.[0];
      if (first) {
        setQuestion(first.question);
        setTurnNo(first.turn_no);
      }
    })();
  }, [interviewId]);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = getSpeechRecognition();
    if (!recognition) return;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!interviewId || !answer.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitAnswer({ interviewId, answer: answer.trim() });
      setAnswer("");
      if (result.done) {
        navigate(`/scorecard/${interviewId}`);
        return;
      }
      if (result.next_question) {
        setQuestion(result.next_question);
        speak(result.next_question);
      }
      if (result.turn_no) setTurnNo(result.turn_no);
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : "Something went wrong submitting your answer.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-moss to-moss-dark"
            animate={{ width: `${Math.min(100, (turnNo / MAX_TURNS) * 100)}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <span className="font-mono text-xs text-ink-faint">Turn {turnNo}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={question}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="card p-8"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-xl font-medium leading-snug text-ink">{question}</p>
            <button
              type="button"
              onClick={() => speak(question)}
              title="Play question aloud"
              className="shrink-0 rounded-full border border-line p-2 text-ink-soft transition-colors hover:border-moss hover:text-moss"
            >
              🔊
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <textarea
              className="field-input min-h-[120px]"
              placeholder="Type your answer, or use the microphone below…"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <div className="mt-3 flex items-center gap-3">
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`btn-secondary ${listening ? "!border-signal !text-signal" : ""}`}
                >
                  {listening ? (
                    <>
                      <ListeningPulse /> Listening…
                    </>
                  ) : (
                    "🎤 Speak answer"
                  )}
                </button>
              )}
              <button type="submit" disabled={submitting || !answer.trim()} className="btn-primary ml-auto">
                {submitting ? "Sending…" : "Submit answer"}
              </button>
            </div>
          </form>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </motion.div>
      </AnimatePresence>

      <p className="mt-4 text-center text-xs text-ink-faint">
        Your score won't be shown until the interview ends.
      </p>
    </div>
  );
}
