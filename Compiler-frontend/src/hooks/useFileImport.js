import { useState } from "react";
import toast from "react-hot-toast";
import { detectLanguageFromFilename } from "../utils/languageExtension";

/**
 * Custom React Hook managing local code file imports and editor drag-and-drop mechanics.
 *
 * @param {Object} params
 * @param {function} params.onFileLoaded - Callback invoked when a file is successfully parsed
 * @param {string} params.myPermission - Current user's permission level ("READ", "WRITE", "EXECUTE")
 * @param {boolean} params.isCollaborating - True if the user is currently connected to a collaborative room
 */
export function useFileImport({ onFileLoaded, myPermission, isCollaborating }) {

  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const processFile = (file) => {
    if (!file) return;

    if (isCollaborating && myPermission === "READ") {
      toast.error("Read-Only: You cannot modify code in this room.");
      return;
    }

    const detectedLang = detectLanguageFromFilename(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        onFileLoaded(content, detectedLang, file.name);
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file.");
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return {
    isDraggingFile,
    processFile,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
