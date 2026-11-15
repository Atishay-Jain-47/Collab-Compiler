import React, { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { apiConnector } from "../../services/apiConnector";
import { versionEndpoints } from "../../services/apis";
import { computeLineDiff } from "../../utils/diffUtils";

/**
 * VersionControlModal
 * Full-featured visual version history, diff comparison, and 1-click restore modal.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {string} props.currentCode
 * @param {string} props.currentLanguage
 * @param {string} props.roomId
 * @param {string} props.currentUserName
 * @param {string} props.token
 * @param {function} props.onRevert - Callback receiving reverted code string
 * @param {boolean} props.isCollaborating
 * @param {string} props.myPermission - "READ" | "WRITE" | "EXECUTE"
 */
export default function VersionControlModal({
  isOpen,
  onClose,
  currentCode,
  currentLanguage,
  roomId,
  currentUserName,
  token,
  onRevert,
  isCollaborating,
  myPermission = "EXECUTE",
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [viewMode, setViewMode] = useState("diff"); // "diff" | "code"
  const [commitTitle, setCommitTitle] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Fetch version history
  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      let url = versionEndpoints.VERSIONS_API;
      const params = [];
      if (roomId) {
        params.push(`roomId=${encodeURIComponent(roomId)}`);
      } else if (currentLanguage) {
        params.push(`language=${encodeURIComponent(currentLanguage)}`);
      }
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiConnector("GET", url, null, headers);
      if (res.data) {
        setVersions(res.data);
        if (res.data.length > 0 && !selectedVersion) {
          setSelectedVersion(res.data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load versions:", err);
      toast.error("Failed to load version history");
    } finally {
      setLoading(false);
    }
  }, [roomId, currentLanguage, token]);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, fetchVersions]);

  // Handle Manual Save Version
  const handleSaveVersion = async (e) => {
    if (e) e.preventDefault();
    if (!commitTitle.trim()) {
      toast.error("Please provide a version title");
      return;
    }
    if (!currentCode || !currentCode.trim()) {
      toast.error("Editor code is empty");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        roomId: roomId || null,
        versionName: commitTitle.trim(),
        message: commitMessage.trim(),
        code: currentCode,
        language: currentLanguage,
        autoSave: false,
      };

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiConnector("POST", versionEndpoints.VERSIONS_API, payload, headers);
      if (res.data) {
        toast.success(`Version "${res.data.versionName}" saved!`, { icon: "🔖" });
        setCommitTitle("");
        setCommitMessage("");
        setShowSaveForm(false);
        setVersions((prev) => [res.data, ...prev]);
        setSelectedVersion(res.data);
      }
    } catch (err) {
      console.error("Failed to save version:", err);
      toast.error("Failed to save version snapshot");
    } finally {
      setSaving(false);
    }
  };

  // Handle Revert
  const handleRevert = async (version) => {
    if (!version) return;
    if (isCollaborating && myPermission === "READ") {
      toast.error("You have view-only access in this room.");
      return;
    }

    const confirmMsg = `Revert editor to version "${version.versionName}"? Any unsaved changes will be replaced.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await apiConnector(
        "POST",
        versionEndpoints.REVERT_VERSION_API(version.id),
        null,
        headers
      );

      const codeToApply = res.data?.code || version.code;
      onRevert(codeToApply);
      toast.success(`Reverted to version "${version.versionName}"`, { icon: "⏪" });
      onClose();
    } catch (err) {
      console.error("Failed to revert:", err);
      // Fallback: apply code directly even if revert call failed
      onRevert(version.code);
      toast.success(`Reverted to "${version.versionName}"`, { icon: "⏪" });
      onClose();
    }
  };

  // Compute Diff between selected version and current editor code
  const lineDiff = useMemo(() => {
    if (!selectedVersion) return [];
    return computeLineDiff(selectedVersion.code, currentCode);
  }, [selectedVersion, currentCode]);

  // Diff stats
  const diffStats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const d of lineDiff) {
      if (d.type === "added") added++;
      if (d.type === "removed") removed++;
    }
    return { added, removed };
  }, [lineDiff]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[var(--text-primary)]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">
                  Version Control & History
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950/80 border border-indigo-700/50 text-indigo-300">
                  {roomId ? `Room: ${roomId}` : `Solo (${currentLanguage})`}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Save named snapshots, compare visual diffs, and 1-click restore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveForm((prev) => !prev)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <span>➕</span>
              <span>Save Version</span>
            </button>
            <button
              onClick={onClose}
              className="text-[var(--text-secondary)] hover:text-white p-1.5 rounded-lg hover:bg-gray-800/60 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Save Version Sub-Drawer / Panel */}
        {showSaveForm && (
          <form
            onSubmit={handleSaveVersion}
            className="px-5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-root)]/60 flex flex-col sm:flex-row gap-2.5 items-center animate-slide-down"
          >
            <input
              type="text"
              placeholder="Version title (e.g., 'Working DFS Solution', 'Fix syntax bug')"
              value={commitTitle}
              onChange={(e) => setCommitTitle(e.target.value)}
              className="flex-1 bg-[var(--input-bg)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              autoFocus
            />
            <input
              type="text"
              placeholder="Optional message / details"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="flex-1 bg-[var(--input-bg)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving || !commitTitle.trim()}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {saving ? "Saving..." : "Commit Snapshot"}
              </button>
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Main Content: Split List and Preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Timeline List */}
          <div className="w-full md:w-80 border-r border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 flex flex-col h-1/3 md:h-full overflow-hidden">
            <div className="px-3.5 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-gray-300">
                Snapshots ({versions.length})
              </span>
              <button
                onClick={fetchVersions}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
                title="Refresh history"
              >
                ↻ Refresh
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]/60">
              {loading && versions.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading commit history...
                </div>
              )}

              {!loading && versions.length === 0 && (
                <div className="p-8 text-center text-xs text-gray-400">
                  <p className="text-xl mb-1.5">🔖</p>
                  <p className="font-medium text-gray-300">No versions yet</p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Click <strong>"Save Version"</strong> above to capture your first snapshot.
                  </p>
                </div>
              )}

              {versions.map((ver) => {
                const isSelected = selectedVersion?.id === ver.id;
                const dateStr = ver.createdAt
                  ? new Date(ver.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersion(ver)}
                    className={`p-3 text-xs transition cursor-pointer border-l-3 ${
                      isSelected
                        ? "bg-indigo-950/40 border-l-indigo-500 text-white"
                        : "border-l-transparent hover:bg-white/[0.03] text-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <span className="font-semibold truncate max-w-[170px]" title={ver.versionName}>
                        {ver.versionName}
                      </span>
                      {ver.autoSave ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/70 border border-amber-700/50 text-amber-300">
                          Auto
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950/70 border border-indigo-700/50 text-indigo-300">
                          Manual
                        </span>
                      )}
                    </div>

                    {ver.message && (
                      <p className="text-[11px] text-gray-400 truncate mb-1" title={ver.message}>
                        {ver.message}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-1">
                      <span>👤 {ver.authorUserName}</span>
                      <span>{dateStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Visual Diff / Code Viewer */}
          <div className="flex-1 flex flex-col h-2/3 md:h-full overflow-hidden bg-[#0d1117]">
            {selectedVersion ? (
              <>
                {/* View Toolbar */}
                <div className="px-4 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      Comparing:
                    </span>
                    <span className="text-xs text-indigo-400 font-medium">
                      "{selectedVersion.versionName}"
                    </span>
                    <span className="text-xs text-gray-500">↔ Current Code</span>

                    {/* Diff Pill Badges */}
                    <div className="flex items-center gap-1.5 ml-2 font-mono text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                        +{diffStats.added}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                        -{diffStats.removed}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mode Toggle */}
                    <div className="flex rounded-lg border border-[var(--border-subtle)] p-0.5 bg-[var(--bg-subtle)] text-[11px]">
                      <button
                        onClick={() => setViewMode("diff")}
                        className={`px-2.5 py-0.5 rounded-md font-medium transition cursor-pointer ${
                          viewMode === "diff"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Visual Diff
                      </button>
                      <button
                        onClick={() => setViewMode("code")}
                        className={`px-2.5 py-0.5 rounded-md font-medium transition cursor-pointer ${
                          viewMode === "code"
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        Snapshot Code
                      </button>
                    </div>

                    {/* Revert Button */}
                    <button
                      onClick={() => handleRevert(selectedVersion)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition shadow-sm cursor-pointer flex items-center gap-1.5"
                      title="Revert editor to this snapshot"
                    >
                      <span>⏪</span>
                      <span>Restore This Version</span>
                    </button>
                  </div>
                </div>

                {/* Diff or Code Content */}
                <div className="flex-1 overflow-auto p-4 font-mono text-xs">
                  {viewMode === "diff" ? (
                    <div className="divide-y divide-gray-800/40 rounded-lg overflow-hidden border border-gray-800/80 bg-[#0a0d14]">
                      {lineDiff.map((line, idx) => {
                        let bgClass = "bg-transparent text-gray-300";
                        let prefix = " ";
                        let signClass = "text-gray-600";

                        if (line.type === "added") {
                          bgClass = "bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500";
                          prefix = "+";
                          signClass = "text-emerald-400 font-bold";
                        } else if (line.type === "removed") {
                          bgClass = "bg-rose-950/40 text-rose-200 border-l-2 border-rose-500";
                          prefix = "-";
                          signClass = "text-rose-400 font-bold";
                        }

                        return (
                          <div
                            key={idx}
                            className={`flex items-start px-2 py-0.5 font-mono leading-relaxed select-text ${bgClass}`}
                          >
                            <span className="w-8 shrink-0 text-right pr-2 text-gray-500 select-none text-[10px]">
                              {line.oldLineNumber || ""}
                            </span>
                            <span className="w-8 shrink-0 text-right pr-2 text-gray-500 select-none text-[10px]">
                              {line.newLineNumber || ""}
                            </span>
                            <span className={`w-4 shrink-0 select-none ${signClass}`}>
                              {prefix}
                            </span>
                            <span className="flex-1 whitespace-pre-wrap break-all">
                              {line.text || " "}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <pre className="p-3 bg-[#0a0d14] border border-gray-800 rounded-lg text-gray-200 overflow-x-auto whitespace-pre">
                      <code>{selectedVersion.code}</code>
                    </pre>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 text-xs">
                <span className="text-4xl mb-2">🌿</span>
                <p>Select a snapshot from the timeline to view diffs and changes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
