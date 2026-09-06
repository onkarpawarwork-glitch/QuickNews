import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Cpu, Heart, MessageSquare, Share2,
  ThumbsUp, ThumbsDown, Send, X, LogIn, Lock, Bookmark, Volume2, VolumeX,
  HelpCircle, ShieldAlert, AlertTriangle, Pin, CornerDownRight
} from 'lucide-react';
import axios from 'axios';
import { t } from '../utils/i18n';
import ThreeLayerVerificationModal from './ThreeLayerVerificationModal';
import { notifyArticleLiked, notifyArticleCommented, notifyArticleVoted, addNotification } from '../services/notificationService';

// ─── Fallback images ──────────────────────────────────────────────────────────
const FALLBACK_IMAGES = {
  technology:    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  business:      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
  sports:        'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
  entertainment: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  science:       'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=800&q=80',
  health:        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
  general:       'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
};

const getPicsumUrl = (title) => {
  const seed = (title || 'news').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `https://picsum.photos/seed/${seed}/800/450`;
};

// ─── Image cache ──────────────────────────────────────────────────────────────
const getImgCache = () => { try { return JSON.parse(sessionStorage.getItem('qn_img') || '{}'); } catch { return {}; } };
const saveImgCache = (k, v) => { try { const c = getImgCache(); c[k] = v; sessionStorage.setItem('qn_img', JSON.stringify(c)); } catch {} };

const STOPWORDS = new Set(['the','a','an','in','on','at','to','for','of','and','or','is','are','was','were','will','be','been','have','has','had','do','does','did','but','if','than','that','this','with','by','from','as','up','out','not','no','its','it','after','over','amid','how','who','what','when','where','why','about','into','during','before','new','says','say','set','get','hit','big','old','top','due','may','can','could','would','should','just','also','more','most','some','such','only','first','last','all','both','each','few','own','same','so','too','very','now','here','there']);
const extractKeyword = (title) => {
  if (!title) return null;
  const proper = (title.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g)||[]).filter(p=>p.length>2&&!STOPWORDS.has(p.toLowerCase())).sort((a,b)=>b.length-a.length);
  if (proper.length) return proper[0];
  return title.toLowerCase().replace(/[^a-z\s]/g,'').split(/\s+/).filter(w=>w.length>4&&!STOPWORDS.has(w))[0]||null;
};

const resolveSmartImage = async (articleUrl, title) => {
  const key = (articleUrl && articleUrl !== '#') ? articleUrl : title;
  const cached = getImgCache()[key]; if (cached) return cached;
  if (articleUrl && articleUrl !== '#') {
    try {
      const r = await axios.get(`https://api.microlink.io/?url=${encodeURIComponent(articleUrl)}`, { timeout: 5000 });
      const img = r.data?.data?.image?.url;
      if (img && img.startsWith('http') && !img.includes('logo')) { saveImgCache(key, img); return img; }
    } catch {}
  }
  try {
    const kw = extractKeyword(title);
    if (kw) {
      const r = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(kw)}`, { timeout: 3000 });
      const thumb = r.data?.thumbnail?.source;
      if (thumb && (r.data?.thumbnail?.width||0) >= 200) { const big = thumb.replace(/\/\d+px-/,'/800px-'); saveImgCache(key, big); return big; }
    }
  } catch {}
  const pu = getPicsumUrl(title); saveImgCache(key, pu); return pu;
};

// ─── Local comment storage ────────────────────────────────────────────────────
const loadComments   = (id) => { try { return JSON.parse(localStorage.getItem('qn_comments')||'{}')[id]||[]; } catch { return []; } };
const persistComment = (id, c) => { try { const all=JSON.parse(localStorage.getItem('qn_comments')||'{}'); all[id]=[c,...(all[id]||[])]; localStorage.setItem('qn_comments',JSON.stringify(all)); } catch {} };

const loadLikes   = ()   => { try { return JSON.parse(localStorage.getItem('qn_likes')||'{}'); } catch { return {}; } };
const toggleLikeStorage = (id, liked) => { try { const all=loadLikes(); liked ? (all[id]=true) : delete all[id]; localStorage.setItem('qn_likes',JSON.stringify(all)); } catch {} };

// ─── Bookmark storage helpers ─────────────────────────────────────────────────
const getBookmarks = (userId) => {
  try { return JSON.parse(localStorage.getItem(`qn_bookmarks_${userId}`) || '[]'); } catch { return []; }
};
const isBookmarked = (userId, articleId) => getBookmarks(userId).some(b => b.id === articleId);
const toggleBookmark = (userId, articleId, article) => {
  const saved = getBookmarks(userId);
  const exists = saved.some(b => b.id === articleId);
  if (exists) {
    const next = saved.filter(b => b.id !== articleId);
    localStorage.setItem(`qn_bookmarks_${userId}`, JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('qn_user_activity_updated'));
    return false;
  } else {
    const slim = {
      id: articleId,
      title: article.title,
      description: article.description,
      image: article.image || article.imageUrl,
      url: article.url,
      source: article.source,
      category: article.category,
      publishedAt: article.publishedAt || article.createdAt,
      isCommunity: article.isCommunity,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(`qn_bookmarks_${userId}`, JSON.stringify([slim, ...saved]));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('qn_user_activity_updated'));
    return true;
  }
};

const timeAgo = (d) => {
  if (!d) return ''; const m=Math.floor((Date.now()-new Date(d))/60000);
  if(m<1) return 'just now'; if(m<60) return `${m}m ago`;
  const h=Math.floor(m/60); return h<24?`${h}h ago`:`${Math.floor(h/24)}d ago`;
};

// ─── Auth Gate Prompt ─────────────────────────────────────────────────────────
function AuthGatePrompt({ action, onLogin, onClose, selectedLang = 'en', darkMode = true }) {
  const icons = { like:'❤️', comment:'💬', vote:'🗳️', share:'🔗' };
  const bg = darkMode ? '#1a1a1a' : '#ffffff';
  const color = darkMode ? '#fff' : '#0f172a';
  const border = darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)';

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)',zIndex:2000 }} />
      <div style={{
        position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
        width:'min(360px,90vw)',background:bg,color:color,borderRadius:'24px',
        border:border,padding:'2rem',
        zIndex:2001,textAlign:'center',boxShadow:'0 24px 64px rgba(0,0,0,0.4)',
        animation:'popIn 0.22s cubic-bezier(0.34,1.56,0.64,1)'
      }}>
        <style>{`@keyframes popIn{from{opacity:0;transform:translate(-50%,-50%) scale(0.85)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
        <div style={{ fontSize:'2.5rem',marginBottom:'0.75rem' }}>{icons[action] || '🔐'}</div>
        <div style={{ width:'48px',height:'48px',background:'rgba(56,189,248,0.12)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem' }}>
          <Lock size={22} color="#38bdf8" />
        </div>
        <h3 style={{ fontSize:'1.2rem',fontWeight:'800',color:color,margin:'0 0 0.5rem' }}>{t(selectedLang, 'signInRequired')}</h3>
        <p style={{ fontSize:'0.9rem',color:darkMode?'#a1a1aa':'#475569',margin:'0 0 1.5rem',lineHeight:'1.5' }}>
          {t(selectedLang, 'signInPrompt')}
        </p>
        <button
          onClick={onLogin}
          style={{ width:'100%',padding:'0.85rem',borderRadius:'12px',border:'none',background:'linear-gradient(135deg,#38bdf8,#818cf8)',color:'#fff',fontWeight:'700',fontSize:'1rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',marginBottom:'0.65rem' }}
        >
          <LogIn size={18} /> {t(selectedLang, 'login')}
        </button>
        <button onClick={onClose} style={{ background:'none',border:'none',color:'#a1a1aa',fontSize:'0.85rem',cursor:'pointer' }}>
          Cancel
        </button>
      </div>
    </>
  );
}

// ─── Comment Drawer ───────────────────────────────────────────────────────────
export function CommentDrawer({ isOpen, onClose, article, image, selectedLang = 'en', user, darkMode = true, onOpenAuthModal }) {
  const [comments, setComments] = useState([]);
  const [text, setText]         = useState('');
  const [authGate, setAuthGate] = useState(false);
  const [replyTo, setReplyTo]   = useState(null); // { commentId, name }
  const inputRef = useRef(null);
  const articleId = article.id || article.title;

  const bg = darkMode ? '#141414' : '#ffffff';
  const textColor = darkMode ? '#fff' : '#0f172a';
  const borderColor = darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)';
  const itemBg = darkMode ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.03)';
  const itemBorder = darkMode ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)';
  const mutedClr = darkMode ? '#71717a' : '#94a3b8';

  useEffect(() => {
    if (isOpen) {
      setComments(loadComments(articleId));
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      document.body.style.overflow = '';
      setReplyTo(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, articleId]);

  const saveComments = (newCommentsList) => {
    setComments(newCommentsList);
    try {
      const all = JSON.parse(localStorage.getItem('qn_comments') || '{}');
      all[articleId] = newCommentsList;
      localStorage.setItem('qn_comments', JSON.stringify(all));
    } catch {}
  };

  const handleLikeComment = (commentId) => {
    if (!user) { setAuthGate(true); return; }
    let targetComment = null;
    let willLike = false;
    const next = comments.map(c => {
      if (c.id === commentId) {
        targetComment = c;
        const likes = c.likes || [];
        const hasLiked = likes.includes(user.id);
        willLike = !hasLiked;
        const nextLikes = hasLiked ? likes.filter(id => id !== user.id) : [...likes, user.id];
        return { ...c, likes: nextLikes };
      }
      return c;
    });
    saveComments(next);

    if (willLike && targetComment) {
      const recipientId = targetComment.userId || user.id;
      const snippet = targetComment.text ? (targetComment.text.length > 35 ? targetComment.text.substring(0, 32) + '...' : targetComment.text) : 'your comment';
      addNotification({
        userId: recipientId,
        title: `❤️ Like on your comment`,
        body: `${user.name || 'A reader'} liked: "${snippet}"`,
        type: 'like',
        url: article?.url || '#'
      });
    }
  };

  const handlePinComment = (commentId) => {
    if (!user) return;
    const next = comments.map(c => {
      if (c.id === commentId) {
        return { ...c, pinned: !c.pinned };
      }
      return c;
    });
    saveComments(next);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!user) { setAuthGate(true); return; }
    if (!text.trim()) return;

    if (replyTo) {
      // Add nested reply to comment
      const replyObj = {
        id: Date.now(),
        name: user.name || 'Anonymous',
        userId: user.id,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        articleTitle: article.title,
        articleUrl: article.url,
        articleCategory: article.category
      };

      const next = comments.map(c => {
        if (c.id === replyTo.commentId) {
          const existingReplies = c.replies || [];
          return { ...c, replies: [...existingReplies, replyObj] };
        }
        return c;
      });

      saveComments(next);
      notifyArticleCommented({ article, user, text: text.trim(), replyTo });
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('qn_user_activity_updated'));
      setReplyTo(null);
    } else {
      // Create top-level comment
      const newComment = {
        id: Date.now(),
        name: user.name || 'Anonymous',
        userId: user.id,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        articleTitle: article.title,
        articleUrl: article.url,
        articleCategory: article.category,
        pinned: false,
        likes: [],
        replies: []
      };

      saveComments([newComment, ...comments]);
      notifyArticleCommented({ article, user, text: text.trim() });
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('qn_user_activity_updated'));
    }

    setText('');
  };

  const avatarColor = (n) => `hsl(${(n||'A').charCodeAt(0)*7%360},55%,42%)`;

  if (!isOpen) return null;

  // Sort comments so pinned comments float to top
  const sortedComments = [...comments].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(5px)',zIndex:1000,animation:'fadeIn .2s ease' }} />
      <div style={{ position:'fixed',top:0,right:0,bottom:0,width:'min(480px,100vw)',background:bg,color:textColor,borderLeft:borderColor,zIndex:1001,display:'flex',flexDirection:'column',animation:'slideInRight .28s cubic-bezier(0.22,1,0.36,1)',boxShadow:'-24px 0 60px rgba(0,0,0,0.3)' }}>
        <style>{`
          @keyframes fadeIn{from{opacity:0}to{opacity:1}}
          @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
          .cm-ta{resize:none;font-family:inherit;transition:border-color .2s}
          .cm-ta:focus{outline:none;border-color:rgba(56,189,248,.5)!important}
        `}</style>

        {/* Header */}
        <div style={{ padding:'1.25rem 1.25rem 0',flexShrink:0 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem' }}>
            <span style={{ fontWeight:'800',fontSize:'1.1rem',color:textColor,display:'flex',alignItems:'center',gap:'0.5rem' }}>
              <MessageSquare size={20} color="#38bdf8" />
              {t(selectedLang, 'comments')} <span style={{ color:'#38bdf8' }}>· {comments.length}</span>
            </span>
            <button onClick={onClose} style={{ background:darkMode?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)',border:'none',borderRadius:'50%',padding:'0.45rem',color:darkMode?'#a1a1aa':'#64748b',cursor:'pointer',display:'flex' }}>
              <X size={18} />
            </button>
          </div>

          {/* Article mini-preview */}
          <div style={{ display:'flex',gap:'0.75rem',alignItems:'center',background:itemBg,borderRadius:'14px',padding:'0.75rem',border:itemBorder,marginBottom:'1rem' }}>
            <img src={image} alt="" style={{ width:'52px',height:'52px',borderRadius:'10px',objectFit:'cover',flexShrink:0 }} onError={e=>{e.target.onerror=null;e.target.src=FALLBACK_IMAGES.general}} />
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:'.7rem',color:'#38bdf8',fontWeight:700,textTransform:'uppercase',marginBottom:'.1rem' }}>{article.category}</div>
              <p style={{ margin:0,fontSize:'.82rem',fontWeight:700,color:textColor,lineHeight:1.3,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical' }}>{article.title}</p>
            </div>
          </div>

          {/* Active Reply Banner Indicator */}
          {replyTo && (
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.4rem .75rem',background:'rgba(99,102,241,.12)',borderRadius:'10px',marginBottom:'.65rem',fontSize:'.78rem',color:'#6366f1',fontWeight:700,border:'1px solid rgba(99,102,241,.25)' }}>
              <span>Replying to <strong style={{ color:'#38bdf8' }}>@{replyTo.name}</strong></span>
              <button onClick={() => setReplyTo(null)} style={{ background:'none',border:'none',color:'#6366f1',cursor:'pointer',padding:0,display:'flex' }}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* User badge OR login prompt */}
          {user ? (
            <div style={{ display:'flex',alignItems:'center',gap:'0.6rem',marginBottom:'0.65rem' }}>
              <div style={{ width:'28px',height:'28px',borderRadius:'50%',background:`hsl(${(user.name||'U').charCodeAt(0)*7%360},55%,42%)`,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:'0.78rem',flexShrink:0 }}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize:'0.82rem',fontWeight:700,color:darkMode?'#d4d4d8':'#334155' }}>
                {replyTo ? 'Posting reply' : 'Commenting'} as <span style={{ color:'#38bdf8' }}>{user.name}</span>
              </span>
            </div>
          ) : (
            <button
              onClick={() => { onClose(); onOpenAuthModal(); }}
              style={{ width:'100%',padding:'0.65rem',borderRadius:'12px',border:'1px dashed rgba(56,189,248,0.35)',background:'rgba(56,189,248,0.06)',color:'#38bdf8',fontWeight:700,fontSize:'0.85rem',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem',marginBottom:'0.75rem' }}
            >
              <LogIn size={15}/> {t(selectedLang, 'signInRequired')}
            </button>
          )}

          {/* Input */}
          <form onSubmit={submit} style={{ display:'flex',gap:'0.5rem',alignItems:'flex-end',marginBottom:'1rem' }}>
            <textarea
              ref={inputRef}
              className="cm-ta"
              rows={2}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(e);} }}
              placeholder={replyTo ? `Write a reply to @${replyTo.name}…` : user ? 'Share your thoughts…' : 'Sign in to comment…'}
              disabled={!user}
              style={{ flex:1,background:darkMode?'rgba(255,255,255,.05)':'rgba(0,0,0,.04)',border:darkMode?'1px solid rgba(255,255,255,.1)':'1px solid rgba(0,0,0,.15)',borderRadius:'12px',padding:'.65rem .85rem',color:textColor,fontSize:'.85rem',lineHeight:1.4,opacity:user?1:0.5 }}
            />
            <button
              type="submit"
              disabled={!user || !text.trim()}
              style={{ background: user&&text.trim()?'#38bdf8':'rgba(56,189,248,.15)',border:'none',borderRadius:'12px',padding:'0.65rem',color:user&&text.trim()?'#000':'#38bdf8',cursor:user&&text.trim()?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,alignSelf:'flex-end',transition:'all .2s' }}
            >
              <Send size={16} />
            </button>
          </form>
          <div style={{ height:'1px',background:darkMode?'rgba(255,255,255,.07)':'rgba(0,0,0,.08)',margin:'0 -1.25rem' }} />
        </div>

        {/* Comments list */}
        <div style={{ flex:1,overflowY:'auto',padding:'1rem 1.25rem',display:'flex',flexDirection:'column',gap:'0.75rem' }}>
          {sortedComments.length === 0 ? (
            <div style={{ textAlign:'center',padding:'3rem 1rem',color:darkMode?'#444':'#94a3b8' }}>
              <MessageSquare size={36} style={{ margin:'0 auto .75rem',display:'block',opacity:.35 }} />
              <p style={{ margin:0,fontWeight:600,fontSize:'.95rem' }}>No comments yet</p>
            </div>
          ) : sortedComments.map(c => {
            const isLiked = user && (c.likes || []).includes(user.id);
            const likesCount = (c.likes || []).length;
            const isAuthorOrAdmin = user && (user.id === c.userId || user.role === 'ADMIN');

            return (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '.5rem',
                  padding: '.85rem',
                  borderRadius: '14px',
                  background: c.pinned ? (darkMode ? 'rgba(99,102,241,.12)' : 'rgba(99,102,241,.06)') : itemBg,
                  border: c.pinned ? '1px solid rgba(99,102,241,.35)' : itemBorder,
                  transition: 'all .15s'
                }}
              >
                {/* Pinned Tag Banner */}
                {c.pinned && (
                  <div style={{ display:'flex',alignItems:'center',gap:'.3rem',fontSize:'.72rem',fontWeight:800,color:'#6366f1' }}>
                    <Pin size={12} fill="#6366f1" /> Pinned Comment
                  </div>
                )}

                <div style={{ display: 'flex', gap: '.7rem' }}>
                  <div style={{ width:'34px',height:'34px',borderRadius:'50%',background:avatarColor(c.name),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'.85rem',fontWeight:700,flexShrink:0 }}>
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.25rem' }}>
                      <div style={{ display:'flex',alignItems:'baseline',gap:'.5rem' }}>
                        <span style={{ fontWeight:700,fontSize:'.85rem',color:textColor }}>{c.name}</span>
                        <span style={{ fontSize:'.72rem',color:darkMode?'#555':'#94a3b8' }}>{timeAgo(c.createdAt)}</span>
                      </div>

                      {/* Pin action button for comment owner or admin */}
                      {isAuthorOrAdmin && (
                        <button
                          onClick={() => handlePinComment(c.id)}
                          title={c.pinned ? 'Unpin comment' : 'Pin comment to top'}
                          style={{ background:'none',border:'none',color:c.pinned?'#6366f1':mutedClr,cursor:'pointer',padding:'.15rem' }}
                        >
                          <Pin size={13} fill={c.pinned ? '#6366f1' : 'none'} />
                        </button>
                      )}
                    </div>

                    <p style={{ margin:0,fontSize:'.88rem',color:darkMode?'#a1a1aa':'#475569',lineHeight:1.5,wordBreak:'break-word' }}>{c.text}</p>

                    {/* Action bar: Like & Reply */}
                    <div style={{ display:'flex',alignItems:'center',gap:'1rem',marginTop:'.5rem',fontSize:'.75rem',fontWeight:600 }}>
                      <button
                        onClick={() => handleLikeComment(c.id)}
                        style={{ background:'none',border:'none',color:isLiked?'#ef4444':mutedClr,cursor:'pointer',display:'flex',alignItems:'center',gap:'.25rem',fontSize:'inherit' }}
                      >
                        <Heart size={13} fill={isLiked ? '#ef4444' : 'none'} />
                        <span>{likesCount > 0 ? likesCount : 'Like'}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (!user) { setAuthGate(true); return; }
                          setReplyTo({ commentId: c.id, name: c.name, userId: c.userId });
                          setTimeout(() => inputRef.current?.focus(), 100);
                        }}
                        style={{ background:'none',border:'none',color:mutedClr,cursor:'pointer',display:'flex',alignItems:'center',gap:'.25rem',fontSize:'inherit' }}
                      >
                        <CornerDownRight size={13} />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Nested Threaded Replies */}
                {c.replies && c.replies.length > 0 && (
                  <div style={{ marginLeft:'2.25rem',marginTop:'.2rem',paddingLeft:'.75rem',borderLeft:'2px solid rgba(99,102,241,.25)',display:'flex',flexDirection:'column',gap:'.45rem' }}>
                    {c.replies.map(r => (
                      <div key={r.id} style={{ display:'flex',gap:'.5rem',background:darkMode?'rgba(255,255,255,.025)':'rgba(0,0,0,.025)',padding:'.45rem .65rem',borderRadius:'10px' }}>
                        <div style={{ width:'24px',height:'24px',borderRadius:'50%',background:avatarColor(r.name),display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'.7rem',fontWeight:700,flexShrink:0 }}>
                          {r.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div style={{ flex:1,minWidth:0 }}>
                          <div style={{ display:'flex',alignItems:'baseline',gap:'.4rem',marginBottom:'.1rem' }}>
                            <span style={{ fontWeight:700,fontSize:'.78rem',color:textColor }}>{r.name}</span>
                            <span style={{ fontSize:'.68rem',color:darkMode?'#555':'#94a3b8' }}>{timeAgo(r.createdAt)}</span>
                          </div>
                          <p style={{ margin:0,fontSize:'.82rem',color:darkMode?'#a1a1aa':'#475569',lineHeight:1.4 }}>{r.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {authGate && <AuthGatePrompt action="comment" selectedLang={selectedLang} darkMode={darkMode} onLogin={() => { setAuthGate(false); onClose(); onOpenAuthModal(); }} onClose={() => setAuthGate(false)} />}
    </>
  );
}

// ─── Short 65-word Summary Component ─────────────────────────────────────────
const WORD_LIMIT = 65;

function ShortSummary({ text, url, selectedLang = 'en', darkMode = true }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;

  const words    = text.trim().split(/\s+/);
  const isLong   = words.length > WORD_LIMIT;
  const display  = (!isLong || expanded) ? text : words.slice(0, WORD_LIMIT).join(' ') + '…';

  return (
    <p style={{ fontSize: '.9rem', color: darkMode ? '#a1a1aa' : '#475569', lineHeight: 1.55, margin: 0 }}>
      {display}
      {' '}
      {isLong && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          style={{ background:'none',border:'none',color:'#38bdf8',fontWeight:700,fontSize:'.85rem',cursor:'pointer',padding:0 }}
        >
          {t(selectedLang, 'readMore')}
        </button>
      )}
      {isLong && expanded && url && (
        <a
          href={url} target="_blank" rel="noopener noreferrer"
          style={{ color:'#38bdf8',fontWeight:700,fontSize:'.85rem',marginLeft:'4px',textDecoration:'none' }}
        >
          {t(selectedLang, 'fullArticle')}
        </a>
      )}
    </p>
  );
}

const getVoteKey = (art) => {
  if (!art) return 'key-0';
  const raw = String(art.id || art.title || '');
  return raw.startsWith('db-') ? raw : `db-${raw}`;
};

// ─── Vote storage helpers ───────────────────────────────────────────────────
const getArticleVotes = (articleId, defaultTrust = 1, defaultDispute = 0) => {
  try {
    const all = JSON.parse(localStorage.getItem('qn_article_votes') || '{}');
    if (all[articleId]) return all[articleId];
  } catch {}
  return { trustVotes: defaultTrust, disputeVotes: defaultDispute, locked: false };
};

const saveArticleVotes = (articleId, trustVotes, disputeVotes, locked = false) => {
  try {
    const all = JSON.parse(localStorage.getItem('qn_article_votes') || '{}');
    all[articleId] = { trustVotes, disputeVotes, locked };
    localStorage.setItem('qn_article_votes', JSON.stringify(all));
  } catch {}
};

// ─────────────────────────────────────────────────────────────────────────────
export default function NewsCard({ article, user, onOpenAuthModal, selectedLang = 'en', darkMode = true }) {
  const baseImage = article.image || article.imageUrl || FALLBACK_IMAGES[article.category] || FALLBACK_IMAGES.general;
  const [displayImage, setDisplayImage] = useState(baseImage);
  const [commentOpen, setCommentOpen]   = useState(false);
  const [authGate, setAuthGate]         = useState(null); // 'like' | 'vote' | 'share'
  const [voteEffect, setVoteEffect]     = useState(null); // 'TRUST' | 'NOT_TRUST' (trigger pulse animation)

  const articleId = getVoteKey(article);

  // Initial votes from localStorage or props
  const initVotes = getArticleVotes(articleId, article.trustVotes || 1, article.notTrustVotes || 0);

  const [trustVotes, setTrustVotes]       = useState(initVotes.trustVotes);
  const [notTrustVotes, setNotTrustVotes] = useState(initVotes.disputeVotes);
  const isLocked                          = initVotes.locked;

  // Persisted user vote state
  const userVoteKey = `${user?.id || 'guest'}_vote_${articleId}`;
  const [userVote, setUserVote]           = useState(() => {
    try { return localStorage.getItem(userVoteKey) || null; } catch { return null; }
  });

  // Likes — persist per user+article
  const likeKey = `${user?.id || 'guest'}_${articleId}`;
  const [liked, setLiked]             = useState(() => !!loadLikes()[likeKey]);
  const [likesCount, setLikesCount]   = useState(article.likes || article.likesCount || 2);
  const commentsCount = loadComments(articleId).length || article.comments || 0;

  // Bookmark state
  const [bookmarked, setBookmarked] = useState(() => user ? isBookmarked(user.id, articleId) : false);

  // TTS state and playback sync
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 3-Layer Trust Verification Modal
  const [showThreeLayerModal, setShowThreeLayerModal] = useState(false);

  useEffect(() => {
    const onSpeechStart = (e) => {
      if (e.detail.articleId !== articleId) {
        setIsSpeaking(false);
      }
    };
    window.addEventListener('qn-speech-start', onSpeechStart);
    return () => {
      window.removeEventListener('qn-speech-start', onSpeechStart);
    };
  }, [articleId]);

  useEffect(() => {
    const handleSync = () => {
      if (user) {
        setBookmarked(isBookmarked(user.id, articleId));
        setLiked(!!loadLikes()[likeKey]);
        try {
          setUserVote(localStorage.getItem(userVoteKey) || null);
        } catch {}
      }
    };
    window.addEventListener('qn_user_activity_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('qn_user_activity_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [user, articleId, likeKey, userVoteKey]);

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis?.cancel();
      }
    };
  }, [isSpeaking]);

  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert('❌ Text-to-Speech is not supported in your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    window.dispatchEvent(new CustomEvent('qn-speech-start', { detail: { articleId } }));

    const cleanText = (article.title || '') + '. ' + (article.description || '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (selectedLang) {
      if (selectedLang === 'hi') utterance.lang = 'hi-IN';
      else if (selectedLang === 'mr') utterance.lang = 'mr-IN';
      else if (selectedLang === 'ta') utterance.lang = 'ta-IN';
      else if (selectedLang === 'te') utterance.lang = 'te-IN';
      else utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.includes(selectedLang));
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Fact-Check Tooltip visibility state
  const [showTooltip, setShowTooltip] = useState(false);

  const getFactCheckStatus = () => {
    if (!article.isCommunity) {
      return {
        label: t(selectedLang, 'verified') || 'Verified News',
        color: '#38bdf8', // Sky Blue
        bgColor: darkMode ? 'rgba(56,189,248,.15)' : 'rgba(56,189,248,.12)',
        borderColor: 'rgba(56,189,248,.3)',
        icon: <ShieldCheck size={14} color="#38bdf8" />,
        description: 'Verified News: Aggregated directly from verified global news networks and trusted publications.'
      };
    }

    if (article.verified) {
      return {
        label: 'Admin Verified',
        color: '#22c55e', // Green
        bgColor: darkMode ? 'rgba(34,197,94,.15)' : 'rgba(34,197,94,.12)',
        borderColor: 'rgba(34,197,94,.3)',
        icon: <ShieldCheck size={14} color="#22c55e" />,
        description: 'Admin Verified: Hand-checked and approved by the QuickNews editorial administrators.'
      };
    }

    const total = trustVotes + notTrustVotes;
    const pct = total > 0 ? Math.round((trustVotes / total) * 100) : 84;

    if (total < 5) {
      return {
        label: 'Unverified Citizen Post',
        color: darkMode ? '#cbd5e1' : '#475569',
        bgColor: darkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)',
        borderColor: darkMode ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.1)',
        icon: <HelpCircle size={14} color={darkMode ? '#cbd5e1' : '#475569'} />,
        description: 'Citizen Post: Brand new post. Awaiting more evaluations from QuickNews community members.'
      };
    }

    if (pct >= 90) {
      return {
        label: 'Highly Trusted',
        color: '#22c55e', // Green
        bgColor: darkMode ? 'rgba(34,197,94,.15)' : 'rgba(34,197,94,.12)',
        borderColor: 'rgba(34,197,94,.3)',
        icon: <ShieldCheck size={14} color="#22c55e" />,
        description: `Highly Trusted: Voted highly reliable by ${total} citizens with a trust consensus score of ${pct}%.`
      };
    }

    if (pct >= 70) {
      return {
        label: 'Credible',
        color: '#fbbf24', // Amber/Yellow
        bgColor: darkMode ? 'rgba(251,191,36,.15)' : 'rgba(251,191,36,.12)',
        borderColor: 'rgba(251,191,36,.3)',
        icon: <ShieldAlert size={14} color="#fbbf24" />,
        description: `Credible: Considered reliable by the community, though disputed by some members (Trust: ${pct}%).`
      };
    }

    return {
      label: 'Highly Disputed',
      color: '#ef4444', // Red
      bgColor: darkMode ? 'rgba(239,68,68,.15)' : 'rgba(239,68,68,.12)',
      borderColor: 'rgba(239,68,68,.3)',
      icon: <AlertTriangle size={14} color="#ef4444" />,
      description: `Disputed: Flagged by citizens as questionable or unverified. Trust consensus is low (${pct}%).`
    };
  };

  const factStatus = getFactCheckStatus();

  useEffect(() => {
    if (article.isCommunity) return;
    let cancelled = false;
    resolveSmartImage(article.url, article.title).then(img => {
      if (!cancelled && img && img !== baseImage) {
        const i = new window.Image(); i.onload = () => { if(!cancelled) setDisplayImage(img); }; i.src = img;
      }
    });
    return () => { cancelled = true; };
  }, [article.url, article.title, article.isCommunity]);

  const totalVotes        = trustVotes + notTrustVotes;
  const trustPercentage   = totalVotes > 0 ? Math.round((trustVotes / totalVotes) * 100) : 84;
  const disputePercentage = 100 - trustPercentage;

  const getTimeAgo = (d) => {
    if (!d) return '4h ago'; const m=Math.floor((Date.now()-new Date(d))/60000);
    if(m<1) return 'Just now'; if(m<60) return `${m}m ago`;
    const h=Math.floor(m/60); return h<24?`${h}h ago`:`${Math.floor(h/24)}d ago`;
  };

  const gated = (action, fn) => {
    if (!user) { setAuthGate(action); return; }
    try {
      const settings = JSON.parse(localStorage.getItem('qn_settings') || '{}');
      if (action === 'vote' && settings.votingEnabled === false) {
        alert('⚙️ Voting is currently disabled by the Admin.');
        return;
      }
      if (action === 'comment' && settings.commentsEnabled === false) {
        alert('⚙️ Commenting is currently disabled by the Admin.');
        return;
      }
    } catch {}
    fn();
  };

  const handleLike = () => gated('like', () => {
    const next = !liked;
    setLiked(next);
    setLikesCount(c => next ? c+1 : c-1);
    toggleLikeStorage(likeKey, next);

    if (user) {
      try {
        const likedList = JSON.parse(localStorage.getItem(`qn_liked_${user.id}`) || '[]');
        if (next) {
          if (!likedList.some(item => item.id === articleId)) {
            const slim = {
              id: articleId,
              title: article.title,
              description: article.description,
              image: displayImage,
              url: article.url,
              category: article.category,
              likedAt: new Date().toISOString()
            };
            localStorage.setItem(`qn_liked_${user.id}`, JSON.stringify([slim, ...likedList]));
          }
          notifyArticleLiked({ article, user });
        } else {
          localStorage.setItem(`qn_liked_${user.id}`, JSON.stringify(likedList.filter(item => item.id !== articleId)));
        }
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('qn_user_activity_updated'));
      } catch {}
    }
  });

  const handleVote = (voteType) => gated('vote', async () => {
    if (isLocked) { alert('🔒 Voting for this story has been locked by Admin.'); return; }
    if (userVote === voteType) return;

    let newTrust   = trustVotes;
    let newDispute = notTrustVotes;

    if (voteType === 'TRUST') {
      newTrust += 1;
      if (userVote === 'NOT_TRUST') newDispute = Math.max(0, newDispute - 1);
    } else {
      newDispute += 1;
      if (userVote === 'TRUST') newTrust = Math.max(0, newTrust - 1);
    }

    setTrustVotes(newTrust);
    setNotTrustVotes(newDispute);
    setUserVote(voteType);
    setVoteEffect(voteType);

    // Save to aggregate storage & user vote storage
    saveArticleVotes(articleId, newTrust, newDispute, isLocked);
    try { localStorage.setItem(userVoteKey, voteType); } catch {}

    if (user) {
      try {
        const votesList = JSON.parse(localStorage.getItem(`qn_votes_${user.id}`) || '[]');
        const filtered = votesList.filter(v => v.id !== articleId);
        const voteItem = {
          id: articleId,
          title: article.title,
          category: article.category,
          image: displayImage,
          url: article.url,
          voteType,
          votedAt: new Date().toISOString()
        };
        localStorage.setItem(`qn_votes_${user.id}`, JSON.stringify([voteItem, ...filtered]));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('qn_user_activity_updated'));
      } catch {}
    }

    notifyArticleVoted({ article, user, voteType });

    // Trigger visual pulse for 1s
    setTimeout(() => setVoteEffect(null), 1000);

    try { await axios.post(`http://localhost:8080/api/votes/${article.id||1}`,{voteType,userId:user.id}); } catch {}
  });

  const handleComment = () => gated('comment', () => setCommentOpen(true));

  const handleShare = () => {
    const url = article.url || window.location.href;
    if (navigator.share) navigator.share({ title:article.title, text:article.description, url });
    else { navigator.clipboard.writeText(url); alert('⚡ Link copied!'); }
  };

  const handleBookmark = () => gated('bookmark', () => {
    const result = toggleBookmark(user.id, articleId, article);
    setBookmarked(result);
  });

  // Light vs Dark Mode Theme Tokens for Card
  const cardBg     = darkMode ? '#1c1c1c' : '#ffffff';
  const cardText   = darkMode ? '#f8fafc' : '#0f172a';
  const cardBorder = voteEffect === 'TRUST' ? '1px solid #22c55e' : voteEffect === 'NOT_TRUST' ? '1px solid #ef4444' : darkMode ? '1px solid rgba(255,255,255,.08)' : '1px solid rgba(0,0,0,.1)';
  const cardShadow = voteEffect === 'TRUST' ? '0 0 24px rgba(34,197,94,.35)' : voteEffect === 'NOT_TRUST' ? '0 0 24px rgba(239,68,68,.35)' : darkMode ? '0 8px 24px rgba(0,0,0,.4)' : '0 10px 30px rgba(0,0,0,.08)';

  const imgBg      = darkMode ? '#121212' : '#f1f5f9';
  const imgBorder  = darkMode ? '1px solid rgba(255,255,255,.18)' : '1px solid rgba(0,0,0,.08)';

  const overlayBg  = darkMode ? 'rgba(18,18,18,.85)' : 'rgba(255,255,255,.92)';
  const overlayClr = darkMode ? '#fff' : '#0f172a';
  const overlayBdr = darkMode ? '1px solid rgba(255,255,255,.25)' : '1px solid rgba(0,0,0,.15)';

  const sourceClr  = darkMode ? '#a1a1aa' : '#64748b';
  const sourceName = darkMode ? '#d4d4d8' : '#1e293b';
  const titleColor = darkMode ? '#fff' : '#0f172a';
  const footerBg   = darkMode ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)';
  const footerLine = darkMode ? '1px solid rgba(255,255,255,.06)' : '1px solid rgba(0,0,0,.06)';
  const mutedClr   = darkMode ? '#555' : '#94a3b8';

  return (
    <>
      <div style={{
        background: cardBg,
        borderRadius: '24px',
        border: cardBorder,
        display: 'flex',
        flexDirection: 'column',
        color: cardText,
        boxShadow: cardShadow,
        transition: 'all 0.35s ease',
        fontFamily: 'system-ui,-apple-system,sans-serif',
        overflow: 'hidden'
      }}>

        {/* ═══ HERO: Full-bleed Image ═══ */}
        <div style={{ position:'relative', height:'clamp(180px, 48vw, 260px)', background:imgBg, overflow:'hidden' }}>
          <img src={displayImage} alt={article.title} style={{ width:'100%',height:'100%',objectFit:'cover',transition:'transform .5s ease' }}
            onError={e=>{e.target.onerror=null;e.target.src=e.target.src.includes('picsum')?FALLBACK_IMAGES[article.category]||FALLBACK_IMAGES.general:getPicsumUrl(article.title);}} />

          {/* Gradient overlay for text readability on image */}
          <div style={{ position:'absolute',bottom:0,left:0,right:0,height:'55%',background:'linear-gradient(transparent, rgba(0,0,0,.75))',pointerEvents:'none' }} />

          {/* Top badges */}
          <div style={{ position:'absolute',top:'12px',left:'12px',display:'flex',alignItems:'center',gap:'.35rem' }}>
            <div
              onClick={(e) => { e.stopPropagation(); setShowThreeLayerModal(true); }}
              title="Click to view 3-Layer Trust Verification audit"
              style={{
                display:'flex',alignItems:'center',gap:'.35rem',
                padding:'.35rem .75rem',borderRadius:'99px',
                background: factStatus.bgColor,
                backdropFilter:'blur(8px)',
                border: `1px solid ${factStatus.borderColor}`,
                color: factStatus.color,
                fontSize:'.78rem',fontWeight:700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 10px rgba(0,0,0,.15)'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {factStatus.icon}
              <span>{factStatus.label}</span>
            </div>

            {/* Fact-check Tooltip Drawer overlay */}
            {showTooltip && (
              <div
                style={{
                  position: 'absolute',
                  top: '36px',
                  left: '0',
                  width: 'min(260px, calc(100vw - 32px))',
                  maxWidth: 'calc(100vw - 32px)',
                  background: darkMode ? '#181822' : '#ffffff',
                  color: cardText,
                  padding: '.85rem 1rem',
                  borderRadius: '12px',
                  border: `1px solid ${factStatus.borderColor}`,
                  boxShadow: '0 10px 25px rgba(0,0,0,.45)',
                  zIndex: 10,
                  fontSize: '.8rem',
                  fontFamily: 'inherit',
                  animation: 'tooltipPop .2s ease'
                }}
              >
                <style>{`@keyframes tooltipPop{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.4rem' }}>
                  <span style={{ fontWeight: 800, color: factStatus.color, display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                    Fact-Check Audit
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
                    style={{ background: 'none', border: 'none', color: mutedClr, cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </div>
                <p style={{ margin: 0, lineHeight: 1.4, color: cardText, opacity: 0.85 }}>
                  {factStatus.description}
                </p>
                {article.isCommunity && (
                  <div style={{ marginTop: '.6rem', paddingTop: '.5rem', borderTop: `1px solid ${footerLine}`, display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: mutedClr, fontWeight: 700 }}>
                    <span style={{ color: '#22c55e' }}>👍 {trustVotes} Trusted</span>
                    <span style={{ color: '#ef4444' }}>👎 {notTrustVotes} Disputed</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ position:'absolute',top:'12px',right:'12px',display:'flex',alignItems:'center',gap:'.4rem' }}>
            <div style={{ padding:'.3rem .7rem',borderRadius:'99px',background:overlayBg,backdropFilter:'blur(8px)',border:overlayBdr,color:overlayClr,fontSize:'.72rem',fontWeight:700,letterSpacing:'.05em',textTransform:'uppercase' }}>
              {t(selectedLang, (article.category || 'general').toLowerCase()) || article.category}
            </div>
            <button
              onClick={handleBookmark}
              title={bookmarked ? 'Remove bookmark' : 'Save for later'}
              style={{
                width:'32px',height:'32px',borderRadius:'50%',border:'none',
                background: bookmarked ? 'rgba(251,191,36,.9)' : overlayBg,
                backdropFilter:'blur(8px)',
                color: bookmarked ? '#000' : overlayClr,
                cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
                transition:'all .25s',
                transform: bookmarked ? 'scale(1.1)' : 'scale(1)',
                boxShadow: bookmarked ? '0 0 12px rgba(251,191,36,.5)' : 'none'
              }}
            >
              <Bookmark size={15} fill={bookmarked ? '#000' : 'none'} />
            </button>
          </div>

          {/* Source line overlaid on bottom of image */}
          <div style={{ position:'absolute',bottom:'12px',left:'14px',right:'14px',display:'flex',alignItems:'center',gap:'.4rem',fontSize:'.82rem',color:'rgba(255,255,255,.8)' }}>
            <Cpu size={14} color="rgba(255,255,255,.7)"/>
            <span><strong style={{ color:'#fff' }}>{article.source?.name||'QuickNews'}</strong> · {getTimeAgo(article.publishedAt||article.createdAt)}</span>
          </div>
        </div>

        {/* ═══ CONTENT: Title + Description (the star of the card) ═══ */}
        <div style={{ padding:'1.1rem 1.25rem .75rem',flex:1 }}>
          <h2 style={{ fontSize:'clamp(1.05rem, 3vw, 1.25rem)',fontWeight:800,lineHeight:1.3,marginBottom:'.5rem',color:titleColor }}>
            {article.url&&!article.isCommunity
              ?<a href={article.url} target="_blank" rel="noopener noreferrer" style={{ color:'inherit',textDecoration:'none' }}>{article.title}</a>
              :article.title}
          </h2>
          <ShortSummary text={article.description} url={article.url} selectedLang={selectedLang} darkMode={darkMode} />
        </div>

        {/* ═══ COMPACT FOOTER: Social + Trust/Dispute (secondary, merged row) ═══ */}
        <div style={{ padding:'.6rem 1.25rem .85rem',borderTop:footerLine,background:footerBg,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'.5rem' }}>

          {/* Left: Social actions */}
          <div style={{ display:'flex',alignItems:'center',gap:'clamp(0.5rem, 2.5vw, 1rem)',color:sourceClr,fontSize:'.85rem',fontWeight:600,flexWrap:'wrap' }}>
            <button onClick={handleLike} title={user?'Like':'Sign in to like'} style={{ background:'none',border:'none',color:liked?'#ef4444':sourceClr,cursor:'pointer',display:'flex',alignItems:'center',gap:'.3rem',fontSize:'inherit',transition:'color .2s',minHeight:'36px' }}>
              <Heart size={17} fill={liked?'#ef4444':'none'}/> {likesCount}
            </button>
            <button onClick={handleComment} title={user?'Comment':'Sign in to comment'} style={{ background:'none',border:'none',color:sourceClr,cursor:'pointer',display:'flex',alignItems:'center',gap:'.3rem',fontSize:'inherit',position:'relative',minHeight:'36px' }}>
              <MessageSquare size={17}/>
              <span>{commentsCount > 0 ? commentsCount : t(selectedLang, 'comment')}</span>
              {!user && <Lock size={10} style={{ position:'absolute',top:'-3px',right:'-5px',color:mutedClr }}/>}
            </button>
            <button onClick={handleShare} style={{ background:'none',border:'none',color:'inherit',cursor:'pointer',display:'flex',alignItems:'center',gap:'.3rem',fontSize:'inherit',minHeight:'36px' }}>
              <Share2 size={17}/> {t(selectedLang, 'share')}
            </button>
            {(() => {
              try {
                const s = JSON.parse(localStorage.getItem('qn_settings') || '{}');
                return s.ttsEnabled !== false;
              } catch { return true; }
            })() && (
              <button onClick={handleReadAloud} title={isSpeaking ? 'Stop reading' : 'Read aloud'} style={{ background:'none',border:'none',color:isSpeaking?'#6366f1':'inherit',cursor:'pointer',display:'flex',alignItems:'center',gap:'.3rem',fontSize:'inherit',transition:'color .2s',minHeight:'36px' }}>
                {isSpeaking ? <VolumeX size={17} color="#6366f1" /> : <Volume2 size={17}/>}
                <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
              </button>
            )}
          </div>

          {/* Right: Trust / Dispute compact pills (People's News only) */}
          {article.isCommunity && (
            <div style={{ display:'flex',gap:'.4rem' }}>
              <button
                onClick={()=>handleVote('TRUST')}
                disabled={isLocked}
                style={{
                  padding:'.3rem .7rem',borderRadius:'99px',border:'none',
                  background:userVote==='TRUST'?'#15803d':darkMode?'rgba(34,197,94,.12)':'rgba(34,197,94,.1)',
                  color:'#22c55e',fontWeight:700,fontSize:'.78rem',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  display:'flex',alignItems:'center',gap:'.25rem',
                  transition:'all .2s',
                  transform: voteEffect === 'TRUST' ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: userVote === 'TRUST' ? '0 0 10px rgba(34,197,94,.35)' : 'none'
                }}
              >
                <ThumbsUp size={13}/> {trustPercentage}%
              </button>
              <button
                onClick={()=>handleVote('NOT_TRUST')}
                disabled={isLocked}
                style={{
                  padding:'.3rem .7rem',borderRadius:'99px',border:'none',
                  background:userVote==='NOT_TRUST'?'#7f1d1d':darkMode?'rgba(239,68,68,.12)':'rgba(239,68,68,.1)',
                  color:'#ef4444',fontWeight:700,fontSize:'.78rem',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  display:'flex',alignItems:'center',gap:'.25rem',
                  transition:'all .2s',
                  transform: voteEffect === 'NOT_TRUST' ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: userVote === 'NOT_TRUST' ? '0 0 10px rgba(239,68,68,.35)' : 'none'
                }}
              >
                <ThumbsDown size={13}/> {disputePercentage}%
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comment Drawer */}
      <CommentDrawer
        article={article}
        image={displayImage}
        isOpen={commentOpen}
        onClose={() => setCommentOpen(false)}
        user={user}
        onOpenAuthModal={onOpenAuthModal}
        selectedLang={selectedLang}
        darkMode={darkMode}
      />

      {/* Auth Gate Prompt */}
      {authGate && (
        <AuthGatePrompt
          action={authGate}
          selectedLang={selectedLang}
          darkMode={darkMode}
          onLogin={() => { setAuthGate(null); onOpenAuthModal(); }}
          onClose={() => setAuthGate(null)}
        />
      )}

      {/* 3-Layer Trust Verification Modal */}
      <ThreeLayerVerificationModal
        isOpen={showThreeLayerModal}
        onClose={() => setShowThreeLayerModal(false)}
        article={article}
        darkMode={darkMode}
      />
    </>
  );
}