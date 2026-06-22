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

Tutti i messaggi viaggiano come JSON con la forma base `{ type, sessionId, payload }`. `sessionId` è assente solo nel primo messaggio (`join_queue`), che è quello che lo genera.

| # | type | Direzione | Payload | Scopo |
|---|---|---|---|---|
| 1 | `join_queue` | customer → server | `{ sourcePage }` | Crea la sessione in stato `queued`, il server risponde con `sessionId` |
| 2 | `incoming_customer` | server → consultant disponibile | `{ sessionId, sourcePage, waitingSince }` | Notifica il prossimo consulente libero (routing "next available", non broadcast) |
| 3 | `answer_customer` | consultant → server | `{ sessionId }` | Il server passa la sessione a `ringing → active` e la blocca per altri consulenti |
| 3b | `decline_customer` | consultant → server | `{ sessionId }` | Il server cerca il prossimo consulente disponibile, o passa a `missed` se non ce ne sono |
| 4 | `call_assigned` | server → entrambi | `{ sessionId, role: "caller" \| "callee" }` | Segnale che dice al browser del consultant di chiamare `getUserMedia` e creare l'offer |
| 5 | `offer` | consultant → server → customer | `{ sessionId, sdp }` | Offerta SDP |
| 6 | `answer` | customer → server → consultant | `{ sessionId, sdp }` | Risposta SDP |
| 7 | `ice_candidate` | entrambe le direzioni | `{ sessionId, candidate }` | Relay puro, nessuna logica lato server |
| 8 | `hangup` | entrambe le direzioni | `{ sessionId, reason }` | Il server chiude la sessione, la marca `ended`, scrive la riga nel call log |

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