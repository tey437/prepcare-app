import { Link, useLocation, useNavigate } from "react-router-dom";
import type { PropsWithChildren } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { ConfigWarning } from "./ConfigWarning";

export function Layout({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkHero = location.pathname === "/";

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ConfigWarning />
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur transition-colors ${
          isDarkHero
            ? "border-white/10 bg-ink/80 text-white"
            : "border-line bg-paper/90 text-ink"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="group flex items-center gap-2">
            <motion.span
              whileHover={{ rotate: -8, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className={`flex h-7 w-7 items-center justify-center rounded-full font-display text-sm font-semibold ${
                isDarkHero ? "bg-amber text-ink" : "bg-ink text-paper"
              }`}
            >
              P
            </motion.span>
            <span className="font-display text-lg font-semibold tracking-tight">PrepCare</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              to="/practice"
              className={`link-underline hidden sm:inline ${
                isDarkHero ? "text-white/70 hover:text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              Practice Mode
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`link-underline hidden sm:inline ${
                    isDarkHero ? "text-white/70 hover:text-white" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className={isDarkHero ? "btn-secondary !border-white/20 !bg-transparent !text-white hover:!border-white !py-2" : "btn-secondary !py-2"}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`link-underline ${
                    isDarkHero ? "text-white/70 hover:text-white" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Client login
                </Link>
                <Link
                  to="/register"
                  className={isDarkHero ? "btn-accent !py-2" : "btn-primary !py-2"}
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-paper py-8 text-center text-xs text-ink-faint">
        PrepCare — built as an academic prototype. Interview audio and transcripts are used only for scoring described on-screen.
      </footer>
    </div>
  );
}
