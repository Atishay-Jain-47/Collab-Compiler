import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { setInput, setCode, setLanguage } from "../slices/codeSlice";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { go } from "@codemirror/lang-go";
import { javascript } from "@codemirror/lang-javascript";
import { rust } from "@codemirror/lang-rust";
import { php } from "@codemirror/lang-php";
import toast from "react-hot-toast";

// Modular Components
import Navbar from "../components/common/Navbar";
import CollabBar from "../components/room/CollabBar";
import CollaboratorsModal from "../components/room/CollaboratorsModal";
import CodeEditor from "../components/editor/CodeEditor";
import IOConsole from "../components/editor/IOConsole";
import ChatBox from "../components/chat/ChatBox";
import AiAssistant from "../components/ai/AiAssistant";

// Custom Hooks
import { useCollaboration } from "../hooks/useCollaboration";
import { useChat } from "../hooks/useChat";
import { useFileImport } from "../hooks/useFileImport";

/**
 * Home View Component
 *
 * Serves as the primary workspace orchestration view for Collab Compiler.
 * Coordinates:
 * - CodeEditor integration with Monaco/CodeMirror extensions
 * - Real-time collaborative synchronization via useCollaboration
 * - In-room group messaging via useChat
 * - File drag-and-drop / system file picking via useFileImport
 * - Remote execution console with input/output synchronization
 * - Floating AI assistant modal for intelligent code review and fixes
 */
function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { language, input, output, code } = useSelector((state) => state.code);
  const { token } = useSelector((state) => state.auth);
  const profileUser = useSelector((state) => state.profile?.user);
  const currentUserName =
    (typeof profileUser === "string" ? profileUser : profileUser?.userName) ||
    localStorage.getItem("user") ||
    "anonymous";

  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  // Chat Hook
  const {
    chatMessages,
    chatInput,
    setChatInput,
    chatBoxVisible,
    unreadChatCount,
    toggleChatBox,
    sendCurrentMessage,
    handleIncomingChatMessage,
    resetChat,
  } = useChat({
    currentUserName,
    onSendMessage: (text) => collab.broadcastChatMessage(text),
  });

  // Collaboration Hook
  const collab = useCollaboration({
    currentUserName,
    token,
    initialCode: code,
    onChatMessageReceived: handleIncomingChatMessage,
  });

  // Initial code load from localStorage on language change
  useEffect(() => {
    dispatch(setCode(localStorage.getItem(`code_${language}`) || ""));
  }, [language, dispatch]);

  // Sync solo/collab code transitions
  useEffect(() => {
    if (!collab.isCollaborating) {
      localStorage.setItem("code", localStorage.getItem(`code_${language}`) || "");
      dispatch(setCode(localStorage.getItem(`code_${language}`) || ""));
      resetChat();
    } else {
      dispatch(setCode(""));
    }
  }, [collab.isCollaborating, language, dispatch]);

  // Language Syntax Highlighter Mapping
  const languageExtension = useMemo(() => {
    switch (language) {
      case "PYTHON":
        return python();
      case "CPP":
      case "C":
        return cpp();
      case "JAVA":
        return java();
      case "GO":
        return go();
      case "RUST":
        return rust();
      case "PHP":
        return php();
      case "TYPESCRIPT":
        return javascript({ typescript: true });
      case "BASH":
      case "RUBY":
      case "JS":
      default:
        return javascript();
    }
  }, [language]);

  const editorExtensions = useMemo(() => {
    const exts = [languageExtension];
    if (collab.isCollaborating) {
      exts.push(collab.yCollabExtension);
    }
    return exts;
  }, [languageExtension, collab.isCollaborating, collab.yCollabExtension]);

  // File Import Hook
  const { isDraggingFile, handleDragOver, handleDragLeave, handleDrop } =
    useFileImport({
      myPermission: collab.myPermission,
      isCollaborating: collab.isCollaborating,
      onFileLoaded: (content, detectedLang, fileName) => {
        dispatch(setLanguage(detectedLang));
        localStorage.setItem("language", detectedLang);

        if (collab.isCollaborating) {
          collab.updateYjsContent(content);
          collab.broadcastLanguage(detectedLang);
        } else {
          dispatch(setCode(content));
          localStorage.setItem(`code_${detectedLang}`, content);
          localStorage.setItem("code", content);
        }
        toast.success(`Opened ${fileName || "file"} (${detectedLang})`, { icon: "📂" });
      },
    });

  // Handlers
  const handleCodeChange = (value) => {
    dispatch(setCode(value));
    localStorage.setItem("code", value);
  };

  const handleInputChange = (value) => {
    dispatch(setInput(value));
    localStorage.setItem("input", value);
    collab.broadcastInput(value);
  };

  const handleApplyAiCode = (suggestedCode) => {
    if (collab.isCollaborating && collab.myPermission === "READ") {
      toast.error("Read-Only: You cannot modify code in this room.");
      return;
    }

    if (collab.isCollaborating) {
      collab.updateYjsContent(suggestedCode);
    } else {
      dispatch(setCode(suggestedCode));
      localStorage.setItem(`code_${language}`, suggestedCode);
      localStorage.setItem("code", suggestedCode);
    }
  };

  const handleJoin = (targetId) => {
    if (!token) {
      toast.error("Login is required");
      navigate("/login");
      return;
    }
    collab.joinRoom(targetId);
  };

  const handleCreate = () => {
    if (!token) {
      toast.error("Login is required");
      navigate("/login");
      return;
    }
    collab.createRoom(code, language, input);
  };

  // Mobile active tab state: 'editor' | 'console'
  const [mobileTab, setMobileTab] = useState("editor");

  // Responsive screen breakpoint detection (>= 1024px is desktop)
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Width percentage for the editor on desktop (between 25% and 80%)
  const [editorWidth, setEditorWidth] = useState(60);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const workspaceRef = useRef(null);
  const isHorizontalDraggingRef = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isHorizontalDraggingRef.current || !workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      if (!rect.width) return;
      const offsetX = e.clientX - rect.left;
      const newWidth = (offsetX / rect.width) * 100;
      const clamped = Math.min(80, Math.max(25, newWidth));
      setEditorWidth(clamped);
    };

    const handleMouseUp = () => {
      if (isHorizontalDraggingRef.current) {
        isHorizontalDraggingRef.current = false;
        setIsDraggingHorizontal(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleHorizontalMouseDown = (e) => {
    e.preventDefault();
    isHorizontalDraggingRef.current = true;
    setIsDraggingHorizontal(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <>
      <style>{`
        .hbtn:hover  { filter: brightness(1.18); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.35); }
        .hbtn:active { filter: brightness(0.92); transform: translateY(1px);  box-shadow: none; }
        .hbtn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; filter: none; box-shadow: none; }
      `}</style>

      <div className="h-screen flex flex-col bg-[var(--bg-root)] text-[var(--text-primary)] transition-colors overflow-hidden">
        {/* Navigation Bar */}
        <Navbar
          stompClientRef={collab.stompClientRef}
          roomId={collab.roomId}
          isCollaborating={collab.isCollaborating}
          myPermission={collab.myPermission}
          onFileLoaded={(content, detectedLang, fileName) => {
            dispatch(setLanguage(detectedLang));
            localStorage.setItem("language", detectedLang);
            if (collab.isCollaborating) {
              collab.updateYjsContent(content);
              collab.broadcastLanguage(detectedLang);
            } else {
              dispatch(setCode(content));
              localStorage.setItem(`code_${detectedLang}`, content);
              localStorage.setItem("code", content);
            }
            toast.success(`Opened ${fileName || "file"} (${detectedLang})`, { icon: "📂" });
          }}
        />

        {/* Collaboration Status & Actions Bar */}
        <CollabBar
          roomId={collab.roomId}
          setRoomId={collab.setRoomId}
          isCollaborating={collab.isCollaborating}
          onJoinRoom={handleJoin}
          onCreateRoom={handleCreate}
          onDisconnectRoom={collab.disconnectRoom}
          onOpenCollaborators={() => collab.setShowMembersModal(true)}
          onOpenAiAssistant={() => setAiAssistantOpen(true)}
          memberCount={collab.roomMembers.length || collab.connectedUsers.size || 1}
          myPermission={collab.myPermission}
          roomAdmin={collab.roomAdmin}
          currentUserName={currentUserName}
        />

        {/* Mobile Viewport Tab Switcher (Visible only on < lg screens) */}
        <div className="flex lg:hidden items-center justify-center gap-2 px-3 py-1.5 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
          <button
            onClick={() => setMobileTab("editor")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mobileTab === "editor"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            }`}
          >
            💻 Code Editor
          </button>
          <button
            onClick={() => setMobileTab("console")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mobileTab === "console"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            }`}
          >
            Terminal & Output
          </button>
        </div>

        {/* Main Workspaces: Editor & Console (Side-by-side on lg+, Toggled on mobile) */}
        <div ref={workspaceRef} className="flex flex-col lg:flex-row p-2.5 flex-1 min-h-0 overflow-hidden relative">
          {/* Code Editor Container */}
          <div
            style={isDesktop ? { width: `calc(${editorWidth}% - 6px)` } : { width: "100%" }}
            className={`h-full min-h-0 ${
              mobileTab === "editor" ? "flex" : "hidden lg:flex"
            } flex-col shrink-0 overflow-hidden`}
          >
            <CodeEditor
              code={code}
              isCollaborating={collab.isCollaborating}
              myPermission={collab.myPermission}
              roomAdmin={collab.roomAdmin}
              editorExtensions={editorExtensions}
              onCodeChange={handleCodeChange}
              isDraggingFile={isDraggingFile}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          </div>

          {/* Draggable Resizer Bar between Editor and Console on Desktop */}
          <div
            onMouseDown={handleHorizontalMouseDown}
            title="Drag horizontally to resize Editor and Console"
            className="hidden lg:flex w-3 items-center justify-center cursor-col-resize group transition hover:bg-indigo-500/20 active:bg-indigo-500/30 z-10 shrink-0 select-none"
          >
            <div className="w-1 h-12 bg-[var(--border-subtle)] group-hover:bg-indigo-500 rounded-full transition-colors"></div>
          </div>

          {/* I/O Console Container */}
          <div
            style={isDesktop ? { width: `calc(${100 - editorWidth}% - 6px)` } : { width: "100%" }}
            className={`h-full min-h-0 ${
              mobileTab === "console" ? "flex" : "hidden lg:flex"
            } flex-col shrink-0 overflow-hidden`}
          >
            <IOConsole
              input={input}
              output={output}
              isCollaborating={collab.isCollaborating}
              onInputChange={handleInputChange}
            />
          </div>

          {/* Full-screen invisible overlay during horizontal resize */}
          {isDraggingHorizontal && (
            <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
          )}

          {/* Floating In-Room Chat Drawer */}
          <ChatBox
            isCollaborating={collab.isCollaborating}
            chatBoxVisible={chatBoxVisible}
            unreadChatCount={unreadChatCount}
            onToggleChat={toggleChatBox}
            chatMessages={chatMessages}
            chatInput={chatInput}
            onChatInputChange={setChatInput}
            onSendMessage={sendCurrentMessage}
            currentUserName={currentUserName}
            roomAdmin={collab.roomAdmin}
          />
        </div>
      </div>

      {/* Collaborators & Permissions Modal */}
      <CollaboratorsModal
        isOpen={collab.showMembersModal}
        onClose={() => collab.setShowMembersModal(false)}
        roomId={collab.roomId}
        adminUserName={collab.roomAdmin}
        currentUserName={currentUserName}
        members={collab.roomMembers}
        onUpdatePermission={collab.updateMemberPermission}
      />

      {/* Gemini AI Assistant Drawer */}
      <AiAssistant
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        currentCode={code}
        currentLanguage={language}
        currentOutput={output}
        onApplyCode={handleApplyAiCode}
        token={token}
      />
    </>
  );
}

export default Home;
