import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { Users, Send, ArrowLeft, Loader, LogOut } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';

interface GroupPost {
  id: number;
  user_id: number;
  username: string;
  profile_picture: string;
  content: string;
  created_at: string;
}

interface GroupMember {
  user_id: number;
  username: string;
  profile_picture: string;
  role: string;
  joined_at: string;
}

interface GroupDetails {
  id: number;
  name: string;
  description: string;
  category: string;
  member_count: number;
  is_public: boolean;
  is_member: boolean;
  created_at: string;
  members: GroupMember[];
  posts: GroupPost[];
}

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    loadGroupDetails();
  }, [groupId]);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await client.get(`/groups/${groupId}`);
      if (response.data.success) {
        setGroup(response.data.group);
      }
    } catch (error: any) {
      console.error('Failed to load group details:', error);
      if (error.response?.status === 404) {
        showToast('Group not found', 'error');
        setTimeout(() => navigate('/groups'), 2000);
      } else {
        showToast('Failed to load group', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    try {
      const response = await client.post(`/groups/${groupId}/join`);
      if (response.data.success) {
        showToast('Joined group successfully!', 'success');
        loadGroupDetails();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to join group', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm('Are you sure you want to leave this group?')) return;
    
    try {
      const response = await client.post(`/groups/${groupId}/leave`);
      if (response.data.success) {
        showToast('Left group successfully', 'success');
        navigate('/groups');
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to leave group', 'error');
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postContent.trim()) return;

    try {
      setPosting(true);
      const response = await client.post(`/groups/${groupId}/posts`, {
        content: postContent
      });
      
      if (response.data.success) {
        setPostContent('');
        loadGroupDetails();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to post', 'error');
    } finally {
      setPosting(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <Loader className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <p className="text-[var(--text-muted)]">Group not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/groups" />
      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-6">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/groups')}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Groups
          </button>

          {/* Group Header */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-lg flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{group.name}</h1>
                  <p className="text-sm text-[var(--text-muted)] mb-2">{group.description}</p>
                  <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                    <span className="px-2 py-1 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-full">
                      {group.category}
                    </span>
                    <span>{group.member_count} members</span>
                    <span>{group.is_public ? 'Public' : 'Private'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {group.is_member ? (
                  <button
                    onClick={handleLeaveGroup}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 font-bold rounded-lg hover:bg-red-500/20 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Leave
                  </button>
                ) : (
                  <button
                    onClick={handleJoinGroup}
                    className="px-6 py-2 bg-[var(--brand-primary)] text-white font-bold rounded-lg hover:opacity-90 transition"
                  >
                    Join Group
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Posts Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Post Input */}
              {group.is_member && (
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-4">
                  <form onSubmit={handlePostSubmit}>
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="Share something with the group..."
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none focus:outline-none focus:border-[var(--brand-primary)]"
                      rows={3}
                    />
                    <div className="flex justify-end mt-3">
                      <button
                        type="submit"
                        disabled={!postContent.trim() || posting}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--brand-primary)] text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        {posting ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Posts List */}
              <div className="space-y-4">
                {group.posts.length === 0 ? (
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-8 text-center">
                    <p className="text-[var(--text-muted)]">No posts yet. Be the first to post!</p>
                  </div>
                ) : (
                  group.posts.map((post) => (
                    <div key={post.id} className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold">
                          {post.username[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold text-[var(--text-primary)]">{post.username}</span>
                            <span className="text-xs text-[var(--text-muted)]">{getTimeAgo(post.created_at)}</span>
                          </div>
                          <p className="text-[var(--text-secondary)] whitespace-pre-wrap">{post.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Members Sidebar */}
            <div className="space-y-6">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-4">
                <h3 className="font-bold text-[var(--text-primary)] mb-4">Members ({group.member_count})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {group.members.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center text-white font-bold">
                        {member.username[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)] text-sm truncate">{member.username}</p>
                        <p className="text-xs text-[var(--text-muted)]">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
