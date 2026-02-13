package com.uknight.server.service;

import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;
import java.util.concurrent.ConcurrentLinkedQueue;

@Slf4j
@Service
public class MatchmakingService {

    private final ConcurrentLinkedQueue<String> waitingUsers = new ConcurrentLinkedQueue<>();

    public void addUser(String sessionId) {
        if (!waitingUsers.contains(sessionId)) {
            waitingUsers.add(sessionId);
            log.info("User added to matchmaking queue: {}", sessionId);
        }
    }

    public void removeUser(String sessionId) {
        waitingUsers.remove(sessionId);
        log.info("User removed from matchmaking queue: {}", sessionId);
    }

    public String findMatch(String sessionId) {
        // Simple FIFO matching
        // If there is someone else in the queue, match with them.
        // Note: This is a very basic implementation. 
        // In a real scenario, we might want to check criteria, lock the queue, etc.
        
        // precise removal is tricky with concurrent queue if we just peek.
        // simplified: 
        
        synchronized (waitingUsers) {
           // If I am the only one, return null
           if (waitingUsers.size() < 2) {
               return null;
           }
           
           // Remove myself to not match with myself (should already be handled by logic flow but safe check)
           // Actually, the controller calling this should probably not have added the user yet? 
           // Or we optimize:
           
           // If we find someone who is NOT me
           for (String waiter : waitingUsers) {
               if (!waiter.equals(sessionId)) {
                   waitingUsers.remove(waiter);
                   waitingUsers.remove(sessionId); // Remove myself too as we are now matched
                   return waiter;
               }
           }
        }
        return null;
    }
    
    // Better Approach for polling:
    // When a user joins, check if queue has someone.
    // If yes, poll() them -> Match!
    // If no, add myself via offer().
    public String attemptMatch(String sessionId) {
        synchronized (waitingUsers) {
            String partner = waitingUsers.poll();
            
            if (partner != null) {
                // Determine if the partner is still valid/connected? 
                // For now assume yes.
                log.info("Match found: {} <-> {}", sessionId, partner);
                return partner;
            } else {
                waitingUsers.add(sessionId);
                log.info("No match found, added {} to queue. Queue size: {}", sessionId, waitingUsers.size());
                return null;
            }
        }
    }
}
