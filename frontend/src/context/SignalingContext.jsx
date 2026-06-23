import { createContext, useCallback, useEffect, useRef, useState } from "react";

function resolveWsUrl() {
  const wsProtocol = location.protocol === "https:" ? "wss://" : "ws://";

  // Codespaces: ogni porta ha il suo sottodominio, es.
  // ...-5173.app.github.dev (frontend, Vite) vs ...-8080.app.github.dev (backend)
  if (location.host.endsWith(".app.github.dev")) {
    const backendHost = location.host.replace(/-\d+\.app\.github\.dev$/, "-8080.app.github.dev");
    return `${wsProtocol}${backendHost}/ws/signal`;
  }

  // Sviluppo locale: stesso host, porta diversa.
  return `${wsProtocol}${location.hostname}:8080/ws/signal`;
}

export const SignalingContext = createContext(null);

/**
 * Possiede l'UNICA connessione WebSocket condivisa da tutta l'app.
 * Va montato una sola volta, in alto nell'albero (vedi App.jsx).
 *
 * IMPORTANTE: NON apre più la connessione automaticamente al mount.
 * Bisogna chiamare connect() esplicitamente — es. solo dopo che
 * l'utente ha accettato i Termini & Condizioni (brief 3.1) — così
 * nessun socket parte prima del consenso.
 */
export function SignalingProvider({ children }) {
  const wsRef = useRef(null);
  const listenersRef = useRef({});
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    // Idempotente: se è già aperta o in apertura, non ne crea un'altra.
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
      return;
    }

    const ws = new WebSocket(resolveWsUrl());
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const handlers = listenersRef.current[msg.type] || [];
      handlers.forEach((h) => h(msg.payload, msg.sessionId));
    };
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  // Chiude il socket quando l'intera app viene smontata (es. refresh/tab chiusa).
  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  const send = useCallback((type, sessionId, payload = {}) => {
    wsRef.current?.send(JSON.stringify({ type, sessionId, payload }));
  }, []);

  const on = useCallback((type, handler) => {
    listenersRef.current[type] = [...(listenersRef.current[type] || []), handler];
    return () => {
      listenersRef.current[type] = listenersRef.current[type].filter((h) => h !== handler);
    };
  }, []);

  return (
    <SignalingContext.Provider value={{ connected, connect, disconnect, send, on }}>
      {children}
    </SignalingContext.Provider>
  );
}