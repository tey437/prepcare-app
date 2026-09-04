// PrepCare Conversation Engine — Supabase Edge Function
// (Diagnostic build: every JSON.parse is wrapped so failures say exactly where they happened.)

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MODEL = "claude-sonnet-5";
const MAX_TURNS = 8;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

interface TranscriptEntryRow {
  entry_id: string;
  turn_no: number;
  question: string;
  answer: string | null;
}

async function callAnthropic(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const rawBody = await res.text(); // read as text FIRST so we can always see it, even if it's not JSON

  if (!res.ok) {
    throw new Error(`[Anthropic HTTP ${res.status}] ${rawBody.slice(0, 500)}`);
  }
  if (!rawBody || rawBody.trim() === "") {
    throw new Error(`[Anthropic returned an empty 200 response body]`);
  }

  let data: { content?: { type: string; text?: string }[] };
  try {
    data = JSON.parse(rawBody);
  } catch {
    throw new Error(`[Could not parse Anthropic's response as JSON] raw: ${rawBody.slice(0, 500)}`);
  }

  const textBlock = data.content?.find((c) => c.type === "text");
  if (!textBlock || !textBlock.text) {
    throw new Error(`[Anthropic response had no text content block] raw: ${rawBody.slice(0, 500)}`);
  }
  return textBlock.text;
}

function parseJsonLoose(raw: string, context: string): Record<string, unknown> {
  const cleaned = raw.trim().replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  if (!cleaned) {
    throw new Error(`[Empty text after cleanup in ${context}] original raw: ${raw.slice(0, 500)}`);
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`[Claude's reply wasn't valid JSON in ${context}] text was: ${cleaned.slice(0, 500)}`);
  }
}

const LIVE_SYSTEM_PROMPT = `You are PrepCare's interview engine, conducting a first-round screening interview for a specific job role. You follow Computerized-Adaptive-Testing logic: use each answer as evidence about the candidate's ability, and choose the next question based on that evidence rather than a fixed script.

Rules:
- If the candidate's last answer was strong and specific, ask a deeper follow-up that probes whether that depth is real.
- If the candidate's last answer was thin, vague, or evasive, ask a clarifying question that gives them a fair chance to explain further, rather than immediately scoring it low.
- Never invent claims the candidate did not make. Every score you give MUST cite the entry_id of the transcript turn that justifies it.
- After enough turns to have real evidence on technical competency, soft skills, and role alignment, end the interview and produce a scorecard instead of another question.

Respond ONLY with strict JSON, no prose, no markdown fences, in exactly one of these two shapes:

To ask the next question:
{"done": false, "next_question": "..."}

To end the interview and score it:
{"done": true, "competency": <0-100>, "soft_skills": <0-100>, "role_alignment": <0-100>, "cited_entry_id": "<entry_id of the most representative transcript turn>", "rationale": "<one sentence>"}`;

const PRACTICE_SYSTEM_PROMPT = `You are PrepCare's practice interview coach, conducting a low-stakes mock interview for a candidate rehearsing for a target role/industry. Use Computerized-Adaptive-Testing logic exactly as in a live interview (deeper follow-ups for strong answers, clarifying questions for thin ones), but the purpose here is coaching, not screening.

Rules:
- Never invent claims the candidate did not make.
- After enough turns, end the session and produce a coaching scorecard instead of another question.
- Estimate speaking pace in words per minute (wpm) from the answer length assuming natural spoken pace if it were spoken aloud, estimate filler_rate as the approximate percentage of words that were filler words ("um", "like", "you know", "uh") across the whole session, and estimate star_adherence (0-100) as how well the candidate's answers followed the Situation-Task-Action-Result structure.
- Every score MUST cite the entry_id of the transcript turn that best illustrates it.

Respond ONLY with strict JSON, no prose, no markdown fences, in exactly one of these two shapes:

To ask the next question:
{"done": false, "next_question": "..."}

To end the session and score it:
{"done": true, "wpm": <number>, "filler_rate": <0-100>, "star_adherence": <0-100>, "cited_entry_id": "<entry_id of the most representative transcript turn>", "rationale": "<one sentence>"}`;

function buildTranscriptText(entries: TranscriptEntryRow[]): string {
  return entries
    .map((e) => `Turn ${e.turn_no} [entry_id=${e.entry_id}]\nQ: ${e.question}\nA: ${e.answer ?? "(no answer yet)"}`)
    .join("\n\n");
}

async function handleStart(
  supabase: SupabaseClient,
  body: { mode: "live" | "practice"; jobProfileId?: string; practiceRole?: string; candidateName?: string }
) {
  const { mode, jobProfileId, practiceRole, candidateName } = body;

  let contextLine = "";
  if (mode === "live") {
    if (!jobProfileId) return json({ error: "jobProfileId is required for live interviews" }, 400);
    const { data: profile, error: profileError } = await supabase
      .from("job_profiles")
      .select("title, criteria")
      .eq("job_profile_id", jobProfileId)
      .single();
    if (profileError || !profile) return json({ error: `Job profile not found: ${profileError?.message ?? "no row"}` }, 404);
    contextLine = `Role: ${profile.title}\nCriteria: ${profile.criteria}`;
  } else {
    if (!practiceRole) return json({ error: "practiceRole is required for practice sessions" }, 400);
    contextLine = `Target role/industry (practice): ${practiceRole}`;
  }

  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .insert({
      job_profile_id: mode === "live" ? jobProfileId : null,
      candidate_name: candidateName ?? null,
      mode,
      status: "in_progress",
    })
    .select()
    .single();
  if (interviewError || !interview) {
    return json({ error: `Could not create interview row: ${interviewError?.message ?? "unknown"}` }, 500);
  }

  const systemPrompt = mode === "live" ? LIVE_SYSTEM_PROMPT : PRACTICE_SYSTEM_PROMPT;

  let openingQuestion = "Tell me a bit about yourself and your background.";
  try {
    const raw = await callAnthropic(
      systemPrompt,
      `${contextLine}\n\nThis is the start of the interview. No turns yet. Ask your opening question.`
    );
    const parsed = parseJsonLoose(raw, "handleStart/opening question") as { next_question?: string };
    if (parsed.next_question) openingQuestion = parsed.next_question;
  } catch (err) {
    // Surface the REAL underlying reason instead of a generic failure.
    return json({ error: `Failed while generating the opening question: ${err instanceof Error ? err.message : String(err)}` }, 502);
  }

  const { data: entry, error: entryError } = await supabase
    .from("transcript_entries")
    .insert({ interview_id: interview.interview_id, turn_no: 1, question: openingQuestion, answer: null })
    .select()
    .single();
  if (entryError || !entry) {
    return json({ error: `Could not save opening question: ${entryError?.message ?? "unknown"}` }, 500);
  }

  await supabase.from("audit_logs").insert({
    entity_type: "interview",
    entity_id: interview.interview_id,
    action: "interview_started",
    details: { mode },
  });

  return json({
    interviewId: interview.interview_id,
    engine: { done: false, next_question: openingQuestion, entry_id: entry.entry_id, turn_no: 1 },
  });
}

async function handleTurn(supabase: SupabaseClient, body: { interviewId: string; answer: string }) {
  const { interviewId, answer } = body;
  if (!interviewId || !answer) return json({ error: "interviewId and answer are required" }, 400);

  const { data: interview, error: interviewError } = await supabase
    .from("interviews")
    .select("*")
    .eq("interview_id", interviewId)
    .single();
  if (interviewError || !interview) return json({ error: `Interview not found: ${interviewError?.message ?? "no row"}` }, 404);

  const { data: entries, error: entriesError } = await supabase
    .from("transcript_entries")
    .select("*")
    .eq("interview_id", interviewId)
    .order("turn_no", { ascending: true });
  if (entriesError || !entries || entries.length === 0) {
    return json({ error: `Transcript not found for this interview: ${entriesError?.message ?? "empty"}` }, 404);
  }

  const currentTurn = entries[entries.length - 1] as TranscriptEntryRow;

  await supabase.from("transcript_entries").update({ answer }).eq("entry_id", currentTurn.entry_id);
  currentTurn.answer = answer;

  let contextLine = "Practice session";
  if (interview.mode === "live") {
    const { data: profile } = await supabase
      .from("job_profiles")
      .select("title, criteria")
      .eq("job_profile_id", interview.job_profile_id)
      .single();
    contextLine = `Role: ${profile?.title ?? "Unknown"}\nCriteria: ${profile?.criteria ?? ""}`;
  }

  const systemPrompt = interview.mode === "live" ? LIVE_SYSTEM_PROMPT : PRACTICE_SYSTEM_PROMPT;
  const shouldWrapUp = entries.length >= MAX_TURNS;
  const userPrompt = `${contextLine}\n\nTranscript so far:\n${buildTranscriptText(entries)}\n\n${
    shouldWrapUp
      ? "The interview has reached its turn limit. You must end it now and return a scorecard."
      : "Decide the next step: either ask the next question, or end the interview with a scorecard if you now have enough evidence."
  }`;

  let parsed: Record<string, unknown> | null = null;
  let lastErr: string = "";
  for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
    try {
      const raw = await callAnthropic(systemPrompt, userPrompt);
      const candidate = parseJsonLoose(raw, `handleTurn/attempt${attempt}`);
      const isValid =
        candidate.done === false
          ? typeof candidate.next_question === "string"
          : typeof candidate.cited_entry_id === "string" &&
            entries.some((e) => e.entry_id === candidate.cited_entry_id);
      if (isValid) {
        parsed = candidate;
      } else {
        lastErr = `Response shape was valid JSON but failed validation: ${JSON.stringify(candidate).slice(0, 300)}`;
      }
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }
  }

  if (!parsed) {
    await supabase
      .from("interviews")
      .update({ status: "abandoned", ended_at: new Date().toISOString() })
      .eq("interview_id", interviewId);
    await supabase.from("audit_logs").insert({
      entity_type: "interview",
      entity_id: interviewId,
      action: "scoring_failed_ungrounded_response",
      details: { lastErr },
    });
    return json({ error: `Could not generate a grounded response for this interview: ${lastErr}` }, 502);
  }

  if (parsed.done) {
    const scoreRow =
      interview.mode === "live"
        ? {
            interview_id: interviewId,
            competency: parsed.competency,
            soft_skills: parsed.soft_skills,
            role_alignment: parsed.role_alignment,
            cited_entry_id: parsed.cited_entry_id,
          }
        : {
            interview_id: interviewId,
            wpm: parsed.wpm,
            filler_rate: parsed.filler_rate,
            star_adherence: parsed.star_adherence,
            cited_entry_id: parsed.cited_entry_id,
          };

    const { data: score, error: scoreError } = await supabase.from("scores").insert(scoreRow).select().single();
    if (scoreError) return json({ error: `Could not save scorecard: ${scoreError.message}` }, 500);

    await supabase
      .from("interviews")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("interview_id", interviewId);

    await supabase.from("audit_logs").insert({
      entity_type: "interview",
      entity_id: interviewId,
      action: "scorecard_generated",
      details: { mode: interview.mode },
    });

    return json({ done: true, score });
  }

  const nextTurnNo = currentTurn.turn_no + 1;
  const { data: nextEntry, error: nextEntryError } = await supabase
    .from("transcript_entries")
    .insert({
      interview_id: interviewId,
      turn_no: nextTurnNo,
      question: parsed.next_question,
      answer: null,
    })
    .select()
    .single();
  if (nextEntryError || !nextEntry) return json({ error: `Could not save next question: ${nextEntryError?.message ?? "unknown"}` }, 500);

  return json({
    done: false,
    next_question: parsed.next_question,
    entry_id: nextEntry.entry_id,
    turn_no: nextTurnNo,
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  if (!ANTHROPIC_API_KEY) return json({ error: "ANTHROPIC_API_KEY is not configured as a Supabase secret" }, 500);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch (err) {
    return json({ error: `Could not read the incoming request body: ${err instanceof Error ? err.message : String(err)}` }, 400);
  }

  if (!bodyText || bodyText.trim() === "") {
    return json({ error: "The request sent from the browser had an empty body (no JSON was sent)." }, 400);
  }

  let body: { action?: string; [key: string]: unknown };
  try {
    body = JSON.parse(bodyText);
  } catch {
    return json({ error: `The request body from the browser wasn't valid JSON. Raw body was: ${bodyText.slice(0, 300)}` }, 400);
  }

  try {
    if (body.action === "start") return await handleStart(supabase, body as never);
    if (body.action === "turn") return await handleTurn(supabase, body as never);
    return json({ error: "Unknown action. Use 'start' or 'turn'." }, 400);
  } catch (err) {
    return json({ error: `Unhandled error: ${err instanceof Error ? err.message : String(err)}` }, 500);
  }
});