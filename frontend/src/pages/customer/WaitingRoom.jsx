import { useEffect, useRef, useState } from "react";
import { useSignaling } from "../../hooks/useSignaling";
import ContactFallbackForm from "../../components/ContactFallbackForm";

export default function WaitingRoom() {
  const { connected, send, on } = useSignaling();
  const [sessionId, setSessionId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | queued | assigned | missed
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState("");
  const chatChannelRef = useRef(null);

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
      // Se arriva una nuova offerta mentre una connessione precedente
      // è ancora viva, la chiudiamo prima: evita due RTCPeerConnection
      // attive in parallelo che si contendono lo stesso videoRef.
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      pc.ondatachannel = (event) => {
        if (event.channel.label === "chat") {
          chatChannelRef.current = event.channel;
          event.channel.onmessage = (msg) => {
            setMessages((prev) => [...prev, { sender: "consultant", text: msg.data }]);
          };
        }
      };

      // Regola one-way: nessun getUserMedia qui, solo recvonly.
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

  function sendChat() {
    if (!chatText.trim()) return;
    chatChannelRef.current?.send(chatText);
    setMessages((prev) => [...prev, { sender: "customer", text: chatText }]);
    setChatText("");
  }

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
        <>
          <p className="mt-4 text-red-500">
            Nessun consulente disponibile al momento.
          </p>
          <ContactFallbackForm
            sessionId={sessionId}
            onSubmit={(data) => send("contact_fallback", sessionId, data)}
          />
        </>
      )}

      {status === "assigned" && (
        <div>
          <p className="mt-4 mb-4 text-[var(--color-text-dim)]">
            Consulente assegnato — chiamata in corso.
          </p>

          <div className="mt-4 border rounded p-3 text-left max-w-md mx-auto">
            <h3 className="font-bold mb-2">Chat</h3>
            <div className="h-40 overflow-y-auto border p-2 mb-2 bg-white">
              {messages.map((m, i) => (
                <div key={i}>
                  <b>{m.sender}</b>: {m.text}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border p-2 rounded"
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
              />
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={sendChat}
              >
                Invia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sempre nel DOM, mai condizionale: il ref deve esistere
          prima che arrivi il track, indipendentemente dallo stato. */}
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
  );
}