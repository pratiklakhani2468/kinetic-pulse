"use client";

/**
 * /landing is now the canonical root path (/).
 * Redirect old bookmarks so they don't 404.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return null;
}
