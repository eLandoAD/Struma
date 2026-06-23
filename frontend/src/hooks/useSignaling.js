import { useEffect, useRef, useState, useCallback } from "react";

export function useSignaling() {
  const wsRef = useRef(null);
  const listenersRef = useRef({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const wsUrl =
      (location.protocol === "https:" ? "wss://" : "ws://") +
      location.host +
      "/ws/signal";
    const ws = new WebSocket(wsUrl);
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