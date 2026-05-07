import React from 'react';
import { useStore } from '../../store/useStore';
import { authApi } from '../../lib/api';
import { disconnectSocket } from '../../lib/socket';

export default function Header() {
  const {
    user,
    accessToken,
    activeChannelId,
    channels,
    sidebarOpen,
    membersPanelOpen,
    toggleSidebar,
    toggleMembersPanel,
    clearAuth,
  } = useStore();

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  const handleLogout = async () => {
    if (accessToken) {
      try {
        await authApi.logout(accessToken);
      } catch {
        // Ignore errors on logout
      }
    }
    disconnectSocket();
    clearAuth();
  };

  return (
    <header className="h-14 bg-chat-sidebar border-b border-chat-border flex items-center px-4 gap-3 flex-shrink-0">
      {/* Hamburger menu (mobile) */}
      <button
        onClick={toggleSidebar}
        className="md:hidden text-chat-text hover:text-white p-1"
        aria-label="Toggle sidebar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {sidebarOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Channel name */}
      <div className="flex-1 min-w-0">
        {activeChannel ? (
          <div className="flex items-center gap-2">
            <span className="text-chat-muted">#</span>
            <h1 className="text-white font-semibold truncate">{activeChannel.name}</h1>
            {activeChannel.description && (
              <span className="hidden sm:inline text-chat-muted text-sm truncate">
                -- {activeChannel.description}
              </span>
            )}
          </div>
        ) : (
          <h1 className="text-white font-semibold">InternalChat</h1>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Members toggle */}
        {activeChannelId && (
          <button
            onClick={toggleMembersPanel}
            className={`hidden md:flex items-center gap-1 px-2 py-1.5 rounded text-sm ${
              membersPanelOpen ? 'bg-primary-600/20 text-primary-400' : 'text-chat-muted hover:text-white'
            }`}
            title="Toggle members panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </button>
        )}

        {/* User menu */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {user?.nickname?.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline text-sm text-chat-text">{user?.nickname}</span>
          <button
            onClick={handleLogout}
            className="text-chat-muted hover:text-red-400 p-1 transition-colors"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
