import { useNavigate } from "react-router-dom";
import { Video, ShieldCheck, ArrowRight, Clock } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md text-center">
        {/* Brand */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Video size={20} strokeWidth={2.25} />
          </span>
          <p className="text-sm font-bold text-blue-600">Lumina</p>
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          La tua consulenza video
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Parla con un consulente in tempo reale, in tutta sicurezza, direttamente dal browser.
        </p>

        {/* Feature pills */}
        <div className="mt-7 flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-lg bg-white border border-blue-100 px-4 py-3 text-left text-sm text-slate-700">
            <ShieldCheck size={18} className="shrink-0 text-blue-600" />
            Sessione cifrata end-to-end con AES a 128 bit
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-white border border-blue-100 px-4 py-3 text-left text-sm text-slate-700">
            <Clock size={18} className="shrink-0 text-blue-600" />
            Tempo di attesa medio: meno di 3 minuti
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => navigate("/consent")}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Start video call
          <ArrowRight size={16} />
        </button>

        <p className="mt-4 text-xs text-slate-400">
          Procedendo accetti di leggere i termini del servizio nella schermata successiva.
        </p>
      </div>
    </div>
  );
}