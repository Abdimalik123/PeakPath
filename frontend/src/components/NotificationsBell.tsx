import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  priority: string;
  entity_type: string;
  entity_id: number;
  action_url: string;
  created_at: string;
}

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const openDropdown = () => {
    if (isOpen) { setIsOpen(false); return; }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 384;
      const margin = 8;
      const top = rect.bottom + margin;
      // Right-align the dropdown to the button, clamped to viewport edges
      let left = rect.right - dropdownWidth;
      if (left < margin) left = margin;
      if (left + dropdownWidth > window.innerWidth - margin) {
        left = window.innerWidth - dropdownWidth - margin;
      }
      setDropdownStyle({ top, left, width: Math.min(dropdownWidth, window.innerWidth - margin * 2) });
    }
    setIsOpen(true);
  };

  const loadNotifications = async () => {
    try {
      const response = await client.get('/notifications');
      if (response.data.success) setNotifications(response.data.notifications || []);
    } catch {}
  };

  const markAsRead = async (id: number) => {
    try {
      await client.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      await client.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {} finally { setLoading(false); }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.action_url) { navigate(notification.action_url); }
    setIsOpen(false);
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await client.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_pr': case 'pr_achieved': return '🏆';
      case 'challenge_invite': case 'challenge_completed': return '🎯';
      case 'friend_workout': return '💪';
      case 'achievement_unlocked': return '🏅';
      case 'level_up': return '⬆️';
      case 'streak_milestone': return '🔥';
      case 'friend_request': return '👥';
      default: return '🔔';
    }
  };

  const timeAgo = (dateString: string) => {
    // Backend may return "2024-01-15 10:30:00" (space) instead of ISO "T" separator
    const normalized = dateString?.replace(' ', 'T');
    const date = new Date(normalized);
    if (!normalized || isNaN(date.getTime())) return 'Recently';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const recent = notifications.slice(0, 10);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={openDropdown}
        className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--error)] text-[var(--text-inverse)] text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="fixed z-[9999] bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="font-bold text-[var(--text-primary)] text-sm">Notifications</h3>
              <p className="text-xs text-[var(--text-muted)]">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-xs text-[var(--brand-primary)] hover:underline disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[var(--bg-tertiary)] rounded-lg transition text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 'min(460px, 60vh)' }}>
            {recent.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
                <p className="text-[var(--text-muted)] text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)]">
                {recent.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)] flex items-start gap-3 ${
                      !n.is_read ? 'bg-[var(--brand-primary)]/5' : ''
                    }`}
                  >
                    <span className="text-xl flex-shrink-0 mt-0.5">{getIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${
                        !n.is_read ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                      }`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                      {!n.is_read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                          className="p-1 hover:bg-[var(--bg-elevated)] rounded transition"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5 text-[var(--success)]" />
                        </button>
                      )}
                      <button
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="p-1 hover:bg-[var(--bg-elevated)] rounded transition"
                        title="Delete"
                      >
                        <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
