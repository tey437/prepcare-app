import { supabase } from "./supabaseClient";
import type { ConversationEngineResponse } from "./types";

interface StartArgs extends Record<string, unknown> {
  mode: "live" | "practice";
  jobProfileId?: string; // required for live
  practiceRole?: string; // required for practice
  candidateName?: string;
}

interface TurnArgs extends Record<string, unknown> {
  interviewId: string;
  answer: string;
}

/**
 * All calls to the AI provider happen inside the Supabase Edge Function
 * (`conversation-engine`), which holds the ANTHROPIC_API_KEY as a server-side
 * secret and uses the Supabase service role key to write transcript rows.
 * The browser never talks to Anthropic directly.
 *
 * NOTE: this calls the function via a plain `fetch` (instead of the
 * `supabase.functions.invoke()` helper) because that helper was observed
 * sending an empty request body in some environments, which the Edge
 * Function then rejected. A direct fetch with an explicit JSON body and
 * headers is more predictable and easier to debug if something goes wrong.
 */
async function callEdgeFunction<T>(
  action: "start" | "turn",
  payload: Record<string, unknown>
): Promise<T> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Supabase isn't configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env)."
    );
  }

  // Include the logged-in user's access token when available (client actions),
  // otherwise fall back to the anon key (anonymous candidate actions). Either
  // way we ALSO send the anon key as apikey, which Supabase's gateway requires.
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token ?? anonKey;

  const res = await fetch(`${supabaseUrl}/functions/v1/conversation-engine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Edge Function returned non-JSON (status ${res.status}): ${text.slice(0, 300)}`);
  }

  if (!res.ok) {
    const message =
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : `Edge Function error (status ${res.status})`;
    throw new Error(message);
  }

  return json as T;
}

export async function startInterview(args: {
  mode: "live" | "practice";
  jobProfileId?: string;
  practiceRole?: string;
  candidateName?: string;
}): Promise<{ interviewId: string; engine: ConversationEngineResponse }> {
  return callEdgeFunction("start", args);
}

export async function submitAnswer(args: TurnArgs): Promise<ConversationEngineResponse> {
  return callEdgeFunction("turn", args);
}