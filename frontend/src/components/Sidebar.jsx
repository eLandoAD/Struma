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
      className={`flex h-full flex-col border-r border-blue-100 bg-blue-50 p-4 transition-all ${
        collapsed ? "w-16" : "w-48"
      }`}
    >
      {/* Top: logo + collapse toggle */}
      <div className="mb-8 flex items-center justify-between gap-2">
        {!collapsed && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
            L
          </span>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 hover:bg-blue-100 hover:text-blue-700 focus:outline-none"
        >
          <PanelLeft size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeItem;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              title={collapsed ? item.label : undefined}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-700 hover:bg-blue-100 hover:text-blue-700"
              }`}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Support button */}
      <button
        onClick={() => onNavigate("support")}
        title={collapsed ? "Support" : undefined}
        className="mb-4 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-blue-100 hover:text-blue-700 transition-all"
      >
        <LifeBuoy size={18} className="shrink-0" />
        {!collapsed && <span className="truncate">Support</span>}
      </button>

      {/* Secure session card + End Consultation */}
      {!collapsed && (
        <div className="rounded-lg border border-blue-200 bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-900">Secure Session</span>
          </div>
          <p className="mb-3 text-xs text-slate-600">{encryptionLabel}</p>

          <button
            onClick={onEndConsultation}
            className="w-full rounded-lg bg-red-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 active:bg-red-800"
          >
            End Consultation
          </button>
        </div>
      )}
    </aside>
  );
}