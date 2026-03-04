# MVP Design: uKnight "Knockout" Mini-Game

This document outlines the Minimum Viable Product (MVP) for **Knockout**, a "Game Pigeon" style interactive experience integrated directly into the uKnight video chat lobby.

## 1. Feature Overview
Students in a video call can invite their partner to a quick session of "Knockout". The game appears as an overlay on the chat interface, allowing players to interact while still seeing and hearing each other via WebRTC.

## 2. Game Mechanics: Knockout (MVP)
To keep the MVP simple, we will implement a **Turn-Based Physics "Sumo" Game**.

*   **Objective:** Knock the opponent's puck off a circular platform.
*   **Gameplay:**
    1.  Each player controls a colored puck.
    2.  On your turn, you click and drag to "aim" and "power up" a shot.
    3.  The pucks collide using basic 2D physics.
    4.  If a puck moves outside the circular boundary, that player loses a point.
    5.  Best of 3 rounds wins.

## 3. User Experience (UX)
1.  **Initiation:** A "Play Game" button appears in the Chat Overlay.
2.  **Invitation:** Clicking it sends a "Game Invite" message to the partner.
3.  **Acceptance:** The partner clicks "Accept" on the message.
4.  **Overlay:** The game canvas slides in, partially covering the chat but keeping the video clear.
5.  **Feedback:** Real-time animations and "Your Turn" indicators.

## 4. Technical Architecture

### Frontend (Next.js)
*   **Component:** `KnockoutGame.tsx` - A Canvas-based component using `framer-motion` for UI transitions.
*   **State Management:** Track game state (puck positions, turn, score) locally, updated by WebSocket events.
*   **Integration:** In `lobby/page.tsx`, add a state `isGameActive` and render the overlay.

### Backend (Spring Boot)
*   **STOMP Messaging:**
    *   **Destination:** `/app/game/{matchId}`
    *   **Topic:** `/topic/game/{matchId}`
*   **Message Types:**
    *   `GAME_INVITE` / `GAME_ACCEPT`
    *   `GAME_MOVE` (Vector of the shot)
    *   `GAME_STATE_SYNC` (Positions of both pucks)
    *   `GAME_OVER`

### Data Flow
1.  **Player A** sends `GAME_MOVE` to Backend.
2.  **Backend** validates the turn and broadcasts `GAME_MOVE` to **Player B**.
3.  Both clients run the physics simulation locally (ensuring deterministic behavior) or the Backend acts as the source of truth for final positions.

## 5. Implementation Phases (MVP)

### Phase 1: Basic Messaging (Communication)
- [ ] Define STOMP endpoints for game data in `LobbyController.java`.
- [ ] Add "Invite" message type to the chat interface.

### Phase 2: Game UI & Canvas
- [ ] Create a basic 2D Canvas overlay in the frontend.
- [ ] Implement local puck movement (drag-to-shoot).

### Phase 3: Synchronization
- [ ] Synchronize shots between players via WebSockets.
- [ ] Implement simple collision detection.

### Phase 4: Win/Loss & Cleanup
- [ ] Detect when a puck is out of bounds.
- [ ] Display "Winner" and provide a "Replay" or "Close" option.

---
*Created for uKnight Feature Development*
