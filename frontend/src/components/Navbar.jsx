import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSignaling } from "../hooks/useSignaling";
import {
  Bell,
  HelpCircle,
  User,
  Video,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/agent/dashboard", enabled: true },
  { label: "Analytics", to: "#", enabled: false },
  { label: "Queue", to: "#", enabled: false },
  { label: "Settings", to: "#", enabled: false },
];

export default function Navbar() {
  const [availability, setAvailability] = useState("Online");
  const location = useLocation();
  const navigate = useNavigate();
  const { send } = useSignaling();

  return (
    <header className="sticky top-0 z-20 border-b border-blue-100 bg-white w-full">
      <div className="flex h-16 items-center justify-between px-6 gap-8">
        {/* Left - Logo + Lumina + Console */}
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Video size={20} strokeWidth={2.25} />
          </span>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-bold text-blue-600">Lumina</p>
            </div>
            <span className="text-sm font-semibold text-blue-600 border-l border-blue-100 pl-4">Console</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-2 border-l border-blue-100 pl-8">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <button
                  key={item.label}
                  disabled={!item.enabled}
                  onClick={() => item.enabled && navigate(item.to)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive
                      ? "bg-blue-100 text-blue-700"
                      : item.enabled
                        ? "text-slate-700 hover:bg-blue-100 hover:text-blue-700"
                        : "text-slate-400 cursor-not-allowed"
                    }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right - Status, Icons */}
        <div className="flex items-center gap-6">
          {/* Status Toggle */}
          <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1">
            {['Online', 'Busy', 'Offline'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setAvailability(option);
                  if (option === "Online") {
                    send("consultant_available", null, {});
                  }
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${availability === option
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                {option}
              </button>
            ))}
          </div>

          {/* Icons */}
          <button
            type="button"
            className="text-slate-600 hover:text-slate-900 transition"
            title="Notifications"
          >
            <Bell size={20} />
          </button>

          <button
            type="button"
            className="text-slate-600 hover:text-slate-900 transition"
            title="Help"
          >
            <HelpCircle size={20} />
          </button>

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-white"
            title="Profile"
          >
            <User size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
