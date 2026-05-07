import React, { memo } from 'react';
import type { Message } from '../../lib/api';
import CodeBlock from './CodeBlock';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAuthor: boolean;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

// Renders markdown-like content: **bold**, *italic*, `inline code`, ```code blocks```
function renderContent(content: string): React.ReactNode {
  // Handle code blocks first
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderInlineMarkdown(content.slice(lastIndex, match.index), parts.length));
    }
    parts.push(
      <CodeBlock key={`code-${parts.length}`} code={match[2]} language={match[1] || 'text'} />
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(renderInlineMarkdown(content.slice(lastIndex), parts.length));
  }

  return parts.length === 0 ? content : parts;
}

function renderInlineMarkdown(text: string, keyBase: number): React.ReactNode {
  // Simple inline formatting
  const formatted = text.split('\n').map((line, i) => (
    <React.Fragment key={`${keyBase}-${i}`}>
      {i > 0 && <br />}
      {line.split(/(`[^`]+`)/).map((part, j) => {
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={j} className="bg-chat-hover px-1 py-0.5 rounded text-sm font-mono text-primary-300">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={j}>{part}</span>;
      })}
    </React.Fragment>
  ));

  return <>{formatted}</>;
}

const MessageBubble = memo(function MessageBubble({ message, isOwn, showAuthor }: MessageBubbleProps) {
  const isCode = message.content_type === 'code';
  const isVideo = message.content_type === 'video';

  return (
    <div className={`group ${showAuthor ? 'mt-3' : 'mt-0.5'}`}>
      {showAuthor && (
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${
              isOwn ? 'bg-primary-600' : 'bg-green-600'
            }`}
          >
            {message.author_nickname.charAt(0).toUpperCase()}
          </div>
          <span className={`text-sm font-medium ${isOwn ? 'text-primary-400' : 'text-green-400'}`}>
            {message.author_nickname}
          </span>
          <span className="text-xs text-chat-muted">
            {formatDate(message.created_at)} at {formatTime(message.created_at)}
          </span>
          {message.updated_at && (
            <span className="text-xs text-chat-muted">(edited)</span>
          )}
        </div>
      )}

      <div className={`${showAuthor ? 'pl-8' : 'pl-8'} pr-4`}>
        {isCode ? (
          <CodeBlock code={message.content} language={message.code_language || 'text'} />
        ) : isVideo ? (
          <div className="max-w-lg">
            <video
              controls
              className="rounded-lg w-full"
              preload="metadata"
            >
              <source src={message.content} />
              Your browser does not support video playback.
            </video>
          </div>
        ) : (
          <div className="text-chat-text text-sm leading-relaxed">
            {renderContent(message.content)}
          </div>
        )}
      </div>
    </div>
  );
});

export default MessageBubble;
