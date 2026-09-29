import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import * as Y from "yjs";
import { yCollab } from "y-codemirror.next";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import * as base64 from "base64-js";
import toast from "react-hot-toast";
import { setCode, setLanguage, setInput, setOutput } from "../slices/codeSlice";
import { apiConnector } from "../services/apiConnector";
import { collabEndpoints } from "../services/apis";

/**
 * Custom React Hook encapsulating real-time collaborative editing state and STOMP WebSocket communication.
 *
 * @param {Object} params
 * @param {string} params.currentUserName - Authenticated user's identifier
 * @param {string} params.token - JWT authentication token
 * @param {string} params.initialCode - Redux seed code for room initialization
 * @param {function} params.onChatMessageReceived - Callback triggered on incoming chat events
 * @returns {Object} Collaborative session state, Yjs extension, and action dispatchers
 */
export function useCollaboration({ currentUserName, token, initialCode, onChatMessageReceived }) {

  const dispatch = useDispatch();
  const { WS_URL, JOIN_ROOM_API, CREATE_ROOM_API, ROOM_DETAILS_API, UPDATE_PERMISSION_API } =
    collabEndpoints;

  const [roomId, setRoomId] = useState("");
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(new Set());
  const [myPermission, setMyPermission] = useState("EXECUTE");
  const [roomAdmin, setRoomAdmin] = useState("");
  const [roomMembers, setRoomMembers] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const stompClientRef = useRef(null);
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);
  const yCollabExtRef = useRef(null);

  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
  }
  if (!ytextRef.current) {
    ytextRef.current = ydocRef.current.getText("codemirror");
  }
  if (!yCollabExtRef.current) {
    yCollabExtRef.current = yCollab(ytextRef.current, null);
  }

  // Fetch Room Details
  const fetchRoomDetails = async (targetRoomId) => {
    if (!targetRoomId) return;
    try {
      const userParam = currentUserName ? `?user=${encodeURIComponent(currentUserName)}` : "";
      const res = await apiConnector("GET", `${ROOM_DETAILS_API}/${targetRoomId}${userParam}`);
      if (res.data) {
        setRoomAdmin(res.data.adminUserName || "");
        setRoomMembers(res.data.members || []);
        if (res.data.userPermission) {
          setMyPermission(res.data.userPermission);
        } else if (res.data.isAdmin) {
          setMyPermission("EXECUTE");
        }
      }
    } catch (e) {
      console.error("Failed to fetch room details:", e);
    }
  };

  // WebSocket lifecycle
  useEffect(() => {
    const ydoc = ydocRef.current;

    if (isCollaborating && roomId.trim() !== "") {
      const client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
        onConnect: () => {
          console.log("Connected to Room:", roomId);

          client.subscribe(`/topic/room/${roomId}`, (message) => {
            const payload = JSON.parse(message.body);

            if (payload.type === "DISCONNECT") {
              setConnectedUsers((prev) => {
                const updated = new Set(prev);
                updated.delete(payload.senderId);
                return updated;
              });
              setRoomMembers((prev) => prev.filter((m) => m.userName !== payload.senderId));
              return;
            }

            if (payload.type === "SYNC_REQUEST") {
              if (payload.senderId !== currentUserName) {
                setConnectedUsers((prev) => new Set(prev).add(payload.senderId));
                fetchRoomDetails(roomId);

                const fullState = Y.encodeStateAsUpdate(ydoc);
                client.publish({
                  destination: `/app/editor.sync/${roomId}`,
                  body: JSON.stringify({
                    senderId: currentUserName,
                    type: "SYNC_STATE",
                    updateBase64: base64.fromByteArray(fullState),
                  }),
                });
              }
            } else if (payload.type === "SYNC_STATE" || payload.type === "UPDATE") {
              if (!payload.updateBase64) return;

              setConnectedUsers((prev) => new Set(prev).add(payload.senderId));
              const updateArray = base64.toByteArray(payload.updateBase64);
              Y.applyUpdate(ydoc, updateArray, "stomp");

              const yjsContent = ytextRef.current.toString();
              dispatch(setCode(yjsContent));
              localStorage.setItem("code", yjsContent);
            } else if (payload.type === "CHAT") {
              if (onChatMessageReceived) {
                onChatMessageReceived(payload);
              }
            } else if (payload.type === "INPUT_CHANGE") {
              if (payload.senderId !== currentUserName && payload.content !== undefined) {
                dispatch(setInput(payload.content));
                localStorage.setItem("input", payload.content);
              }
            } else if (payload.type === "LANGUAGE_CHANGE") {
              if (payload.senderId !== currentUserName && payload.content) {
                dispatch(setLanguage(payload.content));
                localStorage.setItem("language", payload.content);
                toast.success(`Language set to ${payload.content} by ${payload.senderId}`);
              }
            } else if (payload.type === "PERMISSION_CHANGE") {
              if (payload.targetUser === currentUserName) {
                setMyPermission(payload.permission);
                if (payload.permission === "READ") {
                  toast("Your access is now View-Only", { icon: "🔒" });
                } else if (payload.permission === "WRITE") {
                  toast("Your access is now Editor", { icon: "✏️" });
                } else if (payload.permission === "EXECUTE") {
                  toast("Your access is now Runner (Full)", { icon: "🚀" });
                }
              }
              setRoomMembers((prev) =>
                prev.map((m) =>
                  m.userName === payload.targetUser
                    ? { ...m, permission: payload.permission }
                    : m
                )
              );
            } else if (payload.type === "RUN_RESULT") {
              if (payload.senderId !== currentUserName && payload.content) {
                try {
                  const res = JSON.parse(payload.content);
                  if (res.input !== undefined) {
                    dispatch(setInput(res.input));
                    localStorage.setItem("input", res.input);
                  }
                  if (res.error && (!res.output || res.output.trim() === "")) {
                    dispatch(setOutput(res.error));
                  } else if (res.error && res.output) {
                    dispatch(setOutput(res.output + "\n\n[Errors/Warnings]:\n" + res.error));
                  } else {
                    dispatch(
                      setOutput(
                        res.output !== undefined && res.output !== ""
                          ? res.output
                          : "Program executed with no output."
                      )
                    );
                  }
                  toast(`Code executed by ${payload.senderId}`, { icon: "▶️" });
                } catch (e) {
                  console.error("Error parsing RUN_RESULT:", e);
                }
              }
            }
          });

          client.publish({
            destination: `/app/editor.sync/${roomId}`,
            body: JSON.stringify({
              senderId: currentUserName,
              type: "SYNC_REQUEST",
            }),
          });
        },
      });

      client.activate();
      stompClientRef.current = client;

      const handleYjsUpdate = (update, origin) => {
        if (origin !== "stomp" && stompClientRef.current?.connected) {
          if (myPermission === "READ") return;
          const payload = {
            senderId: currentUserName,
            type: "UPDATE",
            updateBase64: base64.fromByteArray(update),
          };
          stompClientRef.current.publish({
            destination: `/app/editor.sync/${roomId}`,
            body: JSON.stringify(payload),
          });
        }
      };

      ydoc.on("update", handleYjsUpdate);

      return () => {
        ydoc.off("update", handleYjsUpdate);
        if (stompClientRef.current) {
          stompClientRef.current.deactivate();
        }
      };
    }
  }, [isCollaborating, roomId, currentUserName, dispatch, WS_URL, myPermission]);

  // Actions
  const joinRoom = async (targetRoomId) => {
    const idToJoin = targetRoomId || roomId;
    if (!idToJoin.trim()) {
      toast.error("Please enter a Room ID to join.");
      return;
    }
    if (!token) {
      toast.error("Login is required");
      return;
    }

    if (ytextRef.current.length > 0) {
      ytextRef.current.delete(0, ytextRef.current.length);
      dispatch(setCode(""));
      localStorage.setItem("code", "");
    }

    try {
      const response = await apiConnector(
        "POST",
        JOIN_ROOM_API,
        { roomId: idToJoin, userName: currentUserName },
        { Authorization: `Bearer ${token}` }
      );
      toast.success(response.data.message);
      setRoomId(idToJoin);
      setIsCollaborating(true);
      await fetchRoomDetails(idToJoin);
      setConnectedUsers((prev) => new Set(prev).add(currentUserName));
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error(error.response?.data?.message || "Failed to join room");
    }
  };

  const createRoom = async (code, language, input) => {
    if (!token) {
      toast.error("Login is required");
      return;
    }
    dispatch(setCode(""));
    localStorage.setItem("code", "");

    if (code && ytextRef.current.length === 0) {
      ytextRef.current.insert(0, code);
    }

    try {
      const response = await apiConnector(
        "POST",
        CREATE_ROOM_API,
        { userName: currentUserName, code, language, input },
        { Authorization: `Bearer ${token}` }
      );
      const newRoomId = response.data.roomId;
      toast.success(response.data.message || "Room created successfully!");
      setRoomId(newRoomId);
      setIsCollaborating(true);
      setMyPermission("EXECUTE");
      setRoomAdmin(currentUserName);
      setConnectedUsers(new Set([currentUserName]));
      await fetchRoomDetails(newRoomId);
    } catch (err) {
      console.error("Error creating room:", err);
      toast.error("Failed to create room");
    }
  };

  const disconnectRoom = () => {
    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination: `/app/editor.sync/${roomId}`,
        body: JSON.stringify({
          senderId: currentUserName,
          type: "DISCONNECT",
        }),
      });
    }
    setIsCollaborating(false);
    setConnectedUsers(new Set());
    setRoomMembers([]);
    setMyPermission("EXECUTE");
    toast.success("Left the collaboration room");
  };

  const updateMemberPermission = async (targetUserName, newPermission) => {
    try {
      const payload = {
        roomId,
        adminUserName: currentUserName,
        targetUserName,
        permission: newPermission,
      };
      await apiConnector("POST", UPDATE_PERMISSION_API, payload, {
        Authorization: `Bearer ${token}`,
      });
      setRoomMembers((prev) =>
        prev.map((m) =>
          m.userName === targetUserName ? { ...m, permission: newPermission } : m
        )
      );
      toast.success(`Updated ${targetUserName} to ${newPermission}`);
    } catch (err) {
      console.error("Error updating permission:", err);
      toast.error(err?.response?.data || "Failed to update permission");
    }
  };

  const broadcastInput = (newInput) => {
    if (isCollaborating && stompClientRef.current?.connected && roomId) {
      stompClientRef.current.publish({
        destination: `/app/editor.sync/${roomId}`,
        body: JSON.stringify({
          senderId: currentUserName,
          type: "INPUT_CHANGE",
          content: newInput,
        }),
      });
    }
  };

  const broadcastLanguage = (newLang) => {
    if (isCollaborating && stompClientRef.current?.connected && roomId) {
      stompClientRef.current.publish({
        destination: `/app/editor.sync/${roomId}`,
        body: JSON.stringify({
          senderId: currentUserName,
          type: "LANGUAGE_CHANGE",
          content: newLang,
        }),
      });
    }
  };

  const broadcastChatMessage = (text) => {
    if (stompClientRef.current?.connected && roomId) {
      stompClientRef.current.publish({
        destination: `/app/editor.sync/${roomId}`,
        body: JSON.stringify({
          senderId: currentUserName,
          type: "CHAT",
          content: text,
        }),
      });
    }
  };

  const updateYjsContent = (newText) => {
    if (ytextRef.current) {
      ytextRef.current.delete(0, ytextRef.current.length);
      ytextRef.current.insert(0, newText);
    }
  };

  return {
    roomId,
    setRoomId,
    isCollaborating,
    connectedUsers,
    myPermission,
    roomAdmin,
    roomMembers,
    showMembersModal,
    setShowMembersModal,
    stompClientRef,
    yCollabExtension: yCollabExtRef.current,
    joinRoom,
    createRoom,
    disconnectRoom,
    updateMemberPermission,
    broadcastInput,
    broadcastLanguage,
    broadcastChatMessage,
    updateYjsContent,
  };
}
