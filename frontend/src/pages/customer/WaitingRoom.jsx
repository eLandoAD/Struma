import { useEffect, useState } from "react";
import { useSignaling } from "../../hooks/useSignaling";

export default function WaitingRoom() {
  const { connected, send, on } = useSignaling();
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | queued | assigned | missed

  useEffect(() => {
    if (!connected) return;

    const offQueued = on("queued", (_, sid) => {
      setSessionId(sid);
      setStatus("queued");
    });

    const offAssigned = on("call_assigned", () => {
      setStatus("assigned");
    });

    const offMissed = on("missed", () => {
      setStatus("missed");
    });

    // Avvia subito la richiesta quando la connessione è pronta.
    // sourcePage è un placeholder; andrà sostituito con il contesto reale
    // (pagina/prodotto da cui parte la chiamata) quando si integra con
    // la landing/consent page.
    send("join_queue", null, { sourcePage: window.location.pathname || "unknown" });

    return () => {
      offQueued();
      offAssigned();
      offMissed();
    };
  }, [connected]);

  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold">Waiting Room</h1>

      {status === "idle" && (
        <p className="mt-4 text-[var(--color-text-dim)]">Connessione al server...</p>
      )}
      {status === "queued" && (
        <p className="mt-4 text-[var(--color-text-dim)]">
          In coda, in attesa di un consulente... (sessionId: {sessionId})
        </p>
      )}
      {status === "assigned" && (
        <p className="mt-4 text-[var(--color-text-dim)]">
          Consulente assegnato — chiamata in corso (qui andrà il componente video).
        </p>
      )}
      {status === "missed" && (
        <p className="mt-4 text-red-500">
          Nessun consulente disponibile al momento. (qui andrà il form di contatto fallback)
        </p>
      )}
    </div>
  );
}