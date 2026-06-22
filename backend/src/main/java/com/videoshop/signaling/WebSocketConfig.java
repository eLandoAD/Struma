package com.videoshop.signaling;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final SignalingSessionManager sessionManager;

    public WebSocketConfig(SignalingSessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry
            .addHandler(new SignalingWebSocketHandler(sessionManager), "/ws/signal")
            .setAllowedOrigins("*"); // da restringere più avanti, ok per il dev locale
    }
}