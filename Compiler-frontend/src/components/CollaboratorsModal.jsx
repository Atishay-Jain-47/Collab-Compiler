import React from "react";
import toast from "react-hot-toast";

/**
 * CollaboratorsModal Component.
 * Modal interface enabling the room Host to view connected participants, inspect their
 * assigned access levels, copy the room ID, and dynamically adjust member permissions
 * between Runner (EXECUTE), Editor (WRITE), and Viewer (READ).
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {function} props.onClose - Modal close handler
 * @param {string} props.roomId - Room identifier
 * @param {string} props.adminUserName - Host username
 * @param {string} props.currentUserName - Current active user
 * @param {Array} props.members - List of member objects with permissions
 * @param {function} props.onUpdatePermission - Callback to update member access level
 */
function CollaboratorsModal({
  isOpen,
  onClose,
  roomId,
  adminUserName,
  currentUserName,
  members = [],
  onUpdatePermission,
}) {
  if (!isOpen) return null;


  const isCurrentAdmin = currentUserName === adminUserName;

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied to clipboard!");
  };

  const getPermissionBadge = (perm, isAdmin) => {
    if (isAdmin) {
      return (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
          👑 Host
        </span>
      );
    }
    switch (perm) {
      case "EXECUTE":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            🚀 Runner
          </span>
        );
      case "WRITE":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            ✏️ Editor
          </span>
        );
      case "READ":
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
            👁️ Viewer
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-[var(--text-primary)] transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-subtle)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)] text-base">Room Members & Permissions</h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Manage room collaborator access levels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-root)] transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Room Info */}
        <div className="px-5 py-3 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] font-medium">Room ID:</span>
            <code className="bg-[var(--input-bg)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-md text-indigo-400 font-mono tracking-wider font-semibold">
              {roomId}
            </code>
          </div>
          <button
            onClick={copyRoomId}
            className="px-2.5 py-1 bg-[var(--bg-surface)] hover:bg-[var(--bg-root)] text-[var(--text-primary)] rounded-md border border-[var(--border-subtle)] transition flex items-center gap-1 cursor-pointer"
          >
            📋 Copy
          </button>
        </div>

        {/* Members List */}
        <div className="p-5 max-h-72 overflow-y-auto space-y-3">
          {members.length === 0 ? (
            <p className="text-[var(--text-secondary)] text-sm text-center py-4">
              No members detected yet.
            </p>
          ) : (
            members.map((member) => {
              const isSelf = member.userName === currentUserName;
              const isTargetAdmin = member.userName === adminUserName || member.isAdmin;

              return (
                <div
                  key={member.userName}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isSelf
                      ? "bg-blue-950/20 border-blue-700/50"
                      : "bg-[#1f1f23] border-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                      {member.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white">
                          {member.userName}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.2 rounded font-medium">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {isTargetAdmin ? "Room Creator (Admin)" : "Collaborator"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* If current user is Admin and target is NOT admin, show dropdown to change permissions */}
                    {isCurrentAdmin && !isTargetAdmin ? (
                      <select
                        value={member.permission || "WRITE"}
                        onChange={(e) =>
                          onUpdatePermission(member.userName, e.target.value)
                        }
                        className="bg-black/60 text-white text-xs border border-gray-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="EXECUTE">🚀 Runner (Full)</option>
                        <option value="WRITE">✏️ Editor (Write)</option>
                        <option value="READ">👁️ Viewer (Read Only)</option>
                      </select>
                    ) : (
                      getPermissionBadge(member.permission, isTargetAdmin)
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Permissions Guide Footer */}
        <div className="p-4 bg-[#141416] border-t border-gray-800 text-xs text-gray-400 space-y-1.5">
          <div className="font-semibold text-gray-300 mb-1">Access Levels:</div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">🚀 Runner:</span>
            <span>Can edit code collaboratively and run execution.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-400">✏️ Editor:</span>
            <span>Can edit code collaboratively (running code is restricted).</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">👁️ Viewer:</span>
            <span>Read-only access (typing and running code are locked).</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollaboratorsModal;
