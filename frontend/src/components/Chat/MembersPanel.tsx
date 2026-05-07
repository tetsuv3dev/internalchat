import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { channelsApi } from '../../lib/api';

interface MembersPanelProps {
  channelId: string;
}

export default function MembersPanel({ channelId }: MembersPanelProps) {
  const { accessToken, members, onlineUsers, setMembers } = useStore();

  useEffect(() => {
    if (!accessToken || !channelId) return;

    channelsApi.members(accessToken, channelId).then((data) => {
      setMembers(channelId, data.members);
    });
  }, [accessToken, channelId]);

  const channelMembers = members[channelId] || [];
  const onlineIds = new Set(onlineUsers.map((u) => u.id));

  const onlineMembers = channelMembers.filter((m) => onlineIds.has(m.id));
  const offlineMembers = channelMembers.filter((m) => !onlineIds.has(m.id));

  return (
    <div className="h-full bg-chat-sidebar p-3 overflow-y-auto">
      <h3 className="text-xs text-chat-muted uppercase tracking-wide mb-3">Members</h3>

      {onlineMembers.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-chat-muted mb-2">
            Online -- {onlineMembers.length}
          </p>
          {onlineMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-2 px-2 py-1.5">
              <div className="relative">
                <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                  {member.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-chat-sidebar" />
              </div>
              <span className="text-sm text-chat-text truncate">{member.nickname}</span>
              {member.role === 'admin' && (
                <span className="text-xs text-yellow-400 ml-auto">admin</span>
              )}
            </div>
          ))}
        </div>
      )}

      {offlineMembers.length > 0 && (
        <div>
          <p className="text-xs text-chat-muted mb-2">
            Offline -- {offlineMembers.length}
          </p>
          {offlineMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-2 px-2 py-1.5 opacity-50">
              <div className="w-7 h-7 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {member.nickname.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-chat-text truncate">{member.nickname}</span>
              {member.role === 'admin' && (
                <span className="text-xs text-yellow-400 ml-auto">admin</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
