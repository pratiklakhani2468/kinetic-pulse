"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { User, AtSign, Lock, Eye, EyeOff } from "lucide-react";

interface Props {
  onSwitch: () => void;
}

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
}

function validate(name: string, email: string, password: string): Errors {
  const errors: Errors = {};
  if (!name.trim()) errors.name = "Name is required.";
  if (!email) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
  if (!password) errors.password = "Password is required.";
  else if (password.length < 6) errors.password = "Minimum 6 characters.";
  return errors;
}

export default function SignUpForm({ onSwitch }: Props) {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [errors, setErrors]     = useState<Errors>({});
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(name, email, password);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name.trim() });
      router.replace("/dashboard");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      const msg =
        code === "auth/email-already-in-use" ? "An account with this email already exists." :
        code === "auth/weak-password"        ? "Password is too weak." :
                                               "Sign-up failed. Please try again.";
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  }

  function clear(field: keyof Errors) {
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  const fields = [
    {
      key: "name" as const,
      label: "Full Name",
      type: "text",
      value: name,
      onChange: (v: string) => { setName(v); clear("name"); },
      placeholder: "Alex Rivera",
      Icon: User,
      error: errors.name,
    },
    {
      key: "email" as const,
      label: "Email",
      type: "email",
      value: email,
      onChange: (v: string) => { setEmail(v); clear("email"); },
      placeholder: "you@example.com",
      Icon: AtSign,
      error: errors.email,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex items-center justify-center px-4">
      {/* Subtle background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#4a8cff]/4 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-primary font-black italic text-2xl tracking-tight">
            The Kinetic Atelier
          </h1>
          <p className="text-[#4b5563] text-[10px] tracking-[0.3em] uppercase mt-1.5">
            Create your account
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
              {/* Name + Email */}
              {fields.map(({ key, label, type, value, onChange, placeholder, Icon, error }) => (
                <div key={key}>
                  <label className="text-[#6b7280] text-[10px] tracking-[0.2em] uppercase font-semibold block mb-2">
                    {label}
                  </label>
                  <div className={`flex items-center gap-3 bg-[#171714] border rounded-xl px-4 py-3 transition-colors ${
                    error
                      ? "border-[#ff7043]/50"
                      : "border-[#222218] focus-within:border-primary/30"
                  }`}>
                    <Icon size={14} className="text-[#4b5563] flex-shrink-0" />
                    <input
                      type={type}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder={placeholder}
                      className="bg-transparent text-white text-sm placeholder-[#4b5563] outline-none w-full"
                    />
                  </div>
                  {error && <p className="text-[#ff7043] text-xs mt-1.5 pl-1">{error}</p>}
                </div>
              ))}

              {/* Password */}
              <div>
                <label className="text-[#6b7280] text-[10px] tracking-[0.2em] uppercase font-semibold block mb-2">
                  Password
                </label>
                <div className={`flex items-center gap-3 bg-[#171714] border rounded-xl px-4 py-3 transition-colors ${
                  errors.password
                    ? "border-[#ff7043]/50"
                    : "border-[#222218] focus-within:border-primary/30"
                }`}>
                  <Lock size={14} className="text-[#4b5563] flex-shrink-0" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clear("password"); }}
                    placeholder="Min. 6 characters"
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
                {errors.password && (
                  <p className="text-[#ff7043] text-xs mt-1.5 pl-1">{errors.password}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase bg-primary hover:bg-primary/90 text-primary-foreground transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
        </div>

        {/* Switch */}
        <p className="text-center text-[#4b5563] text-sm mt-6">
          Already have an account?{" "}
          <button onClick={onSwitch} className="text-primary font-semibold hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
