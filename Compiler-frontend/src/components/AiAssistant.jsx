import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
import { apiConnector } from "../services/apiConnector";
import { aiEndpoints } from "../services/apis";

const MAX_PROMPT_WORDS = 300;
const CHUNK_LINE_SIZE = 100;

/**
 * Parses markdown formatted text into structured, styled React elements.
 * Renders headers, lists, code blocks, bold text, inline code, and quotes cleanly.
 */
function MarkdownRenderer({ content }) {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];
  let codeBlockLang = "";

  const renderInline = (text) => {
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      const codeMatch = remaining.match(/`([^`]+)`/);
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

      let firstMatch = null;
      let matchType = null;

      if (codeMatch && (!boldMatch || codeMatch.index < boldMatch.index)) {
        firstMatch = codeMatch;
        matchType = "code";
      } else if (boldMatch) {
        firstMatch = boldMatch;
        matchType = "bold";
      }

      if (!firstMatch) {
        parts.push(remaining);
        break;
      }

      const matchIndex = firstMatch.index;
      if (matchIndex > 0) {
        parts.push(remaining.substring(0, matchIndex));
      }

      if (matchType === "code") {
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded bg-gray-800 text-purple-300 font-mono text-[11px] border border-gray-700"
          >
            {firstMatch[1]}
          </code>
        );
      } else if (matchType === "bold") {
        parts.push(
          <strong key={key++} className="font-semibold text-white">
            {firstMatch[1]}
          </strong>
        );
      }

      remaining = remaining.substring(matchIndex + firstMatch[0].length);
    }

    return parts;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <div
            key={`cb-${i}`}
            className="my-3 rounded-lg overflow-hidden border border-gray-700/60 bg-[#121217]"
          >
            {codeBlockLang && (
              <div className="px-3 py-1 bg-gray-800/80 text-[10px] uppercase font-mono text-gray-400 border-b border-gray-700/40">
                {codeBlockLang}
              </div>
            )}
            <pre className="p-3 text-[11px] font-mono text-gray-200 overflow-x-auto">
              <code>{codeBlockLines.join("\n")}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = "";
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().replace(/^```/, "").trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      elements.push(<hr key={`hr-${i}`} className="my-3 border-gray-800" />);
      continue;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-sm font-bold text-purple-300 mt-3.5 mb-1.5 flex items-center gap-1.5"
        >
          {renderInline(trimmed.substring(4))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-sm font-bold text-indigo-300 mt-4 mb-2"
        >
          {renderInline(trimmed.substring(3))}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-base font-bold text-white mt-4 mb-2"
        >
          {renderInline(trimmed.substring(2))}
        </h1>
      );
      continue;
    }

    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="my-2 pl-3 py-1 border-l-2 border-purple-500 bg-purple-950/20 text-purple-200 text-xs italic rounded-r"
        >
          {renderInline(trimmed.substring(2))}
        </blockquote>
      );
      continue;
    }

    if (trimmed.match(/^[-*]\s+/)) {
      const itemText = trimmed.replace(/^[-*]\s+/, "");
      elements.push(
        <li
          key={`li-${i}`}
          className="ml-4 list-disc list-outside text-gray-300 my-0.5"
        >
          {renderInline(itemText)}
        </li>
      );
      continue;
    }

    if (trimmed.match(/^\d+\.\s+/)) {
      const itemText = trimmed.replace(/^\d+\.\s+/, "");
      elements.push(
        <li
          key={`nli-${i}`}
          className="ml-4 list-decimal list-outside text-gray-300 my-0.5"
        >
          {renderInline(itemText)}
        </li>
      );
      continue;
    }

    if (trimmed === "") {
      elements.push(<div key={`sp-${i}`} className="h-1.5" />);
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-gray-300 leading-relaxed my-1">
        {renderInline(line)}
      </p>
    );
  }

  return <div className="space-y-0.5 text-xs font-sans">{elements}</div>;
}

/**
 * AiAssistant Component.
 * Interactive AI drawer powered by Google Gemini API with:
 * - Intelligent code chunking (split into 100-line review windows)
 * - Strict word-limit monitoring on custom prompts (max 300 words)
 * - 1-click "Apply to Editor" action
 * - Explain, Fix, and Optimize code actions
 */
function AiAssistant({
  isOpen,
  onClose,
  currentCode,
  currentLanguage,
  currentOutput,
  onApplyCode,
  token,
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [selectedChunk, setSelectedChunk] = useState("ALL");

  // Compute code chunks
  const chunks = useMemo(() => {
    if (!currentCode || !currentCode.trim()) return [];
    const lines = currentCode.split(/\r?\n/);
    const res = [];
    for (let i = 0; i < lines.length; i += CHUNK_LINE_SIZE) {
      const chunkLines = lines.slice(i, i + CHUNK_LINE_SIZE);
      const content = chunkLines.join("\n");
      res.push({
        index: res.length + 1,
        startLine: i + 1,
        endLine: Math.min(i + CHUNK_LINE_SIZE, lines.length),
        content,
        lineCount: chunkLines.length,
        wordCount: content.trim().split(/\s+/).filter(Boolean).length,
      });
    }
    return res;
  }, [currentCode]);

  // Keep selected chunk within valid range
  useEffect(() => {
    if (selectedChunk !== "ALL" && (selectedChunk > chunks.length || selectedChunk < 1)) {
      setSelectedChunk("ALL");
    }
  }, [chunks.length, selectedChunk]);

  // Prompt word count calculation
  const promptWords = useMemo(() => {
    if (!prompt || !prompt.trim()) return 0;
    return prompt.trim().split(/\s+/).filter(Boolean).length;
  }, [prompt]);

  const isWordLimitExceeded = promptWords > MAX_PROMPT_WORDS;

  const handleTrimPrompt = () => {
    const words = prompt.trim().split(/\s+/).filter(Boolean);
    if (words.length > MAX_PROMPT_WORDS) {
      setPrompt(words.slice(0, MAX_PROMPT_WORDS).join(" "));
      toast.success(`Prompt trimmed to ${MAX_PROMPT_WORDS} words`);
    }
  };

  if (!isOpen) return null;

  const handleAsk = async (action, customMsg = "") => {
    if (!currentCode || currentCode.trim() === "") {
      toast.error("Please write or open some code first!");
      return;
    }
    if (!token) {
      toast.error("Please log in to use the AI Assistant.");
      return;
    }

    const trimmedMsg = customMsg.trim();
    if (trimmedMsg) {
      const words = trimmedMsg.split(/\s+/).filter(Boolean).length;
      if (words > MAX_PROMPT_WORDS) {
        toast.error(`Prompt exceeds word limit: maximum ${MAX_PROMPT_WORDS} words (current: ${words} words)`);
        return;
      }
    }

    setLoading(true);
    setAiResult(null);

    // Resolve code based on chunk selection
    const isSpecificChunk = selectedChunk !== "ALL" && chunks[selectedChunk - 1];
    const codeToSend = isSpecificChunk ? chunks[selectedChunk - 1].content : currentCode;

    try {
      const payload = {
        code: codeToSend,
        language: currentLanguage,
        error: currentOutput || "",
        action: action,
        userMessage: trimmedMsg,
        chunkIndex: isSpecificChunk ? selectedChunk : null,
        totalChunks: chunks.length || 1,
      };

      const response = await apiConnector("POST", aiEndpoints.ASK_AI_API, payload, {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      });

      if (response.data && response.data.success) {
        setAiResult(response.data);
      } else {
        toast.error(response.data?.error || "Failed to get AI suggestions");
      }
    } catch (err) {
      console.error("AI Error:", err);
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please log in again.");
      } else if (err?.response?.status === 429) {
        toast.error(err?.response?.data?.error || "AI rate limit reached. Please wait a moment.");
      } else if (err?.response?.status === 400) {
        toast.error(err?.response?.data?.error || "Invalid request. Please check word limits.");
      } else {
        toast.error(err?.response?.data?.error || "AI Assistant service error");
      }
    } finally {
      setLoading(false);
    }
  };

  const copySuggestedCode = () => {
    if (aiResult?.suggestedCode) {
      navigator.clipboard.writeText(aiResult.suggestedCode);
      toast.success("Suggested code copied to clipboard!");
    }
  };

  const handleApply = () => {
    if (aiResult?.suggestedCode) {
      onApplyCode(aiResult.suggestedCode);
      toast.success("Applied AI code to editor!", { icon: "✨" });
    }
  };

  const totalLines = currentCode ? currentCode.split(/\r?\n/).length : 0;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col text-[var(--text-primary)] animate-slide-left transition-colors">
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-lg shadow">
            ✨
          </div>
          <div>
            <h2 className="font-semibold text-[var(--text-primary)] text-sm">Gemini AI Assistant</h2>
            <p className="text-[11px] text-[var(--text-secondary)]">Chunk-aware code analysis & fixes</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-lg hover:bg-[var(--bg-root)] transition cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Code Context & Chunking Bar */}
      <div className="px-3.5 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-root)]/50 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-semibold text-gray-300 flex items-center gap-1.5">
            <span>📦</span> Code Context ({chunks.length || 1} {chunks.length === 1 ? "Chunk" : "Chunks"}, {totalLines} lines)
          </span>
          {chunks.length > 1 ? (
            <span className="text-[10px] text-purple-300 font-mono bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/50">
              {selectedChunk === "ALL" ? "All Chunks Active" : `Chunk ${selectedChunk} Active`}
            </span>
          ) : (
            <span className="text-[10px] text-gray-400 font-mono bg-gray-800/60 px-2 py-0.5 rounded-full border border-gray-700/50">
              Single Chunk
            </span>
          )}
        </div>

        {chunks.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
            <button
              onClick={() => setSelectedChunk("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedChunk === "ALL"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-[var(--bg-surface)] text-gray-400 hover:text-white border border-[var(--border-subtle)] hover:bg-gray-800/60"
              }`}
            >
              ⚡ All ({chunks.length})
            </button>
            {chunks.map((c) => (
              <button
                key={c.index}
                onClick={() => setSelectedChunk(c.index)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap transition cursor-pointer ${
                  selectedChunk === c.index
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-[var(--bg-surface)] text-gray-400 hover:text-white border border-[var(--border-subtle)] hover:bg-gray-800/60"
                }`}
                title={`Lines ${c.startLine}-${c.endLine} (${c.wordCount} words)`}
              >
                Chunk {c.index} ({c.startLine}-{c.endLine})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Pills */}
      <div className="p-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-wrap gap-2">
        <button
          onClick={() => handleAsk("EXPLAIN")}
          disabled={loading}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-700/50 hover:bg-purple-900/80 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          💡 Explain Code
        </button>
        <button
          onClick={() => handleAsk("FIX")}
          disabled={loading}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-950/60 text-red-300 border border-red-700/50 hover:bg-red-900/80 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          🐞 Fix Bugs & Errors
        </button>
        <button
          onClick={() => handleAsk("OPTIMIZE")}
          disabled={loading}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900/80 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          ⚡ Optimize O(N)
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-purple-300 animate-pulse">
              Gemini is reviewing your code...
            </p>
          </div>
        )}

        {!loading && !aiResult && (
          <div className="text-center py-14 px-4 text-gray-400 space-y-3">
            <span className="text-4xl">🤖</span>
            <h3 className="text-sm font-semibold text-gray-300">
              Need help with your code?
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Choose an action above or type a specific question below. Large files are automatically chunked into 100-line segments for precision review.
            </p>
          </div>
        )}

        {!loading && aiResult && (
          <div className="space-y-4">
            {/* AI Explanation Card */}
            <div className="bg-[#1b1b22] border border-gray-800 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-800/80">
                <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                  <span>✨</span> Analysis & Explanation
                </span>
                <div className="flex items-center gap-1.5">
                  {aiResult.chunkIndex ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-800/50 text-indigo-300">
                      Chunk {aiResult.chunkIndex}/{aiResult.totalChunks}
                    </span>
                  ) : (
                    aiResult.totalChunks && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/70 border border-purple-800/50 text-purple-300">
                        {aiResult.totalChunks > 1 ? `All ${aiResult.totalChunks} Chunks` : "Full Code"}
                      </span>
                    )
                  )}
                </div>
              </div>
              <MarkdownRenderer content={aiResult.response} />
            </div>

            {/* Suggested Code Card */}
            {aiResult.suggestedCode && (
              <div className="bg-[#18181f] border border-purple-800/40 rounded-xl overflow-hidden shadow-lg">
                <div className="px-3 py-2 bg-[#1f1f2a] border-b border-gray-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    ✨ Suggested Code ({currentLanguage})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={copySuggestedCode}
                      className="px-2 py-1 text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-200 rounded border border-gray-700 transition cursor-pointer"
                    >
                      Copy
                    </button>
                    <button
                      onClick={handleApply}
                      className="px-2.5 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition cursor-pointer shadow"
                    >
                      Apply to Editor
                    </button>
                  </div>
                </div>
                <pre className="p-3 text-[11px] font-mono text-gray-200 overflow-x-auto max-h-80 bg-black/50">
                  <code>{aiResult.suggestedCode}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prompt Input Footer */}
      <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
        {/* Word Count Header */}
        <div className="flex items-center justify-between text-[11px] mb-1.5 px-0.5">
          <span className="text-gray-400 flex items-center gap-1">
            <span>💬</span> Custom Prompt
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-mono text-[10px] transition-colors ${
                isWordLimitExceeded
                  ? "text-red-400 font-bold"
                  : promptWords > 240
                  ? "text-amber-400 font-semibold"
                  : "text-gray-400"
              }`}
            >
              {promptWords} / {MAX_PROMPT_WORDS} words
            </span>
            {isWordLimitExceeded && (
              <button
                onClick={handleTrimPrompt}
                className="px-1.5 py-0.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 text-[9px] font-semibold transition cursor-pointer"
                title="Automatically trim prompt to 300 words"
              >
                ✂️ Trim
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={
              isWordLimitExceeded
                ? `Prompt exceeds ${MAX_PROMPT_WORDS} words! Please trim...`
                : "Ask AI anything about your code..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && prompt.trim() && !loading) {
                e.preventDefault();
                if (isWordLimitExceeded) {
                  toast.error(`Please shorten your prompt to ${MAX_PROMPT_WORDS} words.`);
                  return;
                }
                handleAsk("CHAT", prompt.trim());
                setPrompt("");
              }
            }}
            disabled={loading}
            className={`flex-1 bg-[var(--input-bg)] text-[var(--text-primary)] px-3 py-2 rounded-xl border text-xs placeholder-gray-500 shadow-2xs transition-colors focus:outline-none focus:ring-1 ${
              isWordLimitExceeded
                ? "border-red-500/80 focus:ring-red-500 text-red-100"
                : "border-[var(--border-subtle)] focus:ring-purple-500"
            }`}
          />
          <button
            onClick={() => {
              if (prompt.trim() && !loading) {
                if (isWordLimitExceeded) {
                  toast.error(`Please shorten your prompt to ${MAX_PROMPT_WORDS} words.`);
                  return;
                }
                handleAsk("CHAT", prompt.trim());
                setPrompt("");
              }
            }}
            disabled={loading || !prompt.trim() || isWordLimitExceeded}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold disabled:opacity-50 transition cursor-pointer shadow-sm disabled:cursor-not-allowed"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}

export default AiAssistant;
