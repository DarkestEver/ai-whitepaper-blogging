"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface HtmlEditorProps {
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
  placeholder?: string;
}

type Mode = "visual" | "code";

const TOOLBAR_GROUPS = [
  {
    label: "Text",
    buttons: [
      { cmd: "bold", icon: "B", title: "Bold (Ctrl+B)", style: "font-weight:700" },
      { cmd: "italic", icon: "I", title: "Italic (Ctrl+I)", style: "font-style:italic" },
      { cmd: "underline", icon: "U", title: "Underline (Ctrl+U)", style: "text-decoration:underline" },
      { cmd: "strikeThrough", icon: "S", title: "Strikethrough", style: "text-decoration:line-through" },
    ],
  },
  {
    label: "Block",
    buttons: [
      { cmd: "formatBlock:h2", icon: "H2", title: "Heading 2" },
      { cmd: "formatBlock:h3", icon: "H3", title: "Heading 3" },
      { cmd: "formatBlock:h4", icon: "H4", title: "Heading 4" },
      { cmd: "formatBlock:p", icon: "¶", title: "Paragraph" },
    ],
  },
  {
    label: "List",
    buttons: [
      { cmd: "insertUnorderedList", icon: "ul", title: "Bullet list", svg: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
      { cmd: "insertOrderedList", icon: "ol", title: "Numbered list", svg: "M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" },
    ],
  },
  {
    label: "Insert",
    buttons: [
      { cmd: "blockquote", icon: "❝", title: "Blockquote" },
      { cmd: "createLink", icon: "🔗", title: "Insert link", svg: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" },
      { cmd: "insertHorizontalRule", icon: "—", title: "Horizontal rule" },
    ],
  },
  {
    label: "Format",
    buttons: [
      { cmd: "removeFormat", icon: "✕", title: "Clear formatting" },
      { cmd: "undo", icon: "↩", title: "Undo" },
      { cmd: "redo", icon: "↪", title: "Redo" },
    ],
  },
];

export function HtmlEditor({ value, onChange, minHeight = 400, placeholder = "Start writing..." }: HtmlEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("visual");
  const [codeValue, setCodeValue] = useState(value);
  const isInternalUpdate = useRef(false);

  // Sync external value into editor on mount
  useEffect(() => {
    if (editorRef.current && mode === "visual" && !isInternalUpdate.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalUpdate.current = false;
  }, [value, mode]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  function execCmd(cmdString: string) {
    if (mode !== "visual") return;
    editorRef.current?.focus();

    if (cmdString.startsWith("formatBlock:")) {
      const tag = cmdString.split(":")[1];
      document.execCommand("formatBlock", false, `<${tag}>`);
    } else if (cmdString === "blockquote") {
      document.execCommand("formatBlock", false, "<blockquote>");
    } else if (cmdString === "createLink") {
      const url = prompt("Enter URL:");
      if (url) document.execCommand("createLink", false, url);
    } else {
      document.execCommand(cmdString, false);
    }
    handleInput();
  }

  function switchMode(newMode: Mode) {
    if (newMode === "code" && editorRef.current) {
      setCodeValue(editorRef.current.innerHTML);
    }
    if (newMode === "visual") {
      if (editorRef.current) {
        editorRef.current.innerHTML = codeValue;
      }
      onChange(codeValue);
    }
    setMode(newMode);
  }

  function handleCodeChange(newCode: string) {
    setCodeValue(newCode);
    onChange(newCode);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
    }
  }

  return (
    <div className="html-editor">
      {/* Toolbar */}
      <div className="html-editor-toolbar">
        <div className="html-editor-toolbar-buttons">
          {TOOLBAR_GROUPS.map((group) => (
            <div key={group.label} className="html-editor-btn-group">
              {group.buttons.map((btn) => (
                <button
                  key={btn.cmd}
                  type="button"
                  className="html-editor-btn"
                  title={btn.title}
                  onClick={() => execCmd(btn.cmd)}
                  disabled={mode !== "visual"}
                >
                  {btn.svg ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={btn.svg} />
                    </svg>
                  ) : (
                    <span style={btn.style ? { ...(Object.fromEntries(btn.style.split(";").filter(Boolean).map(s => { const [k, v] = s.split(":"); return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v.trim()]; }))) } : undefined}>
                      {btn.icon}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="html-editor-mode-toggle">
          <button
            type="button"
            className={`html-editor-mode-btn ${mode === "visual" ? "active" : ""}`}
            onClick={() => switchMode("visual")}
          >
            Visual
          </button>
          <button
            type="button"
            className={`html-editor-mode-btn ${mode === "code" ? "active" : ""}`}
            onClick={() => switchMode("code")}
          >
            &lt;/&gt; Code
          </button>
        </div>
      </div>

      {/* Editor Area */}
      {mode === "visual" ? (
        <div
          ref={editorRef}
          className="html-editor-content"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          style={{ minHeight }}
          data-placeholder={placeholder}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <textarea
          className="html-editor-code"
          value={codeValue}
          onChange={(e) => handleCodeChange(e.target.value)}
          style={{ minHeight }}
          spellCheck={false}
        />
      )}
    </div>
  );
}
