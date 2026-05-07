import React, { useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { channelsApi, messagesApi } from '../../lib/api';
import { onMessage, onTyping, onUserOnline, onUserList, joinChannel } from '../../lib/socket';
import Sidebar from './Sidebar';
import MessageArea from '../Messages/MessageArea';
import MembersPanel from './MembersPanel';
import Header from './Header';

export default function ChatLayout() {
  const {
    accessToken,
    channels,
    activeChannelId,
    sidebarOpen,
    membersPanelOpen,
    setChannels,
    setActiveChannel,
    setMessages,
    addMessage,
    setTyping,
    setUserOnline,
    setOnlineUsers,
    setSidebarOpen,
  } = useStore();

  // Load channels
  useEffect(() => {
    if (!accessToken) return;

    channelsApi.list(accessToken).then((data) => {
      setChannels(data.channels);
      // Auto-select first channel user is a member of
      const memberChannel = data.channels.find((c) => c.is_member);
      if (memberChannel && !activeChannelId) {
        setActiveChannel(memberChannel.id);
      }
    });
  }, [accessToken]);

  // Load messages when active channel changes
  useEffect(() => {
    if (!accessToken || !activeChannelId) return;

    messagesApi.list(accessToken, activeChannelId).then((data) => {
      setMessages(activeChannelId, data.messages, data.hasMore);
    });
  }, [accessToken, activeChannelId]);

  // Socket event listeners
  useEffect(() => {
    const cleanups = [
      onMessage((data) => {
        addMessage(data.message);
      }),
      onTyping((data) => {
        setTyping(data.userId, data.nickname, data.channelId);
      }),
      onUserOnline((data) => {
        setUserOnline(data.userId, data.nickname, data.online);
      }),
      onUserList((data) => {
        setOnlineUsers(data.users);
      }),
    ];

    return () => {
      cleanups.forEach((cleanup) => cleanup?.());
    };
  }, []);

  // Close sidebar on mobile when selecting a channel
  const handleChannelSelect = useCallback((channelId: string) => {
    setActiveChannel(channelId);
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  return (
    <div className="h-full flex flex-col bg-chat-bg">
      <Header />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            fixed md:relative md:translate-x-0
            z-30 md:z-auto
            w-64 h-full
            transition-transform duration-200 ease-in-out
            flex-shrink-0
          `}
        >
          <Sidebar onChannelSelect={handleChannelSelect} />
        </div>

        {/* Main message area */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeChannelId ? (
            <MessageArea channelId={activeChannelId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-chat-muted">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Welcome to InternalChat</h2>
                <p>Select a channel to start chatting</p>
              </div>
            </div>
          )}
        </div>

        {/* Members panel - hidden on mobile, toggleable on desktop */}
        {membersPanelOpen && activeChannelId && (
          <div className="hidden md:block w-60 flex-shrink-0 border-l border-chat-border">
            <MembersPanel channelId={activeChannelId} />
          </div>
        )}
      </div>
    </div>
  );
}
