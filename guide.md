# uKnight Developer Onboarding Guide

> **Welcome to uKnight!** This document provides a comprehensive architectural overview for senior engineers joining the project.

---

## Abstract

**uKnight** is a high-fidelity, university-exclusive video chat platform inspired by Omegle but restricted to verified `.edu` email addresses. The platform enables spontaneous peer-to-peer video connections between students while providing an integrated "Knockout" minigame for instant entertainment. The project uses a modern full-stack approach: Next.js 16 for the frontend with Server-Side Rendering (SSR), and Spring Boot 4 for the real-time WebSocket backend.

---

## Technology Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19
- **Styling:** Tailwind CSS 4 + CSS Variables
- **Component Library:** Shadcn/ui (Radix primitives)
- **Animations:** Framer Motion
- **State Management:** Zustand (persist middleware)
- **Real-time Communication:** @stomp/stompjs (WebSocket over STOMP)
- **Authentication:** Firebase Auth
- **Video/Audio:** WebRTC (Native browser API)

### Backend
- **Framework:** Spring Boot 4
- **Language:** Java 21
- **Real-time Protocol:** WebSocket with STOMP
- **Build Tool:** Maven

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Deployment:** Google Cloud Run (production)

---

## Directory Structure

```
uKnight/
├── frontend/                          # Next.js 16 application
│   ├── src/
│   │   ├── app/                       # App Router pages
│   │   │   ├── page.tsx               # Landing page
│   │   │   ├── login/                 # Login page
│   │   │   ├── signup/                # Signup page
│   │   │   ├── lobby/                 # Video matching & chat (CORE)
│   │   │   ├── room/                  # (reserved for future use)
│   │   │   ├── profile/               # User profile page
│   │   │   ├── about/                 # About page
│   │   │   ├── contact/               # Contact page
│   │   │   ├── careers/               # Careers page
│   │   │   ├── globals.css            # Tailwind + CSS variables
│   │   │   └── layout.tsx             # Root layout (providers, fonts)
│   │   ├── components/
│   │   │   ├── ui/                    # Shadcn/ui components
│   │   │   ├── navbar.tsx             # Navigation header
│   │   │   ├── footer.tsx             # Site footer
│   │   │   ├── footer-wrapper.tsx     # Footer wrapper
│   │   │   ├── theme-provider.tsx     # Dark mode provider
│   │   │   ├── media-device-selector.tsx
│   │   │   ├── knockout/
│   │   │   │   └── KnockoutGame.tsx   # Canvas-based physics game
│   │   │   └── marketing/             # Landing page sections
│   │   │       ├── live-demo.tsx
│   │   │       ├── manifesto.tsx
│   │   │       └── feature-scroll.tsx
│   │   ├── context/
│   │   │   └── auth-context.tsx       # Firebase auth context
│   │   ├── lib/
│   │   │   ├── firebase.ts            # Firebase client config
│   │   │   └── utils.ts               # Utility functions (cn)
│   │   └── store/
│   │       └── media-store.ts         # Zustand persisted store
│   ├── public/                        # Static assets
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── Dockerfile
│
├── backend/                           # Spring Boot backend
│   └── server/
│       ├── src/main/java/com/uknight/server/
│       │   ├── ServerApplication.java # Main entry point
│       │   ├── config/
│       │   │   ├── WebSocketConfig.java   # STOMP config
│       │   │   └── SecurityConfig.java    # Security config
│       │   ├── service/
│       │   │   ├── MatchmakingService.java    # FIFO matching logic
│       │   │   └── GameService.java           # Knockout game logic
│       │   └── controller/
│       │       └── LobbyController.java       # Message handlers
│       └── pom.xml
│
├── docker-compose.yml                 # Local dev orchestration
├── guide.md                           # This file
├── ARCHITECTURE.md                    # Detailed architecture
├── BACKEND.md                         # Backend documentation
├── DEPLOYMENT.md                      # Deployment guide
└── PLAN.md                            # Development roadmap
```

---

## Core Architecture

### Frontend Architecture

**Rendering Strategy:**
- Next.js App Router is used for routing and layouts.
- All pages under `/app` are Server Components by default, but interaction-heavy pages (login, lobby, knockout game) use the `"use client"` directive.
- The root layout (`layout.tsx`) wraps the entire application in:
  - `ThemeProvider` (next-themes) for dark/light mode
  - `AuthProvider` (Firebase context) for user state
  - `Navbar` and `FooterWrapper` for layout consistency

**Routing:**
- File-based routing via Next.js App Router
- Dynamic segments are used for routes like `/room/[id]` (if applicable)
- Client-side navigation via `useRouter` hook

**State Management:**
- **Zustand:** Used for persisting media device preferences (`media-store.ts`). Uses `persist` middleware to store settings in localStorage.
- **React Context:** Used for Firebase Authentication (`AuthProvider`). Handles user session state, login/logout, and route protection.

**Authentication Flow:**
- Firebase Auth (Google Popup + Email/Password)
- Route protection in `AuthContext` redirects unauthenticated users to `/login`
- User session is checked via `onAuthStateChanged`

### Real-time Communication Architecture

**WebSocket (STOMP):**
- The frontend connects to the backend via STOMP over WebSocket at: `wss://uknight-backend-536429702801.us-central1.run.app/ws`
- Uses `@stomp/stompjs` library
- Subscriptions and destinations:
  - `/topic/match/{uuid}` — Match found notifications
  - `/topic/signal/{uuid}` — WebRTC signaling (OFFER, ANSWER, ICE)
  - `/topic/chat/{uuid}` — Chat messages
  - `/topic/game/{uuid}` — Knockout game state

**WebRTC (Video):**
- P2P connection established after match via `RTCPeerConnection`
- STUN/TURN servers configured (Google STUN, Metered.ca TURN)
- Signaling happens via WebSocket, then P2P media streams flow directly

**Matchmaking:**
- Backend maintains a `ConcurrentLinkedQueue` of waiting user UUIDs
- FIFO matching: when a second user joins, they're paired with the first
- Both users receive notification to begin WebRTC handshake

### Backend Architecture

**Spring Boot Structure:**
- `ServerApplication.java`: Main entry point with `@SpringBootApplication`
- `WebSocketConfig.java`: Enables STOMP message broker at `/ws` endpoint
- `LobbyController.java`: Handles `/app/join`, `/app/signal`, `/app/chat`, `/app/game/*` messages
- `MatchmakingService.java`: Manages user queue and pairing logic
- `GameService.java`: Manages Knockout game state, physics, scoring

**WebSocket Flow:**
1. Client connects to `/ws`
2. Client sends UUID in headers: `uuid: <client-generated-uuid>`
3. Client subscribes to personalized topics
4. Client publishes to `/app/join` to enter matchmaking
5. Server matches pairs and notifies via `/topic/match/{uuid}`

---

## Key Components & Features

### Frontend Components

| Component | Purpose |
|-----------|---------|
| `AuthProvider` | Wraps app, manages Firebase user session, protects routes |
| `Navbar` | Responsive nav with auth-aware menu (login vs avatar dropdown) |
| `KnockoutGame` | Canvas-based physics game: two pucks, drag-to-shoot mechanics, turn-based |
| `MediaDeviceSelector` | Dialog to select camera/microphone from available devices |
| `LobbyPage` | Core interaction: local video, remote video, chat, skip button, game invite |

### Pages

| Page | Description |
|------|-------------|
| `/` | Landing page with hero, feature showcase, marketing sections |
| `/login` | Firebase Google + email/password login |
| `/signup` | Firebase sign up (prototype allows non-.edu) |
| `/lobby` | Main video room: matchmaking, WebRTC, chat, knockout game |
| `/profile` | User profile (display name, avatar) |

### Backend Services

| Service | Responsibility |
|---------|----------------|
| `MatchmakingService` | Adds/removes users from queue, pairs them FIFO |
| `GameService` | Tracks game state, calculates puck physics, scores, rounds |

---

## Styling & Theming

**Tailwind CSS 4:**
- Uses `@import "tailwindcss"` syntax (no `tailwind.config.ts` required)
- CSS variables defined in `globals.css` using `@theme inline`
- Dark mode default with light mode override via `dark:` variant
- Color palette: Slate backgrounds, Emerald accents, Amber highlights

**Shadcn/ui:**
- Components located in `src/components/ui/`
- Configured in `components.json`
- Uses `cva` (class-variance-authority) for variants

**Fonts:**
- `Geist` (Sans) and `Geist_Mono` from Google Fonts
- Loaded via `next/font/google` in `layout.tsx`

**Global Styles:**
- `globals.css` defines `--radius`, `--background`, `--foreground`, etc.
- Base layer applies `border-border` and `bg-background` globally

---

## Local Development

### Prerequisites
- **Node.js** 18+ (preferably 20+)
- **Java** 21+ (for Spring Boot backend)
- **Maven** (for backend build)
- **Docker & Docker Compose** (optional, for containerized dev)

### Quick Start (Docker)

```bash
# Clone the repo
git clone https://github.com/your-org/uknight.git
cd uknight

# Build and run with Docker Compose
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8080

### Manual Setup

#### 1. Backend (Spring Boot)

```bash
cd backend/server

# Using Maven wrapper
./mvnw spring-boot:run

# Or build and run
./mvnw clean package
java -jar target/server-0.0.1-SNAPSHOT.jar
```

The backend starts on port **8080**.

#### 2. Frontend (Next.js)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend starts on port **3000**.

### Environment Variables

- **Frontend:** Firebase config in `src/lib/firebase.ts` (hardcoded for prototype)
- **Backend:** No local .env required; uses embedded configuration

### Development Workflow

1. **Start Backend:** `cd backend/server && ./mvnw spring-boot:run`
2. **Start Frontend:** `cd frontend && npm run dev`
3. Open http://localhost:3000
4. Login with Google or Email
5. Navigate to `/lobby` to test matchmaking and video

---

## Important Notes for Developers

### Key Implementation Details

- **WebSocket Production URL:** `wss://uknight-backend-536429702801.us-central1.run.app/ws` (hardcoded in `LobbyPage`)
- **UUID Generation:** Client generates UUID via `crypto.randomUUID()` and sends it in STOMP headers
- **WebRTC Transceivers:** Added dynamically based on media availability
- **Game Physics:** Client-side canvas rendering + server-side state reconciliation
- **TypeScript:** Strict mode enabled; Build errors ignored via `next.config.ts`

### Known Limitations

- **No Room Persistence:** Match history is not stored in a database (prototype)
- **Hardcoded STUN/TURN:** Uses public STUN/TURN servers (not production-ready)
- **Authentication:** .edu validation is commented out in signup (prototype mode)
- **Docker:** Single-node local dev only; no orchestrator for scaling

---

## Next Steps for New Engineers

1. **Read ARCHITECTURE.md** for deeper technical details
2. **Explore `/lobby` page** to understand real-time video flow
3. **Review Backend `LobbyController`** to see message handling
4. **Test locally** with `npm run dev` + `./mvnw spring-boot:run`
5. **Make a small change:** Add a new UI component or a new WebSocket message type

---

*Built with ❤️ for the University Community*
