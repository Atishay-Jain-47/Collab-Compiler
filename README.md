# ⚡ Real-Time Online Collaborative Compiler & Code Execution Engine

A production-grade, highly scalable **Online Collaborative Code Editor and Multi-Language Execution Engine** built with **Spring Boot 3 (Java 21)**, **React 19**, **Yjs (CRDT)**, and **WebSocket (STOMP / SockJS)**.

Features real-time conflict-free collaborative editing, role-based room administration (`Host`, `Runner`, `Editor`, `Viewer`), sandboxed process execution with strict resource constraints, shared execution output and standard input, Google Gemini AI code assistance, local file import with drag-and-drop, and in-room chat.

---

## 📑 Table of Contents
- [Architecture & System Design](#-architecture--system-design)
  - [High-Level Design (HLD)](#high-level-design-hld)
  - [Low-Level Design (LLD) Patterns](#low-level-design-lld-patterns)
- [Key Features](#-key-features)
- [Supported Languages](#-supported-languages)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start Scripts (start.sh / stop.sh)](#quick-start-scripts)
  - [Manual Setup](#manual-setup)
- [API Reference](#-api-reference)
  - [REST Endpoints](#rest-endpoints)
  - [WebSocket STOMP Protocol](#websocket-stomp-protocol)
- [Security & Sandboxing](#-security--sandboxing)
- [Horizontal Scalability & Production Readiness](#-horizontal-scalability--production-readiness)

---

## 🏛️ Architecture & System Design

### High-Level Design (HLD)

```
                            +-----------------------------+
                            |       Browser Clients       |
                            |  (React 19 + Yjs + STOMP)   |
                            +--------------+--------------+
                                           |
                                [HTTPS / WSS Traffic]
                                           |
                            +--------------v--------------+
                            |    API Gateway / LB (NGINX) |
                            +--------------+--------------+
                                           |
                   +-----------------------+-----------------------+
                   |                                               |
        +----------v----------+                         +----------v----------+
        | Spring Boot Node 1  |                         | Spring Boot Node N  |
        | (Port 8082)         |                         | (Horizontally scaled)
        +----------+----------+                         +----------+----------+
                   |                                               |
                   +-----------------------+-----------------------+
                                           |
                   +-----------------------+-----------------------+
                   |                       |                       |
        +----------v----------+ +----------v----------+ +----------v----------+
        |   Redis Cluster     | |  MongoDB Atlas       | | Sandboxed Workers   |
        | - Pub/Sub Room Mesh | | - Users & Auth       | | - Process Isolation |
        | - Session & Perms   | | - Code Snapshots     | | - 15s Timeout       |
        +---------------------+ +----------------------+ +---------------------+
```

### Low-Level Design (LLD) Patterns

1. **Strategy Pattern (`ExecutionStrategy`)**:
   - Encapsulates compilation commands, binary paths, execution flags, and execution semantics per language.
   - Adding new languages requires zero modifications to existing runners, strictly adhering to the **Open/Closed Principle (OCP)**.
2. **Factory Pattern (`ExecutionStrategyFactory`)**:
   - Dynamically registers all `ExecutionStrategy` beans via Spring dependency injection and resolves them at runtime based on the `Language` enum.
3. **Sandbox Abstraction (`SandboxExecutor`)**:
   - Decouples process management from web request threads.
   - Controls process lifecycles, working directory isolation, standard input streaming, and forcible termination upon exceeding the 15-second time limit.
4. **Repository Pattern (`RoomSessionRepository`)**:
   - Decouples room and member permission persistence from business logic.
   - Implements `InMemoryRoomSessionRepository` for lightweight local development, ready to be swapped with a Redis repository in clustered deployments.
5. **Conflict-Free Replicated Data Types (CRDT - Yjs)**:
   - Client-side operational synchronization ensures convergence without server-side merge locks.

---

## ✨ Key Features

- **Granular Room Permissions**:
  - `👑 Host`: Room creator with full administration rights. Can dynamically promote or demote any participant.
  - `🚀 Runner` (`EXECUTE`): Full collaborative code editing and execution privileges.
  - `✏️ Editor` (`WRITE`): Can collaboratively edit code (execution is disabled).
  - `👁️ Viewer` (`READ`): Read-only mode. CodeMirror is locked with a warning banner, and execution is prohibited.
- **Collaborative Runner & Input Sync**:
  - Live shared stdin (`INPUT_CHANGE`) keeps test inputs synchronized across participants.
  - Shared execution results (`RUN_RESULT`) broadcast stdout, stderr, and run status to all room participants simultaneously.
- **File Explorer & Drag-and-Drop**:
  - `📁 Open File` dialog accepts `.py`, `.cpp`, `.c`, `.java`, `.js`, `.go`, etc.
  - Drag-and-drop code files directly onto the editor with an animated drop zone overlay.
  - Automatic language and syntax mode detection from file extensions.
- **Gemini AI Code Assistant**:
  - Floating `✨ AI Assistant` drawer.
  - **💡 Explain Code**: Algorithmic breakdown and logic flow explanation.
  - **🐞 Fix Bugs & Errors**: Analyzes runtime errors/warnings and generates corrected code.
  - **⚡ Optimize $O(N)$**: Algorithmic complexity analysis and optimizations.
  - **✨ 1-Click "Apply to Editor"**: Inserts AI-generated code directly into CodeMirror / Yjs.
- **Room Chat**:
  - Live in-room chat with role badges (`Host`, `Collaborator`).
  - Animated unread badge counter on the chat toggle icon when the drawer is closed.
- **Adaptive Workspace & Draggable Splitters**:
  - **Light / Dark Themes**: Persistent theme engine with CSS design tokens and custom scrollbars.
  - **Horizontal Splitter (Editor vs Console)**: Draggable divider bar with visual grip handle allowing flexible split adjustment (25% to 80%) on desktop screens.
  - **Vertical Splitter (Input vs Output)**: Draggable splitter between Custom Input (stdin) and Execution Output (stdout) (15% to 85% height distribution) with independent `overflow-auto` scrollbars.
  - **Mobile & Tablet Responsive**: Responsive layout with dedicated tab navigation (`💻 Code Editor` vs `Terminal & Output`) on screens below `lg`.

---

## 💻 Supported Languages

| Language | Extension | Compiler / Interpreter | Platform Command (Host / Docker Sandbox) |
| :--- | :--- | :--- | :--- |
| **Python** | `.py` | Python 3.x | `python3 main.py` |
| **C++** | `.cpp`, `.cc` | GCC / G++ | `g++ main.cpp -O2 -o main.out && ./main.out` |
| **C** | `.c` | GCC | `gcc main.c -O2 -o main.out && ./main.out` |
| **Java** | `.java` | OpenJDK 17 / 21 | `javac Main.java && java Main` |
| **Go** | `.go` | Golang | `go run main.go` |
| **JavaScript** | `.js` | Node.js | `node main.js` |
| **TypeScript** | `.ts` | TypeScript (`tsx` / `ts-node`) | `npx -y tsx main.ts` |
| **Rust** | `.rs` | Rust (`rustc`) | `rustc main.rs -O -o main.out && ./main.out` |
| **PHP** | `.php` | PHP CLI | `php main.php` |
| **Ruby** | `.rb` | Ruby | `ruby main.rb` |
| **Bash / Shell** | `.sh`, `.bash` | GNU Bash | `/bin/bash main.sh` |

---

## 📂 Project Structure

```text
Collab Compiler/
├── Compiler/                            # Spring Boot 3 Backend
│   ├── src/main/java/com/example/demo/
│   │   ├── common/                      # Response envelope & Global exception handling
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   ├── ExecutionException.java
│   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   └── UnauthorizedException.java
│   │   │   └── response/
│   │   │       └── ApiResponse.java
│   │   ├── config/                      # Web, Security, Mongo & STOMP configurations
│   │   ├── controller/                  # REST & WebSocket Controllers
│   │   │   ├── AiController.java
│   │   │   ├── AuthController.java
│   │   │   ├── CodeController.java
│   │   │   ├── CollaborationController.java
│   │   │   └── RoomController.java
│   │   ├── dto/                         # Request / Response DTOs
│   │   ├── entity/                      # Domain entities & enums (Language, RoomPermission)
│   │   ├── manager/                     # SessionManager
│   │   ├── modules/
│   │   │   ├── room/repository/         # RoomSessionRepository & In-Memory Store
│   │   │   └── runner/
│   │   │       ├── sandbox/             # SandboxExecutor & ProcessSandboxExecutor
│   │   │       └── strategy/            # ExecutionStrategy & Factory (Python, C++, Java...)
│   │   └── service/                     # Business services (AiService, CodeRunnerService...)
│   ├── pom.xml
│   └── mvnw.cmd / mvnw
│
├── Compiler-frontend/                   # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/                      # AiAssistant.jsx
│   │   │   ├── chat/                    # ChatBox.jsx
│   │   │   ├── common/                  # Navbar.jsx
│   │   │   ├── editor/                  # CodeEditor.jsx, IOConsole.jsx
│   │   │   └── room/                    # CollabBar.jsx, CollaboratorsModal.jsx
│   │   ├── hooks/                       # Custom hooks (useCollaboration, useChat, useFileImport)
│   │   ├── pages/                       # Home.jsx, Login.jsx, Signup.jsx
│   │   ├── services/                    # API connector & endpoint definitions
│   │   ├── slices/                      # Redux Toolkit slices (auth, code, profile)
│   │   └── utils/                       # Language extensions & detection
│   ├── package.json
│   └── vite.config.js
│
├── start.sh                             # Linux / macOS / Git Bash startup script
├── stop.sh                              # Linux / macOS / Git Bash shutdown script
├── start.bat                            # Windows CMD / PowerShell startup script
├── stop.bat                             # Windows CMD / PowerShell shutdown script
└── README.md                            # Comprehensive project documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Java Development Kit (JDK 21+)** (Amazon Corretto, Eclipse Temurin, or Oracle OpenJDK)
- **Node.js (v18+) & npm**
- Compilers & Interpreters in PATH:
  - Python 3 (`python`)
  - GCC / G++ (`gcc`, `g++`)
  - Node.js (`node`)
  - Go (`go`)
- **MongoDB** (Atlas connection string or local MongoDB instance)

---

### Quick Start Scripts

#### Linux / macOS / Git Bash
```bash
# Start both Backend (port 8082) and Frontend (port 5173)
./start.sh

# Stop all running services
./stop.sh
```

#### Windows (Command Prompt / PowerShell)
```cmd
# Start both Backend and Frontend
start.bat

# Stop all services
stop.bat
```

---

### Manual Setup

#### 1. Backend Setup
```bash
cd Compiler

# Configure environment variables (optional, defaults provided in application.properties)
# export GEMINI_API_KEY="your-gemini-key"

# Compile and run
./mvnw spring-boot:run
# On Windows: .\mvnw.cmd spring-boot:run
```
The backend will start on **`http://localhost:8082`**.

#### 2. Frontend Setup
```bash
cd Compiler-frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
The frontend will start on **`http://localhost:5173`**.

---

## 📡 API Reference

### REST Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/signup` | Register a new user account | No |
| `POST` | `/auth/login` | Authenticate and obtain JWT token | No |
| `POST` | `/collab/info` | Create a new collaborative room (Creator becomes Host) | Yes |
| `POST` | `/collab/join` | Join an existing room by `roomId` | Yes |
| `GET` | `/collab/room/{roomId}?user={userName}` | Get room members, admin status, and permissions | No |
| `POST` | `/collab/permission` | Update member permission (`EXECUTE`, `WRITE`, `READ`) | Yes (Host only) |
| `POST` | `/run` | Execute code with language, input, and optional `roomId` | Yes |
| `POST` | `/api/ai/ask` | Ask Gemini AI (`EXPLAIN`, `FIX`, `OPTIMIZE`, `CHAT`) | No |

---

### WebSocket STOMP Protocol

- **Broker Destination Prefix**: `/topic`
- **Application Destination Prefix**: `/app`
- **WebSocket Handshake URL**: `http://localhost:8082/ws-compiler` (SockJS fallback enabled)

#### STOMP Topics & Mappings:
- **Subscribe**: `/topic/room/{roomId}` (receives real-time events for the room)
- **Publish**: `/app/editor.sync/{roomId}`

#### Message Event Types (`YjsPayload`):
- `SYNC_REQUEST`: Broadcast by a newly joined client requesting current room state.
- `SYNC_STATE`: Sent by existing peers with full Base64-encoded Yjs state.
- `UPDATE`: Incremental typing change emitted by an authorized editor.
- `INPUT_CHANGE`: Synchronizes the custom standard input textarea across all participants.
- `RUN_RESULT`: Broadcasts execution output (`output`, `error`, `input`) when a member runs code.
- `LANGUAGE_CHANGE`: Broadcasts language mode change to update syntax highlighting.
- `PERMISSION_CHANGE`: Broadcasts administrative permission changes for a specific user.
- `CHAT`: In-room messaging payload (`senderId`, `content`, `timestamp`).
- `DISCONNECT`: Informs room members when a participant disconnects.

---

## 🛡️ Security & Sandboxing

1. **Permission Gating**:
   - `CodeController` verifies member permissions with `SessionManager.canUserExecute()`. Unauthorized execution attempts are rejected with `HTTP 403 Forbidden`.
   - `CollaborationController` blocks WebSocket `UPDATE` broadcasts from members with `READ` permission.
2. **Adaptive Execution Engine (`AdaptiveSandboxExecutor`)**:
   - **Docker Sandbox (`DockerSandboxExecutor`)**: When Docker is available and `collab-compiler-runner:latest` is built, untrusted user code executes in hardened ephemeral containers:
     - `--network=none`: Zero network access (neutralizes SSRF, crypto-mining, reverse shells, external calls).
     - `--memory=256m --memory-swap=256m`: Cgroups memory ceiling preventing host RAM exhaustion.
     - `--cpus=1.0`: CPU quota preventing 100% CPU thread starvation.
     - `--pids-limit=64`: Neutralizes fork bombs (`:(){ :|:& };:`).
     - `--rm`: Ephemeral container lifecycle; container is destroyed immediately after execution.
   - **Process Sandbox Fallback (`ProcessSandboxExecutor`)**: If Docker is offline or disabled, automatically falls back to isolated host process execution so code runs without breaking local development.
   - **15-Second Watchdog (TLE)**: All executions (Docker and process) enforce a strict 15-second wall-clock limit with forced destruction (`destroyForcibly()`) upon timeout.
3. **Runner Image & Build Scripts**:
   - Built from [`runner/Dockerfile`](file:///d:/Collab%20Compiler/runner/Dockerfile) (Debian slim with GCC, G++, Python 3, Node.js, OpenJDK 17, and Go, running as non-root `runner:1001`).
   - Windows 1-click build: `runner\build-runner-image.bat`
   - Linux/macOS build: `runner/build-runner-image.sh`
4. **Authentication & Authorization**:
   - JWT stateless token validation on protected endpoints.
   - Passwords hashed using Spring Security BCrypt.

---

## 📈 Horizontal Scalability & Production Readiness

To deploy this architecture across multiple Kubernetes pods or cloud instances:
1. **Enable Redis Pub/Sub**: Connect `WebSocketConfig` to a shared Redis message broker or RabbitMQ relay so WebSocket messages broadcast seamlessly across all backend instances.
2. **Distributed Room State**: Switch `RoomSessionRepository` from `InMemoryRoomSessionRepository` to a Redis-backed session repository.
3. **Containerized Execution Workers**: Use `DockerSandboxExecutor` or Kubernetes Jobs / Firecracker microVMs for production clusters.
