import { useState } from "react";

/**
 * Custom React Hook managing room messaging, input state, and unread notifications.
 *
 * @param {Object} params
 * @param {string} params.currentUserName - Current active username
 * @param {function} params.onSendMessage - Broadcast callback sending chat messages over WebSocket
 */
export function useChat({ currentUserName, onSendMessage }) {

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBoxVisible, setChatBoxVisible] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const handleIncomingChatMessage = (payload) => {
    if (payload.senderId !== currentUserName) {
      const messageText = payload.text || payload.content || payload.message;
      setChatMessages((prev) => [
        ...prev,
        {
          user: payload.senderId,
          message: messageText || "[Message]",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      if (!chatBoxVisible) {
        setUnreadChatCount((count) => count + 1);
      }
    }
  };

  const toggleChatBox = () => {
    const nextState = !chatBoxVisible;
    setChatBoxVisible(nextState);
    if (nextState) {
      setUnreadChatCount(0);
    }
  };

  const sendCurrentMessage = () => {
    const text = chatInput.trim();
    if (!text) return;

    setChatMessages((prev) => [
      ...prev,
      {
        user: currentUserName,
        message: text,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    if (onSendMessage) {
      onSendMessage(text);
    }

    setChatInput("");
  };

  const resetChat = () => {
    setChatMessages([]);
    setChatInput("");
    setUnreadChatCount(0);
  };

  return {
    chatMessages,
    chatInput,
    setChatInput,
    chatBoxVisible,
    unreadChatCount,
    toggleChatBox,
    sendCurrentMessage,
    handleIncomingChatMessage,
    resetChat,
  };
}
