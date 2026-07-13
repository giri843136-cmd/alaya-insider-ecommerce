/**
 * ALAYA INSIDER — Workspace Switcher Component (PART 3.6)
 * ------------------------------------------------------------------
 * Workspace navigation, quick switching, and workspace management.
 */
import { useMemo, useState } from "react";
import { LayoutDashboard, ShoppingBag, Megaphone, Newspaper, Handshake, Search, Code2, Smile, DollarSign, Settings, ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";
import { getWorkspaces, getActiveWorkspace, setActiveWorkspace } from "../../lib/adminPortal";

const ICON_MAP: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard, ShoppingBag, Megaphone, Newspaper, Handshake,
  Search, Code2, Smile, DollarSign, Settings,
};

/* ------------------------------------------------------------------ */
/*  Workspace Tab Bar                                                  */
/* ------------------------------------------------------------------ */

export function WorkspaceTabBar() {
  const [open, setOpen] = useState(false);
  const activeType = getActiveWorkspace();
  const workspaces = useMemo(() => getWorkspaces(), []);
  const pinnedWorkspaces = workspaces.filter((w) => w.pinned);

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto">
      {pinnedWorkspaces.map((ws) => {
        const Icon = ICON_MAP[ws.icon] || LayoutDashboard;
        const isActive = ws.type === activeType;
        return (
          <button
            key={ws.id}
            onClick={() => { setActiveWorkspace(ws.type); setOpen(false); }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              isActive ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface2 hover:text-ink"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {ws.name}
          </button>
        );
      })}
      <button onClick={() => setOpen(!open)} className="btn-ghost btn-xs"><ChevronDown className="h-3.5 w-3.5" /></button>
      {open && (
        <div className="card absolute left-4 top-full z-50 mt-1 w-56 animate-scale-in origin-top-left">
          {workspaces.map((ws) => {
            const Icon = ICON_MAP[ws.icon] || LayoutDashboard;
            return (
              <button key={ws.id} onClick={() => { setActiveWorkspace(ws.type); setOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface2">
                <Icon className="h-4 w-4 text-muted" />
                <span className="flex-1 text-ink">{ws.name}</span>
                <span className="text-[0.55rem] text-muted">{ws.pinned ? "Pinned" : ""}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
