# Collab Compiler Animation & Presentation Plan

Use Slide Show in desktop PowerPoint. Each numbered cue takes one click. Within a cue, elements enter together with a smooth transition and clean timing. Titles, category badges, and layout guides on content slides are visible on entry.

---

## 1. Collab Compiler (Title Slide)
Transition — Smooth Fade (0.5 s).
1. Collab Compiler (Fade).
2. A shared editor where teammates can run the same program and inspect the result together. (Fade).
3. Reveal the captured product screen. (Fade, FadedZoom).

## 2. Where a shared coding session breaks down
Transition — Smooth Fade (0.5 s).
1. EDITING — Concurrent edits (Fade, Float).
2. EXECUTION — Different runs (Fade, Float).
3. HISTORY — Lost context (Fade, Float).

## 3. One room for a coding session
Transition — Smooth Fade (0.5 s).
1. Reveal the captured product screen. (Fade, FadedZoom).
2. Share a room ID — Open the same editor and see who has joined. (Fade).
3. Work side by side — Edit the source, exchange chat messages and share input. (Fade).
4. Inspect the outcome — Read the run result and keep a named snapshot. (Fade).

## 4. What collaborators can do
Transition — Smooth Fade (0.5 s).
1. Edit together — CodeMirror and Yjs merge changes across browsers. (Fade, Float).
2. Run a program — Choose among 11 language strategies and supply standard input. (Fade, Float).
3. Ask for help — Request an explanation, a fix or an optimization in the AI drawer. (Fade, Float).
4. Recover a version — Save a checkpoint, inspect the line diff and restore its source. (Fade, Float).

## 5. A pair-programming session
Transition — Smooth Fade (0.5 s).
1. Open the IDE — Choose a language, type code or drop a source file. (Fade).
2. Create or join — Sign in and share or enter the room ID. (Fade, Wipe).
3. Set roles — The host assigns viewing, editing or execution rights. (Fade, Wipe).
4. Edit and run — Change the source, enter stdin and press Run. (Fade, Wipe).
5. Keep a version — Open History and name a snapshot. (Fade, Wipe).

## 6. The technology stack
Transition — Smooth Fade (0.5 s).
1. Browser — React 19, Vite, Redux Toolkit and CodeMirror 6 handle editing and local UI state. (Fade).
2. Live transport — Yjs merges text updates. STOMP over SockJS carries room events. (Fade).
3. Application — Java 21 and Spring Boot serve HTTP and messaging. Spring Security handles identity. (Fade).
4. Persistence — Spring Data maps users, rooms and snapshots to MongoDB documents. (Fade).
5. Execution and AI — Docker packages the runner. Gemini supplies language-model responses. (Fade).

## 7. Inside the shared workspace
Transition — Smooth Fade (0.5 s).
1. Browser — React · CodeMirror · Yjs (Fade).
2. Spring Boot — REST + STOMP broker (Fade).
3. MongoDB / records — Runner / programs (Fade, Wipe).
4. Request & Response flow — Room events reach every subscribed client through the broker. (Fade, Motion path).

## 8. System Architecture Workflow (Mermaid Workflow Diagram)
Transition — Smooth Fade (0.5 s).
1. Slide entry displays category header "SYSTEM DESIGN", title, and explanatory subtitle.
2. Click 1 reveals the full-scale system architecture flowchart: Browser Client (React/CodeMirror/Yjs/STOMP) -> Spring Boot (Controllers/Session Manager/Execution Strategies/Sandbox) -> Persistence (MongoDB), Docker Runner, and Gemini API. (Fade, 0.38 s).

## 9. How a keystroke reaches a peer
Transition — Smooth Fade (0.5 s).
1. Type an edit — CodeMirror changes the shared Y.Text. (Fade).
2. Encode a delta — The client Base64-encodes a binary Yjs update. (Fade, Wipe).
3. Send to Spring — Publish UPDATE to the room’s sync endpoint. (Fade, Wipe).
4. Relay to the room — Spring checks write permission and publishes to subscribers. (Fade, Wipe).
5. Apply the delta — The peer decodes it and calls Y.applyUpdate. (Fade, Wipe).

## 10. Real-Time Collaboration Flow (Mermaid Sequence Diagram)
Transition — Smooth Fade (0.5 s).
1. Slide entry displays category header "FEATURE WALKTHROUGH", title, and subtitle.
2. Click 1 reveals the sequence diagram showing sub-50ms keystroke synchronization between Alice, CodeMirror, Yjs Doc, Spring STOMP Broker, and Bob. (Fade, 0.38 s).

## 11. What happens when you press Run
Transition — Smooth Fade (0.5 s).
1. Submit — POST /run sends source, language, stdin and optional room ID. (Fade).
2. Authorize — A room run requires execution permission. (Fade, Wipe).
3. Prepare — Create a session and write source and input files. (Fade, Wipe).
4. Execute — Select the language strategy and use Docker or a host process. (Fade, Wipe).
5. Return — Collect output, errors and elapsed time. Clean up the files. (Fade, Wipe).

## 12. Code Execution Pipeline (Mermaid Workflow Diagram)
Transition — Smooth Fade (0.5 s).
1. Slide entry displays category header "FEATURE WALKTHROUGH", title, and subtitle.
2. Click 1 reveals the execution flowchart: User clicks Run -> CodeController -> Permission check -> SaveFileService -> StrategyFactory -> Adaptive Docker / Host Sandbox -> Output collection -> Temp cleanup. (Fade, 0.38 s).

## 13. Asking Gemini about the code
Transition — Smooth Fade (0.5 s).
1. Reveal the captured product screen. (Fade, FadedZoom).
2. Choose an action — Explain, fix, optimize or ask a question. (Fade).
3. Build the request — The authenticated AI endpoint checks the prompt and rate limit. (Fade).
4. Prepare context — AiService organizes code in 100-line chunks for Gemini. (Fade).
5. Review the reply — Read the explanation. Apply a suggested snippet when appropriate. (Fade).

## 14. AI Assistant Intelligence Flow (Mermaid Workflow Diagram)
Transition — Smooth Fade (0.5 s).
1. Slide entry displays category header "FEATURE WALKTHROUGH", title, and subtitle.
2. Click 1 reveals the intelligence pipeline: User action selection -> Validation -> Rate limit check -> 100-line chunking engine -> Multi-tier model fallback (gemini-3.5-flash -> 3.1-flash-lite -> 3.8-flash -> Offline heuristic) -> Structured response. (Fade, 0.38 s).

## 15. Restoring a room snapshot
Transition — Smooth Fade (0.5 s).
1. Reveal the captured product screen. (Fade, FadedZoom).
2. Capture — Save Version writes the code and metadata to MongoDB. (Fade).
3. Compare — Select a snapshot to inspect its line-by-line diff. (Fade).
4. Restore — The service loads the snapshot and checks room write permission. (Fade).
5. Refresh peers — REVERT_TO_VERSION carries the saved code to room clients. (Fade).

## 16. Version Control and Revert Workflow (Mermaid Sequence Diagram)
Transition — Smooth Fade (0.5 s).
1. Slide entry displays category header "FEATURE WALKTHROUGH", title, and subtitle.
2. Click 1 reveals the snapshot and revert sequence: User -> VersionController -> VersionService -> MongoDB query -> Authorization check -> STOMP REVERT_TO_VERSION room-wide broadcast -> Instant peer editor update. (Fade, 0.38 s).

## 17. Identity across HTTP and STOMP
Transition — Smooth Fade (0.5 s).
1. POST /auth/login (Fade, Wipe).
2. Look up user and verify hash (Fade, Wipe).
3. Signed JWT (Fade, Wipe).
4. STOMP CONNECT + bearer token (Fade, Wipe).

## 18. What MongoDB remembers
Transition — Smooth Fade (0.5 s).
1. ACCOUNT — user (Fade).
2. ROOM — collab_rooms (Fade, Wipe).
3. SNAPSHOT — code_versions (Fade, Wipe).

## 19. One run, two consoles
Transition — Smooth Fade (0.5 s).
1. Runner clicks Run — The browser posts code and stdin to /run. (Fade).
2. Server executes — Check the room role, prepare files and invoke the runner. (Fade, Wipe).
3. HTTP returns — The caller displays output, errors and elapsed time. (Fade, Wipe).
4. Client publishes — The caller sends RUN_RESULT through the room sync destination. (Fade, Wipe).
5. Peers display — Room subscribers unpack the result into their own consoles. (Fade, Wipe).

## 20. Sign-in and editor views
Transition — Smooth Fade (0.5 s).
1. Sign in — Enter the workspace with a room identity. (Fade, FadedZoom).
2. Room controls — Source editor with real-time presence indicators. (Fade, FadedZoom).

## 21. Three engineering decisions
Transition — Smooth Fade (0.5 s).
1. Concurrent typing — Yjs merges incremental changes so simultaneous edits converge. (Fade).
2. Slow or noisy programs — A timeout bounds execution. Concurrent readers drain output with a size cap. (Fade).
3. Unequal room roles — Viewers observe, editors change code, runners execute and hosts manage members. (Fade).

## 22. Future scope
Transition — Smooth Fade (0.5 s).
1. WORKSPACE — Multi-file projects (Fade, Float).
2. EDITOR — Language intelligence & LSP support (Fade, Float).
3. INFRASTRUCTURE — Multi-node rooms via Redis pub/sub (Fade, Float).

## 23. Collab Compiler (Closing Slide)
Transition — Smooth Fade (0.5 s).
1. Collab Compiler (Fade).
2. A team can edit one program, inspect the same run and restore a known version. (Fade).
3. Questions & Discussion — Thank you! (Fade).

---

All sequences and slide transitions are fully embedded in `Project_Presentation.pptx`. No manual PowerPoint configuration is needed. Slides run seamlessly in PowerPoint desktop or web view with Slide Show mode (`F5`).
