import { useState } from 'react';
import { X, Search, Loader } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';

interface StartConversationModalProps {
  onClose: () => void;
  onConversationStarted: (conversationId: number) => void;
}

export function StartConversationModal({ onClose, onConversationStarted }: StartConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const { showToast } = useToast();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await client.get(`/social/users/search?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        setSearchResults(response.data.users || []);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setSearching(false);
    }
  };

  const startConversation = async (userId: number) => {
    try {
      // Get or create conversation
      const response = await client.get(`/conversations/${userId}`);
      if (response.data.success) {
        onConversationStarted(response.data.conversation_id);
        onClose();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to start conversation', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg max-w-md w-full max-h-[600px] flex flex-col">
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Start New Conversation</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search for users..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {searching ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 text-[var(--brand-primary)] animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-muted)]">
                {searchQuery.length < 2 ? 'Type to search for users' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => startConversation(user.id)}
                  className="w-full flex items-center gap-3 p-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 rounded-lg transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold">
                    {user.name[0]}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                    <p className="text-sm text-[var(--text-muted)]">Level {user.level}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
