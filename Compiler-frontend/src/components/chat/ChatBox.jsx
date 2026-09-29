import React from "react";
import chatbox from "../../assets/chatbox.png";

/**
 * ChatBox Component.
 * Floating room chat drawer with live messaging, host/member role badges, timestamps,
 * and an animated unread badge counter on the toggle trigger.
 *
 * @param {Object} props
 * @param {boolean} props.isCollaborating - Room collaboration state
 * @param {boolean} props.chatBoxVisible - Chat drawer visibility
 * @param {number} props.unreadChatCount - Unread message counter
 * @param {function} props.onToggleChat - Visibility toggle callback
 * @param {Array} props.chatMessages - List of message objects
 * @param {string} props.chatInput - Message text field value
 * @param {function} props.onChatInputChange - Text change handler
 * @param {function} props.onSendMessage - Dispatcher for sending message
 * @param {string} props.currentUserName - Logged-in user's identifier
 * @param {string} props.roomAdmin - Host username
 */
function ChatBox({
  isCollaborating,
  chatBoxVisible,
  unreadChatCount,
  onToggleChat,
  chatMessages,
  chatInput,
  onChatInputChange,
  onSendMessage,
  currentUserName,
  roomAdmin,
}) {
  if (!isCollaborating) return null;


  return (
    <>
      {/* Floating Chat Button */}
      <div className="absolute right-3 bottom-3 z-30">
        <button
          onClick={onToggleChat}
          className="relative w-12 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center shadow-2xl transition cursor-pointer"
          title="Toggle Room Chat"
        >
          <img src={chatbox} alt="Chat" className="w-6 h-6" />
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#111] shadow animate-pulse">
              {unreadChatCount}
            </span>
          )}
        </button>
      </div>

      {/* Live Chat Drawer */}
      {chatBoxVisible && (
        <div className="bg-[var(--bg-surface)] absolute text-[var(--text-primary)] rounded-2xl border border-[var(--border-subtle)] h-[50vh] flex flex-col bottom-16 right-3 w-80 z-40 shadow-2xl overflow-hidden animate-slide-up transition-colors">
          {/* Header */}
          <div className="p-3 border-b border-[var(--border-subtle)] text-xs font-semibold bg-[var(--bg-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span>💬</span>
              <span>Room Chat</span>
            </div>
            <button
              onClick={onToggleChat}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {chatMessages.length === 0 ? (
              <p className="text-center text-gray-500 text-xs py-8">
                No messages yet. Say hello! 👋
              </p>
            ) : (
              chatMessages.map((msg, index) => {
                const isMe = msg.user === currentUserName;
                const isMsgAdmin = msg.user === roomAdmin;
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-0.5">
                      <span className="font-semibold text-gray-300">{msg.user}</span>
                      {isMsgAdmin && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded">
                          Host
                        </span>
                      )}
                      <span>{msg.timestamp}</span>
                    </div>
                    <div
                      className={`p-2 rounded-xl text-xs max-w-[85%] break-words ${
                        isMe
                          ? "bg-violet-600 text-white rounded-tr-none"
                          : "bg-[#202028] text-gray-200 border border-gray-800 rounded-tl-none"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Footer */}
          <div className="p-2 border-t border-[var(--border-subtle)] flex gap-1.5 bg-[var(--bg-subtle)]">
            <input
              type="text"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              className="flex-1 bg-[var(--input-bg)] text-[var(--text-primary)] px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            />
            <button
              onClick={onSendMessage}
              disabled={!chatInput.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatBox;
