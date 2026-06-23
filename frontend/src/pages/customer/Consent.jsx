import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Consent() {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  const handleProceed = () => {
    if (!accepted) return;
    navigate("/waiting-room");
  };

  const handleDecline = () => {
    navigate("/");
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="px-8 pt-8 pb-5 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900">
            Termini della Consulenza
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Leggi e accetta i nostri termini prima di entrare nella diretta.
          </p>
        </div>

        {/* Body - scrollable terms */}
        <div className="max-h-96 overflow-y-auto px-8 py-6 space-y-5 text-sm leading-relaxed text-slate-700">
          <p>
            <span className="font-semibold text-slate-900">1. Privacy e Sicurezza:</span>{" "}
            La tua consulenza si svolge tramite una connessione peer-to-peer
            sicura e cifrata. Il video è a senso unico (Consulente verso
            Cliente) a meno che tu non scelga di attivare la tua videocamera
            durante la sessione.
          </p>
          <p>
            <span className="font-semibold text-slate-900">2. Conservazione dei Dati:</span>{" "}
            Per garantire la qualità del servizio e per scopi formativi,
            l'audio di questa sessione potrebbe essere trascritto. Non
            conserviamo dati biometrici del volto né registriamo il flusso
            video, a meno che tu non lo autorizzi esplicitamente.
          </p>
          <p>
            <span className="font-semibold text-slate-900">3. Politica di Condotta:</span>{" "}
            Manteniamo una politica di tolleranza zero verso molestie o
            comportamenti inappropriati. Le sessioni possono essere
            interrotte immediatamente se i nostri consulenti si sentono in
            pericolo.
          </p>
          <p>
            <span className="font-semibold text-slate-900">4. Consulenza Professionale:</span>{" "}
            Le consulenze forniscono informazioni sui prodotti e assistenza
            generale. Durante queste sessioni non viene fornita alcuna
            consulenza finanziaria, legale o medica.
          </p>
          <p>
            Procedendo, dichiari di avere almeno 18 anni e di accettare il
            quadro globale sulla privacy di Lumina Direct.
          </p>
        </div>

        {/* Footer - checkbox + actions */}
        <div className="rounded-b-2xl bg-indigo-50 px-8 py-6">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Ho letto e accetto i Termini e Condizioni e prendo atto
            dell'Informativa sulla Privacy.
          </label>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={handleDecline}
              className="flex-1 rounded-lg bg-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300"
            >
              Rifiuta
            </button>
            <button
              type="button"
              onClick={handleProceed}
              disabled={!accepted}
              className="flex-1 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Vai alla Sala d'Attesa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}