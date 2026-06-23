import { useEffect, useRef, useState } from "react";
import { useSignaling } from "../../hooks/useSignaling";

export default function WaitingRoom() {
  const { connected, send, on } = useSignaling();
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | queued | assigned | missed
  const [micError, setMicError] = useState(null);
  const videoRef = useRef(null);
  const pcRef = useRef(null);

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

    const offOffer = on("offer", async (payload, sid) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      // Regola one-way: nessun getUserMedia per il VIDEO, solo recvonly.
      pc.addTransceiver("video", { direction: "recvonly" });

      pc.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          send("ice_candidate", sid, { candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          setStatus("connection_failed");
        }
      };

      // Audio è two-way (ARCHITECTURE.md sezione 5): il customer pubblica
      // il proprio microfono qui, prima di creare l'answer.
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream.getAudioTracks().forEach((track) => pc.addTrack(track, audioStream));
      } catch (err) {
        // Permesso negato o nessun microfono disponibile: non blocchiamo la
        // chiamata, il customer resta semplicemente senza audio in uscita.
        console.warn("Microfono non disponibile:", err.name, err.message);
        setMicError(err.name);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      send("answer", sid, { sdp: answer });
    });

    const offIce = on("ice_candidate", async (payload) => {
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.error("Errore ICE candidate:", e);
        }
      }
    });

    const offHangup = on("hangup", () => {
      setStatus("idle");
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    });

    send("join_queue", null, { sourcePage: window.location.pathname || "unknown" });

    return () => {
      offQueued();
      offAssigned();
      offMissed();
      offOffer();
      offIce();
      offHangup();
      if (pcRef.current) {
        pcRef.current.close();
      }
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
      {status === "missed" && (
        <p className="mt-4 text-red-500">
          Nessun consulente disponibile al momento. (qui andrà il form di contatto fallback)
        </p>
      )}

      {status === "assigned" && (
        <div className="mt-4">
          <p className="mb-4 text-[var(--color-text-dim)]">Consulente assegnato — chiamata in corso.</p>
          {micError && (
            <p className="mb-2 text-sm text-amber-600">
              Microfono non disponibile ({micError}) — la chiamata continua senza il tuo audio.
            </p>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            width={480}
            style={{
              display: status === "assigned" ? "block" : "none",
              margin: "16px auto 0",
              border: "2px solid #2563eb",
              background: "#000",
              borderRadius: "8px",
            }}
          />
        </div>
      )}

      {status === "connection_failed" && (
        <p className="mt-4 text-red-500">
          La connessione è stata persa. Riprova più tardi o contattaci tramite il modulo di assistenza.
        </p>
      )}
    </div>
  );
}
