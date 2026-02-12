package com.uknight.server.controller;

import com.uknight.server.service.MatchmakingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Slf4j
@Controller
@RequiredArgsConstructor
public class LobbyController {

    private final MatchmakingService matchmakingService;
    private final SimpMessagingTemplate messagingTemplate;

    // Frontend sends to: /app/join
    @MessageMapping("/join")
    public void joinLobby(@Payload String university, SimpMessageHeaderAccessor headerAccessor) {
        // We use the UUID sent by the client for topics, as it's easier to synchronize
        String sessionId = headerAccessor.getFirstNativeHeader("uuid");
        if (sessionId == null) {
            sessionId = headerAccessor.getSessionId(); // Fallback
        }
        
        log.info("Student joined the lobby from: {} (UUID: {})", university, sessionId);
        
        matchmakingService.addUser(sessionId);

        String partnerSessionId = matchmakingService.findMatch(sessionId);
        
        if (partnerSessionId != null) {
            // Notify both users that a match is found
            log.info("Match created: {} and {}", sessionId, partnerSessionId);
            
            // Notify current user (initiator of the match)
            Object payload1 = Map.of("peerId", partnerSessionId, "initiator", true);
            messagingTemplate.convertAndSend("/topic/match/" + sessionId, payload1);
                
            // Notify partner
            Object payload2 = Map.of("peerId", sessionId, "initiator", false);
            messagingTemplate.convertAndSend("/topic/match/" + partnerSessionId, payload2);
        }
    }

    // Frontend sends to: /app/signal
    // Payload should contain: { "type": "offer/answer/ice", "data": "...", "targetPeerId": "..." }
    @MessageMapping("/signal")
    public void handleSignal(@Payload Map<String, Object> signal, SimpMessageHeaderAccessor headerAccessor) {
        String senderId = headerAccessor.getFirstNativeHeader("uuid");
        if (senderId == null) {
             senderId = headerAccessor.getSessionId();
        }
        
        String targetPeerId = (String) signal.get("targetPeerId");
        
        log.info("Signal {} from {} to {}", signal.get("type"), senderId, targetPeerId);
        
        if (targetPeerId != null) {
            // Forward the signal to the specific user
            // We strip 'targetPeerId' and add 'senderId' so the receiver knows who sent it
            signal.put("senderId", senderId);
            Object signalPayload = signal;
            messagingTemplate.convertAndSend("/topic/signal/" + targetPeerId, signalPayload);
        }
    }
    // Frontend sends to: /app/chat
    // Payload should contain: { "targetPeerId": "...", "message": "..." }
    @MessageMapping("/chat")
    public void handleChat(@Payload Map<String, String> chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String senderId = headerAccessor.getFirstNativeHeader("uuid");
        if (senderId == null) {
             senderId = headerAccessor.getSessionId();
        }

        String targetPeerId = chatMessage.get("targetPeerId");
        String messageContent = chatMessage.get("message");

        log.info("Chat message from {} to {}: {}", senderId, targetPeerId, messageContent);

        if (targetPeerId != null && messageContent != null) {
            // Forward the signal to the specific user
            // We include 'senderId' so the receiver knows who sent it
            Object payload = Map.of("senderId", senderId, "message", messageContent);
            messagingTemplate.convertAndSend("/topic/chat/" + targetPeerId, payload);
        }
    }
}