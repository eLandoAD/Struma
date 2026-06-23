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
      className={`flex h-full flex-col border-r border-indigo-100 bg-indigo-50/60 p-3 transition-all ${
        collapsed ? "w-14" : "w-52"
      }`}
    >
      {/* Top: logo + collapse toggle */}
      <div className="mb-6 flex items-center gap-2 px-1">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
          <Video size={14} strokeWidth={2.25} />
        </span>
        {!collapsed && (
          <span className="text-sm font-bold text-slate-900">Lumina</span>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-indigo-100 hover:text-slate-700 focus:outline-none"
        >
          <PanelLeft size={12} />
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
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-slate-600 hover:bg-indigo-100 hover:text-slate-900"
              }`}
            >
              <item.icon size={14} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Support button */}
      <button
        onClick={() => onNavigate("support")}
        title={collapsed ? "Support" : undefined}
        className="mb-3 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-indigo-100 hover:text-slate-900 transition-all"
      >
        <LifeBuoy size={14} className="shrink-0" />
        {!collapsed && <span className="truncate">Support</span>}
      </button>

      {/* Secure session card + End Consultation */}
      {!collapsed && (
        <div className="rounded-md border border-indigo-100 bg-white p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <span className="text-xs font-semibold text-slate-900">Secure Session</span>
          </div>
          <p className="mb-2 text-[11px] text-slate-500">{encryptionLabel}</p>

          <button
            onClick={onEndConsultation}
            className="w-full rounded-md bg-red-600 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 active:bg-red-800"
          >
            End Consultation
          </button>
        </div>
      )}
    </aside>
  );
}