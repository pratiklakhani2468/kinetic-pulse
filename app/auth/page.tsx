"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import SignUpForm from "@/components/auth/SignUpForm";
import { useAuth } from "@/lib/AuthContext";

export type AuthMode = "login" | "signup";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");

  // Redirect already-authenticated users to the dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Don't flash the auth form while we check the session
  if (loading || user) return null;

  return mode === "login" ? (
    <LoginForm onSwitch={() => setMode("signup")} />
  ) : (
    <SignUpForm onSwitch={() => setMode("login")} />
  );
}
