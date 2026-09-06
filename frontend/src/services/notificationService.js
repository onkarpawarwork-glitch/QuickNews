// ─────────────────────────────────────────────────────────────────────────────
// QuickNews — Centralized Notification Service & Real-Time Dispatcher
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  likes: true,
  comments: true,
  votes: true,
  system: true,
};

const INITIAL_NOTIFICATIONS = [
  {
    id: 'init-1',
    title: 'Welcome to QuickNews! 🚀',
    body: 'Stay updated with live community and verified world news. Never miss an update.',
    type: 'system',
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'init-2',
    title: '🛡️ Trust Verification Active',
    body: 'Community fact-checking is live! Upvote trusted stories to boost local journalists.',
    type: 'verify',
    read: false,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  }
];

// Helper to get active user ID or fallback
export const getActiveUserId = (user) => {
  return user?.id || user?.email || 'guest';
};

// ── Notification Storage Helpers ─────────────────────────────────────────────
export const getNotifications = (userId = 'guest') => {
  try {
    const key = `qn_notifications_${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading notifications', e);
    return [];
  }
};

export const getUnreadCount = (userId = 'guest') => {
  const list = getNotifications(userId);
  return list.filter(n => !n.read).length;
};

export const getNotificationSettings = (userId = 'guest') => {
  try {
    const raw = localStorage.getItem(`qn_notif_settings_${userId}`);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
};

export const saveNotificationSettings = (userId = 'guest', settings) => {
  try {
    localStorage.setItem(`qn_notif_settings_${userId}`, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('qn_notifications_updated', { detail: { userId } }));
  } catch (e) {
    console.warn('Error saving notification settings', e);
  }
};

// ── Event Dispatcher ──────────────────────────────────────────────────────────
const notifyChange = (userId) => {
  window.dispatchEvent(new CustomEvent('qn_notifications_updated', { detail: { userId } }));
  window.dispatchEvent(new Event('storage'));
};

// ── Native Browser Push ───────────────────────────────────────────────────────
export const sendBrowserPush = (title, body, url = '#') => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: '/logo192.png',
    });
    n.onclick = () => {
      window.focus();
      if (url && url !== '#') window.open(url, '_blank');
    };
  } catch (e) {
    console.error('Browser push notification failed', e);
  }
};

// ── Add Notification ──────────────────────────────────────────────────────────
export const addNotification = ({
  userId = 'guest',
  title,
  body,
  type = 'system', // 'like' | 'comment' | 'vote' | 'verify' | 'admin' | 'system'
  url = '#',
  metadata = {}
}) => {
  try {
    const settings = getNotificationSettings(userId);
    // Respect user custom preferences
    if (type === 'like' && settings.likes === false) return;
    if (type === 'comment' && settings.comments === false) return;
    if ((type === 'vote' || type === 'verify') && settings.votes === false) return;
    if ((type === 'system' || type === 'admin') && settings.system === false) return;

    const list = getNotifications(userId);

    const newNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      body,
      type,
      url,
      metadata,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const next = [newNotification, ...list].slice(0, 40); // Keep max 40 items
    localStorage.setItem(`qn_notifications_${userId}`, JSON.stringify(next));

    notifyChange(userId);
    sendBrowserPush(title, body, url);

    return newNotification;
  } catch (e) {
    console.error('Error adding notification', e);
  }
};

// ── Delete Single Notification ────────────────────────────────────────────────
export const deleteNotification = (userId = 'guest', notifId) => {
  try {
    const list = getNotifications(userId);
    const next = list.filter(n => n.id !== notifId);
    localStorage.setItem(`qn_notifications_${userId}`, JSON.stringify(next));
    notifyChange(userId);
    return next;
  } catch (e) {
    console.error('Error deleting notification', e);
  }
};

// ── Toggle / Mark Read ────────────────────────────────────────────────────────
export const toggleRead = (userId = 'guest', notifId) => {
  try {
    const list = getNotifications(userId);
    const next = list.map(n => n.id === notifId ? { ...n, read: !n.read } : n);
    localStorage.setItem(`qn_notifications_${userId}`, JSON.stringify(next));
    notifyChange(userId);
    return next;
  } catch (e) {
    console.error('Error toggling read status', e);
  }
};

export const markAllAsRead = (userId = 'guest') => {
  try {
    const list = getNotifications(userId);
    const next = list.map(n => ({ ...n, read: true }));
    localStorage.setItem(`qn_notifications_${userId}`, JSON.stringify(next));
    notifyChange(userId);
    return next;
  } catch (e) {
    console.error('Error marking all as read', e);
  }
};

export const clearAllNotifications = (userId = 'guest') => {
  try {
    localStorage.setItem(`qn_notifications_${userId}`, JSON.stringify([]));
    notifyChange(userId);
    return [];
  } catch (e) {
    console.error('Error clearing notifications', e);
  }
};

// ── Domain Events: Likes, Comments, Trust Votes ──────────────────────────────

/**
 * Triggered when a user likes an article.
 * Generates notification for the article author (or current user for demo).
 */
export const notifyArticleLiked = ({ article, user }) => {
  const likerName = user?.name || 'A reader';
  const articleTitle = article?.title || 'your article';
  const shortTitle = articleTitle.length > 40 ? `${articleTitle.substring(0, 37)}...` : articleTitle;

  const authorId = article?.userId || article?.authorId;

  if (authorId && String(authorId) !== String(user?.id)) {
    // Notify the actual author
    addNotification({
      userId: authorId,
      title: `❤️ New Like on your article`,
      body: `${likerName} liked "${shortTitle}"`,
      type: 'like',
      url: article?.url || '#'
    });
  } else {
    // Liking own article or single-user demo mode
    addNotification({
      userId: getActiveUserId(user),
      title: `❤️ New Like on your article`,
      body: `${likerName} liked "${shortTitle}"`,
      type: 'like',
      url: article?.url || '#'
    });
  }
};

/**
 * Triggered when someone comments on an article or replies to a comment.
 */
export const notifyArticleCommented = ({ article, user, text, replyTo }) => {
  const commenterName = user?.name || 'A reader';
  const snippet = text.length > 45 ? `${text.substring(0, 42)}...` : text;
  const articleTitle = article?.title || 'your article';
  const shortTitle = articleTitle.length > 35 ? `${articleTitle.substring(0, 32)}...` : articleTitle;
  const authorId = article?.userId || article?.authorId;

  if (replyTo && replyTo.userId) {
    // Notify the user who was replied to
    addNotification({
      userId: replyTo.userId,
      title: `💬 Reply from @${commenterName}`,
      body: `"${snippet}" on "${shortTitle}"`,
      type: 'comment',
      url: article?.url || '#'
    });
    // If author is someone else, also notify author
    if (authorId && String(authorId) !== String(replyTo.userId) && String(authorId) !== String(user?.id)) {
      addNotification({
        userId: authorId,
        title: `💬 New Reply on your article`,
        body: `@${commenterName}: "${snippet}" on "${shortTitle}"`,
        type: 'comment',
        url: article?.url || '#'
      });
    }
  } else {
    // Notify article author (or active user in single-user demo)
    const targetId = (authorId && String(authorId) !== String(user?.id)) ? authorId : getActiveUserId(user);
    addNotification({
      userId: targetId,
      title: `💬 New Comment on your article`,
      body: `@${commenterName}: "${snippet}" on "${shortTitle}"`,
      type: 'comment',
      url: article?.url || '#'
    });
  }
};

/**
 * Triggered when a user casts a Trust / Dispute vote on an article.
 */
export const notifyArticleVoted = ({ article, user, voteType }) => {
  const voterName = user?.name || 'A community member';
  const isTrust = voteType === 'TRUST';
  const articleTitle = article?.title || 'your story';
  const shortTitle = articleTitle.length > 35 ? `${articleTitle.substring(0, 32)}...` : articleTitle;
  const authorId = article?.userId || article?.authorId;
  const targetId = (authorId && String(authorId) !== String(user?.id)) ? authorId : getActiveUserId(user);

  addNotification({
    userId: targetId,
    title: isTrust ? `👍 Trust Vote Received` : `⚠️ Dispute Vote Received`,
    body: `${voterName} voted ${isTrust ? 'Trusted' : 'Disputed'} on "${shortTitle}"`,
    type: 'vote',
    url: article?.url || '#'
  });
};

/**
 * Schedule automated realistic community interactions when a user posts news.
 */
export const simulateCommunityEngagement = (article, authorUser) => {
  if (!article || !article.title) return;
  const targetId = getActiveUserId(authorUser);
  const articleId = article.id || article._id;
  const titleSnippet = article.title.length > 35 ? `${article.title.substring(0, 32)}...` : article.title;

  const simulatedMembers = [
    { name: 'Ananya Sen (Citizen Expert)', comment: 'Great local reporting on this! Verified with ground sources.' },
    { name: 'Vikram Malhotra (Rural Journalist)', comment: 'Important update. Appreciate bringing this to light.' },
    { name: 'Sneha Patil (Local Eye)', comment: 'Confirmed this occurred in our neighboring ward.' }
  ];

  // 1. First like after 4 seconds
  setTimeout(() => {
    const member = simulatedMembers[0];
    addNotification({
      userId: targetId,
      title: `❤️ New Like on your article`,
      body: `${member.name} liked "${titleSnippet}"`,
      type: 'like',
      url: article?.url || '#'
    });
  }, 4000);

  // 2. First comment after 10 seconds (and insert into comments store)
  setTimeout(() => {
    const member = simulatedMembers[1];
    if (articleId) {
      try {
        const allComments = JSON.parse(localStorage.getItem('qn_comments') || '{}');
        const existing = allComments[articleId] || [];
        const simComment = {
          id: Date.now(),
          name: member.name,
          userId: 'sim-journalist-1',
          text: member.comment,
          createdAt: new Date().toISOString(),
          articleTitle: article.title,
          articleUrl: article.url,
          articleCategory: article.category || 'community',
          pinned: false,
          likes: ['sim-user-2'],
          replies: []
        };
        allComments[articleId] = [simComment, ...existing];
        localStorage.setItem('qn_comments', JSON.stringify(allComments));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('qn_user_activity_updated'));
      } catch {}
    }

    addNotification({
      userId: targetId,
      title: `💬 New Comment on your article`,
      body: `${member.name}: "${member.comment}" on "${titleSnippet}"`,
      type: 'comment',
      url: article?.url || '#'
    });
  }, 10000);

  // 3. Trust validation milestone after 18 seconds
  setTimeout(() => {
    addNotification({
      userId: targetId,
      title: `🏆 3-Layer Verification Milestone`,
      body: `"${titleSnippet}" reached 96% Community Trust Score!`,
      type: 'verify',
      url: article?.url || '#'
    });
  }, 18000);
};
