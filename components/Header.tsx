"use client";

import { useAuth } from "@/lib/AuthContext";

// Derive a friendly first name from the Firebase user:
//   1. displayName present  → first word  (e.g. "Pratik Lakhani" → "Pratik")
//   2. email only           → part before '@', up to first digit / special char
//      e.g. "pratiklakhani2468@gmail.com" → "pratik"
function resolveUserName(displayName: string | null, email: string | null): string {
  if (displayName?.trim()) {
    return displayName.trim().split(/\s+/)[0];
  }
  if (email) {
    const local   = email.split("@")[0];
    const letters = local.match(/^[a-zA-Z]+/);
    if (letters?.[0]) {
      const raw = letters[0];
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    }
    return local;
  }
  return "Athlete";
}

export default function Header() {
  const { user, loading } = useAuth();

  const userName     = loading ? null : resolveUserName(user?.displayName ?? null, user?.email ?? null);
  const avatarLetter = userName ? userName.charAt(0).toUpperCase() : null;

  return (
    <div className="flex items-center justify-between pt-1 pb-2">
      {/* Left: greeting */}
      <div>
        <p className="text-white/20 text-[10px] font-bold tracking-[0.32em] uppercase mb-2">
          Performance Dashboard
        </p>
        <h1 className="text-[28px] font-black text-white tracking-tight leading-none">
          {loading ? (
            <>
              Welcome back,{" "}
              <span className="inline-block w-28 h-7 bg-white/[0.06] rounded-lg animate-pulse align-middle" />
            </>
          ) : (
            <>
              Welcome back,{" "}
              <span style={{ color: "#10b981" }}>{userName}</span>.
            </>
          )}
        </h1>
      </div>

      {/* Right: status + avatar */}
      <div className="flex items-center gap-3">
        {/* Status pill */}
        <div
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
          style={{
            background:  "rgba(255,255,255,0.04)",
            border:      "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background:  "#10b981",
              boxShadow:   "0 0 6px rgba(16,185,129,0.9)",
            }}
          />
          <span className="text-white/50 text-[11px] font-medium tracking-wide">
            Optimal Recovery
          </span>
        </div>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-black font-black text-sm flex-shrink-0"
          style={{
            background:  "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            boxShadow:   "0 0 16px rgba(16,185,129,0.28)",
          }}
        >
          {loading ? (
            <span className="w-4 h-4 rounded-full bg-black/20 animate-pulse" />
          ) : (
            avatarLetter
          )}
        </div>
      </div>
    </div>
  );
}
