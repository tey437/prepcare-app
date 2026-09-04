import { isSupabaseConfigured } from "@/lib/supabaseClient";

export function ConfigWarning() {
  if (isSupabaseConfigured) return null;
  return (
    <div className="border-b border-amber bg-amber-light px-4 py-2.5 text-center text-sm text-ink">
      <span className="font-semibold">Supabase isn't configured yet.</span>{" "}
      Copy <code className="font-mono">.env.example</code> to <code className="font-mono">.env</code>, add your
      project URL and anon key, then restart <code className="font-mono">npm run dev</code>.
    </div>
  );
}
