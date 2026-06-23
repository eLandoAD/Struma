import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import { AgentAuthProvider } from "./context/AgentAuthContext";
import { ProtectedAgentRoute } from "./components/ProtectedAgentRoute";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import { Button } from "./components/Button";
import { Logo } from "./components/Logo";
import { StatusToggle } from "./components/StatusToggle";
import { SignalingProvider } from "./context/SignalingContext";


import Landing from "./pages/customer/Landing";
import Consent from "./pages/customer/Consent";
import WaitingRoom from "./pages/customer/WaitingRoom";
import CallView from "./pages/customer/CallView";
import Console from "./pages/agent/Console";

import AgentLogin from "./pages/agent/Login";
import AgentDashboard from "./pages/agent/Dashboard";

function ComponentsDemo() {
  const [status, setStatus] = useState("ONLINE");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <Link className="text-sm font-semibold text-sky-500 hover:text-sky-400" to="/">
          Back home
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/30">
        <h1 className="text-2xl font-semibold text-white">Component Preview</h1>
        <div className="mt-6 flex flex-wrap gap-4">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="mt-6 space-y-2 text-sm text-slate-300">
          <span>Agent status control</span>
          <StatusToggle value={status} onChange={setStatus} />
        </div>
      </div>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeItem = location.pathname === "/agent/dashboard" ? "live-stream" : "";

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Assicurati che i puntini di sospensione "..." siano spariti da qui sotto: */}
      <Sidebar
        activeItem={activeItem}
        onNavigate={(key) => {
          if (key === "live-stream" || key === "support") {
            navigate("/agent/dashboard");
          }
        }}
        onEndConsultation={() => navigate("/")}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/components" element={<ComponentsDemo />} />

            {/* Customer flow */}
            <Route path="/" element={<Landing />} />
            <Route path="/consent" element={<Consent />} />
            <Route path="/waiting-room" element={<WaitingRoom />} />
            <Route path="/call" element={<CallView />} />

            {/* Agent console */}
            <Route path="/agent/login" element={<AgentLogin />} />
            <Route
              path="/agent/dashboard"
              element={
                <ProtectedAgentRoute>
                  <AgentDashboard />
                </ProtectedAgentRoute>
              }
            />
            <Route path="/console" element={<ProtectedAgentRoute><Console /></ProtectedAgentRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AgentAuthProvider>
      <SignalingProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </SignalingProvider>
    </AgentAuthProvider>
  );
}
