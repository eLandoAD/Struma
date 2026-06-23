# Video Shop — Architecture

> Bozza di lavoro. Da aggiornare man mano che le decisioni si confermano o cambiano.

## 1. Regola di prodotto (non negoziabile)

Il customer vede e sente il consultant. Il consultant non vede il customer.

- Video: **one-way**, consultant → customer.
- Audio: **two-way**.
- Chat testuale: **two-way**.
- File transfer: **one-way**, customer → consultant.
- Screen sharing: **two-way** (consultant ↔ customer).

## 2. Stack tecnico

| Layer | Scelta |
|---|---|
| Backend | Java + Spring Boot |
| Segnalazione real-time | WebSocket (Spring) |
| Media transport | WebRTC, peer-to-peer (nessun SFU/MCU) |
| Frontend | TBD |
| Database | TBD |
| STUN | pubblico (es. Google STUN) per lo sviluppo |
| TURN | stretch goal, non nello scope dei 5 giorni |

## 3. Ciclo di vita di una sessione

```
queued → ringing → active → ended
                 ↘ missed (timeout / nessun consulente risponde)
```

- `queued`: il customer ha fatto `join_queue`, nessun consulente ancora notificato/assegnato.
- `ringing`: un consulente specifico è stato notificato e sta decidendo (answer/decline).
- `active`: negoziazione SDP/ICE in corso o completata, media P2P attivo.
- `ended`: hangup volontario da una delle due parti, sessione chiusa e loggata.
- `missed`: nessun consulente disponibile entro un timeout, o tutti hanno declinato → customer va al fallback "no consultant available".

Il server è l'unica fonte di verità sullo stato della sessione. Nessun browser decide autonomamente lo stato — evita le "ghost calls".

## 4. Contratto dei messaggi WebSocket

Tutti i messaggi viaggiano come JSON con la forma fissa `{ type, sessionId, payload }`. `payload` è sempre un oggetto (anche vuoto `{}`), mai assente. `sessionId` è assente solo nel primissimo messaggio del customer (`join_queue`), perché è il server a generarlo.

| # | type | Direzione | Payload | Scopo |
|---|---|---|---|---|
| 1 | `join_queue` | customer → server | `{ sourcePage }` | Crea la sessione in stato `QUEUED`. Nessun `sessionId` in questo messaggio: lo genera il server. |
| 2 | `queued` | server → customer | `{ sourcePage }` | Risposta a `join_queue`. Da qui in avanti il client usa il `sessionId` ricevuto in busta per tutti i messaggi successivi. Fa partire anche il timeout lato server (vedi nota sotto). |
| 3 | `consultant_available` | consultant → server | `{}` | Il consulente si dichiara libero. Nessun `sessionId` (non è ancora legato a nessuna sessione). Il server lo accoda e tenta subito un match. |
| 4 | `incoming_customer` | server → consultant disponibile | `{ sourcePage }` | Notifica il prossimo consulente libero in coda (routing "next available", non broadcast a tutti i consulenti). Sessione passa a `RINGING`. |
| 5 | `answer_customer` | consultant → server | `{}` | Il consulente ha risposto davvero. Il server passa la sessione a `ACTIVE`, **ferma il timeout**, e replica `call_assigned` a entrambe le parti. |
| 6 | `decline_customer` | consultant → server | `{}` | Il consulente rifiuta. Il server rimette la sessione in coda (`QUEUED`) e cerca il prossimo consulente disponibile. **Il timeout originale continua a contare** — non si resetta a ogni decline. |
| 7 | `call_assigned` | server → entrambi | `{ role: "caller" \| "callee" }` | Segnale che dice al browser del consultant (`caller`) di chiamare `getUserMedia`/canvas e creare l'offer; al customer (`callee`) di prepararsi a riceverla. |
| 8 | `offer` | consultant → server → customer | `{ sdp }` | Offerta SDP. Relay puro per `sessionId`, nessuna logica del server sul contenuto. |
| 9 | `answer` | customer → server → consultant | `{ sdp }` | Risposta SDP. Stesso relay puro. |
| 10 | `ice_candidate` | entrambe le direzioni | `{ candidate }` | Relay puro, nessuna logica lato server. |
| 11 | `hangup` | entrambe le direzioni, oppure server → parte rimanente | `{ reason }` | Il server chiude la sessione e la rimuove. `reason` può essere impostato dal client (es. `hangup_customer`, `hangup_consultant`) oppure generato dal server: `disconnect` (socket chiuso senza hangup esplicito) o `timeout` (vedi sotto). |
| 12 | `missed` | server → customer | `{}` | Inviato quando il timeout di coda scade senza che nessun consulente abbia risposto (`answer_customer`). La sessione passa a `MISSED` e viene rimossa. Il customer dovrebbe qui mostrare il fallback "nessun consulente disponibile" (brief 3.7). |

### Nota — timeout di coda

Ogni sessione, alla creazione (`join_queue`), riceve un timer lato server (oggi **30 secondi**, valore di test — da alzare prima della demo). Il timer:
- **si ferma** solo quando un consulente risponde per davvero (`answer_customer` → `ACTIVE`);
- **continua a contare** anche se un consulente viene notificato (`incoming_customer`) e poi declina — il tempo totale di attesa del customer è quello che conta, non il tempo per singolo tentativo;
- **allo scadere**, se la sessione è ancora `QUEUED` o `RINGING`, passa a `MISSED`: il customer riceve `missed`, l'eventuale consulente assegnato riceve `hangup` con `reason: "timeout"`.

### Nota — disponibilità del consulente

`consultant_available` è in-memory lato server di segnalazione (una coda di `WebSocketSession` libere), **non** la colonna `status` su DB della tabella `consultant`. Sono due cose distinte: il DB serve per persistenza/reporting (letto da Persona 3), questa coda serve per sapere a runtime quale socket è davvero libero per il prossimo match. Vanno tenute sincronizzate ma non sono la stessa fonte di verità.

## 5. Architettura media (WebRTC)

- Il backend è **solo un broker di segnalazione**. Non riceve, non instrada, non tocca mai un frame audio/video. Solo testo (SDP, ICE) tramite WebSocket.
- **One-way video, enforcement**: il browser del customer non chiama mai `getUserMedia` per il video. Aggiunge solo una transceiver video `recvonly`. Niente da "disattivare" dopo: è strutturalmente impossibile che il customer pubblichi video, perché lo stream non esiste mai dal suo lato.
- **Audio**: `sendrecv` su entrambi i lati.
- Cleanup: ogni `hangup` (volontario o per disconnessione WebSocket rilevata dal server) chiude la `RTCPeerConnection` su entrambi i lati e libera la sessione lato server. Da implementare anche un heartbeat/timeout per i tab chiusi senza un hangup esplicito.

## 6. Routing

Modello "next available consultant": il server mantiene una lista di consulenti con stato `online | busy | offline`. Alla `join_queue`, il server notifica il primo `online` disponibile. Su `decline`, passa al successivo. Routing per skill/gruppo è fuori scope per i 5 giorni.

## 7. Strumenti in-call: trasporto

Decisione per questo sprint: **chat e file transfer passano dal WebSocket di segnalazione** (relay lato server), non da un `RTCDataChannel` separato. Più semplice da debuggare, nessun impatto sui criteri di valutazione. Da rivedere come refinement se avanza tempo.

Screen sharing resta invece dentro WebRTC (traccia aggiuntiva via `getDisplayMedia`, negoziata come track separata sulla stessa peer connection) — dettaglio del flusso ancora da definire.

## 8. Semplificazioni di scope (intenzionali, da 5 giorni)

- **Nessun ruolo admin separato.** Un solo meccanismo di login (username + password, persistito), condiviso da consultant e admin. Il tab "Analytics" è visibile a chiunque sia loggato — nessun controllo sui ruoli nell'MVP.
- **Auth semplificata.** Username + password, salvataggio su DB. Nessun password reset, nessuna email verification.
- **Il customer resta sempre anonimo.** Nessun login, nessun account — coerente con il punto 1 del brief ("il customer non installa nulla").

## 9. Domande aperte / TBD

- Framework frontend (React vs Angular)
- Scelta del database
- Flusso esatto di negoziazione per lo screen sharing
- TURN server (stretch goal, da valutare solo a tutto il resto funzionante)