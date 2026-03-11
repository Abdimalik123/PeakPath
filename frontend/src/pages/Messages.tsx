import { useState, useEffect, useRef } from 'react';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { Send, Loader, MessageCircle } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { StartConversationModal } from '../components/StartConversationModal';

interface Message {
  id: number;
  sender_id: number;
  sender_username: string;
  content: string;
  is_read: boolean;
  created_at: string;
  is_mine: boolean;
}

interface Conversation {
  id: number;
  other_user: {
    id: number;
    username: string;
    profile_picture: string;
  };
  last_message: {
    content: string;
    created_at: string;
    is_mine: boolean;
  } | null;
  unread_count: number;
  last_message_at: string;
}

export default function Messages({ embedded }: { embedded?: boolean }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await client.get('/conversations');
      if (response.data.success) {
        setConversations(response.data.conversations || []);
        // Don't auto-select conversation - let user choose
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
    try {
      const response = await client.get(`/conversations/${conversationId}/messages`);
      if (response.data.success) {
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageContent.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const response = await client.post(`/conversations/${selectedConversation}/messages`, {
        content: messageContent
      });
      
      if (response.data.success) {
        setMessageContent('');
        loadMessages(selectedConversation);
        loadConversations();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  const mainContent = (
    <>
      {!embedded && (
        <PageHeader
          title="Messages"
          subtitle="Chat with your fitness friends"
          actionButton={{
            label: "+ New Message",
            onClick: () => setShowNewConversation(true)
          }}
        />
      )}
      {embedded && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Messages</h3>
          <button onClick={() => setShowNewConversation(true)} className="px-4 py-2 bg-[var(--brand-primary)] text-white font-bold rounded-lg hover:opacity-90 transition text-sm">+ New Message</button>
        </div>
      )}

          <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
            <div className="grid grid-cols-12 h-full">
              {/* Conversations List */}
              <div className={`col-span-12 md:col-span-4 border-r border-[var(--border-default)] overflow-y-auto ${selectedConversation ? 'hidden md:block' : ''}`}>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader className="w-6 h-6 text-[var(--brand-primary)] animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <MessageCircle className="w-16 h-16 text-[var(--text-muted)] mb-4 opacity-50" />
                    <p className="text-[var(--text-muted)]">No conversations yet</p>
                    <p className="text-sm text-[var(--text-muted)] mt-2">Start chatting with friends from the Social page</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`p-4 border-b border-[var(--border-subtle)] cursor-pointer transition ${
                        selectedConversation === conv.id
                          ? 'bg-[var(--brand-primary)]/10'
                          : 'hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold flex-shrink-0">
                          {conv.other_user?.username[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[var(--text-primary)] truncate">
                              {conv.other_user?.username || 'Unknown'}
                            </span>
                            {conv.unread_count > 0 && (
                              <span className="bg-[var(--brand-primary)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className="text-sm text-[var(--text-muted)] truncate">
                              {conv.last_message.is_mine ? 'You: ' : ''}
                              {conv.last_message.content}
                            </p>
                          )}
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            {getTimeAgo(conv.last_message_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Area */}
              <div className={`col-span-12 md:col-span-8 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
                {selectedConv ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-[var(--border-default)] flex items-center gap-3">
                      {/* Back button for mobile */}
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="md:hidden p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold">
                          {selectedConv.other_user?.username[0] || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">
                            {selectedConv.other_user?.username || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.is_mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              message.is_mine
                                ? 'bg-[var(--brand-primary)] text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                            <p className={`text-xs mt-1 ${message.is_mine ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                              {getTimeAgo(message.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-[var(--border-default)]">
                      <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                          type="text"
                          value={messageContent}
                          onChange={(e) => setMessageContent(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)]"
                        />
                        <button
                          type="submit"
                          disabled={!messageContent.trim() || sending}
                          className="px-4 py-2 bg-[var(--brand-primary)] text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[var(--text-muted)]">Select a conversation to start chatting</p>
                  </div>
                )}
              </div>
            </div>
          </div>
      {/* New Conversation Modal */}
      {showNewConversation && (
        <StartConversationModal
          onClose={() => setShowNewConversation(false)}
          onConversationStarted={(conversationId) => {
            setSelectedConversation(conversationId);
            loadConversations();
          }}
        />
      )}
    </>
  );

  if (embedded) return mainContent;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/messages" />
      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-6">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {mainContent}
        </main>
      </div>
    </div>
  );
}
