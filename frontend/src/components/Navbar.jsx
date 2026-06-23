import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSignaling } from "../hooks/useSignaling";
import { Bell, HelpCircle, User } from "lucide-react";
import LoginModal from "./LoginModal";
import { useAgentAuth } from "../context/AgentAuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/agent/dashboard", enabled: true },
  { label: "Analytics", to: "#", enabled: false },
  { label: "Queue", to: "/console", enabled: true },
  { label: "Settings", to: "#", enabled: false },
];

export default function Navbar() {
  const [availability, setAvailability] = useState("Online");
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAgentAuth();
  const { send } = useSignaling();

  const handleLoginSubmit = async ({ email, password }) => {
    await login(email, password);
    setShowLogin(false);
    navigate("/agent/dashboard");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-indigo-100 bg-white w-full">
      <div className="flex h-12 items-center justify-between px-5 gap-6">
        {/* Left - Console + Nav Tabs */}
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold text-blue-600">Console</span>

          <nav className="flex items-center gap-5">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <button
                  key={item.label}
                  disabled={!item.enabled}
                  onClick={() => item.enabled && navigate(item.to)}
                  className={`text-xs font-medium pb-1 border-b-2 transition-all ${
                    isActive
                      ? "border-blue-600 text-blue-600 font-semibold"
                      : item.enabled
                      ? "border-transparent text-slate-700 hover:text-slate-900"
                      : "border-transparent text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right - Status, Icons */}
        <div className="flex items-center gap-3">
          {/* Status Toggle */}
          <div className="flex items-center gap-0.5 rounded-md bg-slate-100 p-0.5">
            {["Online", "Busy", "Offline"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setAvailability(option);
                  if (option === "Online") {
                    send("consultant_available", null, {});
                  }
                }}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  availability === option
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
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            title="Notifications"
          >
            <Bell size={15} />
          </button>

          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            title="Help"
          >
            <HelpCircle size={15} />
          </button>

          <button
            type="button"
            onClick={() => setShowLogin(true)}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-300 text-white ring-2 ring-white hover:bg-slate-400 transition"
            title="Profile"
          >
            <User size={14} />
          </button>
        </div>
      </div>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSubmit={handleLoginSubmit}
        />
      )}
    </header>
  );
}