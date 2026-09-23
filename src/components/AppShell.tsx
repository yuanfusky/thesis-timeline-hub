import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Briefcase, LayoutDashboard, Menu, X } from "lucide-react";

import { AddJobDialog } from "@/components/AddJobDialog";
import { BackupMenu } from "@/components/BackupMenu";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[232px_1fr]">
      <aside
        className={cn(
          "z-40 flex flex-col border-r border-border bg-sidebar lg:sticky lg:top-0 lg:h-screen",
          navOpen ? "fixed inset-y-0 left-0 w-60" : "hidden lg:flex",
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <div className="text-sm font-semibold tracking-tight">Master Thesis</div>
            <div className="text-xs text-muted-foreground">Tracker</div>
          </div>
          <button
            className="text-muted-foreground lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setNavOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <p className="px-5 pb-3 pt-4 text-[11px] leading-relaxed text-muted-foreground">
          Job → Application → Timeline of events
        </p>
        <BackupMenu />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-5 py-3.5 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="text-muted-foreground lg:hidden"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          <AddJobDialog />
        </header>
        <main className="min-w-0 flex-1 px-5 py-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
