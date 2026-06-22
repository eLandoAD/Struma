import { useState } from "react";
import {
  Video,
  MessageSquare,
  FileText,
  User,
  History,
  LifeBuoy,
  PanelLeft,
} from "lucide-react";

/**
 * Sidebar — Consultant Console.
 *
 * Plain JSX, pure Tailwind utility classes — no custom CSS variables,
 * no extra stylesheet needed. Drop it into any Tailwind-enabled React
 * project as-is.
 *
 * Only "Live Stream" is wired as active/enabled by default; the other
 * nav items render disabled, matching the mockup, until their pages exist.
 */

const NAV_ITEMS = [
  { key: "live-stream", label: "Live Stream", icon: Video, enabled: true },
  { key: "chat", label: "Chat", icon: MessageSquare, enabled: false },
  { key: "files", label: "Files", icon: FileText, enabled: false },
  { key: "customer-info", label: "Customer Info", icon: User, enabled: false },
  { key: "history", label: "History", icon: History, enabled: false },
];

export default function Sidebar({
  activeItem = "live-stream",
  onNavigate = () => {},
  onEndConsultation = () => {},
  encryptionLabel = "128-bit Encrypted",
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex h-full flex-col border-r border-slate-800 bg-slate-950 p-4 transition-all ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Top: collapse toggle + logo mark */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <PanelLeft size={16} />
        </button>
        {!collapsed && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Video size={16} strokeWidth={2.25} />
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeItem;
          return (
            <button
              key={item.key}
              disabled={!item.enabled}
              onClick={() => item.enabled && onNavigate(item.key)}
              title={collapsed ? item.label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isActive
                  ? "bg-blue-500/10 text-blue-400"
                  : item.enabled
                  ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                  : "cursor-not-allowed text-slate-600"
              }`}
            >
              <item.icon size={16} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Support, pinned above the secure-session card */}
      <button
        onClick={() => onNavigate("support")}
        title={collapsed ? "Support" : undefined}
        className="mb-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <LifeBuoy size={16} className="shrink-0" />
        {!collapsed && <span>Support</span>}
      </button>

      {/* Secure session card + End Consultation */}
      {!collapsed && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Secure Session
          </div>
          <p className="mt-0.5 text-xs text-slate-400">{encryptionLabel}</p>

          <button
            onClick={onEndConsultation}
            className="mt-3 w-full rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            End Consultation
          </button>
        </div>
      )}
    </aside>
  );
}