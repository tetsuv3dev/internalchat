import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { channelsApi } from '../../lib/api';
import { joinChannel } from '../../lib/socket';

interface SidebarProps {
  onChannelSelect: (channelId: string) => void;
}

export default function Sidebar({ onChannelSelect }: SidebarProps) {
  const { channels, activeChannelId, accessToken, user, setChannels, addChannel } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const memberChannels = channels.filter((c) => c.is_member);
  const otherChannels = channels.filter((c) => !c.is_member && c.is_public);

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newChannelName.trim()) return;

    setCreating(true);
    try {
      const data = await channelsApi.create(accessToken, newChannelName.trim(), newChannelDesc.trim());
      addChannel({ ...data.channel, is_member: 1 });
      joinChannel(data.channel.id);
      onChannelSelect(data.channel.id);
      setShowCreateModal(false);
      setNewChannelName('');
      setNewChannelDesc('');
    } catch (err) {
      console.error('Failed to create channel:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinChannel = async (channelId: string) => {
    if (!accessToken) return;
    try {
      await channelsApi.join(accessToken, channelId);
      joinChannel(channelId);
      // Refresh channels
      const data = await channelsApi.list(accessToken);
      setChannels(data.channels);
      onChannelSelect(channelId);
    } catch (err) {
      console.error('Failed to join channel:', err);
    }
  };

  return (
    <div className="h-full bg-chat-sidebar flex flex-col border-r border-chat-border">
      {/* Header */}
      <div className="p-3 border-b border-chat-border">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Channels</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-chat-muted hover:text-white w-6 h-6 flex items-center justify-center rounded hover:bg-chat-hover"
            title="Create channel"
          >
            +
          </button>
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto p-2">
        {memberChannels.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-chat-muted uppercase tracking-wide px-2 mb-1">Your Channels</p>
            {memberChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel.id)}
                className={`sidebar-item w-full text-left text-sm ${
                  activeChannelId === channel.id ? 'sidebar-item-active' : ''
                }`}
              >
                <span className="text-chat-muted">#</span>
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </div>
        )}

        {otherChannels.length > 0 && (
          <div>
            <p className="text-xs text-chat-muted uppercase tracking-wide px-2 mb-1">Browse</p>
            {otherChannels.map((channel) => (
              <div key={channel.id} className="sidebar-item text-sm group">
                <span className="text-chat-muted">#</span>
                <span className="truncate flex-1">{channel.name}</span>
                <button
                  onClick={() => handleJoinChannel(channel.id)}
                  className="text-xs text-primary-400 hover:text-primary-300 opacity-0 group-hover:opacity-100"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create channel modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-chat-sidebar rounded-xl p-6 w-full max-w-md border border-chat-border shadow-xl">
            <h3 className="text-white font-semibold text-lg mb-4">Create Channel</h3>
            <form onSubmit={handleCreateChannel} className="space-y-4">
              <div>
                <label className="block text-sm text-chat-text mb-1">Channel Name</label>
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. project-updates"
                  className="input-field"
                  required
                  pattern="[a-zA-Z0-9_-]+"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-chat-text mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="What is this channel about?"
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
