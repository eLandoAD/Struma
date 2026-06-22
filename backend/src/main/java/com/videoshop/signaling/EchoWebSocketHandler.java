package com.videoshop.signaling;

import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * Handler "stupido": rimanda al mittente esattamente quello che riceve.
 * Serve solo a provare che il canale WebSocket end-to-end funziona
 * (browser -> Spring Boot -> browser) prima di scrivere la vera
 * logica di segnalazione (join_queue, offer, answer, ice_candidate...).
 */
public class EchoWebSocketHandler extends TextWebSocketHandler {

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        session.sendMessage(new TextMessage("echo: " + message.getPayload()));
    }
}
