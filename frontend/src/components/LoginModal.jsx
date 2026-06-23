import { useState } from "react";
import { Video, Mail, Lock, ShieldCheck, ArrowRight, X } from "lucide-react";

export default function LoginModal({ onClose = () => {}, onSubmit = () => {} }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit({ email, password });
    } catch (err) {
      setError(err?.message || "Credenziali non valide. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-sm rounded-xl border border-blue-100 bg-white shadow-xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
          title="Close"
        >
          <X size={16} />
        </button>

        <div className="px-6 pt-7 pb-6">
          {/* Brand */}
          <div className="mb-5 flex items-center justify-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Video size={16} strokeWidth={2.25} />
            </span>
            <p className="text-sm font-bold text-blue-600">Lumina</p>
            <span className="text-sm font-semibold text-blue-600 border-l border-blue-100 pl-2.5">
              Console
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-center text-lg font-bold text-slate-900">
            Consultant Portal
          </h1>
          <p className="mt-1 text-center text-xs text-slate-500">
            Enter your credentials to access the secure stream.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div>
              <label
                htmlFor="login-email"
                className="mb-1 block text-xs font-medium text-slate-700"
              >
                Employee Email
              </label>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <Mail size={16} className="text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@lumina.com"
                  className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-xs font-medium text-slate-700"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <Lock size={16} className="text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-2.5 py-2 text-xs font-medium text-blue-700">
              <ShieldCheck size={14} className="text-blue-600 shrink-0" />
              Session encrypted with 128-bit AES
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign In"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-600">
            Don&apos;t have an account?{" "}
            <a href="#" className="font-semibold text-blue-600 hover:text-blue-700">
              Request Access
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}