import React from "react";

/**
 * CollabBar Component.
 * Top collaboration control bar containing room ID input, Join/Create/Disconnect actions,
 * live connection indicators, member presence counters, and the AI Assistant trigger.
 *
 * @param {Object} props
 * @param {string} props.roomId - Active or entered room ID
 * @param {function} props.setRoomId - Room ID input change handler
 * @param {boolean} props.isCollaborating - Collaboration room active state
 * @param {function} props.onJoinRoom - Join room action
 * @param {function} props.onCreateRoom - Create room action
 * @param {function} props.onDisconnectRoom - Leave room action
 * @param {function} props.onOpenCollaborators - Modal open trigger
 * @param {function} props.onOpenAiAssistant - AI drawer open trigger
 * @param {number} props.memberCount - Count of connected collaborators
 * @param {string} props.myPermission - Active user's access level
 * @param {string} props.roomAdmin - Room Host username
 * @param {string} props.currentUserName - Current authenticated user
 */
function CollabBar({
  roomId,
  setRoomId,
  isCollaborating,
  onJoinRoom,
  onCreateRoom,
  onDisconnectRoom,
  onOpenCollaborators,
  onOpenAiAssistant,
  memberCount,
  myPermission,
  roomAdmin,
  currentUserName,
}) {

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-2.5 px-3 py-2 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] text-[var(--text-primary)] transition-colors">
      {/* Left Group: Room ID, Join/Create or Live Status */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[var(--text-secondary)] font-medium text-xs">Room:</span>

        <input
          type="text"
          placeholder="room-123"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          disabled={isCollaborating}
          className="bg-[var(--input-bg)] text-[var(--text-primary)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-mono shadow-2xs w-28 sm:w-44"
        />

        {!isCollaborating ? (
          <>
            <button
              onClick={() => onJoinRoom()}
              className="px-3 py-1 rounded-lg shadow-sm font-medium text-xs transition-colors bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
            >
              Join
            </button>

            <span className="text-gray-500 text-xs">or</span>

            <button
              onClick={onCreateRoom}
              className="px-3 py-1 rounded-lg font-medium text-xs transition-colors bg-green-600 hover:bg-green-500 text-white cursor-pointer"
            >
              ➕ Create Room
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onDisconnectRoom}
              className="px-3 py-1 rounded-lg font-medium text-xs transition-colors bg-red-600 hover:bg-red-500 text-white cursor-pointer"
            >
              ⚡ Disconnect
            </button>

            <span className="text-emerald-400 text-xs flex items-center gap-1 font-medium bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Room: <strong className="text-white font-mono">{roomId}</strong>
            </span>

            {/* Collaborators Button */}
            <button
              onClick={onOpenCollaborators}
              className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-900/80 transition flex items-center gap-1.5 cursor-pointer"
              title="View and manage room members & permissions"
            >
              <span>👥 Collaborators</span>
              <span className="bg-indigo-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {memberCount || 1}
              </span>
            </button>

            {/* My Permission Badge */}
            <span className="text-xs px-2.5 py-0.5 rounded-full border flex items-center gap-1 font-medium bg-black/40 border-gray-700 text-gray-300">
              Role:{" "}
              {myPermission === "EXECUTE" ? (
                <span className="text-emerald-400 font-semibold">
                  {roomAdmin === currentUserName ? "👑 Host" : "🚀 Runner"}
                </span>
              ) : myPermission === "WRITE" ? (
                <span className="text-blue-400 font-semibold">✏️ Editor</span>
              ) : (
                <span className="text-yellow-400 font-semibold">
                  👁️ Viewer (Read Only)
                </span>
              )}
            </span>
          </>
        )}
      </div>

      {/* Right Group: AI Assistant Trigger */}
      <div className="relative">
        <div className="absolute inset-0 animate-pulse bg-purple-500/20 blur-md rounded-full"></div>
        <button
          onClick={onOpenAiAssistant}
          className="relative px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white flex items-center gap-1.5 shadow-md cursor-pointer transition"
        >
          <span>✨ AI Assistant</span>
        </button>
      </div>
      <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent' />
    </div>
  );
}

export default CollabBar;
