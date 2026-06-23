import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, ShieldCheck, ArrowRight } from "lucide-react";

const TERMS = [
  "La sessione video sarà cifrata end-to-end e non verrà registrata senza il tuo consenso esplicito.",
  "I dati condivisi durante la consulenza sono trattati secondo la nostra informativa privacy.",
  "Puoi interrompere la sessione in qualsiasi momento dal pulsante 'Termina consulenza'.",
  "Il consulente potrà visualizzare il tuo nome, l'orario di prenotazione e le note che fornisci.",
];

export default function Consent() {
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (!accepted) return;
    navigate("/waiting-room");
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white shadow-xl">
        <div className="px-8 pt-10 pb-8">
          {/* Brand */}
          <div className="mb-8 flex items-center justify-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Video size={20} strokeWidth={2.25} />
            </span>
            <p className="text-sm font-bold text-blue-600">Lumina</p>
          </div>

          {/* Heading */}
          <h1 className="text-center text-2xl font-bold text-slate-900">
            Termini e Condizioni
          </h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            Prima di entrare nella sala d'attesa, leggi e accetta i seguenti punti.
          </p>

          {/* Terms list */}
          <ul className="mt-7 space-y-3">
            {TERMS.map((term, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
              >
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                {term}
              </li>
            ))}
          </ul>

          {/* Encryption note */}
          <div className="mt-5 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700">
            <ShieldCheck size={16} className="text-blue-600" />
            Sessione protetta con cifratura AES a 128 bit
          </div>

          {/* Checkbox */}
          <label className="mt-6 flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Ho letto e accetto i termini e le condizioni del servizio.
          </label>

          {/* Continue button */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={!accepted}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Accetta e continua
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}