import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  LayoutDashboard,
  BarChart3,
  ListChecks,
  Settings2,
  Video,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/agent/dashboard", icon: LayoutDashboard, enabled: true },
  { label: "Analytics", to: "#", icon: BarChart3, enabled: false },
  { label: "Queue", to: "#", icon: ListChecks, enabled: false },
  { label: "Settings", to: "#", icon: Settings2, enabled: false },
];

export default function Navbar() {
  const [availability, setAvailability] = useState("Online");
  const location = useLocation();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
            <Video size={20} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Lumina</p>
            <p className="text-base font-semibold text-slate-950">Consultant Console</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-full bg-slate-100 px-2 py-2 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = item.enabled && location.pathname === item.to;
            const content = (
              <span className="flex items-center gap-2">
                <item.icon size={16} className="shrink-0" />
                <span>{item.label}</span>
              </span>
            );

            return item.enabled ? (
              <Link
                key={item.label}
                to={item.to}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:bg-white hover:text-slate-950"
                }`}
              >
                {content}
              </Link>
            ) : (
              <span
                key={item.label}
                className="inline-flex cursor-not-allowed items-center rounded-full px-4 py-2 text-sm font-medium text-slate-400"
                title="Coming soon"
              >
                {content}
              </span>
            );
          })}
        </nav>

        <div className="flex flex-1 flex-col items-end gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
            {['Online', 'Busy', 'Offline'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setAvailability(option)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  availability === option
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300"
          >
            <Bell size={18} />
            Activity
          </button>
        </div>
      </div>
    </header>
  );
}
