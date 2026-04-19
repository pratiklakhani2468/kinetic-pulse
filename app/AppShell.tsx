"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

// Exact-match routes — sidebar hidden on these paths only (not their children)
const NO_SIDEBAR_EXACT = ["/", "/landing"];

// Prefix-match routes — sidebar hidden on these paths AND any sub-path
const NO_SIDEBAR_PREFIX = ["/auth"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar =
    !NO_SIDEBAR_EXACT.includes(pathname) &&
    !NO_SIDEBAR_PREFIX.some((r) => pathname.startsWith(r));

  if (!showSidebar) return <>{children}</>;

  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
