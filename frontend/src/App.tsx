import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { authApi } from './lib/api';
import { connectSocket, disconnectSocket } from './lib/socket';
import AuthScreen from './components/Auth/AuthScreen';
import ChatLayout from './components/Chat/ChatLayout';

export default function App() {
  const { user, accessToken, setAuth, clearAuth } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedRefreshToken = localStorage.getItem('refreshToken');
    if (savedRefreshToken) {
      authApi
        .login(savedRefreshToken)
        .then((data) => {
          setAuth(data.user, data.accessToken, data.refreshToken);
        })
        .catch(() => {
          localStorage.removeItem('refreshToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      connectSocket(accessToken);
    }
    return () => {
      disconnectSocket();
    };
  }, [accessToken]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-chat-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-chat-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !accessToken) {
    return <AuthScreen />;
  }

  return <ChatLayout />;
}
