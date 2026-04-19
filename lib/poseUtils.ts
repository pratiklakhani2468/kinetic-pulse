// ─── Landmark index constants (MediaPipe Pose 33-point model) ─────────────────

export const LANDMARKS = {
  // Right arm (from camera's perspective — matches mirrored display)
  RIGHT_SHOULDER: 12,
  RIGHT_ELBOW:    14,
  RIGHT_WRIST:    16,
  // Left arm
  LEFT_SHOULDER:  11,
  LEFT_ELBOW:     13,
  LEFT_WRIST:     15,
  // Right leg
  RIGHT_HIP:      24,
  RIGHT_KNEE:     26,
  RIGHT_ANKLE:    28,
  // Left leg
  LEFT_HIP:       23,
  LEFT_KNEE:      25,
  LEFT_ANKLE:     27,
} as const;

// ─── Angle thresholds for bicep curl ──────────────────────────────────────────

export const CURL_THRESHOLDS = {
  UP:   60,   // elbow angle ≤ this  → arm curled   → UP stage
  DOWN: 150,  // elbow angle ≥ this  → arm extended → DOWN stage
} as const;

// ─── Angle calculation ────────────────────────────────────────────────────────
//
//  Computes the interior angle (0–180°) at vertex `b` formed by rays b→a and b→c.
//
//  Uses the dot-product formula:
//    cos θ = (ab⃗ · cb⃗) / (|ab⃗| × |cb⃗|)
//
//  where ab⃗ = a − b  and  cb⃗ = c − b  (both vectors pointing away from b).
//  The acos result is clamped to [−1, 1] to guard against floating-point drift.

interface Point2D { x: number; y: number }

export function calculateAngle(a: Point2D, b: Point2D, c: Point2D): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };  // vector b→a
  const cb = { x: c.x - b.x, y: c.y - b.y };  // vector b→c

  const dot   = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x ** 2 + ab.y ** 2);
  const magCB = Math.sqrt(cb.x ** 2 + cb.y ** 2);

  // Degenerate case — two points coincide
  if (magAB === 0 || magCB === 0) return 0;

  // Clamp before acos to avoid NaN from tiny floating-point overshoots past ±1
  const cosAngle = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

// ─── AI Feedback ─────────────────────────────────────────────────────────────
//
//  Returns a coaching message based on elbow angle + current curl stage.
//  Returns null when no meaningful feedback applies (avoids unnecessary updates).
//
//  Angle guide:
//    ~180° → fully extended (DOWN)
//    ~50°  → fully curled   (UP)
//
//  Stage guide:
//    "DOWN" → arm was extended; person is curling up
//    "UP"   → arm was curled; person is lowering back down

export interface AIFeedback {
  text: string;
  type: "success" | "warning";
}

export function getAIFeedback(angle: number, stage: CurlStage): AIFeedback {
  // ① Fully curled — great form
  if (angle <= CURL_THRESHOLDS.UP) {
    return { text: "Good Rep!", type: "success" };
  }

  // ② Coming back down after a rep — cue controlled descent
  if (stage === "UP") {
    return { text: "Lower Slowly", type: "warning" };
  }

  // ③ Arm fully extended at bottom — ready to curl
  if (angle > CURL_THRESHOLDS.DOWN && stage === "DOWN") {
    return { text: "Fully Extend Your Arm", type: "warning" };
  }

  // ④ Mid-curl on the way up but not high enough — prompt more range
  if (stage === "DOWN" && angle > 70 && angle < CURL_THRESHOLDS.DOWN) {
    return { text: "Curl Higher", type: "warning" };
  }

  // ⑤ Fallback — always return something
  return { text: "Keep Going", type: "warning" };
}

// ─── Squat thresholds ─────────────────────────────────────────────────────────

export const SQUAT_THRESHOLDS = {
  DOWN: 90,   // knee angle ≤ this  → deep squat → DOWN stage
  UP:   160,  // knee angle ≥ this  → standing   → UP stage
} as const;

// ─── Squat feedback ───────────────────────────────────────────────────────────

export type SquatStage = "UP" | "DOWN" | "IDLE";

export function getSquatFeedback(angle: number, stage: SquatStage): AIFeedback {
  if (angle < SQUAT_THRESHOLDS.DOWN) {
    return { text: "Good Depth!", type: "success" };
  }
  if (angle > 140 && stage === "DOWN") {
    return { text: "Stand Fully Up", type: "warning" };
  }
  if (stage === "UP" && angle <= 140) {
    return { text: "Go Lower", type: "warning" };
  }
  return { text: "Keep Going", type: "warning" };
}

// ─── Rep detection ────────────────────────────────────────────────────────────
//
//  Stateless function — caller owns the current stage via a ref.
//  Returns the new stage (and whether a rep was completed) so the caller
//  can decide what to do with the update.
//
//  State machine (bicep curl):
//
//    START → DOWN (arm extended, angle > 150°)
//
//    DOWN  → UP   when angle < 60°   (curl reached the top — no rep yet)
//    UP    → DOWN when angle > 150°  (arm fully extended again → rep complete ✓)
//
//  Counting at the BOTTOM of the movement (UP→DOWN) rather than the top
//  (DOWN→UP) ensures a full range-of-motion repetition before incrementing,
//  and prevents premature counts from a partial curl.

export type CurlStage = "UP" | "DOWN" | "IDLE";

export interface RepResult {
  newStage: CurlStage;
  repCounted: boolean;
}

export function detectCurlRep(angle: number, currentStage: CurlStage): RepResult {
  // Arm curled past the top threshold — transition DOWN → UP (no rep yet)
  if (angle < CURL_THRESHOLDS.UP && currentStage === "DOWN") {
    return { newStage: "UP", repCounted: false };
  }

  // Arm fully extended again after being curled — rep complete!
  if (angle > CURL_THRESHOLDS.DOWN && currentStage === "UP") {
    return { newStage: "DOWN", repCounted: true };
  }

  // Mid-movement or already in correct stage → no change
  return { newStage: currentStage, repCounted: false };
}

export interface SquatRepResult {
  newStage: SquatStage;
  repCounted: boolean;
}

export function detectSquatRep(angle: number, currentStage: SquatStage): SquatRepResult {
  if (angle <= SQUAT_THRESHOLDS.DOWN) {
    // Knee deeply bent → DOWN
    return { newStage: "DOWN", repCounted: false };
  }

  if (angle >= SQUAT_THRESHOLDS.UP && currentStage === "DOWN") {
    // Stood back up after deep squat → completed rep
    return { newStage: "UP", repCounted: true };
  }

  // In-between → no state change
  return { newStage: currentStage, repCounted: false };
}
