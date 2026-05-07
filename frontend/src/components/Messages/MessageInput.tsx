import React, { useState, useRef, useCallback } from 'react';

interface MessageInputProps {
  onSend: (content: string, contentType: string, codeLanguage?: string) => void;
  onTyping: () => void;
}

export default function MessageInput({ onSend, onTyping }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingRef = useRef(0);

  const languages = [
    'javascript', 'typescript', 'python', 'json', 'html', 'css',
    'bash', 'markdown', 'sql', 'yaml', 'text',
  ];

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';

    // Debounced typing indicator
    const now = Date.now();
    if (now - lastTypingRef.current > 2000) {
      onTyping();
      lastTypingRef.current = now;
    }
  }, [onTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    if (isCodeMode) {
      onSend(trimmed, 'code', codeLanguage);
    } else {
      onSend(trimmed, 'text');
    }

    setContent('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="border-t border-chat-border p-3 bg-chat-bg">
      {/* Code mode toggle bar */}
      {isCodeMode && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-chat-muted">Language:</span>
          <select
            value={codeLanguage}
            onChange={(e) => setCodeLanguage(e.target.value)}
            className="bg-chat-input border border-chat-border rounded px-2 py-1 text-xs text-chat-text focus:outline-none"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Code mode toggle */}
        <button
          onClick={() => setIsCodeMode(!isCodeMode)}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            isCodeMode
              ? 'bg-primary-600/20 text-primary-400'
              : 'text-chat-muted hover:text-chat-text hover:bg-chat-hover'
          }`}
          title="Toggle code mode"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>

        {/* Input field */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isCodeMode ? 'Paste your code here...' : 'Type a message... (Shift+Enter for new line)'}
          className={`input-field flex-1 resize-none min-h-[40px] max-h-[200px] ${
            isCodeMode ? 'font-mono text-sm' : ''
          }`}
          rows={1}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          className="flex-shrink-0 btn-primary p-2"
          title="Send message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
