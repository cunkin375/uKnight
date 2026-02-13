# Backend Overview

This directory contains the Spring Boot backend for the uKnight application. It currently serves as a WebSocket server for real-time communication, particularly for lobby management.

## Technology Stack

-   **Java**: 21
-   **Framework**: Spring Boot
-   **Build Tool**: Maven (`mvnw` wrapper included)
-   **Security**: Spring Security
-   **Real-time**: Spring WebSocket (STOMP)
-   **Database**: (None currently configured/visible in the analyzed files)

## Key Configurations

### Security (`SecurityConfig.java`)
-   **CSRF**: Disabled.
-   **CORS**: Configured to allow requests from `http://localhost:3000` (Frontend).
    -   Allowed Methods: GET, POST, PUT, DELETE, OPTIONS.
    -   Allow Credentials: `true`.
-   **Authentication**:
    -   `/ws/**`: Publicly accessible (for WebSocket handshake).
    -   All other requests: Require authentication.

### WebSocket (`WebSocketConfig.java`)
-   **Protocol**: STOMP over WebSocket.
-   **Endpoint**: `/ws` (Allowed Origin Patterns: `*`).
-   **Broker**: Simple broker enabled for `/topic` and `/queue`.
-   **Application Prefix**: `/app`.

## API Documentation

### WebSocket Endpoints

| Type | Destination | Handler | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Pub** | `/app/join` | `LobbyController.joinLobby` | `String` (University Name) | Logs that a student from a specific university has joined the lobby. |

## Project Structure

-   `src/main/java/com/uknight/server/ServerApplication.java`: Main entry point.
-   `src/main/java/com/uknight/server/config/`: Configuration classes.
    -   `SecurityConfig.java`: Security and CORS settings.
    -   `WebSocketConfig.java`: WebSocket setup.
    -   `LobbyController.java`: WebSocket message handlers.

## Running the Backend
 
 To run the application, verify you are in the `backend/server` directory and use the provided Maven wrapper:
 
 ```bash
 cd backend/server
 ./mvnw spring-boot:run
 ```
 
 The server will start on port 8080.
