"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Zap,
  LayoutDashboard,
  Dumbbell,
  Activity,
  BarChart2,
  LogOut,
  Play,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/training",  label: "Training",  icon: Dumbbell },
  { href: "/workout",   label: "Workout",   icon: Activity },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await signOut(auth);
    router.push("/");
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/40 bg-card flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border/40">
        <div className="p-1.5 rounded-lg bg-primary">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="font-black text-sm tracking-widest text-foreground leading-none">KINETIC</p>
          <p className="text-muted-foreground text-[10px] tracking-widest mt-0.5">PULSE</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navItems.map((item) => {
          const Icon   = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                  active
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Start Session CTA */}
      <div className="px-4 pb-4">
        <Link
          href="/workout"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
        >
          <Play className="h-4 w-4 fill-current" />
          Start Session
        </Link>
      </div>

      {/* Logout */}
      <div className="border-t border-border/40 p-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
