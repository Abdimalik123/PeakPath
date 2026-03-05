import { useState } from 'react';
import client from '../api/client';

const REACTIONS = [
  { type: 'strong', emoji: '💪', label: 'Strong' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
  { type: 'clap', emoji: '👏', label: 'Clap' },
  { type: 'wow', emoji: '😮', label: 'Wow' },
  { type: 'heart', emoji: '❤️', label: 'Love' }
];

interface EmojiReactionsProps {
  activityId: number;
  reactions?: Record<string, number>;
  userReactions?: string[];
}

export function EmojiReactions({ activityId, reactions = {}, userReactions = [] }: EmojiReactionsProps) {
  const [localReactions, setLocalReactions] = useState(reactions);
  const [localUserReactions, setLocalUserReactions] = useState(userReactions);
  
  const handleReact = async (reactionType: string) => {
    try {
      await client.post(`/activities/${activityId}/react`, { reaction_type: reactionType });
      
      // Reload reactions
      const response = await client.get(`/activities/${activityId}/reactions`);
      if (response.data.success) {
        const grouped: Record<string, number> = {};
        for (const [type, data] of Object.entries(response.data.reactions as Record<string, any>)) {
          grouped[type] = data.count || 0;
        }
        setLocalReactions(grouped);
        setLocalUserReactions(response.data.user_reactions || []);
      }
    } catch (error) {
      console.error('Failed to react:', error);
    }
  };
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {REACTIONS.map(({ type, emoji, label }) => {
        const count = localReactions[type] || 0;
        const isActive = localUserReactions.includes(type);
        
        return (
          <button
            key={type}
            onClick={() => handleReact(type)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isActive
                ? 'bg-[var(--brand-primary)] text-white shadow-md'
                : count > 0
                ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/20'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]/80'
            }`}
            title={label}
          >
            <span className="text-base">{emoji}</span>
            {count > 0 && <span className="font-bold text-xs">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
