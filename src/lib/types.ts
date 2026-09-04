export type InterviewMode = "live" | "practice";
export type InterviewStatus = "in_progress" | "completed" | "abandoned";

export interface Organization {
  org_id: string;
  auth_user_id: string;
  name: string;
  sector: string | null;
  created_at: string;
}

export interface JobProfile {
  job_profile_id: string;
  org_id: string;
  title: string;
  criteria: string;
  interview_link: string;
  created_at: string;
}

export interface Interview {
  interview_id: string;
  job_profile_id: string | null;
  candidate_name: string | null;
  mode: InterviewMode;
  status: InterviewStatus;
  started_at: string;
  ended_at: string | null;
}

export interface TranscriptEntry {
  entry_id: string;
  interview_id: string;
  turn_no: number;
  question: string;
  answer: string | null;
  created_at: string;
}

export interface Score {
  score_id: string;
  interview_id: string;
  competency: number | null;
  soft_skills: number | null;
  role_alignment: number | null;
  wpm: number | null;
  filler_rate: number | null;
  star_adherence: number | null;
  cited_entry_id: string | null;
  generated_at: string;
}

/** Shape returned by the conversation-engine Edge Function on each turn. */
export interface ConversationEngineResponse {
  done: boolean;
  next_question?: string;
  entry_id?: string;
  turn_no?: number;
  score?: Score;
  transcript?: TranscriptEntry[];
}
