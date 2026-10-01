import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/operations/authApi";
import { apiConnector } from "../services/apiConnector";
import { runEndpoints } from "../services/apis";
import toast from "react-hot-toast";
import { setLanguage, setOutput } from "../slices/codeSlice";
import { extensions, detectLanguageFromFilename } from "../utils/languageExtension";

import { useTheme } from "../context/ThemeContext";

/**
 * Navbar Component.
 * Top navigation bar featuring language selection, execution trigger (Run),
 * local file explorer picker (Open File), save & download buttons,
 * dark/light mode toggle, and responsive user auth management.
 *
 * @param {Object} props
 * @param {Object} props.stompClientRef - WebSocket STOMP client ref
 * @param {string} props.roomId - Active collaborative room ID
 * @param {boolean} props.isCollaborating - Collaboration room active state
 * @param {string} props.myPermission - Active user's access level ("READ", "WRITE", "EXECUTE")
 * @param {function} props.onFileLoaded - Callback invoked when a local file is loaded
 */
function Navbar({ stompClientRef, roomId, isCollaborating, myPermission = "EXECUTE", onFileLoaded }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { theme, isDark, toggleTheme } = useTheme();

  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const { language, input, code } = useSelector((state) => state.code);

  const [loading, setLoading] = useState(false);

  const { RUN_API } = runEndpoints;

  const languageHandler = (value) => {
    dispatch(setLanguage(value));
    localStorage.setItem("language", value);

    if (isCollaborating && stompClientRef?.current?.connected && roomId) {
      stompClientRef.current.publish({
        destination: `/app/editor.sync/${roomId}`,
        body: JSON.stringify({
          senderId: localStorage.getItem("user") || "anonymous",
          type: "LANGUAGE_CHANGE",
          content: value,
        }),
      });
    }
  };

  const handleOpenFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const detected = detectLanguageFromFilename(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        if (onFileLoaded) {
          onFileLoaded(content, detected, file.name);
        } else {
          languageHandler(detected);
        }
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file.");
    };

    reader.readAsText(file);
    e.target.value = ""; // Reset to allow re-selecting same file
  };

  const downloadText = () => {
    const text = code;
    const blob = new Blob([text], { type: extensions[language] });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `code.${extensions[language]}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const runCode = async () => {
    if (!token) {
      toast.error("Login Required");
      return navigate("/login");
    }

    if (isCollaborating && myPermission === "READ") {
      toast.error("Permission Denied: You have Read-Only access in this room.");
      return;
    }

    dispatch(setOutput(""));
    localStorage.setItem("output", "");
    setLoading(true);
    dispatch(setOutput("Running..."));
    const userName = localStorage.getItem("user");
    try {
      const response = await apiConnector(
        "POST",
        RUN_API,
        JSON.stringify({
          language,
          code,
          input,
          user: userName,
          userName: userName,
          roomId: isCollaborating ? roomId : null,
        }),
        {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      );

      const data = response.data;
      console.log("DATA.....", response);
      if (data.error && (!data.output || data.output.trim() === "")) {
        dispatch(setOutput(data.error));
      } else if (data.error && data.output) {
        dispatch(setOutput(data.output + "\n\n[Errors/Warnings]:\n" + data.error));
      } else {
        dispatch(setOutput(data.output !== undefined && data.output !== "" ? data.output : "Program executed with no output."));
      }

      if (isCollaborating && stompClientRef?.current?.connected && roomId) {
        stompClientRef.current.publish({
          destination: `/app/editor.sync/${roomId}`,
          body: JSON.stringify({
            senderId: userName || "anonymous",
            type: "RUN_RESULT",
            content: JSON.stringify({ output: data.output, error: data.error, input: input }),
          }),
        });
      }
    } catch (err) {
      console.log("Error : ", err);
      dispatch(setOutput(err?.response?.data?.error || err?.response?.data?.message || err?.message || String(err)));
    }
    setLoading(false);
  };

  const saveCodeHandler = () => {
    if (!token) {
      toast.error("Login Required");
      return navigate("/login");
    }
    console.log("Saving code for language", language);
    const key = `code_${language}`;
    localStorage.setItem(key, code);
    toast.success("Code saved successfully");
  };

  return (
    <header className="w-full relative border-b transition-colors bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-primary)] px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Left Section: Brand + Language + Execution Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 mr-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25 text-sm">
              &lt;/&gt;
            </div>
            <span className="font-extrabold tracking-tight text-sm hidden sm:inline-block bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent select-none">
              CollabIDE
            </span>
          </div>

          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => languageHandler(e.target.value)}
              className="bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="PYTHON">Python (3.x)</option>
              <option value="CPP">C++ (GCC)</option>
              <option value="JAVA">Java (OpenJDK 17/21)</option>
              <option value="C">C (GCC)</option>
              <option value="GO">Go</option>
              <option value="JS">JavaScript (Node.js)</option>
              <option value="RUST">Rust (rustc)</option>
              <option value="TYPESCRIPT">TypeScript (tsx)</option>
              <option value="PHP">PHP (CLI)</option>
              <option value="RUBY">Ruby</option>
              <option value="BASH">Bash / Shell</option>
            </select>
          </div>

          {/* Hidden File Picker */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
            accept=".py,.cpp,.cc,.cxx,.c,.java,.js,.jsx,.ts,.tsx,.go,.rs,.php,.rb,.sh,.bash,.txt"
          />

          {/* Run Button */}
          <button
            onClick={runCode}
            disabled={loading || (isCollaborating && myPermission === "READ")}
            title={
              isCollaborating && myPermission === "READ"
                ? "View-Only mode: execution locked by host."
                : "Execute Code (Run)"
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isCollaborating && myPermission === "READ"
                ? "bg-gray-700 text-gray-400 cursor-not-allowed opacity-60 shadow-sm"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-md"
            }`}
          >
            {loading ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Running...</span>
              </>
            ) : isCollaborating && myPermission === "READ" ? (
              <span>🔒 Locked</span>
            ) : (
              <span>▶ Run</span>
            )}
          </button>

          {/* Open File Button */}
          <button
            onClick={handleOpenFileClick}
            title="Import code from your local file system"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] transition flex items-center gap-1 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <span>📁</span>
            <span className="hidden sm:inline">Open</span>
          </button>

          {/* Save Button */}
          <button
            onClick={saveCodeHandler}
            title="Save code to local browser storage"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] transition flex items-center gap-1 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <span>💾</span>
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Download Button */}
          <button
            onClick={downloadText}
            title="Download source code file"
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] transition flex items-center gap-1 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <span>⬇</span>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {/* Right Section: Theme Switcher & Authentication */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle Switch */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer flex items-center justify-center text-xs"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle color theme"
          >
            {isDark ? (
              <span className="text-yellow-400">☀️</span>
            ) : (
              <span className="text-indigo-500">🌙</span>
            )}
          </button>

          {/* Auth State */}
          {token ? (
            <div className="flex items-center gap-2">
              <div className='w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-[10px] font-bold text-white'>
                {(typeof user === "string" ? user : user?.userName || localStorage.getItem("user") || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-[var(--text-primary)] max-w-[100px] truncate">
                {typeof user === "string" ? user : user?.userName || localStorage.getItem("user") || "User"}
              </span>
              <button
                onClick={() => dispatch(logout(navigate))}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-rose-500/40 text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate("/login")}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 border border-indigo-500/40 transition cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
      <div className='absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent' />
    </header>
  );
}

export default Navbar;
