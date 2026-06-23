import { useEffect, useRef, useState, useCallback } from "react";

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

export function useSignaling() {
  const wsRef = useRef(null);
  const listenersRef = useRef({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(resolveWsUrl());
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const handlers = listenersRef.current[msg.type] || [];
      handlers.forEach((h) => h(msg.payload, msg.sessionId));
    };

    return () => ws.close();
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

  return { connected, send, on };
}