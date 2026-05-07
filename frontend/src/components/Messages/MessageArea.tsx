import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { messagesApi } from '../../lib/api';
import { sendMessage, sendTyping } from '../../lib/socket';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface MessageAreaProps {
  channelId: string;
}

export default function MessageArea({ channelId }: MessageAreaProps) {
  const { messages, hasMore, accessToken, user, typingUsers, prependMessages } = useStore();
  const channelMessages = messages[channelId] || [];
  const channelHasMore = hasMore[channelId] ?? true;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelMessages.length, autoScroll]);

  // Track scroll position for auto-scroll
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setAutoScroll(isAtBottom);

    // Load more messages on scroll to top
    if (container.scrollTop < 100 && channelHasMore && !loadingMore && accessToken) {
      setLoadingMore(true);
      const oldestMessage = channelMessages[0];
      if (oldestMessage) {
        const prevScrollHeight = container.scrollHeight;
        messagesApi
          .list(accessToken, channelId, oldestMessage.created_at)
          .then((data) => {
            prependMessages(channelId, data.messages, data.hasMore);
            // Maintain scroll position
            requestAnimationFrame(() => {
              container.scrollTop = container.scrollHeight - prevScrollHeight;
            });
          })
          .finally(() => setLoadingMore(false));
      } else {
        setLoadingMore(false);
      }
    }
  }, [channelId, channelHasMore, loadingMore, accessToken, channelMessages]);

  // Active typing users for this channel (exclude self, within 3 seconds)
  const activeTyping = typingUsers.filter(
    (t) => t.channelId === channelId && t.userId !== user?.id && Date.now() - t.timestamp < 3000
  );

  const handleSendMessage = (content: string, contentType: string, codeLanguage?: string) => {
    sendMessage(channelId, content, contentType, codeLanguage);
  };

  const handleTyping = () => {
    sendTyping(channelId);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-2"
      >
        {loadingMore && (
          <div className="text-center py-2">
            <div className="inline-block w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {channelMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-chat-muted">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {channelMessages.map((message, index) => {
              const prevMessage = index > 0 ? channelMessages[index - 1] : null;
              const showAuthor = !prevMessage || prevMessage.user_id !== message.user_id ||
                (new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 5 * 60 * 1000);

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.user_id === user?.id}
                  showAuthor={showAuthor}
                />
              );
            })}
          </div>
        )}

        {/* Typing indicator */}
        {activeTyping.length > 0 && (
          <div className="px-2 py-1 text-xs text-chat-muted">
            {activeTyping.map((t) => t.nickname).join(', ')}{' '}
            {activeTyping.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSendMessage} onTyping={handleTyping} />
    </div>
  );
}
