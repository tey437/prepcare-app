import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Minimal typing for the non-standard beforeinstallprompt event.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && sessionStorage.getItem("prepcare-install-dismissed") === "1"
  );

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredEvent || dismissed) return null;

  async function handleInstall() {
    if (!deferredEvent) return;
    await deferredEvent.prompt();
    await deferredEvent.userChoice;
    setDeferredEvent(null);
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("prepcare-install-dismissed", "1");
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-surface px-4 py-2.5 shadow-card-hover"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-semibold text-paper">
          P
        </span>
        <p className="flex-1 text-xs text-ink-soft">Install PrepCare for quick, app-like access.</p>
        <button onClick={handleInstall} className="btn-accent !px-3 !py-1.5 !text-xs">
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-ink-faint hover:text-ink"
          aria-label="Dismiss install prompt"
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
