"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AtSign, Lock, Eye, EyeOff } from "lucide-react";

interface Props {
  onSwitch: () => void;
}

interface Errors {
  email?: string;
  password?: string;
  form?: string;
}

function validate(email: string, password: string): Errors {
  const errors: Errors = {};
  if (!email) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  if (!password) errors.password = "Password is required.";
  return errors;
}

export default function LoginForm({ onSwitch }: Props) {
  const router = useRouter();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [errors, setErrors]       = useState<Errors>({});
  const [loading, setLoading]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(email, password);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      const msg =
        code === "auth/user-not-found"    ? "No account found with this email." :
        code === "auth/wrong-password"    ? "Incorrect password." :
        code === "auth/invalid-credential"? "Invalid email or password." :
        code === "auth/too-many-requests" ? "Too many attempts. Try again later." :
                                           "Sign-in failed. Please try again.";
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center px-4">
      {/* Subtle background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-primary font-black italic text-2xl tracking-tight">
            The Kinetic Atelier
          </h1>
          <p className="text-[#4b5563] text-[10px] tracking-[0.3em] uppercase mt-1.5">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111110] border border-[#1e1e1a] rounded-2xl px-7 py-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {errors.form && (
                <p className="text-[#ff7043] text-xs text-center bg-[#ff7043]/10 border border-[#ff7043]/20 rounded-xl px-3 py-2">
                  {errors.form}
                </p>
              )}
              {/* Email */}
              <div>
                <label className="text-[#6b7280] text-[10px] tracking-[0.2em] uppercase font-semibold block mb-2">
                  Email
                </label>
                <div className={`flex items-center gap-3 bg-[#171714] border rounded-xl px-4 py-3 transition-colors ${
                  errors.email
                    ? "border-[#ff7043]/50"
                    : "border-[#222218] focus-within:border-primary/30"
                }`}>
                  <AtSign size={14} className="text-[#4b5563] flex-shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                    placeholder="you@example.com"
                    className="bg-transparent text-white text-sm placeholder-[#4b5563] outline-none w-full"
                  />
                </div>
                {errors.email && <p className="text-[#ff7043] text-xs mt-1.5 pl-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[#6b7280] text-[10px] tracking-[0.2em] uppercase font-semibold">
                    Password
                  </label>
                  <button type="button" className="text-[#4b5563] hover:text-[#9ca3af] text-xs transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className={`flex items-center gap-3 bg-[#171714] border rounded-xl px-4 py-3 transition-colors ${
                  errors.password
                    ? "border-[#ff7043]/50"
                    : "border-[#222218] focus-within:border-primary/30"
                }`}>
                  <Lock size={14} className="text-[#4b5563] flex-shrink-0" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                    placeholder="••••••••"
                    className="bg-transparent text-white text-sm placeholder-[#4b5563] outline-none w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="text-[#4b5563] hover:text-[#9ca3af] transition-colors flex-shrink-0"
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && <p className="text-[#ff7043] text-xs mt-1.5 pl-1">{errors.password}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase bg-primary hover:bg-primary/90 text-primary-foreground transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
        </div>

        {/* Switch */}
        <p className="text-center text-[#4b5563] text-sm mt-6">
          Don&apos;t have an account?{" "}
          <button onClick={onSwitch} className="text-primary font-semibold hover:underline">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
