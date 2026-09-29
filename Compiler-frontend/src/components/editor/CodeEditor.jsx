import React from "react";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";

import { useTheme } from "../../context/ThemeContext";

/**
 * CodeEditor Component.
 * Wraps CodeMirror with dynamic language syntax, Yjs collaborative extensions,
 * a read-only lock banner when viewing, responsive sizing, and theme switching.
 *
 * @param {Object} props
 * @param {string} props.code - Current code content
 * @param {boolean} props.isCollaborating - Whether the room is active
 * @param {string} props.myPermission - Access level ("READ", "WRITE", "EXECUTE")
 * @param {string} props.roomAdmin - Host username
 * @param {Array} props.editorExtensions - CodeMirror extension array
 * @param {function} props.onCodeChange - Code change listener
 * @param {boolean} props.isDraggingFile - File drag hover status
 * @param {function} props.onDragOver - Drag over handler
 * @param {function} props.onDragLeave - Drag leave handler
 * @param {function} props.onDrop - Drop event handler
 */
function CodeEditor({
  code,
  isCollaborating,
  myPermission,
  roomAdmin,
  editorExtensions,
  onCodeChange,
  isDraggingFile,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const { isDark } = useTheme();
  const isReadOnly = isCollaborating && myPermission === "READ";

  return (
    <div
      className={`w-full h-full flex flex-col relative rounded-xl overflow-hidden border transition-all bg-[var(--bg-surface)] ${
        isDraggingFile
          ? "border-purple-500 ring-2 ring-purple-500/50"
          : "border-[var(--border-subtle)] shadow-xs"
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Read-Only Warning Notice Banner */}
      {isReadOnly && (
        <div className="bg-yellow-950/60 border-b border-yellow-700/50 text-yellow-300 px-3 py-1.5 text-xs flex items-center justify-between z-10">
          <span className="flex items-center gap-1.5">
            <span>🔒</span>
            <span>
              <strong>View-Only Mode:</strong> You have read-only access in this room.
              Edits and running code are disabled.
            </span>
          </span>
          <span className="text-[11px] text-yellow-400/80">Admin: {roomAdmin || "Host"}</span>
        </div>
      )}

      {/* Drag & Drop Visual Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-0 z-30 bg-purple-950/85 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none border-2 border-dashed border-purple-400 rounded-xl">
          <span className="text-4xl animate-bounce">📂</span>
          <h3 className="text-lg font-bold text-white mt-2">Drop Code File Here</h3>
          <p className="text-xs text-purple-200 mt-1">
            Supports .py, .cpp, .java, .js, .go, .c, etc.
          </p>
        </div>
      )}

      {/* CodeMirror */}
      <div className="flex-1 min-h-0 h-full overflow-hidden">
        <CodeMirror
          key={`${isCollaborating ? "collab" : "solo"}-${isDark ? "dark" : "light"}`}
          value={isCollaborating ? undefined : code}
          height="100%"
          className="h-full"
          theme={isDark ? oneDark : "light"}
          readOnly={isReadOnly}
          editable={!isReadOnly}
          extensions={editorExtensions}
          onChange={(value) => {
            if (!isReadOnly && onCodeChange) {
              onCodeChange(value);
            }
          }}
        />
      </div>
    </div>
  );
}

export default CodeEditor;
