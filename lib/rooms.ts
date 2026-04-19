/**
 * Live Workout Rooms — Firebase helpers
 *
 * Firestore structure:
 *   rooms/{roomId}                   — room metadata
 *   rooms/{roomId}/participants/{uid} — per-user live state
 */

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoomMeta {
  exerciseType: string;
  createdAt: unknown;
}

export interface Participant {
  id: string;
  name: string;
  reps: number;
  status: "active" | "resting";
  lastUpdated: unknown;
}

// ─── Room CRUD ────────────────────────────────────────────────────────────────

/** Create a new room and return its generated ID. */
export async function createRoom(exerciseType: string): Promise<string> {
  const ref = await addDoc(collection(db, "rooms"), {
    exerciseType,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Fetch the room metadata. Returns null if the room doesn't exist. */
export async function getRoomMeta(roomId: string): Promise<RoomMeta | null> {
  const snap = await getDoc(doc(db, "rooms", roomId));
  return snap.exists() ? (snap.data() as RoomMeta) : null;
}

/**
 * Add a participant to the room.
 *
 * Uses setDoc with merge:true so a re-join preserves existing reps if the
 * document already exists, but creates a fresh doc for new participants.
 * Each participant is keyed by `userId`, which must be unique per tab/session
 * (use a sessionStorage-backed ID on the client, not the Firebase auth UID,
 * so that two browser tabs can join as separate participants).
 */
export async function joinRoom(
  roomId: string,
  userId: string,
  name: string
): Promise<void> {
  await setDoc(
    doc(db, "rooms", roomId, "participants", userId),
    { name, reps: 0, status: "active", lastUpdated: serverTimestamp() },
    { merge: true }
  );
}

/** Remove a participant from the room. */
export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  await deleteDoc(doc(db, "rooms", roomId, "participants", userId));
}

/** Push a rep count update for one participant. */
export async function updateReps(
  roomId: string,
  userId: string,
  reps: number
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId, "participants", userId), {
    reps,
    lastUpdated: serverTimestamp(),
  });
}

/** Update a participant's status ("active" | "resting"). */
export async function updateStatus(
  roomId: string,
  userId: string,
  status: "active" | "resting"
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId, "participants", userId), {
    status,
    lastUpdated: serverTimestamp(),
  });
}

/** Subscribe to live participant updates. Returns the unsubscribe function. */
export function subscribeToRoom(
  roomId: string,
  callback: (participants: Participant[]) => void
): () => void {
  const ref = collection(db, "rooms", roomId, "participants");
  return onSnapshot(ref, (snap) => {
    // Debug: log raw Firestore docs so we can confirm multiple participants arrive
    console.log(
      "Participants snapshot:",
      snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    );

    const participants: Participant[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Participant, "id">),
    }));

    // Sort by reps descending so the leaderboard stays ordered
    participants.sort((a, b) => b.reps - a.reps);

    // Spread into a fresh array so React always sees a new reference and
    // triggers a re-render, even if the sort returned the same in-place ref.
    callback([...participants]);
  });
}
