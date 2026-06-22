package com.videoshop.signaling;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

public class SignalingWebSocketHandler extends TextWebSocketHandler {

    private final SignalingSessionManager sessionManager;

    public SignalingWebSocketHandler(SignalingSessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        sessionManager.handleMessage(session, message.getPayload());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        sessionManager.handleDisconnect(session);
    }
}