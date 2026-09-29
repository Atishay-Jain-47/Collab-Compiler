import React from "react";
import toast from "react-hot-toast";

/**
 * IOConsole Component.
 * Displays side-by-side standard input (stdin) and execution output (stdout/stderr)
 * with live collaboration synchronization indicators, copy to clipboard, and clear options.
 *
 * @param {Object} props
 * @param {string} props.input - Standard input text
 * @param {string} props.output - Standard output and execution diagnostics text
 * @param {boolean} props.isCollaborating - Whether the room is active
 * @param {function} props.onInputChange - Stdin change dispatcher
 */
function IOConsole({
  input,
  output,
  isCollaborating,
  onInputChange,
}) {
  // Ratio of input height (percentage, between 15% and 85%)
  const [splitRatio, setSplitRatio] = React.useState(50);
  const containerRef = React.useRef(null);
  const isDraggingRef = React.useRef(false);

  const copyOutput = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      toast.success("Output copied to clipboard!");
    }
  };

  const clearInput = () => {
    onInputChange("");
  };

  // Dragging logic for the horizontal splitter bar between Input and Output
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetY = e.clientY - rect.top;
      const newRatio = (offsetY / rect.height) * 100;
      if (newRatio >= 15 && newRatio <= 85) {
        setSplitRatio(newRatio);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
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

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div ref={containerRef} className="flex flex-col w-full h-full relative overflow-hidden">
      {/* Custom Input Header & Textarea */}
      <div
        style={{ height: `calc(${splitRatio}% - 5px)` }}
        className="flex flex-col min-h-[90px] overflow-hidden"
      >
        <div className="px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface)] rounded-t-xl border border-b-0 border-[var(--border-subtle)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span>Custom Input (stdin)</span>
            {isCollaborating && (
              <span className="text-[10px] text-cyan-400 font-normal">
                ● Live Shared Input
              </span>
            )}
          </div>
          {input && (
            <button
              onClick={clearInput}
              className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <textarea
          placeholder="Enter inputs to pass to standard input (stdin)..."
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          className="flex-1 bg-[var(--input-bg)] text-[var(--text-primary)] rounded-b-xl border border-[var(--border-subtle)] focus:outline-none focus:ring-1 focus:ring-indigo-500 p-2.5 font-mono text-xs resize-none shadow-2xs overflow-auto"
        />
      </div>

      {/* Resizable Divider Bar between Input and Output */}
      <div
        onMouseDown={handleMouseDown}
        title="Drag vertically to resize Input and Output"
        className="h-2.5 my-0.5 flex items-center justify-center cursor-row-resize group transition hover:bg-indigo-500/10 rounded"
      >
        <div className="w-12 h-1 bg-[var(--border-subtle)] group-hover:bg-indigo-500 rounded-full transition-colors"></div>
      </div>

      {/* Output Header & Textarea */}
      <div
        style={{ height: `calc(${100 - splitRatio}% - 5px)` }}
        className="flex flex-col min-h-[90px] overflow-hidden"
      >
        <div className="px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface)] rounded-t-xl border border-b-0 border-[var(--border-subtle)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span>Output (stdout / stderr)</span>
            {isCollaborating && (
              <span className="text-[10px] text-emerald-400 font-normal">
                ● Collaborative Output
              </span>
            )}
          </div>
          {output && (
            <button
              onClick={copyOutput}
              className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
            >
              Copy
            </button>
          )}
        </div>
        <textarea
          placeholder="Program execution output will appear here..."
          value={output}
          readOnly
          className="flex-1 bg-[var(--input-bg)] text-[var(--text-primary)] rounded-b-xl border border-[var(--border-subtle)] focus:outline-none focus:ring-1 focus:ring-indigo-500 p-2.5 font-mono text-xs resize-none shadow-2xs overflow-auto"
        />
      </div>
    </div>
  );
}

export default IOConsole;
