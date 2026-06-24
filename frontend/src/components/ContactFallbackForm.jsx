import { useState } from "react";
import { Mail, User, MessageSquare, Send, CheckCircle2 } from "lucide-react";

/**
 * Form di contatto fallback (brief 3.7).
 * Mostrato quando WaitingRoom riceve l'evento "missed" — nessun
 * consulente disponibile in quel momento.
 *
 * Componente "dumb": non sa nulla di WebSocket/API. Chi lo integra
 * passa una funzione onSubmit({ name, email, message }) che decide
 * come spedire i dati (fetch REST, email, ecc.).
 *
 * Uso minimo:
 *   <ContactFallbackForm onSubmit={(data) => fetch("/api/contact-fallback", {...})} />
 */
export default function ContactFallbackForm({ onSubmit = () => {}, sessionId = null }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim()) {
      setError("Nome ed email sono obbligatori.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name, email, message, sessionId });
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || "Invio non riuscito. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto mt-6 max-w-sm rounded-xl border border-blue-100 bg-white p-6 text-center shadow-sm">
        <CheckCircle2 size={32} className="mx-auto text-blue-600" />
        <h3 className="mt-3 text-base font-bold text-slate-900">
          Richiesta inviata
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Ti contatteremo appena possibile all'indirizzo che hai indicato.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-6 max-w-sm rounded-xl border border-blue-100 bg-white p-6 text-left shadow-sm"
    >
      <h3 className="text-base font-bold text-slate-900">
        Lasciaci i tuoi contatti
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Nessun consulente disponibile in questo momento — ti richiameremo noi.
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Nome
          </label>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <User size={16} className="text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Il tuo nome"
              className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Email
          </label>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <Mail size={16} className="text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@esempio.com"
              className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Messaggio (opzionale)
          </label>
          <div className="flex items-start gap-2 rounded-md border border-slate-200 px-3 py-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
            <MessageSquare size={16} className="mt-0.5 text-slate-400" />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descrivi brevemente di cosa hai bisogno..."
              rows={3}
              className="w-full resize-none text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            />
          </div>
        </div>

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Invio in corso…" : "Invia richiesta"}
          {!submitting && <Send size={15} />}
        </button>
      </div>
    </form>
  );
}