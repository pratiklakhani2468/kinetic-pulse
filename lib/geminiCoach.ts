// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkoutFeedbackInput {
  exercise:  string;
  reps:      number;
  duration:  number;   // seconds
  accuracy:  number;   // 0–100 (0 = not tracked)
  issues:    string[]; // top detected form-issue labels
  imbalance: boolean;  // bilateral asymmetry detected?
}

// ─── Constants ────────────────────────────────────────────────────────────────

// v1 (stable) endpoint — NOT v1beta. gemini-1.5-flash is the fast, free-tier model.
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";

// Shown whenever the API call fails — always a useful coaching sentence.
export const FALLBACK_FEEDBACK =
  "Good effort! Focus on improving form consistency next time.";

// ─── Prompt builder ───────────────────────────────────────────────────────────
//
//  Tight, role-prefixed prompt — forces 1–2 short coaching sentences with one
//  strength + one concrete tip.  All numeric context is inlined so Gemini can
//  reference it directly.

function buildPrompt(input: WorkoutFeedbackInput): string {
  const { exercise, reps, duration, accuracy, issues, imbalance } = input;

  const mins     = Math.floor(duration / 60);
  const secs     = duration % 60;
  const durText  = duration > 0
    ? (mins > 0 ? `${mins}m ${secs}s` : `${secs}s`)
    : "unknown duration";

  const accText  = accuracy > 0 ? `${accuracy}% form accuracy` : "form accuracy not tracked";
  const issText  = issues.length > 0
    ? `Form issues detected: ${issues.join(", ")}.`
    : "No significant form issues.";
  const imbText  = imbalance ? "Left–right muscle imbalance was flagged." : "";

  return `You are a concise fitness coach. Write 1–2 short, clear sentences of post-workout coaching. \
No bullet points. No emojis. No greeting. Be specific and actionable.

Workout:
- Exercise: ${exercise}
- Reps: ${reps}
- Duration: ${durText}
- ${accText}
- ${issText}
${imbText ? `- ${imbText}` : ""}

Acknowledge one positive, then give one concrete improvement tip.`;
}

// ─── Gemini API call ──────────────────────────────────────────────────────────
//
//  Always resolves with a non-empty string — either the model's response or
//  FALLBACK_FEEDBACK.  Errors are caught internally and logged so the UI never
//  shows a raw exception.
//
//  Console log sequence (visible in browser DevTools):
//    [GeminiCoach] → request payload  (before fetch)
//    [GeminiCoach] ← raw JSON         (on success)
//    [GeminiCoach] ✗ …                (on any failure)

export async function generateWorkoutFeedback(
  input: WorkoutFeedbackInput,
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // Guard: key missing at build/runtime (local dev or misconfigured Vercel)
  if (!apiKey) {
    console.warn("[GeminiCoach] ✗ NEXT_PUBLIC_GEMINI_API_KEY is not set — using fallback.");
    return FALLBACK_FEEDBACK;
  }

  const requestBody = {
    contents: [
      { parts: [{ text: buildPrompt(input) }] },
    ],
    generationConfig: {
      maxOutputTokens: 120,   // ~2 sentences
      temperature:     0.65,
      topP:            0.9,
    },
  };

  console.log("[GeminiCoach] → Request payload:", {
    exercise: input.exercise,
    reps:     input.reps,
    accuracy: input.accuracy,
    issues:   input.issues,
    imbalance: input.imbalance,
  });

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(requestBody),
    });

    if (!res.ok) {
      // Log the full error body so the developer can debug API key / quota issues
      const errorBody = await res.text().catch(() => res.statusText);
      console.error(`[GeminiCoach] ✗ HTTP ${res.status}:`, errorBody);
      return FALLBACK_FEEDBACK;
    }

    const json = await res.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    console.log("[GeminiCoach] ← Response:", json);

    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text?.trim()) {
      console.warn("[GeminiCoach] ✗ Gemini returned an empty response — using fallback.");
      return FALLBACK_FEEDBACK;
    }

    return text.trim();

  } catch (err) {
    // Network failure, CORS, or unexpected runtime error
    console.error("[GeminiCoach] ✗ Network / parse error:", err);
    return FALLBACK_FEEDBACK;
  }
}
