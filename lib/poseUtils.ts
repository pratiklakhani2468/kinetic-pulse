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

// ─── Dual-arm bicep curl detection ───────────────────────────────────────────
//
//  Fixes the single-arm flaw by requiring BOTH elbows to cross thresholds
//  simultaneously.  Arms must also stay within CURL_SYNC_TOLERANCE of each
//  other to reject one-sided cheating or camera noise.
//
//  State machine:
//    DOWN → UP   when BOTH angles ≤ UP threshold AND arms are in sync
//    UP   → DOWN when BOTH angles ≥ DOWN threshold AND UP phase lasted ≥ 500 ms
//
//  The 500 ms minimum in the UP phase prevents bounced / momentum reps from
//  being counted (stability check).

export const CURL_SYNC_TOLERANCE = 20; // degrees — max allowed gap between arms

export function detectDualCurlRep(
  leftAngle:      number,
  rightAngle:     number,
  currentStage:   CurlStage,
  phaseElapsedMs: number,   // ms spent in the current UP phase
): RepResult {
  const inSync = Math.abs(leftAngle - rightAngle) < CURL_SYNC_TOLERANCE;

  // Both arms curled high enough AND moving together → enter UP (no rep yet)
  if (
    leftAngle  <= CURL_THRESHOLDS.UP &&
    rightAngle <= CURL_THRESHOLDS.UP &&
    inSync &&
    currentStage === "DOWN"
  ) {
    return { newStage: "UP", repCounted: false };
  }

  // Both arms fully extended after being curled AND held UP for ≥ 500 ms → rep!
  if (
    leftAngle  >= CURL_THRESHOLDS.DOWN &&
    rightAngle >= CURL_THRESHOLDS.DOWN &&
    currentStage === "UP" &&
    phaseElapsedMs >= 500
  ) {
    return { newStage: "DOWN", repCounted: true };
  }

  return { newStage: currentStage, repCounted: false };
}

// ─── Dual-arm curl feedback ───────────────────────────────────────────────────
//
//  Priority order:
//    1. Jitter / momentum (too-fast movement) — catches swinging & bouncing
//    2. Sync mismatch    — one arm lagging more than CURL_SYNC_TOLERANCE
//    3. Peak curl        — both arms at full contraction → success
//    4. Eccentric phase  — arms lowering back down from UP
//    5. Bottom — not yet at full extension
//    6. Mid-curl (tiered) — guides user to go higher
//
//  `angleVelocity` is the smoothed per-frame angle change (°/frame) averaged
//  across both arms.  Pass 0 (default) when not tracked.

export const JITTER_THRESHOLD = 8; // °/frame — above this = momentum / swing

export function getDualCurlFeedback(
  leftAngle:     number,
  rightAngle:    number,
  stage:         CurlStage,
  angleVelocity = 0,
): AIFeedback {
  const angleDiff = Math.abs(leftAngle - rightAngle);
  const avgAngle  = (leftAngle + rightAngle) / 2;

  // 1. Jitter / swinging — catches momentum reps and elbow flares
  if (angleVelocity > JITTER_THRESHOLD) {
    return { text: "Control Your Movement", type: "warning" };
  }

  // 2. Arms out of sync — one side doing more work
  if (angleDiff >= CURL_SYNC_TOLERANCE) {
    return { text: "Keep Both Arms Even", type: "warning" };
  }

  // 3. Peak of curl — full contraction reached
  if (avgAngle <= CURL_THRESHOLDS.UP) {
    return { text: "Good Rep!", type: "success" };
  }

  // 4. Eccentric (lowering) phase — cue slow, controlled descent
  if (stage === "UP") {
    return { text: "Lower Slowly", type: "warning" };
  }

  // 5. At full extension — ready to start next rep
  if (avgAngle > CURL_THRESHOLDS.DOWN && stage === "DOWN") {
    return { text: "Fully Extend Both Arms", type: "warning" };
  }

  // 6. Mid-curl (stage DOWN, concentric phase) — tiered depth guidance
  if (stage === "DOWN") {
    if (avgAngle > 120) return { text: "Start Curling",  type: "warning" };
    if (avgAngle > 70)  return { text: "Curl Higher",    type: "warning" };
    return                     { text: "Almost There!",  type: "success" }; // 60–70°, near peak
  }

  return { text: "Keep Going", type: "warning" };
}

// ─── Push-up detection ────────────────────────────────────────────────────────
//
//  State machine (right elbow angle — camera faces user from front):
//    UP   → DOWN  when elbowAngle ≤ 90°  (chest near floor)
//    DOWN → UP    when elbowAngle ≥ 150° AND DOWN phase lasted ≥ 500 ms
//
//  The 500 ms minimum in the DOWN phase prevents partial-dip reps.

export const PUSHUP_THRESHOLDS = {
  DOWN: 90,   // elbow angle ≤ this → chest near floor → DOWN
  UP:  150,   // elbow angle ≥ this → arms extended    → UP
} as const;

export type PushupStage = "UP" | "DOWN" | "IDLE";

export interface PushupRepResult {
  newStage:   PushupStage;
  repCounted: boolean;
}

export function detectPushupRep(
  elbowAngle:     number,
  currentStage:   PushupStage,
  phaseElapsedMs: number,   // ms spent in the current DOWN phase
): PushupRepResult {
  // Arms bent to full depth → DOWN
  if (elbowAngle <= PUSHUP_THRESHOLDS.DOWN && currentStage !== "DOWN") {
    return { newStage: "DOWN", repCounted: false };
  }

  // Arms fully extended after being bent AND held low for ≥ 500 ms → rep!
  if (
    elbowAngle >= PUSHUP_THRESHOLDS.UP &&
    currentStage === "DOWN" &&
    phaseElapsedMs >= 500
  ) {
    return { newStage: "UP", repCounted: true };
  }

  return { newStage: currentStage, repCounted: false };
}

// Push-up feedback tiers (elbowAngle is the right-arm angle, 0–180°):
//
//   ≤ 90°          → full depth           → "Good Depth!"
//   90–120°        → near but not there   → "Go a Little Lower"
//   > 90°, DOWN    → ascending            → "Push All The Way Up"
//   UP, < 140°     → elbows not locked    → "Lock Out Your Arms"
//   UP, ≥ 140°     → fully extended       → "Lower With Control"

export function getPushupFeedback(elbowAngle: number, stage: PushupStage): AIFeedback {
  // 1. Full depth — chest near floor
  if (elbowAngle <= PUSHUP_THRESHOLDS.DOWN) {
    return { text: "Good Depth!", type: "success" };
  }

  // 2. Near depth but not quite — incomplete rep (90–120°)
  if (elbowAngle <= 120 && stage !== "UP") {
    return { text: "Go a Little Lower", type: "warning" };
  }

  // 3. Ascending after reaching depth — push to full lockout
  if (stage === "DOWN" && elbowAngle < PUSHUP_THRESHOLDS.UP) {
    return { text: "Push All The Way Up", type: "warning" };
  }

  // 4. At top but elbows still soft — full extension required
  if (stage === "UP" && elbowAngle < 140) {
    return { text: "Lock Out Your Arms", type: "warning" };
  }

  // 5. Fully extended at top — cue controlled descent into next rep
  if (stage === "UP") {
    return { text: "Lower With Control", type: "warning" };
  }

  return { text: "Keep Going", type: "warning" };
}

// ─── Bilateral squat detection ────────────────────────────────────────────────
//
//  Improvement over detectSquatRep:
//    1. Averages LEFT and RIGHT knee angles — one-sided lean can't fake a rep
//    2. Checks knee symmetry (diff < 25°) — flags imbalanced squats
//    3. Requires ≥ 500 ms in DOWN phase — prevents bounce reps
//
//  State machine:
//    UP   → DOWN  when avgAngle ≤ SQUAT DOWN threshold AND knees balanced
//    DOWN → UP    when avgAngle ≥ SQUAT UP threshold   AND DOWN lasted ≥ 500 ms

// ─── Bilateral squat feedback ─────────────────────────────────────────────────
//
//  Takes individual left/right knee angles so it can detect imbalance
//  independently of the depth check.
//
//  Priority order:
//    1. Imbalance (diff > 25°)           → "Balance Your Weight"
//    2. Full depth reached (avg < 90°)   → "Good Depth!"
//    3. Near depth (avg 90–110°, going ↓)→ "Go a Little Lower"
//    4. Shallow descent (avg 110–140°)   → "Go Lower"
//    5. Rising out of squat (stage DOWN) → "Drive Through Your Heels"
//    6. Standing, initiate squat         → "Squat Down"

export function getSquatFeedbackBilateral(
  leftAngle:  number,
  rightAngle: number,
  stage:      SquatStage,
): AIFeedback {
  const avgAngle = (leftAngle + rightAngle) / 2;
  const diff     = Math.abs(leftAngle - rightAngle);

  // 1. Weight imbalance — one knee tracking differently from the other
  if (diff > 25) {
    return { text: "Balance Your Weight", type: "warning" };
  }

  // 2. At or past full depth
  if (avgAngle < SQUAT_THRESHOLDS.DOWN) {
    return { text: "Good Depth!", type: "success" };
  }

  // 3. Rising after depth (stage flipped to DOWN) — cue drive phase
  if (stage === "DOWN") {
    return { text: "Drive Through Your Heels", type: "warning" };
  }

  // 4. Descending but not deep enough — tiered guidance (stage is still UP)
  if (avgAngle < 110) return { text: "Go a Little Lower", type: "warning" };
  if (avgAngle < 140) return { text: "Go Lower",          type: "warning" };

  // 5. Standing — cue user to begin descent
  return { text: "Squat Down", type: "warning" };
}

export function detectDualSquatRep(
  leftAngle:      number,
  rightAngle:     number,
  currentStage:   SquatStage,
  phaseElapsedMs: number,   // ms spent in the current DOWN phase
): SquatRepResult {
  const avgAngle = (leftAngle + rightAngle) / 2;
  const balanced = Math.abs(leftAngle - rightAngle) < 25;

  // Both knees deeply bent AND tracking evenly → DOWN
  if (avgAngle <= SQUAT_THRESHOLDS.DOWN && balanced && currentStage !== "DOWN") {
    return { newStage: "DOWN", repCounted: false };
  }

  // Standing back up after full squat AND held depth for ≥ 500 ms → rep!
  if (
    avgAngle >= SQUAT_THRESHOLDS.UP &&
    currentStage === "DOWN" &&
    phaseElapsedMs >= 500
  ) {
    return { newStage: "UP", repCounted: true };
  }

  return { newStage: currentStage, repCounted: false };
}
