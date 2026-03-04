# uKnight - Technical Documentation

> **For LLM Agents:** This file contains the complete architectural overview of uKnight. Read this first before modifying any code.

---

## 1. Project Overview

**uKnight** is a modern, university-exclusive video chat platform inspired by Omegle. It verifies users via `.edu` email addresses to create a safe "walled garden" for students to connect randomly with peers from other universities.

### Key Differentiators
- **Verified Community:** Only `.edu` email holders can join
- **Real-time Video:** P2P WebRTC connections
- **Modern Aesthetic:** "Vercel-Minimalism" dark mode UI

---

## 2. Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | Next.js 14 (App Router) + Tailwind CSS | User interface, marketing pages |
| **Backend** | Spring Boot 4.0 (Java 21) | WebSocket server, matchmaking |
| **Database** | Neon (PostgreSQL) | User profiles, chat logs, reports |
| **Auth** | Firebase Auth | OAuth2 login (Google) |
| **Real-time** | WebSockets (STOMP) + WebRTC | Video chat, matchmaking signaling |
| **Hosting** | Vercel (Frontend) + GCP Cloud Run (Backend) | Deployment |

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                            CLIENT                                    │
│  ┌──────────────────┐        ┌──────────────────────────────────┐  │
│  │   Next.js App    │        │     WebRTC (P2P Video)           │  │
│  │   (Vercel)       │        │     /lobby Page                  │  │
│  └────────┬─────────┘        └──────────────────────────────────┘  │
│           │                                                        │
│           │ HTTPS / WebSocket                                      │
│           ▼                                                        │
├─────────────────────────────────────────────────────────────────────┤
│                          BACKEND (GCP Cloud Run)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │  WebSocket      │  │  Matchmaking    │  │  REST API         │  │
│  │  /ws endpoint   │  │  Queue          │  │  (future)         │  │
│  └────────┬────────┘  └────────┬────────┘  └───────────────────┘  │
│           │                    │                                    │
│           ▼                    ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    NEON DATABASE (PostgreSQL)                 │  │
│  │    Users, Reports, Chat Logs, University Info                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend Structure

```
frontend/src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Landing page (marketing)
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   ├── lobby/              # ⭐ VIDEO CHAT PAGE (primary feature)
│   ├── room/               # Legacy/placeholder room page
│   ├── profile/            # User profile
│   └── legal/              # Privacy/Terms pages
├── components/
│   ├── ui/                 # Shadcn/ui components
│   └── media-device-selector.tsx  # Camera/mic selector
├── context/
│   └── auth-context.tsx    # Firebase auth provider
├── lib/
│   └── firebase.ts         # Firebase configuration
└── store/
    └── media-store.ts      # Zustand store for media device prefs
```

### Key Frontend Files

#### `/src/app/lobby/page.tsx` ⭐ **MAIN CHAT FUNCTIONALITY**
This file contains:
- WebRTC video/audio streaming
- WebSocket (STOMP) client connection
- Matchmaking logic
- Chat functionality
- Media device selection

**Important:** The actual video chat happens in `/lobby`, not `/room`.

#### `/src/lib/firebase.ts`
Firebase configuration for authentication. Note: The `appId` and `measurementId` fields are currently empty in the config.

#### `/src/context/auth-context.tsx`
React context that:
- Manages Firebase auth state
- Protects routes (redirects to login if not authenticated)
- Provides `useAuth()` hook for components

---

## 5. Backend Structure

```
backend/server/src/main/java/com/uknight/server/
├── ServerApplication.java          # Main entry point
├── config/
│   ├── SecurityConfig.java         # CORS, CSRF, authentication
│   └── WebSocketConfig.java        # STOMP WebSocket setup
├── controller/
│   └── LobbyController.java        # WebSocket message handlers
└── service/
    └── MatchmakingService.java     # User pairing logic
```

### WebSocket Endpoints

The backend uses **STOMP over WebSocket** protocol.

| Endpoint | Description |
|----------|-------------|
| `/ws` | Main WebSocket connection endpoint |
| `/app/join` | Client joins matchmaking queue |
| `/app/signal` | WebRTC signaling (offer/answer/ICE) |
| `/app/chat` | Text chat message relay |
| `/topic/match/{uuid}` | Match notification |
| `/topic/signal/{uuid}` | WebRTC signaling messages |
| `/topic/chat/{uuid}` | Chat messages |

### Matchmaking Flow

1. Client connects to WebSocket at `/ws`
2. Client sends message to `/app/join` with their UUID and university name
3. `MatchmakingService` adds user to queue
4. If a match is found, both users receive notification via `/topic/match/{uuid}`
5. Clients perform WebRTC handshake via `/app/signal`
6. Once connected, video is P2P (server not involved after handshake)

### Configuration

- **CORS:** Configured in `SecurityConfig.java`. Allowlist controlled by `cors.allowed-origins` environment variable
- **Port:** 8080 (default)
- **Spring Boot Version:** 4.0.2
- **Java Version:** 21

---

## 6. Infrastructure

### Neon Database (PostgreSQL)
- **Purpose:** User data, reports, university verification
- **Connection:** JDBC string (not currently in codebase - likely managed externally)

### Firebase
- **Project:** `uknight-webcalling-prototype`
- **Services Used:**
  - Firebase Authentication (Google OAuth)
- **Note:** Missing `appId` in config - this needs to be added for full functionality

### GCP Cloud Run
- **Backend Hosting:** Spring Boot container
- **URL Pattern:** `https://uknight-backend-{hash}.us-central1.run.app`

---

## 7. Development Setup

### Prerequisites
- Node.js 18+
- Java 21
- Maven
- Docker

### Running Locally

**Option 1: Docker Compose (Recommended)**
```bash
docker-compose up --build
```

**Option 2: Manual**

Backend:
```bash
cd backend/server
./mvnw spring-boot:run
# Starts on http://localhost:8080
```

Frontend:
```bash
cd frontend
npm install
npm run dev
# Starts on http://localhost:3000
```

---

## 8. Deployment Guide

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Build command: `npm run build`
3. Output directory: `.next`
4. Environment variables: None required for basic function

### Backend (GCP Cloud Run)
See `BACKEND.md` for detailed deployment steps.

Quick commands:
```bash
export PROJECT_ID="your-project-id"
export REGION="us-central1"

# Build
docker build --platform linux/amd64 -t $REGION-docker.pkg.dev/$PROJECT_ID/uknight-repo/backend:latest backend/server

# Deploy
gcloud run deploy uknight-backend \
    --image $REGION-docker.pkg.dev/$PROJECT_ID/uknight-repo/backend:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "^@^cors.allowed-origins=https://u-knight.vercel.app,http://localhost:3000"
```

---

## 9. Important Notes for LLM Agents

### Common Pitfalls

1. **WebSocket Hardcoding**: The WebSocket URL in `lobby/page.tsx` is hardcoded to the GCP Cloud Run URL:
   ```typescript
   brokerURL: 'wss://uknight-backend-536429702801.us-central1.run.app/ws'
   ```
   When developing locally, you need to change this to `ws://localhost:8080/ws`.

2. **Firebase Config**: The `appId` in `frontend/src/lib/firebase.ts` is empty. You must add your Firebase project app ID for auth to work.

3. **CORS Issues**: If frontend can't connect to backend, check that the `cors.allowed-origins` environment variable in Cloud Run includes your frontend URL.

4. **Matchmaking Race Conditions**: The current `MatchmakingService` implementation is basic. It uses a simple FIFO queue which could have issues under high concurrency.

5. **WebRTC Browser Support**: The video chat uses modern WebRTC APIs. It won't work in older browsers or without HTTPS (except localhost).

6. **Media Permissions**: The app requires camera/microphone permissions. If testing, ensure the browser allows these.

7. **Room vs Lobby**: There are two pages (`/room` and `/lobby`). Only `/lobby` contains the functional video chat. `/room` appears to be a legacy/placeholder page.

### Debugging Tips

- **Check browser console** for STOMP/WebRTC logs
- **Check Cloud Run logs** for backend WebSocket activity
- **Use Chrome's `chrome://webrtc-internals`** to debug connection issues
- **Verify WebSocket connection** using: `curl http://localhost:8080/ws/info`

---

## 10. File Reference

| File | Purpose |
|------|---------|
| `frontend/src/app/lobby/page.tsx` | Main video chat implementation |
| `frontend/src/lib/firebase.ts` | Firebase auth setup |
| `frontend/src/context/auth-context.tsx` | Auth protection |
| `backend/server/.../LobbyController.java` | WebSocket handlers |
| `backend/server/.../WebSocketConfig.java` | STOMP configuration |
| `backend/server/.../SecurityConfig.java` | CORS and security |
| `backend/server/.../MatchmakingService.java` | User matching |
| `docker-compose.yml` | Local development setup |

---

*Last Updated: Documentation created for future agent reference*
