/**
 * Ghost Mode — pose recording & playback helpers
 *
 * One ghost session is stored per exercise in localStorage under the key
 * `ghost_{exerciseId}`.  Each frame records elapsed milliseconds since the
 * session started plus the 33 MediaPipe pose landmarks, rounded to 3 d.p.
 * to keep the JSON payload small (~350 KB for a 60-second session at 10 fps).
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GhostLandmark {
  x: number;
  y: number;
  z: number;
  v: number;   // visibility, abbreviated for compactness
}

export interface GhostFrame {
  t: number;                // ms since session start
  lm: GhostLandmark[];      // 33 landmarks
}

// ─── Storage key ──────────────────────────────────────────────────────────────

export function ghostKey(exerciseId: string): string {
  return `ghost_${exerciseId}`;
}

// ─── Save ─────────────────────────────────────────────────────────────────────

/**
 * Persist frames to localStorage, overwriting any previous ghost for this
 * exercise.  Silently swallows QuotaExceededError so a full storage never
 * crashes the app.
 */
export function saveGhost(exerciseId: string, frames: GhostFrame[]): void {
  if (frames.length === 0) return;
  try {
    localStorage.setItem(ghostKey(exerciseId), JSON.stringify(frames));
  } catch {
    // localStorage quota exceeded — discard silently
  }
}

// ─── Load ─────────────────────────────────────────────────────────────────────

/**
 * Load previously saved ghost frames for an exercise.
 * Returns null when no recording exists or JSON parsing fails.
 */
export function loadGhost(exerciseId: string): GhostFrame[] | null {
  try {
    const raw = localStorage.getItem(ghostKey(exerciseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GhostFrame[];
    // Sanity-check: must be an array with at least one frame
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

// ─── Frame lookup ─────────────────────────────────────────────────────────────

/**
 * Find the ghost frame whose timestamp is closest to `currentTimeMs`.
 *
 * Frames are stored in ascending time order.  We iterate until we've passed
 * the target so the loop exits early for long recordings.
 *
 * Returns null when:
 *  - the array is empty
 *  - the nearest frame is further than `maxDeltaMs` away (current session has
 *    run longer than the recorded ghost)
 */
export function findGhostFrame(
  frames: GhostFrame[],
  currentTimeMs: number,
  maxDeltaMs = 500
): GhostFrame | null {
  if (frames.length === 0) return null;

  let best = frames[0];
  let bestDelta = Math.abs(frames[0].t - currentTimeMs);

  for (let i = 1; i < frames.length; i++) {
    const delta = Math.abs(frames[i].t - currentTimeMs);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = frames[i];
    }
    // Frames are time-ordered; once we've gone past target and delta grows, stop
    if (frames[i].t > currentTimeMs && delta > bestDelta) break;
  }

  return bestDelta <= maxDeltaMs ? best : null;
}

// ─── Landmark compression helpers ─────────────────────────────────────────────

/** Round to 3 decimal places before storing to keep JSON small. */
export function compressLandmarks(
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }>
): GhostLandmark[] {
  return landmarks.map((lm) => ({
    x: +lm.x.toFixed(3),
    y: +lm.y.toFixed(3),
    z: +lm.z.toFixed(3),
    v: +(lm.visibility ?? 1).toFixed(3),
  }));
}
