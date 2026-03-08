import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { PageHeader } from '../components/PageHeader';
import { Users, Plus, Search, TrendingUp, Lock, Globe, MessageCircle, X, Loader } from 'lucide-react';
import client from '../api/client';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';

interface Group {
  id: number;
  name: string;
  description: string;
  category: string;
  member_count: number;
  is_public: boolean;
  is_member: boolean;
  created_at: string;
}

export default function Groups({ embedded }: { embedded?: boolean }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my-groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
  }, [filter]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await client.get(`/groups?filter=${filter}`);
      if (response.data.success) {
        if (filter === 'my-groups') {
          setMyGroups(response.data.groups || []);
        } else {
          setGroups(response.data.groups || []);
        }
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupId: number) => {
    try {
      const response = await client.post(`/groups/${groupId}/join`);
      if (response.data.success) {
        showToast('Joined group successfully!', 'success');
        loadGroups();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to join group', 'error');
    }
  };

  const filteredGroups = (filter === 'my-groups' ? myGroups : groups).filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mainContent = (
    <>
      {!embedded && (
        <PageHeader
          title="Groups & Communities"
          subtitle="Connect with like-minded fitness enthusiasts"
          actionButton={{
            label: "+ Create Group",
            onClick: () => setShowCreateModal(true)
          }}
        />
      )}
      {embedded && (
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Groups</h3>
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-[var(--brand-primary)] text-white font-bold rounded-lg hover:opacity-90 transition text-sm">+ Create Group</button>
        </div>
      )}

          {/* Filters and Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'all'
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Discover
              </button>
              <button
                onClick={() => setFilter('my-groups')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === 'my-groups'
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                My Groups
              </button>
            </div>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              />
            </div>
          </div>

          {/* Groups Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-[var(--brand-primary)] animate-spin" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-12 text-center">
              <Users className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
              <p className="text-[var(--text-muted)] mb-4">
                {filter === 'my-groups' ? "You haven't joined any groups yet" : 'No groups found'}
              </p>
              {filter === 'my-groups' && (
                <button
                  onClick={() => setFilter('all')}
                  className="px-6 py-2 bg-[var(--brand-primary)] text-white font-bold rounded-lg hover:opacity-90 transition"
                >
                  Discover Groups
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onJoin={joinGroup}
                  onView={(id) => navigate(`/groups/${id}`)}
                />
              ))}
            </div>
          )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadGroups();
          }}
        />
      )}
    </>
  );

  if (embedded) return mainContent;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navigation currentPage="/groups" />
      <div className="lg:ml-64 min-h-screen pt-14 lg:pt-16 pb-20 lg:pb-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {mainContent}
        </main>
      </div>
    </div>
  );
}

function GroupCard({ group, onJoin, onView }: { group: Group; onJoin: (id: number) => void; onView: (id: number) => void }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-6 hover:border-[var(--brand-primary)] transition cursor-pointer"
         onClick={() => onView(group.id)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">{group.name}</h3>
            <span className="text-xs px-2 py-0.5 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-full">
              {group.category}
            </span>
          </div>
        </div>
        {group.is_public ? (
          <Globe className="w-4 h-4 text-green-500" />
        ) : (
          <Lock className="w-4 h-4 text-[var(--text-muted)]" />
        )}
      </div>

      <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">
        {group.description || 'No description'}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {group.member_count} members
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!group.is_member) {
              onJoin(group.id);
            }
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
            group.is_member
              ? 'bg-green-500/20 text-green-500 cursor-default'
              : 'bg-[var(--brand-primary)] text-white hover:opacity-90'
          }`}
        >
          {group.is_member ? 'Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
}

function CreateGroupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    is_public: true
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const categories = ['General', 'Powerlifting', 'Bodybuilding', 'CrossFit', 'Yoga', 'Running', 'Cycling', 'Calisthenics', 'Martial Arts', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      showToast('Group name is required', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await client.post('/groups', formData);
      if (response.data.success) {
        showToast('Group created successfully!', 'success');
        onSuccess();
      }
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create group', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg max-w-lg w-full">
        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Create Group</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Group Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
              placeholder="e.g., Powerlifting Warriors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-[var(--text-primary)] resize-none"
              rows={3}
              placeholder="Describe your group..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[var(--text-primary)] mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-4 py-2 text-[var(--text-primary)]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="is_public" className="text-sm text-[var(--text-primary)]">
              Make this group public
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold rounded-lg hover:bg-[var(--bg-tertiary)]/80 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[var(--brand-primary)] text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
