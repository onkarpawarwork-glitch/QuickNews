import React, { useState, useEffect } from 'react';
import {
  X, User, Bookmark, MessageSquare, ThumbsUp, Settings,
  MapPin, Mail, Shield, Calendar, Trash2, ChevronRight, LogOut,
  Heart, ExternalLink, Award, FileText, Check
} from 'lucide-react';

// ─── Data helpers ─────────────────────────────────────────────────────────────
const getBookmarks = (userId) => {
  try { return JSON.parse(localStorage.getItem(`qn_bookmarks_${userId}`) || '[]'); } catch { return []; }
};

const getLikes = (userId) => {
  try { return JSON.parse(localStorage.getItem(`qn_liked_${userId}`) || '[]'); } catch { return []; }
};

const getReports = (userId) => {
  try {
    const list = JSON.parse(localStorage.getItem('quicknews_user_reports') || '[]');
    return list.filter(r => String(r.userId) === String(userId) || r.author?.includes(userId));
  } catch { return []; }
};

const getAllComments = (userId) => {
  try {
    const all = JSON.parse(localStorage.getItem('qn_comments') || '{}');
    const result = [];
    Object.entries(all).forEach(([articleId, comments]) => {
      if (Array.isArray(comments)) {
        comments.forEach(c => {
          if (String(c.userId) === String(userId)) {
            result.push({ ...c, articleId });
          }
          if (Array.isArray(c.replies)) {
            c.replies.forEach(r => {
              if (String(r.userId) === String(userId)) {
                result.push({ ...r, articleId, isReply: true });
              }
            });
          }
        });
      }
    });
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch { return []; }
};

const getAllVotes = (userId) => {
  try {
    // 1. Try rich stored votes
    const richVotes = JSON.parse(localStorage.getItem(`qn_votes_${userId}`) || '[]');
    if (richVotes.length > 0) return richVotes;

    // 2. Fallback to legacy key scan
    const votes = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${userId}_vote_`)) {
        const articleId = key.replace(`${userId}_vote_`, '');
        const voteType = localStorage.getItem(key);
        votes.push({ id: articleId, title: `Story #${articleId.substring(0, 8)}`, voteType });
      }
    }
    return votes;
  } catch { return []; }
};

const timeAgo = (d) => {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return days < 30 ? `${days}d ago` : `${Math.floor(days / 30)}mo ago`;
};

// ─────────────────────────────────────────────────────────────────────────────
export default function UserProfileModal({ isOpen, onClose, user, darkMode = true, onLogout, onViewSaved }) {
  const [tab, setTab] = useState('overview');
  const [bookmarks, setBookmarks] = useState([]);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [votes, setVotes] = useState([]);
  const [reports, setReports] = useState([]);

  const refreshData = () => {
    if (!user) return;
    setBookmarks(getBookmarks(user.id));
    setLikes(getLikes(user.id));
    setComments(getAllComments(user.id));
    setVotes(getAllVotes(user.id));
    setReports(getReports(user.id));
  };

  useEffect(() => {
    if (!isOpen || !user) return;
    refreshData();

    const handleUpdate = () => refreshData();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('qn_user_activity_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('qn_user_activity_updated', handleUpdate);
    };
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const bg = darkMode ? '#0e0e0e' : '#ffffff';
  const textClr = darkMode ? '#f8fafc' : '#0f172a';
  const mutedClr = darkMode ? '#71717a' : '#94a3b8';
  const cardBg = darkMode ? '#1a1a1a' : '#f8fafc';
  const borderClr = darkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
  const sidebarBg = darkMode ? '#080808' : '#f1f5f9';

  const avatarHue = (user.name || 'U').charCodeAt(0) * 7 % 360;

  // ── Action Handlers ────────────────────────────────────────────────────────
  const notifyActivityChange = () => {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('qn_user_activity_updated'));
  };

  // Bookmarks
  const clearBookmarks = () => {
    localStorage.removeItem(`qn_bookmarks_${user.id}`);
    setBookmarks([]);
    notifyActivityChange();
  };

  const removeBookmark = (id) => {
    const next = bookmarks.filter(b => b.id !== id);
    localStorage.setItem(`qn_bookmarks_${user.id}`, JSON.stringify(next));
    setBookmarks(next);
    notifyActivityChange();
  };

  // Likes
  const clearLikes = () => {
    try {
      const all = JSON.parse(localStorage.getItem('qn_likes') || '{}');
      likes.forEach(l => {
        delete all[`${user.id}_${l.id}`];
      });
      localStorage.setItem('qn_likes', JSON.stringify(all));
    } catch {}
    localStorage.removeItem(`qn_liked_${user.id}`);
    setLikes([]);
    notifyActivityChange();
  };

  const removeLike = (articleId) => {
    const next = likes.filter(l => l.id !== articleId);
    localStorage.setItem(`qn_liked_${user.id}`, JSON.stringify(next));
    try {
      const all = JSON.parse(localStorage.getItem('qn_likes') || '{}');
      delete all[`${user.id}_${articleId}`];
      localStorage.setItem('qn_likes', JSON.stringify(all));
    } catch {}
    setLikes(next);
    notifyActivityChange();
  };

  // Comments
  const deleteComment = (articleId, commentId) => {
    try {
      const all = JSON.parse(localStorage.getItem('qn_comments') || '{}');
      if (all[articleId]) {
        all[articleId] = all[articleId]
          .filter(c => String(c.id) !== String(commentId))
          .map(c => {
            if (c.replies) {
              return { ...c, replies: c.replies.filter(r => String(r.id) !== String(commentId)) };
            }
            return c;
          });
        localStorage.setItem('qn_comments', JSON.stringify(all));
      }
      setComments(prev => prev.filter(c => String(c.id) !== String(commentId)));
      notifyActivityChange();
    } catch (e) {
      console.error(e);
    }
  };

  // Votes
  const removeVote = (articleId) => {
    const next = votes.filter(v => v.id !== articleId);
    localStorage.setItem(`qn_votes_${user.id}`, JSON.stringify(next));
    try {
      localStorage.removeItem(`${user.id}_vote_${articleId}`);
    } catch {}
    setVotes(next);
    notifyActivityChange();
  };

  const clearVotes = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${user.id}_vote_`)) {
          localStorage.removeItem(key);
        }
      }
    } catch {}
    localStorage.removeItem(`qn_votes_${user.id}`);
    setVotes([]);
    notifyActivityChange();
  };

  // ── Tab Content ────────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (tab) {

      // ── Overview ────────────────────────────────────────────────────────────
      case 'overview':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Profile card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.4rem', background: cardBg, borderRadius: '18px', border: `1px solid ${borderClr}` }}>
              <div style={{
                width: '70px', height: '70px', borderRadius: '50%',
                background: `linear-gradient(135deg, hsl(${avatarHue},60%,45%), hsl(${avatarHue + 40},55%,55%))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1.8rem', fontWeight: 800, flexShrink: 0,
                boxShadow: `0 8px 20px hsla(${avatarHue},60%,45%,.3)`
              }}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: textClr, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.82rem', color: mutedClr, marginTop: '.2rem' }}>
                  <Mail size={13} /> {user.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: '99px',
                    background: user.role === 'ADMIN' ? 'rgba(239,68,68,.15)' : 'rgba(56,189,248,.15)',
                    color: user.role === 'ADMIN' ? '#ef4444' : '#38bdf8',
                    display: 'flex', alignItems: 'center', gap: '.3rem'
                  }}>
                    <Shield size={11} /> {user.role}
                  </span>
                  {user.location && (
                    <span style={{ fontSize: '.75rem', color: mutedClr, display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                      <MapPin size={12} /> {user.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="profile-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.6rem' }}>
              {[
                { label: 'Saved', value: bookmarks.length, color: '#fbbf24', icon: <Bookmark size={15} />, tab: 'saved' },
                { label: 'Liked', value: likes.length, color: '#ef4444', icon: <Heart size={15} fill="#ef4444" />, tab: 'likes' },
                { label: 'Comments', value: comments.length, color: '#38bdf8', icon: <MessageSquare size={15} />, tab: 'comments' },
                { label: 'Votes', value: votes.length, color: '#a855f7', icon: <ThumbsUp size={15} />, tab: 'votes' },
              ].map(s => (
                <div
                  key={s.label}
                  onClick={() => setTab(s.tab)}
                  style={{
                    background: cardBg,
                    padding: '.9rem .6rem',
                    borderRadius: '14px',
                    border: `1px solid ${borderClr}`,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'transform .15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ color: s.color, marginBottom: '.25rem', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: textClr }}>{s.value}</div>
                  <div style={{ fontSize: '.72rem', color: mutedClr, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Recent activity preview */}
            <div>
              <h4 style={{ fontSize: '.88rem', fontWeight: 700, color: mutedClr, marginBottom: '.6rem' }}>Recent Interactions</h4>
              {comments.length === 0 && likes.length === 0 && votes.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', background: cardBg, borderRadius: '12px', border: `1px solid ${borderClr}`, color: mutedClr, fontSize: '.82rem' }}>
                  No interactions recorded yet. Read stories, leave comments, and vote on validity to build your standing!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  {likes.slice(0, 2).map(l => (
                    <div key={l.id} style={{ display: 'flex', gap: '.6rem', padding: '.65rem', borderRadius: '10px', background: cardBg, border: `1px solid ${borderClr}`, alignItems: 'center' }}>
                      <Heart size={14} color="#ef4444" fill="#ef4444" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '.82rem', color: textClr, fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Liked "{l.title}"
                        </span>
                        <span style={{ fontSize: '.7rem', color: mutedClr }}>{timeAgo(l.likedAt)}</span>
                      </div>
                    </div>
                  ))}

                  {comments.slice(0, 2).map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: '.6rem', padding: '.65rem', borderRadius: '10px', background: cardBg, border: `1px solid ${borderClr}`, alignItems: 'center' }}>
                      <MessageSquare size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '.82rem', color: textClr, fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Commented: "{c.text}"
                        </span>
                        <span style={{ fontSize: '.7rem', color: mutedClr }}>{timeAgo(c.createdAt)}</span>
                      </div>
                    </div>
                  ))}

                  {votes.slice(0, 2).map((v, i) => (
                    <div key={i} style={{ display: 'flex', gap: '.6rem', padding: '.65rem', borderRadius: '10px', background: cardBg, border: `1px solid ${borderClr}`, alignItems: 'center' }}>
                      <ThumbsUp size={14} color={v.voteType === 'TRUST' ? '#22c55e' : '#ef4444'} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '.82rem', color: textClr, fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Voted {v.voteType === 'TRUST' ? 'Trusted' : 'Disputed'} on "{v.title || 'Community story'}"
                        </span>
                        <span style={{ fontSize: '.7rem', color: mutedClr }}>{timeAgo(v.votedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      // ── Saved Articles ──────────────────────────────────────────────────────
      case 'saved':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '.88rem', color: mutedClr }}>{bookmarks.length} saved article{bookmarks.length !== 1 ? 's' : ''}</span>
              {bookmarks.length > 0 && (
                <button onClick={clearBookmarks} style={{ background: 'none', border: '1px solid rgba(239,68,68,.3)', color: '#ef4444', padding: '.3rem .7rem', borderRadius: '8px', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                  <Trash2 size={12} /> Clear All
                </button>
              )}
            </div>

            {bookmarks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: mutedClr }}>
                <Bookmark size={40} style={{ margin: '0 auto .75rem', display: 'block', opacity: .3 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No saved articles yet</p>
                <p style={{ margin: '.25rem 0 0', fontSize: '.82rem' }}>Tap the 🔖 bookmark icon on any news card to save stories here.</p>
              </div>
            ) : (
              bookmarks.map(b => (
                <div key={b.id} style={{ display: 'flex', gap: '.85rem', padding: '.85rem', borderRadius: '14px', background: cardBg, border: `1px solid ${borderClr}`, marginBottom: '.6rem', alignItems: 'center' }}>
                  {b.image && (
                    <img src={b.image} alt="" style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.7rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.15rem' }}>{b.category || 'general'}</div>
                    {b.url ? (
                      <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ margin: 0, fontSize: '.88rem', fontWeight: 700, color: textClr, textDecoration: 'none', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.title}</a>
                    ) : (
                      <p style={{ margin: 0, fontSize: '.88rem', fontWeight: 700, color: textClr, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{b.title}</p>
                    )}
                    <div style={{ fontSize: '.72rem', color: mutedClr, marginTop: '.2rem' }}>
                      {b.source?.name || 'QuickNews'} · Saved {timeAgo(b.savedAt)}
                    </div>
                  </div>
                  <button onClick={() => removeBookmark(b.id)} title="Remove bookmark" style={{ background: 'none', border: 'none', color: mutedClr, cursor: 'pointer', padding: '.4rem', flexShrink: 0 }}>
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        );

      // ── Liked Articles ──────────────────────────────────────────────────────
      case 'likes':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '.88rem', color: mutedClr }}>{likes.length} liked article{likes.length !== 1 ? 's' : ''}</span>
              {likes.length > 0 && (
                <button onClick={clearLikes} style={{ background: 'none', border: '1px solid rgba(239,68,68,.3)', color: '#ef4444', padding: '.3rem .7rem', borderRadius: '8px', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                  <Trash2 size={12} /> Clear All
                </button>
              )}
            </div>

            {likes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: mutedClr }}>
                <Heart size={40} style={{ margin: '0 auto .75rem', display: 'block', opacity: .3 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No liked articles yet</p>
                <p style={{ margin: '.25rem 0 0', fontSize: '.82rem' }}>Tap the ❤️ heart button on any news story to like it.</p>
              </div>
            ) : (
              likes.map(l => (
                <div key={l.id} style={{ display: 'flex', gap: '.85rem', padding: '.85rem', borderRadius: '14px', background: cardBg, border: `1px solid ${borderClr}`, marginBottom: '.6rem', alignItems: 'center' }}>
                  {l.image && (
                    <img src={l.image} alt="" style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.7rem', color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', marginBottom: '.15rem' }}>{l.category || 'news'}</div>
                    {l.url ? (
                      <a href={l.url} target="_blank" rel="noopener noreferrer" style={{ margin: 0, fontSize: '.88rem', fontWeight: 700, color: textClr, textDecoration: 'none', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.title}</a>
                    ) : (
                      <p style={{ margin: 0, fontSize: '.88rem', fontWeight: 700, color: textClr, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.title}</p>
                    )}
                    <div style={{ fontSize: '.72rem', color: mutedClr, marginTop: '.2rem' }}>
                      Liked {timeAgo(l.likedAt)}
                    </div>
                  </div>
                  <button onClick={() => removeLike(l.id)} title="Unlike article" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '.4rem', flexShrink: 0 }}>
                    <Heart size={16} fill="#ef4444" />
                  </button>
                </div>
              ))
            )}
          </div>
        );

      // ── Comments History ────────────────────────────────────────────────────
      case 'comments':
        return (
          <div>
            <span style={{ fontSize: '.88rem', color: mutedClr, display: 'block', marginBottom: '1rem' }}>{comments.length} comment{comments.length !== 1 ? 's' : ''} written</span>
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: mutedClr }}>
                <MessageSquare size={40} style={{ margin: '0 auto .75rem', display: 'block', opacity: .3 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No comments yet</p>
                <p style={{ margin: '.25rem 0 0', fontSize: '.82rem' }}>Join the conversation by commenting on stories in the feed.</p>
              </div>
            ) : (
              comments.map(c => (
                <div key={c.id} style={{ padding: '.9rem', borderRadius: '14px', background: cardBg, border: `1px solid ${borderClr}`, marginBottom: '.6rem' }}>
                  {c.articleTitle && (
                    <div style={{ fontSize: '.74rem', color: '#38bdf8', fontWeight: 700, marginBottom: '.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📰 On "{c.articleTitle}"
                    </div>
                  )}
                  <p style={{ margin: '0 0 .5rem', fontSize: '.9rem', color: textClr, lineHeight: 1.4 }}>"{c.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '.72rem', color: mutedClr }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><Calendar size={11} /> {timeAgo(c.createdAt)}</span>
                      {c.likes && c.likes.length > 0 && (
                        <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                          <Heart size={11} fill="#ef4444" /> {c.likes.length}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteComment(c.articleId, c.id)}
                      title="Delete comment"
                      style={{ background: 'none', border: 'none', color: mutedClr, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.2rem', fontSize: '.72rem', transition: 'color .2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={e => e.currentTarget.style.color = mutedClr}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      // ── Votes History ───────────────────────────────────────────────────────
      case 'votes':
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '.88rem', color: mutedClr }}>{votes.length} vote{votes.length !== 1 ? 's' : ''} cast</span>
              {votes.length > 0 && (
                <button onClick={clearVotes} style={{ background: 'none', border: '1px solid rgba(239,68,68,.3)', color: '#ef4444', padding: '.3rem .7rem', borderRadius: '8px', fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                  <Trash2 size={12} /> Clear All
                </button>
              )}
            </div>

            {votes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: mutedClr }}>
                <ThumbsUp size={40} style={{ margin: '0 auto .75rem', display: 'block', opacity: .3 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>No votes cast yet</p>
                <p style={{ margin: '.25rem 0 0', fontSize: '.82rem' }}>Vote Trusted or Disputed on community news to audit source reliability.</p>
              </div>
            ) : (
              votes.map((v, i) => (
                <div key={v.id || i} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem .85rem', borderRadius: '12px', background: cardBg, border: `1px solid ${borderClr}`, marginBottom: '.5rem' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    background: v.voteType === 'TRUST' ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)',
                    color: v.voteType === 'TRUST' ? '#22c55e' : '#ef4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <ThumbsUp size={15} style={{ transform: v.voteType === 'NOT_TRUST' ? 'rotate(180deg)' : 'none' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      <span style={{ fontSize: '.82rem', fontWeight: 700, color: v.voteType === 'TRUST' ? '#22c55e' : '#ef4444' }}>
                        {v.voteType === 'TRUST' ? '✓ Trusted' : '⚠️ Disputed'}
                      </span>
                      {v.votedAt && <span style={{ fontSize: '.7rem', color: mutedClr }}>· {timeAgo(v.votedAt)}</span>}
                    </div>
                    <p style={{ margin: '.15rem 0 0', fontSize: '.82rem', color: textClr, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.title || `Story #${(v.id || '').replace('db-', '')}`}
                    </p>
                  </div>
                  <button
                    onClick={() => removeVote(v.id)}
                    title="Remove vote"
                    style={{ background: 'none', border: 'none', color: mutedClr, cursor: 'pointer', padding: '.4rem', flexShrink: 0, transition: 'color .2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = mutedClr}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        );

      // ── Settings ────────────────────────────────────────────────────────────
      case 'settings':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Name', value: user.name, icon: <User size={16} /> },
              { label: 'Email', value: user.email, icon: <Mail size={16} /> },
              { label: 'Location', value: user.location || 'Not set', icon: <MapPin size={16} /> },
              { label: 'Role', value: user.role, icon: <Shield size={16} /> },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.1rem', background: cardBg, borderRadius: '14px', border: `1px solid ${borderClr}` }}>
                <div style={{ color: '#6366f1', flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.75rem', color: mutedClr, fontWeight: 600, marginBottom: '.1rem' }}>{item.label}</div>
                  <div style={{ fontSize: '.92rem', fontWeight: 700, color: textClr }}>{item.value}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: '.5rem', padding: '1rem 1.1rem', borderRadius: '14px', border: '1px solid rgba(239,68,68,.25)', background: darkMode ? 'rgba(239,68,68,.05)' : 'rgba(239,68,68,.03)' }}>
              <h4 style={{ margin: '0 0 .6rem', color: '#ef4444', fontWeight: 700, fontSize: '.9rem' }}>Account Controls</h4>
              <button
                onClick={() => { onLogout(); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.4rem',
                  background: 'transparent', border: '1px solid #ef4444', color: '#ef4444',
                  padding: '.55rem 1rem', borderRadius: '10px', cursor: 'pointer',
                  fontWeight: 600, fontSize: '.85rem'
                }}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)', zIndex: 2000 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 'min(820px, 96vw)', maxHeight: '92vh',
        background: bg, color: textClr, borderRadius: '20px',
        border: `1px solid ${borderClr}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 2001,
        boxShadow: '0 32px 80px rgba(0,0,0,.5)',
        animation: 'profilePopIn .22s cubic-bezier(0.34,1.56,0.64,1)'
      }}>
        <style>{`
          @keyframes profilePopIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.92); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
          .profile-inner { flex-direction: column; }
          .profile-sidebar { width: 100%; border-right: none; border-bottom: 1px solid ${borderClr}; padding: 0.75rem 1rem; flex-direction: row; align-items: center; gap: 0; }
          .profile-sidebar-avatar { display: none; }
          .profile-sidebar nav { flex-direction: row; overflow-x: auto; scrollbar-width: none; gap: 0.25rem; flex: 1; }
          .profile-sidebar nav::-webkit-scrollbar { display: none; }
          .profile-sidebar-footer { display: none; }
          .profile-tab-btn { padding: 0.45rem 0.75rem !important; font-size: 0.78rem !important; width: auto !important; white-space: nowrap; }
          .profile-stats-grid { grid-template-columns: repeat(4, 1fr) !important; }
          @media (max-width: 520px) {
            .profile-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (min-width: 640px) {
            .profile-inner { flex-direction: row !important; }
            .profile-sidebar { width: 200px; border-right: 1px solid ${borderClr}; border-bottom: none; padding: 1.25rem; flex-direction: column; }
            .profile-sidebar-avatar { display: flex !important; }
            .profile-sidebar nav { flex-direction: column; overflow-x: visible; }
            .profile-sidebar-footer { display: block !important; }
            .profile-tab-btn { padding: 0.7rem 1rem !important; font-size: 0.88rem !important; width: 100% !important; }
          }
        `}</style>

        {/* Inner wrapper */}
        <div className="profile-inner" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Sidebar / Horizontal tab strip on mobile */}
          <div className="profile-sidebar" style={{ background: sidebarBg, display: 'flex', flexShrink: 0 }}>
            {/* Mini avatar (desktop sidebar) */}
            <div className="profile-sidebar-avatar" style={{ alignItems: 'center', gap: '.6rem', marginBottom: '1.25rem', display: 'flex' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: `linear-gradient(135deg, hsl(${avatarHue},60%,45%), hsl(${avatarHue + 40},55%,55%))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '.95rem', fontWeight: 800, flexShrink: 0
              }}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '.88rem', fontWeight: 700, color: textClr, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: '.7rem', color: mutedClr }}>{user.role}</div>
              </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '.25rem', flex: 1 }}>
              {[
                { id: 'overview', icon: <User size={16} />, label: 'Overview' },
                { id: 'saved', icon: <Bookmark size={16} />, label: 'Saved', count: bookmarks.length },
                { id: 'likes', icon: <Heart size={16} />, label: 'Liked', count: likes.length },
                { id: 'comments', icon: <MessageSquare size={16} />, label: 'Comments', count: comments.length },
                { id: 'votes', icon: <ThumbsUp size={16} />, label: 'Votes', count: votes.length },
                { id: 'settings', icon: <Settings size={16} />, label: 'Settings' },
              ].map(({ id, icon, label, count }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="profile-tab-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '.5rem',
                    padding: '.7rem 1rem', borderRadius: '10px', border: 'none',
                    background: tab === id ? (darkMode ? 'rgba(99,102,241,.15)' : 'rgba(99,102,241,.1)') : 'transparent',
                    color: tab === id ? '#6366f1' : (darkMode ? '#a1a1aa' : '#64748b'),
                    cursor: 'pointer', fontWeight: 600, fontSize: '.88rem',
                    transition: 'all .2s', width: '100%', textAlign: 'left', whiteSpace: 'nowrap',
                    flexShrink: 0, minHeight: '40px',
                  }}
                >
                  {icon}
                  <span>{label}</span>
                  {(count || 0) > 0 && (
                    <span style={{
                      marginLeft: 'auto', fontSize: '.7rem', fontWeight: 700,
                      background: tab === id ? '#6366f1' : (darkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'),
                      color: tab === id ? '#fff' : (darkMode ? '#71717a' : '#94a3b8'),
                      padding: '1px 6px', borderRadius: '99px'
                    }}>{count}</span>
                  )}
                </button>
              ))}
            </nav>

            <div className="profile-sidebar-footer" style={{ fontSize: '.7rem', color: darkMode ? '#444' : '#cbd5e1', marginTop: 'auto', paddingTop: '.75rem', borderTop: `1px solid ${borderClr}` }}>
              Member since {new Date(user.id || Date.now()).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', borderBottom: `1px solid ${borderClr}`, flexShrink: 0 }}>
              <h2 style={{ margin: 0, fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: 800, textTransform: 'capitalize' }}>
                {tab === 'overview' ? '👤 My Profile' : tab === 'saved' ? '🔖 Saved Articles' : tab === 'likes' ? '❤️ Liked Stories' : tab === 'comments' ? '💬 My Comments' : tab === 'votes' ? '🗳️ My Votes' : '⚙️ Account Settings'}
              </h2>
              <button onClick={onClose} style={{ background: darkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)', border: 'none', borderRadius: '50%', padding: '.45rem', color: textClr, cursor: 'pointer', display: 'flex', minWidth: '34px', minHeight: '34px', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', WebkitOverflowScrolling: 'touch' }}>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
