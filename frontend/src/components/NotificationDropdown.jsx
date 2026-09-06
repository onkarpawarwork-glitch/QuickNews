import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, BellOff, Trash2, CheckCheck, Circle, ExternalLink,
  MessageSquare, ShieldAlert, Award, Heart, ThumbsUp, Settings,
  Check, X, SlidersHorizontal
} from 'lucide-react';
import {
  getNotifications,
  deleteNotification as removeNotification,
  toggleRead as toggleNotificationRead,
  markAllAsRead,
  clearAllNotifications,
  getNotificationSettings,
  saveNotificationSettings,
  sendBrowserPush,
  getActiveUserId
} from '../services/notificationService';

// Helper to request notification permission
export const requestNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendBrowserNotification = sendBrowserPush;

export default function NotificationDropdown({ user, darkMode = true, isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'like' | 'comment' | 'vote'
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => getNotificationSettings(getActiveUserId(user)));
  const [permissionGranted, setPermissionGranted] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });
  const containerRef = useRef(null);

  const userId = getActiveUserId(user);

  // Sync notifications from notificationService
  const refresh = () => {
    setNotifications(getNotifications(userId));
    setSettings(getNotificationSettings(userId));
  };

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();
    window.addEventListener('qn_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('qn_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [userId]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isOpen && containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, onClose]);

  // Sync state with browser permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermissionGranted(granted);
  };

  const handleMarkAllRead = () => {
    markAllAsRead(userId);
    refresh();
  };

  const handleToggleRead = (id) => {
    toggleNotificationRead(userId, id);
    refresh();
  };

  const handleDelete = (id, e) => {
    if (e) e.stopPropagation();
    removeNotification(userId, id);
    refresh();
  };

  const handleClearAll = () => {
    clearAllNotifications(userId);
    refresh();
  };

  const handleToggleSetting = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveNotificationSettings(userId, updated);
  };

  // Styles/Tokens
  const bg = darkMode ? '#181822' : '#ffffff';
  const textClr = darkMode ? '#f8fafc' : '#0f172a';
  const mutedClr = darkMode ? '#71717a' : '#64748b';
  const borderClr = darkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
  const itemBg = darkMode ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)';
  const unreadBg = darkMode ? 'rgba(99,102,241,.08)' : 'rgba(99,102,241,.05)';
  const pillActiveBg = 'var(--accent-gradient)';

  const timeAgo = (d) => {
    if (!d) return '';
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like':    return <Heart size={16} color="#ef4444" fill="#ef4444" />;
      case 'comment': return <MessageSquare size={16} color="#38bdf8" />;
      case 'vote':    return <ThumbsUp size={16} color="#a855f7" />;
      case 'verify':  return <Award size={16} color="#22c55e" />;
      case 'admin':   return <ShieldAlert size={16} color="#f43f5e" />;
      default:        return <Bell size={16} color="#fbbf24" />;
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'like') return n.type === 'like';
    if (filter === 'comment') return n.type === 'comment';
    if (filter === 'alert') return n.type === 'admin' || n.type === 'system' || n.type === 'verify';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div
      ref={containerRef}
      className="notification-dropdown"
      style={{
        position: 'absolute',
        top: '54px',
        right: '0',
        width: 'min(390px, calc(100vw - 1.5rem))',
        maxWidth: 'calc(100vw - 1.5rem)',
        maxHeight: '520px',
        background: bg,
        color: textClr,
        borderRadius: '20px',
        border: `1px solid ${borderClr}`,
        boxShadow: darkMode ? '0 16px 48px rgba(0,0,0,.6)' : '0 12px 36px rgba(0,0,0,.12)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        fontFamily: 'system-ui,-apple-system,sans-serif',
        overflow: 'hidden',
        animation: 'dropPop .2s ease'
      }}
    >
      <style>{`
        @keyframes dropPop { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .notif-item:hover { background: ${darkMode ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)'} !important; }
        .notif-del-btn:hover { color: #ef4444 !important; opacity: 1 !important; transform: scale(1.1); }
      `}</style>

      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.1rem', borderBottom: `1px solid ${borderClr}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem' }}>
          <Bell size={18} color="#6366f1" />
          <span style={{ fontWeight: 800, fontSize: '.95rem' }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', fontSize: '.68rem', fontWeight: 800, padding: '1px 7px', borderRadius: '99px' }}>
              {unreadCount}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
          {/* Settings / Customize button */}
          <button
            onClick={() => setShowSettings(s => !s)}
            title="Customize notifications"
            style={{
              background: showSettings ? 'rgba(99,102,241,.2)' : 'none',
              border: 'none',
              color: showSettings ? '#6366f1' : mutedClr,
              cursor: 'pointer',
              display: 'flex',
              padding: '.35rem',
              borderRadius: '8px',
              transition: 'all .2s'
            }}
          >
            <SlidersHorizontal size={16} />
          </button>

          {notifications.length > 0 && (
            <>
              {/* Mark all read */}
              <button
                onClick={handleMarkAllRead}
                title="Mark all as read"
                style={{ background: 'none', border: 'none', color: mutedClr, cursor: 'pointer', display: 'flex', padding: '.35rem', borderRadius: '8px', transition: 'color .2s' }}
                onMouseOver={e => e.currentTarget.style.color = '#22c55e'}
                onMouseOut={e => e.currentTarget.style.color = mutedClr}
              >
                <CheckCheck size={16} />
              </button>

              {/* Clear all */}
              <button
                onClick={handleClearAll}
                title="Clear all notifications"
                style={{ background: 'none', border: 'none', color: mutedClr, cursor: 'pointer', display: 'flex', padding: '.35rem', borderRadius: '8px', transition: 'color .2s' }}
                onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                onMouseOut={e => e.currentTarget.style.color = mutedClr}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Customization Panel (when Settings open) ── */}
      {showSettings ? (
        <div style={{ padding: '1rem', background: darkMode ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.03)', borderBottom: `1px solid ${borderClr}`, display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '.82rem', fontWeight: 800, color: textClr }}>Notification Preferences</span>
            <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: mutedClr, cursor: 'pointer', padding: 0 }}>
              <X size={15} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', fontSize: '.8rem' }}>
            {[
              { key: 'likes', label: '❤️ Article Likes', desc: 'When someone likes your story' },
              { key: 'comments', label: '💬 Comments & Replies', desc: 'When someone responds to your news' },
              { key: 'votes', label: '👍 Trust Votes & Audits', desc: 'When readers verify your community post' },
              { key: 'system', label: '📢 System & Breaking Alerts', desc: 'Broadcasts and editorial updates' }
            ].map(opt => (
              <div key={opt.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.45rem .6rem', borderRadius: '10px', background: itemBg }}>
                <div>
                  <div style={{ fontWeight: 700, color: textClr }}>{opt.label}</div>
                  <div style={{ fontSize: '.72rem', color: mutedClr }}>{opt.desc}</div>
                </div>
                <button
                  onClick={() => handleToggleSetting(opt.key)}
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '99px',
                    border: 'none',
                    background: settings[opt.key] ? '#22c55e' : (darkMode ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.15)'),
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background .2s',
                    flexShrink: 0
                  }}
                >
                  <div style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '3px',
                    left: settings[opt.key] ? '19px' : '3px',
                    transition: 'left .2s'
                  }} />
                </button>
              </div>
            ))}
          </div>

          {!permissionGranted && (
            <button
              onClick={handleRequestPermission}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                color: '#fff',
                border: 'none',
                padding: '.55rem',
                borderRadius: '10px',
                fontSize: '.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '.4rem'
              }}
            >
              <Bell size={14} /> Enable Desktop Push Alerts
            </button>
          )}
        </div>
      ) : (
        /* ── Filter Chips ── */
        <div style={{ display: 'flex', gap: '.35rem', padding: '.55rem .85rem', borderBottom: `1px solid ${borderClr}`, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { id: 'all', label: `All (${notifications.length})` },
            { id: 'unread', label: `Unread (${unreadCount})` },
            { id: 'like', label: 'Likes' },
            { id: 'comment', label: 'Comments' },
            { id: 'alert', label: 'Alerts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                flexShrink: 0,
                padding: '.3rem .65rem',
                borderRadius: '99px',
                border: 'none',
                background: filter === tab.id ? pillActiveBg : itemBg,
                color: filter === tab.id ? '#fff' : mutedClr,
                fontSize: '.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all .15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Notifications List ── */}
      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '360px', WebkitOverflowScrolling: 'touch' }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: mutedClr }}>
            <BellOff size={32} style={{ margin: '0 auto .5rem', opacity: .35, display: 'block' }} />
            <span style={{ fontSize: '.85rem', fontWeight: 600 }}>
              {filter === 'unread' ? 'No unread notifications' : filter === 'like' ? 'No like notifications yet' : filter === 'comment' ? 'No comment notifications yet' : 'All caught up!'}
            </span>
          </div>
        ) : (
          filteredNotifications.map(n => (
            <div
              key={n.id}
              className="notif-item"
              style={{
                display: 'flex',
                gap: '.75rem',
                padding: '.85rem 1rem',
                borderBottom: `1px solid ${borderClr}`,
                background: n.read ? 'transparent' : unreadBg,
                transition: 'background .15s',
                position: 'relative',
                alignItems: 'flex-start'
              }}
            >
              {/* Type Icon Badge */}
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                {getIcon(n.type)}
              </div>

              {/* Notification Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', marginBottom: '.15rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '.84rem', color: textClr, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.title}
                  </span>
                  {!n.read && <Circle size={6} fill="#6366f1" color="#6366f1" style={{ flexShrink: 0 }} />}
                </div>

                <p style={{ margin: 0, fontSize: '.78rem', color: mutedClr, lineHeight: 1.4 }}>
                  {n.body}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.35rem', fontSize: '.7rem', color: mutedClr }}>
                  <span>{timeAgo(n.createdAt)}</span>
                  {n.url && n.url !== '#' && (
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#6366f1', display: 'inline-flex', alignItems: 'center', gap: '.1rem', textDecoration: 'none', fontWeight: 600 }}
                    >
                      View <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons: Mark Read + Delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem', flexShrink: 0 }}>
                {/* Toggle Read */}
                <button
                  onClick={() => handleToggleRead(n.id)}
                  title={n.read ? 'Mark as unread' : 'Mark as read'}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: n.read ? mutedClr : '#6366f1',
                    cursor: 'pointer',
                    padding: '.3rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Circle size={10} fill={n.read ? 'none' : '#6366f1'} />
                </button>

                {/* Delete Button (Trash icon) */}
                <button
                  className="notif-del-btn"
                  onClick={(e) => handleDelete(n.id, e)}
                  title="Delete notification"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: mutedClr,
                    cursor: 'pointer',
                    padding: '.3rem',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.6,
                    transition: 'all .2s'
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Simulated notification engine in client-side (exported for backwards compatibility)
export const useNotificationEngine = (user, setNotificationsCount) => {
  const userId = getActiveUserId(user);

  useEffect(() => {
    // Sync initial count
    setNotificationsCount(getNotifications(userId).filter(n => !n.read).length);

    const handleUpdate = () => {
      setNotificationsCount(getNotifications(userId).filter(n => !n.read).length);
    };

    window.addEventListener('qn_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('qn_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [userId, setNotificationsCount]);
};
