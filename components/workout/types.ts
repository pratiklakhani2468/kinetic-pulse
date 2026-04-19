export type SessionState = "idle" | "running" | "paused";
export type Stage = "UP" | "DOWN";

export interface Feedback {
  text: string;
  type: "idle" | "success" | "warning";
}
