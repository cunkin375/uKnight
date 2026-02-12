package com.uknight.server.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
public class LobbyController {

    // Frontend sends to: /app/join
    @MessageMapping("/join")
    public void joinLobby(@Payload String university) {
        log.info("Student joined the lobby from: {}", university);
        
        // TODO: Add matchmaking logic here later
    }
}