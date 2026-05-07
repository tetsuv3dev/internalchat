import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { authApi } from '../../lib/api';

export default function AuthScreen() {
  const { setAuth } = useStore();
  const [nickname, setNickname] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.register(nickname.trim(), registrationToken.trim());
      setAuth(data.user, data.accessToken, data.refreshToken);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-chat-bg p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">InternalChat</h1>
          <p className="text-chat-muted">Real-time cross-platform messaging</p>
        </div>

        <form
          onSubmit={handleRegister}
          className="bg-chat-sidebar rounded-xl p-6 shadow-xl border border-chat-border"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Join the conversation</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-chat-text mb-1.5">
                Nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="input-field"
                required
                minLength={2}
                maxLength={30}
                pattern="[a-zA-Z0-9_-]+"
                title="Letters, numbers, underscores, and hyphens only"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="token" className="block text-sm font-medium text-chat-text mb-1.5">
                Registration Token
              </label>
              <input
                id="token"
                type="text"
                value={registrationToken}
                onChange={(e) => setRegistrationToken(e.target.value)}
                placeholder="Enter the server-provided token"
                className="input-field font-mono text-sm"
                required
              />
              <p className="mt-1 text-xs text-chat-muted">
                Get this token from your server administrator
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading || !nickname.trim() || !registrationToken.trim()}
            >
              {loading ? 'Joining...' : 'Join Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
