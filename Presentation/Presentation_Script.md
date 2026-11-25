# Collab Compiler

## Presentation script

### 1. Collab Compiler

Imagine two people tracing the same Python function. One changes the loop while the other supplies the input. Both need to see the code that actually ran and the output it produced. Collab Compiler brings those actions into a browser room. Follow one edit, one run and one restore to see how the pieces fit together.

**Presenter cue**  Pause on each reveal and connect it to the pair-programming example.

### 2. Where a shared coding session breaks down

Think of a student pasting a fix into chat while an interviewer runs an older copy. Even a correct fix can look broken if the test input differs. A useful coding room needs a shared document, an agreed result and a way to recover the version under discussion.

**Presenter cue**  Pause on each reveal and connect it to the pair-programming example.

### 3. One room for a coding session

The workspace shown here is the actual React editor. The host creates a room with the current language, code and input. A collaborator joins by ID. The host can choose who observes, edits or runs. Room chat keeps the discussion next to the work.

**Presenter cue**  Pause on each reveal and connect it to the pair-programming example.

### 4. What collaborators can do

These four actions take different paths. Edits travel as room messages. Runs and AI questions start as HTTP requests. Version history adds a database read or write, and a room restore also sends a message to peers. File import, roles and chat support those four workflows.

**Presenter cue**  Pause on each reveal and connect it to the pair-programming example.

### 5. A pair-programming session

The home route is the editor. For a two-person demo, begin with the host’s code already loaded. Create a room in one browser, sign in as a second user in another and join with its ID. Use the members control to set the second user’s role. End by saving a version that can be compared later.

**Presenter cue**  Advance one stage at a time. Pause at “Set roles” before revealing the next step.

### 6. The technology stack

CodeMirror supplies an extensible editor. Yjs provides the shared-text model, so the server can relay edits. REST handles actions with a single response. STOMP fans out changes to current subscribers. MongoDB holds durable records. Deployment separates the Vite static bundle from the Java service, which the project packages with a multi-stage Dockerfile.

**Presenter cue**  Pause on each reveal and connect it to the pair-programming example.

### 7. Inside the shared workspace

Start at the browser. Login, run, version and AI actions call REST controllers. The Spring messaging controller handles room messages on a separate path. Services route durable data to MongoDB, programs to the adaptive executor and AI requests to Gemini. Replies return to the caller over HTTP. Edits and room notifications fan out over STOMP. These are alternative paths selected by the action.

**Presenter cue**  Reveal the two directions separately. Ask which transport carries a peer update.

### 8. How a keystroke reaches a peer

A CodeMirror transaction changes the local Yjs document immediately. The collaboration hook sends the encoded delta to /app/editor.sync/{roomId}. Spring derives the sender from the connected principal and checks write permission for UPDATE. Subscribers on /topic/room/{roomId} receive the message. Their local Yjs documents merge it and update CodeMirror. Presence and cursor awareness use separate messages.

**Presenter cue**  Advance one stage at a time. Pause at “Send to Spring” before revealing the next step.

### 9. What happens when you press Run

For a room submission, CodeController asks SessionManager whether the named user can execute. SaveFileService materializes the session files. The strategy factory selects a command for the language. CodeRunnerService passes it to the adaptive executor with a 15-second timeout. Docker mode needs the daemon and runner image. The fallback uses a host process with different isolation properties. A finally block cleans up the workspace.

**Presenter cue**  Advance one stage at a time. Pause at “Prepare” before revealing the next step.

### 10. Asking Gemini about the code

Open AI Assistant and choose an action. The frontend sends language, code, error context and the question to POST /api/ai/ask. The server enforces a 300-word custom prompt limit and a per-user bucket refilling at five requests per minute. The service builds context, tries configured model fallbacks and extracts a suggested snippet when available. Apply to Editor replaces the current editor content with that suggestion, so review the scope before applying it.

**Presenter cue**  Point to the captured control first. Then trace each service operation in order.

### 11. Restoring a room snapshot

Open History, choose Save Version and enter a meaningful name. VersionControlService saves a code_versions document and announces VERSION_CREATED to the room. The UI can compare source using a longest-common-subsequence line diff. A revert loads the selected document and checks write permission for room versions. Spring publishes the saved source to connected members. A solo restore updates the local editor.

**Presenter cue**  Point to the captured control first. Then trace each service operation in order.

### 12. Identity across HTTP and STOMP

Signup stores a BCrypt password hash. At login, Spring’s authentication manager checks the credentials against the stored user. A successful response contains a username and a signed JWT. The browser can present it to authenticated endpoints such as the AI API. The SockJS handshake opens the transport, then the STOMP CONNECT interceptor checks the token, resolves the user and sets the connection principal. Room permissions govern subsequent editing and execution decisions.

**Presenter cue**  Follow the arrows in order. Pause after the JWT returns to the browser.

### 13. What MongoDB remembers

These are application-level references in MongoDB. A room keeps its administrator’s username and a permissions map keyed by username. Multiple snapshots can share one roomId. A solo snapshot leaves roomId empty and can be queried by author and language. Room history reads snapshots newest first. The Mongo-backed room repository also uses an in-memory cache. Temporary execution files have a separate lifecycle.

**Presenter cue**  Follow one username into a room, then one room ID into its version history.

### 14. One run, two consoles

Follow the result carefully. The backend executes the submitted source once for this request and sends an HTTP response to the initiating browser. The frontend updates its console, then publishes RUN_RESULT over its active STOMP connection. The collaboration hook in each receiving browser unpacks the event and updates its console state. A peer can read the same outcome without launching another process.

**Presenter cue**  Advance one stage at a time. Pause at “HTTP returns” before revealing the next step.

### 15. Sign-in and editor views

The left capture shows the sign-in screen. The right shows the actual local frontend with a short Python program typed into the editor. Trace the function, then point out that it reads a value from standard input. The upper-right input pane accepts that value before execution. The lower-right output pane is where the returned result appears. In this capture the program has not been run.

**Presenter cue**  Pause on each reveal and connect it to the pair-programming example.

### 16. Three engineering decisions

For editing, the important design decision is to exchange document updates and let Yjs reconcile them. For execution, stream draining prevents a verbose child process from blocking on a full pipe, and a timeout limits how long it can run. For permissions, the interface reflects the role and the server checks relevant operations such as UPDATE, room runs and room-wide restore.

**Presenter cue**  Pause on each reveal and connect it to the pair-programming example.

### 17. Future scope

These are proposed extensions. Multi-file support changes how the editor and runner represent a project. Language servers would bring semantic assistance into the editor. A shared broker would let users on different Spring instances receive the same room events. Today the application uses a single-file workspace and Spring’s simple broker.

**Presenter cue**  Pause on each reveal and connect it to the pair-programming example.

### 18. Collab Compiler

Close by returning to the pair-programming example. Yjs handles concurrent text edits, a language strategy runs the submission, and a persisted snapshot gives the room a recovery point. For questions, offer to trace an edit, a run or a restore through the implementation. The repository link opens the project source.

**Presenter cue**  Invite questions about the edit, run or restore path.
