import { useState } from 'react';
import { Search, UserPlus, Check, Clock, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import client from '../api/client';

interface SearchUser {
  id: number;
  name: string;
  email: string;
  level: number;
  points: number;
  friendship_status: string | null;
}

interface UserSearchProps {
  onFriendAdded?: () => void;
}

export function UserSearch({ onFriendAdded }: UserSearchProps) {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<number | null>(null);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await client.get(`/social/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.data.success) {
        setResults(response.data.users);
      }
    } catch (error) {
      console.error('Search failed:', error);
      showToast('Failed to search users', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId: number) => {
    setSendingRequest(userId);
    try {
      const response = await client.post('/social/friend-request', { friend_id: userId });
      if (response.data.success) {
        showToast('Friend request sent!');
        setResults(results.map(u => 
          u.id === userId ? { ...u, friendship_status: 'pending' } : u
        ));
        if (onFriendAdded) onFriendAdded();
      }
    } catch (error) {
      console.error('Failed to send request:', error);
      showToast('Failed to send friend request', 'error');
    } finally {
      setSendingRequest(null);
    }
  };

  const getFriendshipButton = (user: SearchUser) => {
    if (user.friendship_status === 'accepted') {
      return (
        <button disabled className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold flex items-center gap-1">
          <Check className="w-3 h-3" />
          Friends
        </button>
      );
    }
    
    if (user.friendship_status === 'pending') {
      return (
        <button disabled className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs font-bold flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending
        </button>
      );
    }

    return (
      <button
        onClick={() => handleSendRequest(user.id)}
        disabled={sendingRequest === user.id}
        className="px-3 py-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/80 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition disabled:opacity-50"
      >
        <UserPlus className="w-3 h-3" />
        Add Friend
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search users by name or email..."
          className="w-full pl-10 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {searching && (
        <div className="text-center py-8 text-[var(--text-muted)]">
          Searching...
        </div>
      )}

      {!searching && results.length === 0 && query.length >= 2 && (
        <div className="text-center py-8 text-[var(--text-muted)]">
          No users found matching "{query}"
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--border-default)] transition"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-[var(--text-primary)]">{user.name}</h4>
                  <span className="text-xs px-2 py-0.5 bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] rounded-full font-bold">
                    Lv {user.level}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{user.email}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{user.points.toLocaleString()} points</p>
              </div>
              {getFriendshipButton(user)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
