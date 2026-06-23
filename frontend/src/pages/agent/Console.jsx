import { useEffect, useRef, useState } from "react";
import { useSignaling } from "../../hooks/useSignaling";

// Stessa idea già validata in consultant.html: un video track sintetico via
// canvas, che non passa da getUserMedia per il video — bypassa qualunque
// problema di camera/policy/driver sull'ambiente di sviluppo. A
// RTCPeerConnection non importa la differenza rispetto a una webcam vera.
function createFakeVideoTrack() {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d");
  let hue = 0;
  setInterval(() => {
    hue = (hue + 2) % 360;
    ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "24px sans-serif";
    ctx.fillText(new Date().toLocaleTimeString(), 20, 40);
  }, 100);
  return canvas.captureStream(30).getVideoTracks()[0];
}

export default function Console() {
  const { connected, send, on } = useSignaling();

  const [queue, setQueue] = useState([]); // [{ sessionId, sourcePage, waitingSince }]
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [callState, setCallState] = useState("idle"); // idle | connecting | active
  const [logLines, setLogLines] = useState([]);

  const pcRef = useRef(null);
  const localVideoRef = useRef(null);

  const appendLog = (msg) => setLogLines((prev) => [...prev.slice(-49), msg]);

  // Annuncia disponibilità appena la WebSocket è su.
  // TODO: quando StatusToggle è collegato, questo va legato allo stato
  // "Online" invece di scattare sempre alla connessione — per ora un
  // consulente connesso è sempre considerato disponibile.
  useEffect(() => {
    if (connected) {
      send("consultant_available");
      appendLog("connesso al server, mi dichiaro disponibile");
    }
  }, [connected, send]);

  useEffect(() => {
    const unsubIncoming = on("incoming_customer", (payload, sessionId) => {
      appendLog(`customer in arrivo: ${payload.sourcePage} (${sessionId})`);
      setQueue((prev) => [...prev, { sessionId, ...payload }]);
    });

    const unsubCancelled = on("incoming_customer_cancelled", (_payload, sessionId) => {
      appendLog(`richiesta ${sessionId} non più assegnata a me (timeout di risposta)`);
      setQueue((prev) => prev.filter((item) => item.sessionId !== sessionId));
    });

    const unsubAssigned = on("call_assigned", (payload, sessionId) => {
      if (payload.role !== "caller") return; // il customer riceve anche lui call_assigned, ma con role "callee"
      setQueue((prev) => prev.filter((item) => item.sessionId !== sessionId));
      setActiveSessionId(sessionId);
      startCall(sessionId).catch((e) => appendLog(`ERRORE in startCall: ${e.name} - ${e.message}`));
    });

    const unsubAnswer = on("answer", async (payload) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      appendLog("answer ricevuta");
    });

    const unsubIce = on("ice_candidate", async (payload) => {
      if (!pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (e) {
        appendLog("errore ICE candidate: " + e);
      }
    });

    const unsubHangup = on("hangup", (_payload, sessionId) => {
      appendLog(`chiamata ${sessionId} terminata dall'altra parte`);
      endCall();
    });

    return () => {
      unsubIncoming();
      unsubCancelled();
      unsubAssigned();
      unsubAnswer();
      unsubIce();
      unsubHangup();
    };
    // `on`/`send` sono stabili (useCallback senza deps in useSignaling),
    // quindi questo effect si registra una sola volta.
  }, [on]);

  async function startCall(sessionId) {
    setCallState("connecting");

    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) send("ice_candidate", sessionId, { candidate: e.candidate });
    };
    pc.onconnectionstatechange = () => {
      appendLog("stato connessione: " + pc.connectionState);
      if (pc.connectionState === "connected") setCallState("active");
    };

    // Audio vero (getUserMedia), video finto via canvas — stessa scelta già
    // fatta in consultant.html, per lo stesso motivo (ambiente senza camera
    // utilizzabile). Quando la webcam vera sarà disponibile, qui basta
    // tornare a getUserMedia({ video: true, audio: true }) e togliere
    // createFakeVideoTrack.
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const videoTrack = createFakeVideoTrack();
    const localStream = new MediaStream([videoTrack, ...audioStream.getAudioTracks()]);

    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    send("offer", sessionId, { sdp: offer });
    appendLog("offer inviata per sessione " + sessionId);
  }

  function endCall() {
    pcRef.current?.close();
    pcRef.current = null;
    setActiveSessionId(null);
    setCallState("idle");
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }

  function handleAnswer(sessionId) {
    send("answer_customer", sessionId);
  }

  function handleDecline(sessionId) {
    send("decline_customer", sessionId);
    setQueue((prev) => prev.filter((item) => item.sessionId !== sessionId));
  }

  function handleEndCall() {
    if (activeSessionId) send("hangup", activeSessionId, { reason: "consultant_hangup" });
    endCall();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-2xl font-bold mb-1">Console</h1>
      <p className="text-sm text-slate-500 mb-6">
        {connected ? "connesso" : "non connesso"} — stato chiamata: {callState}
      </p>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border rounded bg-white p-4">
          <h2 className="font-bold mb-2">Video (consulente)</h2>
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full bg-black rounded" />
          {activeSessionId && (
            <button
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={handleEndCall}
            >
              End Call
            </button>
          )}
        </div>

        <div className="border rounded bg-white p-4">
          <h2 className="font-bold mb-2">Waiting Queue ({queue.length})</h2>
          {queue.length === 0 && <p className="text-sm text-slate-400">Nessun cliente in attesa.</p>}
          {queue.map((item) => (
            <div key={item.sessionId} className="flex items-center justify-between border-b py-2 text-sm">
              <div>
                <div className="font-medium">{item.sourcePage}</div>
                <div className="text-slate-400">{item.sessionId.slice(0, 8)}…</div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => handleAnswer(item.sessionId)}
                >
                  Answer
                </button>
                <button
                  className="px-3 py-1 border rounded hover:bg-slate-100"
                  onClick={() => handleDecline(item.sessionId)}
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded bg-white p-4">
        <h2 className="font-bold mb-2">Log</h2>
        <pre className="text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">{logLines.join("\n")}</pre>
      </div>
    </div>
  );
}
