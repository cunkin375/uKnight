package com.uknight.server.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class GameService {

    // Game state storage: matchId -> GameState
    private final Map<String, GameState> activeGames = new ConcurrentHashMap<>();

    public String createGame(String matchId, String player1Id, String player2Id) {
        GameState game = new GameState(matchId, player1Id, player2Id);
        activeGames.put(matchId, game);
        log.info("Created game for match: {}", matchId);
        return matchId;
    }

    public Optional<GameState> getGame(String matchId) {
        return Optional.ofNullable(activeGames.get(matchId));
    }

    public void removeGame(String matchId) {
        activeGames.remove(matchId);
        log.info("Removed game for match: {}", matchId);
    }

    public GameState processShot(String matchId, String playerId, Shot shot) {
        GameState game = activeGames.get(matchId);
        if (game == null) {
            log.warn("Game not found: {}", matchId);
            return null;
        }

        // Only allow move if it's the player's turn
        if (!playerId.equals(game.getCurrentTurn())) {
            log.warn("Not {}'s turn", playerId);
            return game;
        }

        // Apply the shot to the player's puck
        game.applyShot(playerId, shot);

        // Run physics simulation
        game.runPhysicsSimulation();

        // Check for win condition and switch turns
        game.checkWinCondition();
        
        if (!game.isRoundOver()) {
            game.switchTurn();
        }

        return game;
    }

    public GameState getGameState(String matchId) {
        return activeGames.get(matchId);
    }

    // Inner class representing game state
    public static class GameState {
        private final String matchId;
        private final String player1Id;
        private final String player2Id;

        // Pucks: 0 = player1, 1 = player2
        private Puck[] pucks = new Puck[2];

        // Turn: player1Id or player2Id
        private String currentTurn;

        // Scores
        private int player1Score = 0;
        private int player2Score = 0;

        // Round tracking
        private int round = 1;
        private boolean roundOver = false;
        private String winner = null;

        // Platform radius (normalized 0-1)
        private static final double PLATFORM_RADIUS = 0.45;

        public GameState(String matchId, String player1Id, String player2Id) {
            this.matchId = matchId;
            this.player1Id = player1Id;
            this.player2Id = player2Id;

            // Initialize pucks at starting positions
            pucks[0] = new Puck(-0.3, 0.0, 0.05); // Player 1 on left
            pucks[1] = new Puck(0.3, 0.0, 0.05);  // Player 2 on right

            this.currentTurn = player1Id;
        }

        public void applyShot(String playerId, Shot shot) {
            int puckIndex = playerId.equals(player1Id) ? 0 : 1;
            if (pucks[puckIndex] != null) {
                pucks[puckIndex].vx = shot.dx * 0.015; // Scale power
                pucks[puckIndex].vy = shot.dy * 0.015;
            }
        }

        public void runPhysicsSimulation() {
            // Simple physics simulation with multiple steps for stability
            for (int step = 0; step < 50; step++) {
                // Update positions
                for (Puck puck : pucks) {
                    if (puck != null) {
                        puck.x += puck.vx;
                        puck.y += puck.vy;

                        // Friction
                        puck.vx *= 0.98;
                        puck.vy *= 0.98;
                    }
                }

                // Collision detection between pucks
                detectPuckCollision();

                // Stop if velocities are very low
                if (isMovementStopped()) break;
            }
        }

        private void detectPuckCollision() {
            if (pucks[0] == null || pucks[1] == null) return;

            double dx = pucks[1].x - pucks[0].x;
            double dy = pucks[1].y - pucks[0].y;
            double distance = Math.sqrt(dx * dx + dy * dy);
            double minDistance = pucks[0].radius + pucks[1].radius;

            if (distance < minDistance && distance > 0) {
                // Normalize collision vector
                double nx = dx / distance;
                double ny = dy / distance;

                // Relative velocity
                double dvx = pucks[0].vx - pucks[1].vx;
                double dvy = pucks[0].vy - pucks[1].vy;

                // Relative velocity along collision normal
                double dvn = dvx * nx + dvy * ny;

                // Only resolve if objects are moving towards each other
                if (dvn > 0) {
                    // Apply impulse (elastic collision)
                    double impulse = dvn;
                    pucks[0].vx -= impulse * nx;
                    pucks[0].vy -= impulse * ny;
                    pucks[1].vx += impulse * nx;
                    pucks[1].vy += impulse * ny;
                }

                // Separate pucks to prevent overlap
                double overlap = (minDistance - distance) / 2;
                pucks[0].x -= overlap * nx;
                pucks[0].y -= overlap * ny;
                pucks[1].x += overlap * nx;
                pucks[1].y += overlap * ny;
            }
        }

        private boolean isMovementStopped() {
            for (Puck puck : pucks) {
                if (puck != null && (Math.abs(puck.vx) > 0.0001 || Math.abs(puck.vy) > 0.0001)) {
                    return false;
                }
            }
            return true;
        }

        public void checkWinCondition() {
            // Check if pucks are out of bounds (outside platform)
            boolean player1Out = isOutOfBounds(pucks[0]);
            boolean player2Out = isOutOfBounds(pucks[1]);

            if (player1Out || player2Out) {
                roundOver = true;

                if (player1Out && !player2Out) {
                    player2Score++;
                    winner = player2Id;
                } else if (player2Out && !player1Out) {
                    player1Score++;
                    winner = player1Id;
                } else if (player1Out && player2Out) {
                    // Draw - no points awarded
                    winner = null;
                }

                log.info("Round {} complete. Score: {}-{}, Winner: {}",
                    round, player1Score, player2Score, winner);

                // Check for match winner (best of 3)
                if (player1Score >= 2 || player2Score >= 2) {
                    log.info("Match complete! Winner: {}", winner);
                } else {
                    // Reset for next round after delay
                    resetRound();
                }
            }
        }

        private boolean isOutOfBounds(Puck puck) {
            if (puck == null) return false;
            double distance = Math.sqrt(puck.x * puck.x + puck.y * puck.y);
            return distance > PLATFORM_RADIUS;
        }

        public void switchTurn() {
            currentTurn = currentTurn.equals(player1Id) ? player2Id : player1Id;
        }

        private void resetRound() {
            // Reset puck positions
            pucks[0] = new Puck(-0.3, 0.0, 0.05);
            pucks[1] = new Puck(0.3, 0.0, 0.05);
            
            // Loser picks who starts? For now, just reset to player 1 or random
            currentTurn = player1Id; 
            roundOver = false;
            winner = null;
            round++;
        }

        // Getters for serialization
        public String getMatchId() { return matchId; }
        public String getPlayer1Id() { return player1Id; }
        public String getPlayer2Id() { return player2Id; }
        public Puck[] getPucks() { return pucks; }
        public String getCurrentTurn() { return currentTurn; }
        public int getPlayer1Score() { return player1Score; }
        public int getPlayer2Score() { return player2Score; }
        public int getRound() { return round; }
        public boolean isRoundOver() { return roundOver; }
        public String getWinner() { return winner; }
    }

    public static class Shot {
        public double dx;
        public double dy;

        public Shot() {}

        public Shot(double dx, double dy) {
            this.dx = dx;
            this.dy = dy;
        }
    }

    public static class Puck {
        public double x;
        public double y;
        public double radius;
        public double vx;
        public double vy;

        public Puck(double x, double y, double radius) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.vx = 0;
            this.vy = 0;
        }
    }
}
