import React, { useState, useEffect } from 'react';
import {
  X, ShieldAlert, BarChart3, Users, CheckCircle, TrendingUp,
  ThumbsUp, ThumbsDown, Settings, Trash2, Ban, ShieldCheck,
  Newspaper, UserX, UserCheck, Eye, EyeOff, AlertTriangle,
  RefreshCw, Download, Bell, Globe, Lock, Unlock, PlusCircle,
  MessageSquare, Heart, Activity
} from 'lucide-react';
import axios from 'axios';

// ─── Live data helpers (read from localStorage) ───────────────────────────────
const getUsers        = () => { try { return JSON.parse(localStorage.getItem('quicknews_user_db') || '[]'); } catch { return []; } };
const getBannedList   = () => { try { return JSON.parse(localStorage.getItem('qn_banned') || '[]'); } catch { return []; } };
const getComments     = () => { try { return JSON.parse(localStorage.getItem('qn_comments') || '{}'); } catch { return {}; } };
const getSettings     = () => { try { return JSON.parse(localStorage.getItem('qn_settings') || '{}'); } catch { return {}; } };
const saveSettings    = (s) => { try { localStorage.setItem('qn_settings', JSON.stringify(s)); } catch {} };

const totalComments   = () => Object.values(getComments()).reduce((s, arr) => s + arr.length, 0);

const getVoteKey = (art) => {
  if (!art) return 'key-0';
  const raw = String(art.id || art.title || '');
  return raw.startsWith('db-') ? raw : `db-${raw}`;
};

const getLiveTotalVotes = () => {
  try {
    const all = JSON.parse(localStorage.getItem('qn_article_votes') || '{}');
    return Object.values(all).reduce((acc, v) => acc + (v.trustVotes || 0) + (v.disputeVotes || 0), 0);
  } catch { return 0; }
};

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ on, onChange, color = '#22c55e' }) {
  return (
    <div onClick={onChange} style={{ width:'48px',height:'26px',borderRadius:'99px',background:on?color:'#2a2a2a',position:'relative',cursor:'pointer',transition:'background .25s',flexShrink:0 }}>
      <div style={{ width:'20px',height:'20px',background:'#fff',borderRadius:'50%',position:'absolute',top:'3px',left:on?'25px':'3px',transition:'left .22s',boxShadow:'0 1px 4px rgba(0,0,0,.4)' }} />
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = '#fff', icon }) {
  return (
    <div style={{ background:'rgba(255,255,255,.04)',padding:'1.1rem',borderRadius:'16px',border:'1px solid rgba(255,255,255,.07)' }}>
      <div style={{ display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.4rem',color:'#a1a1aa',fontSize:'.78rem' }}>
        {icon}{label}
      </div>
      <div style={{ fontSize:'1.8rem',fontWeight:'800',color }}>{value}</div>
    </div>
  );
}

// ─── Nav button ───────────────────────────────────────────────────────────────
function NavBtn({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{ display:'flex',alignItems:'center',gap:'.75rem',padding:'.85rem 1rem',borderRadius:'12px',border:'none',background:active?'rgba(56,189,248,.15)':'transparent',color:active?'#38bdf8':'#a1a1aa',cursor:'pointer',textAlign:'left',fontWeight:600,transition:'all .2s',width:'100%',position:'relative' }}>
      {icon} {label}
      {badge > 0 && <span style={{ marginLeft:'auto',background:'#ef4444',color:'#fff',fontSize:'.7rem',fontWeight:700,padding:'1px 6px',borderRadius:'99px' }}>{badge}</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboardModal({ isOpen, onClose }) {
  const [tab, setTab]             = useState('analytics');
  const [users, setUsers]         = useState([]);
  const [banned, setBanned]       = useState([]);
  const [posts, setPosts]         = useState([]);
  const [settings, setSettingsState] = useState({
    autoApprove: true, antiFake: true, maintenance: false,
    registrationOpen: true, commentsEnabled: true, votingEnabled: true,
    ttsEnabled: true, tickerEnabled: true, carouselEnabled: true,
    pollsEnabled: true, leaderboardEnabled: true
  });
  const [notify, setNotify]       = useState('');
  const [search, setSearch]       = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // Push Dispatcher States
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody]   = useState('');

  // Poll management states
  const [polls, setPolls] = useState([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptA, setPollOptA] = useState('');
  const [pollOptB, setPollOptB] = useState('');
  const [pollOptC, setPollOptC] = useState('');
  const [pollOptD, setPollOptD] = useState('');

  const loadPolls = () => {
    try {
      const stored = localStorage.getItem('qn_polls');
      if (stored) setPolls(JSON.parse(stored));
      else setPolls([]);
    } catch {}
  };

  useEffect(() => {
    if (!isOpen) return;
    setUsers(getUsers());
    setBanned(getBannedList());
    const saved = getSettings();
    if (Object.keys(saved).length) setSettingsState(s => ({ ...s, ...saved }));

    axios.get('http://localhost:8080/api/community/posts', { timeout: 2000 })
      .then(r => { if (Array.isArray(r.data)) setPosts(r.data); })
      .catch(() => {
        setPosts([
          { id:'c-1', title:'Next-gen chip design leaks in local dev group', category:'technology', source:{name:'g/hardware'}, trustScore:84, isCommunity:true },
          { id:'c-2', title:'Solar power grid commissioned in Mysuru village', category:'science', source:{name:'g/greenenergy'}, trustScore:92, isCommunity:true },
          { id:'c-3', title:'Bengaluru startup funds AI healthcare app', category:'health', source:{name:'g/healthtech'}, trustScore:96, isCommunity:true },
        ]);
      });

    loadPolls();
    window.addEventListener('storage', loadPolls);
    return () => window.removeEventListener('storage', loadPolls);
  }, [isOpen]);

  if (!isOpen) return null;

  const isBanned     = (email) => banned.includes(email);
  const bannedCount  = banned.length;
  const activeUsers  = users.filter(u => !isBanned(u.email)).length;
  const comments     = totalComments();
  const totalVotesCast = getLiveTotalVotes();

  const notify_ = (msg) => { setNotify(msg); setTimeout(() => setNotify(''), 2500); };

  // ── User actions ────────────────────────────────────────────────────────────
  const banUser = (email) => {
    const next = [...banned, email];
    setBanned(next);
    localStorage.setItem('qn_banned', JSON.stringify(next));
    notify_(`🚫 ${email} has been banned.`);
  };
  const unbanUser = (email) => {
    const next = banned.filter(e => e !== email);
    setBanned(next);
    localStorage.setItem('qn_banned', JSON.stringify(next));
    notify_(`✅ ${email} has been unbanned.`);
  };
  const deleteUser = (email) => {
    const next = users.filter(u => u.email !== email);
    setUsers(next);
    localStorage.setItem('quicknews_user_db', JSON.stringify(next));
    notify_(`🗑️ Account deleted: ${email}`);
  };
  const promoteAdmin = (email) => {
    const next = users.map(u => u.email === email ? { ...u, role:'ADMIN' } : u);
    setUsers(next);
    localStorage.setItem('quicknews_user_db', JSON.stringify(next));
    notify_(`⭐ ${email} promoted to Admin.`);
  };

  // ── Post actions ────────────────────────────────────────────────────────────
  const deletePost = async (id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    try { await axios.delete(`http://localhost:8080/api/community/posts/${id}`); } catch {}
    notify_('🗑️ Post deleted.');
  };
  const verifyPost = async (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, trustScore: 99, verified: true } : p));
    try { await axios.put(`http://localhost:8080/api/community/posts/${id}/verify`); } catch {}
    notify_('✅ Post verified.');
  };

  // ── Settings save ───────────────────────────────────────────────────────────
  const updateSetting = (key, val) => {
    const next = { ...settings, [key]: val };
    setSettingsState(next);
    saveSettings(next);
    notify_(`⚙️ Setting updated.`);
  };

  // ── Dispatch Push Notification to all users ──────────────────────────────
  const handleDispatchPush = (e) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushBody.trim()) return;

    try {
      const notice = {
        id: `admin-push-${Date.now()}`,
        title: `📢 ${pushTitle.trim()}`,
        body: pushBody.trim(),
        type: 'admin',
        read: false,
        createdAt: new Date().toISOString()
      };

      // Store in guest list
      const guestList = JSON.parse(localStorage.getItem('qn_notifications_guest') || '[]');
      localStorage.setItem('qn_notifications_guest', JSON.stringify([notice, ...guestList]));

      // Store in all user notification keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('qn_notifications_') && key !== 'qn_notifications_guest') {
          const userList = JSON.parse(localStorage.getItem(key) || '[]');
          localStorage.setItem(key, JSON.stringify([notice, ...userList]));
        }
      }

      // Trigger window event so open navbar updates unread count
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('qn_notifications_updated'));

      // Fire browser alert if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(pushTitle.trim(), { body: pushBody.trim() });
      }

      setPushTitle('');
      setPushBody('');
      notify_('🔔 Broadcast push notification dispatched to all users!');
    } catch {
      notify_('❌ Failed to dispatch push notification.');
    }
  };

  // ── Poll Actions ───────────────────────────────────────────────────────────
  const savePolls = (list) => {
    setPolls(list);
    try {
      localStorage.setItem('qn_polls', JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    } catch {}
  };

  const handleCreatePoll = (e) => {
    e.preventDefault();
    if (!pollQuestion.trim() || !pollOptA.trim() || !pollOptB.trim()) {
      alert('Question and at least 2 options are required!');
      return;
    }

    const options = [pollOptA.trim(), pollOptB.trim()];
    if (pollOptC.trim()) options.push(pollOptC.trim());
    if (pollOptD.trim()) options.push(pollOptD.trim());

    const initialVotes = {};
    options.forEach(opt => {
      initialVotes[opt] = 0;
    });

    const newPoll = {
      id: `poll-${Date.now()}`,
      question: pollQuestion.trim(),
      options,
      votes: initialVotes,
      active: true,
      createdAt: new Date().toISOString()
    };

    const next = [newPoll, ...polls];
    savePolls(next);

    setPollQuestion('');
    setPollOptA('');
    setPollOptB('');
    setPollOptC('');
    setPollOptD('');
    notify_('🗳️ New poll created and live!');
  };

  const togglePollActive = (id) => {
    const next = polls.map(p => p.id === id ? { ...p, active: !p.active } : p);
    savePolls(next);
    notify_('⚙️ Poll status updated.');
  };

  const deletePoll = (id) => {
    if (window.confirm('Delete this poll permanently?')) {
      const next = polls.filter(p => p.id !== id);
      savePolls(next);
      notify_('🗑️ Poll deleted.');
    }
  };

  // ── Clear all comments ──────────────────────────────────────────────────────
  const clearAllComments = () => {
    localStorage.removeItem('qn_comments');
    notify_('🧹 All comments cleared.');
  };

  // ── Export users CSV ────────────────────────────────────────────────────────
  const exportUsers = () => {
    const csv = ['Name,Email,Role,Status', ...users.map(u => `${u.name},${u.email},${u.role},${isBanned(u.email)?'Banned':'Active'}`)].join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'quicknews_users.csv'; a.click();
    notify_('📥 Users exported.');
  };

  const filteredUsers = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // ── TAB CONTENT ─────────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (tab) {

      // ── ANALYTICS ──────────────────────────────────────────────────────────
      case 'analytics': return (
        <div>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'1rem',marginBottom:'2rem' }}>
            <StatCard label="Registered Users" value={users.length} color="#38bdf8" icon={<Users size={14}/>} />
            <StatCard label="Active Users"      value={activeUsers}  color="#22c55e" icon={<Activity size={14}/>} />
            <StatCard label="Total Votes Cast"  value={totalVotesCast} color="#a78bfa" icon={<ThumbsUp size={14}/>} />
            <StatCard label="Community Posts"   value={posts.length} color="#fb923c" icon={<Newspaper size={14}/>} />
            <StatCard label="Total Comments"    value={comments}     color="#e879f9" icon={<MessageSquare size={14}/>} />
            <StatCard label="Banned Users"      value={bannedCount}  color="#ef4444" icon={<Ban size={14}/>} />
          </div>

          {/* Platform health */}
          <h3 style={{ fontWeight:700,marginBottom:'1rem',color:'#fff' }}>Platform Health</h3>
          {[
            { label:'Registration', on:settings.registrationOpen, color:'#22c55e' },
            { label:'Commenting',   on:settings.commentsEnabled,  color:'#38bdf8' },
            { label:'Voting',       on:settings.votingEnabled,    color:'#a78bfa' },
            { label:'Auto-Approve Community Posts', on:settings.autoApprove, color:'#fb923c' },
            { label:'Anti-Fake Filter (≥70% dispute → hidden)', on:settings.antiFake, color:'#ef4444' },
          ].map(item => (
            <div key={item.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'.85rem 1rem',background:'rgba(255,255,255,.03)',borderRadius:'10px',marginBottom:'.5rem',border:'1px solid rgba(255,255,255,.06)' }}>
              <span style={{ fontSize:'.9rem',color:'#d4d4d8' }}>{item.label}</span>
              <span style={{ fontWeight:700,color:item.on?item.color:'#555',fontSize:'.85rem' }}>{item.on?'● Active':'○ Off'}</span>
            </div>
          ))}

          {/* Community posts trust breakdown */}
          {posts.length > 0 && <>
            <h3 style={{ fontWeight:700,margin:'1.5rem 0 1rem',color:'#fff' }}>Community Posts Trust Breakdown</h3>
            {posts.slice(0,5).map(p => {
              const articleId = getVoteKey(p);
              const savedVoteObj = (() => {
                try { return JSON.parse(localStorage.getItem('qn_article_votes') || '{}')[articleId] || {}; } catch { return {}; }
              })();
              const tVotes  = savedVoteObj.trustVotes ?? (p.trustVotes || 1);
              const dVotes  = savedVoteObj.disputeVotes ?? (p.notTrustVotes || 0);
              const totV    = tVotes + dVotes;
              const pct     = totV > 0 ? Math.round((tVotes / totV) * 100) : (p.trustScore || 80);

              return (
                <div key={p.id} style={{ background:'#1a1a1a',padding:'1rem',borderRadius:'12px',border:'1px solid rgba(255,255,255,.07)',marginBottom:'.75rem' }}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'.5rem' }}>
                    <span style={{ fontWeight:700,fontSize:'.9rem',color:'#e4e4e7' }}>{p.title}</span>
                    <span style={{ fontSize:'.8rem',fontWeight:700,color:pct>=70?'#22c55e':'#ef4444' }}>{pct}% Trust ({tVotes}👍 / {dVotes}👎)</span>
                  </div>
                  <div style={{ height:'5px',background:'#2a2a2a',borderRadius:'99px',overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${pct}%`,background:pct>=70?'#22c55e':'#ef4444',transition:'width .4s' }} />
                  </div>
                </div>
              );
            })}
          </>}
        </div>
      );

      // ── MANAGE NEWS & VOTING OVERRIDES ───────────────────────────────────────
      case 'news': return (
        <div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem' }}>
            <span style={{ color:'#a1a1aa',fontSize:'.9rem' }}>{posts.length} community post{posts.length!==1?'s':''} in database</span>
            <button onClick={() => axios.get('http://localhost:8080/api/community/posts',{timeout:2000}).then(r=>setPosts(r.data)).catch(()=>{})} style={{ background:'none',border:'1px solid rgba(255,255,255,.15)',color:'#a1a1aa',padding:'.4rem .8rem',borderRadius:'8px',cursor:'pointer',display:'flex',alignItems:'center',gap:'.4rem',fontSize:'.82rem' }}>
              <RefreshCw size={14}/> Refresh
            </button>
          </div>

          {posts.length === 0
            ? <div style={{ textAlign:'center',padding:'3rem',color:'#555' }}><Newspaper size={36} style={{ margin:'0 auto .75rem',display:'block',opacity:.3 }}/><p style={{ margin:0 }}>No community posts yet.</p></div>
            : posts.map(p => {
              const articleId = getVoteKey(p);
              const savedVoteObj = (() => {
                try { return JSON.parse(localStorage.getItem('qn_article_votes') || '{}')[articleId] || {}; } catch { return {}; }
              })();

              const tVotes  = savedVoteObj.trustVotes ?? (p.trustVotes || 1);
              const dVotes  = savedVoteObj.disputeVotes ?? (p.notTrustVotes || 0);
              const isLock  = !!savedVoteObj.locked;
              const totalV  = tVotes + dVotes;
              const trustPct = totalV > 0 ? Math.round((tVotes / totalV) * 100) : (p.trustScore || 84);
              const isDisputed = totalV > 0 && (dVotes / totalV) >= 0.7;

              const handleAdminResetVotes = () => {
                try {
                  const all = JSON.parse(localStorage.getItem('qn_article_votes') || '{}');
                  all[articleId] = { trustVotes: 0, disputeVotes: 0, locked: isLock };
                  localStorage.setItem('qn_article_votes', JSON.stringify(all));
                  notify_(`🔄 Votes reset for "${p.title.substring(0,25)}..."`);
                  setPosts([...posts]);
                } catch {}
              };

              const handleAdminToggleLock = () => {
                try {
                  const all = JSON.parse(localStorage.getItem('qn_article_votes') || '{}');
                  all[articleId] = { trustVotes: tVotes, disputeVotes: dVotes, locked: !isLock };
                  localStorage.setItem('qn_article_votes', JSON.stringify(all));
                  notify_(isLock ? `🔓 Voting unlocked for "${p.title.substring(0,25)}..."` : `🔒 Voting locked for "${p.title.substring(0,25)}..."`);
                  setPosts([...posts]);
                } catch {}
              };

              const handleAdminSetTrust = (score) => {
                try {
                  const all = JSON.parse(localStorage.getItem('qn_article_votes') || '{}');
                  all[articleId] = { trustVotes: score * 10, disputeVotes: (100 - score) * 10, locked: isLock };
                  localStorage.setItem('qn_article_votes', JSON.stringify(all));
                  notify_(`⭐ Trust score set to ${score}% for "${p.title.substring(0,25)}..."`);
                  setPosts([...posts]);
                } catch {}
              };

              return (
                <div key={p.id} style={{ display:'flex',flexDirection:'column',gap:'.75rem',background:'#1a1a1a',padding:'1.1rem',borderRadius:'16px',border:`1px solid ${isDisputed ? 'rgba(239,68,68,.4)' : 'rgba(255,255,255,.08)'}`,marginBottom:'1rem' }}>
                  
                  {/* Top info */}
                  <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'1rem' }}>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.3rem',flexWrap:'wrap' }}>
                        <span style={{ fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',color:'#38bdf8' }}>{p.category}</span>
                        {p.verified && <span style={{ fontSize:'.7rem',fontWeight:700,color:'#22c55e',background:'rgba(34,197,94,.12)',padding:'1px 7px',borderRadius:'99px' }}>✓ Verified</span>}
                        {isLock && <span style={{ fontSize:'.7rem',fontWeight:700,color:'#f59e0b',background:'rgba(245,158,11,.12)',padding:'1px 7px',borderRadius:'99px' }}>🔒 Voting Locked</span>}
                        {isDisputed && <span style={{ fontSize:'.7rem',fontWeight:700,color:'#ef4444',background:'rgba(239,68,68,.15)',padding:'1px 7px',borderRadius:'99px' }}>⚠️ HIGH DISPUTE</span>}
                      </div>
                      <h4 style={{ margin:'0 0 .35rem',fontWeight:700,fontSize:'1rem',color:'#e4e4e7' }}>{p.title}</h4>
                      <div style={{ fontSize:'.78rem',color:'#71717a' }}>
                        Trust: <strong style={{ color: trustPct>=70?'#22c55e':'#ef4444' }}>{trustPct}%</strong> · Live Votes: 👍 {tVotes} / 👎 {dVotes} · Source: {p.sourceName || p.source?.name || 'Community'}
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div style={{ display:'flex',gap:'.4rem',flexShrink:0 }}>
                      <button onClick={() => verifyPost(p.id)} title="Verify Post" style={{ background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.3)',color:'#22c55e',padding:'.5rem',borderRadius:'99px',cursor:'pointer',display:'flex' }}>
                        <CheckCircle size={17}/>
                      </button>
                      <button onClick={() => deletePost(p.id)} title="Delete Post" style={{ background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.3)',color:'#ef4444',padding:'.5rem',borderRadius:'99px',cursor:'pointer',display:'flex' }}>
                        <Trash2 size={17}/>
                      </button>
                    </div>
                  </div>

                  {/* Admin Voting Controls Panel */}
                  <div style={{ display:'flex',alignItems:'center',gap:'.75rem',background:'rgba(255,255,255,.03)',padding:'.65rem .85rem',borderRadius:'12px',border:'1px solid rgba(255,255,255,.05)',flexWrap:'wrap' }}>
                    <span style={{ fontSize:'.78rem',fontWeight:700,color:'#a1a1aa' }}>⚙️ Voting Controls:</span>

                    <button onClick={handleAdminToggleLock} style={{ background: isLock?'rgba(245,158,11,.15)':'rgba(255,255,255,.06)',border:`1px solid ${isLock?'#f59e0b':'rgba(255,255,255,.1)'}`,color: isLock?'#f59e0b':'#d4d4d8',padding:'.35rem .75rem',borderRadius:'7px',fontSize:'.78rem',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:'.3rem' }}>
                      {isLock ? <Unlock size={13}/> : <Lock size={13}/>} {isLock ? 'Unlock Voting' : 'Lock Voting'}
                    </button>

                    <button onClick={handleAdminResetVotes} style={{ background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',color:'#d4d4d8',padding:'.35rem .75rem',borderRadius:'7px',fontSize:'.78rem',fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:'.3rem' }}>
                      <RefreshCw size={13}/> Reset Votes
                    </button>

                    <div style={{ display:'flex',alignItems:'center',gap:'.3rem',marginLeft:'auto' }}>
                      <span style={{ fontSize:'.75rem',color:'#71717a' }}>Force Trust:</span>
                      <button onClick={()=>handleAdminSetTrust(99)} style={{ background:'rgba(34,197,94,.12)',border:'1px solid rgba(34,197,94,.3)',color:'#22c55e',padding:'.25rem .5rem',borderRadius:'6px',fontSize:'.75rem',fontWeight:700,cursor:'pointer' }}>
                        99% Trust
                      </button>
                      <button onClick={()=>handleAdminSetTrust(10)} style={{ background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.3)',color:'#ef4444',padding:'.25rem .5rem',borderRadius:'6px',fontSize:'.75rem',fontWeight:700,cursor:'pointer' }}>
                        10% Dispute
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          }

          {/* Danger zone */}
          <div style={{ marginTop:'1.5rem',padding:'1rem',borderRadius:'12px',border:'1px solid rgba(239,68,68,.25)',background:'rgba(239,68,68,.05)' }}>
            <h4 style={{ margin:'0 0 .75rem',color:'#ef4444',fontWeight:700 }}>⚠️ Danger Zone</h4>
            <button onClick={clearAllComments} style={{ background:'transparent',border:'1px solid #ef4444',color:'#ef4444',padding:'.5rem 1rem',borderRadius:'8px',cursor:'pointer',fontWeight:600,fontSize:'.85rem',display:'flex',alignItems:'center',gap:'.4rem' }}>
              <Trash2 size={14}/> Clear All Comments
            </button>
          </div>
        </div>
      );

      // ── USERS ───────────────────────────────────────────────────────────────
      case 'users': return (
        <div>
          <div style={{ display:'flex',gap:'.75rem',marginBottom:'1.25rem',flexWrap:'wrap' }}>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search users by name or email…"
              style={{ flex:1,minWidth:'180px',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'10px',padding:'.6rem .9rem',color:'#fff',fontSize:'.88rem' }}
            />
            <button onClick={exportUsers} style={{ background:'rgba(56,189,248,.1)',border:'1px solid rgba(56,189,248,.25)',color:'#38bdf8',padding:'.6rem 1rem',borderRadius:'10px',cursor:'pointer',display:'flex',alignItems:'center',gap:'.4rem',fontWeight:600,fontSize:'.85rem',whiteSpace:'nowrap' }}>
              <Download size={15}/> Export CSV
            </button>
          </div>

          {filteredUsers.length === 0
            ? <div style={{ textAlign:'center',padding:'2rem',color:'#555' }}>No users registered yet.</div>
            : filteredUsers.map(u => (
              <div key={u.email} style={{ display:'flex',alignItems:'center',gap:'1rem',background:'#1a1a1a',padding:'1rem',borderRadius:'14px',border:`1px solid ${isBanned(u.email)?'rgba(239,68,68,.25)':'rgba(255,255,255,.07)'}`,marginBottom:'.65rem' }}>
                <div style={{ width:'40px',height:'40px',borderRadius:'50%',background:`hsl(${(u.name||'U').charCodeAt(0)*7%360},50%,38%)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'#fff',fontSize:'1rem',flexShrink:0 }}>
                  {u.name?.[0]?.toUpperCase()||'?'}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:'.5rem' }}>
                    <span style={{ fontWeight:700,color:'#e4e4e7',fontSize:'.92rem' }}>{u.name}</span>
                    <span style={{ fontSize:'.7rem',fontWeight:700,padding:'1px 7px',borderRadius:'99px',background:u.role==='ADMIN'?'rgba(56,189,248,.15)':'rgba(255,255,255,.08)',color:u.role==='ADMIN'?'#38bdf8':'#a1a1aa' }}>{u.role}</span>
                    {isBanned(u.email) && <span style={{ fontSize:'.7rem',fontWeight:700,color:'#ef4444',background:'rgba(239,68,68,.12)',padding:'1px 7px',borderRadius:'99px' }}>BANNED</span>}
                  </div>
                  <div style={{ fontSize:'.78rem',color:'#555',marginTop:'.15rem' }}>{u.email}</div>
                </div>
                <div style={{ display:'flex',gap:'.35rem',flexShrink:0 }}>
                  {u.role !== 'ADMIN' && (
                    <button onClick={()=>promoteAdmin(u.email)} title="Promote to Admin" style={{ background:'rgba(56,189,248,.1)',border:'1px solid rgba(56,189,248,.2)',color:'#38bdf8',padding:'.4rem',borderRadius:'7px',cursor:'pointer',display:'flex' }}>
                      <ShieldCheck size={15}/>
                    </button>
                  )}
                  {!isBanned(u.email)
                    ? <button onClick={()=>banUser(u.email)} title="Ban User" style={{ background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',color:'#ef4444',padding:'.4rem',borderRadius:'7px',cursor:'pointer',display:'flex' }}><Ban size={15}/></button>
                    : <button onClick={()=>unbanUser(u.email)} title="Unban User" style={{ background:'rgba(34,197,94,.1)',border:'1px solid rgba(34,197,94,.2)',color:'#22c55e',padding:'.4rem',borderRadius:'7px',cursor:'pointer',display:'flex' }}><UserCheck size={15}/></button>
                  }
                  <button onClick={()=>{ if(window.confirm(`Delete account of ${u.name}? This cannot be undone.`)) deleteUser(u.email); }} title="Delete Account" style={{ background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.15)',color:'#ef4444',padding:'.4rem',borderRadius:'7px',cursor:'pointer',display:'flex' }}>
                    <Trash2 size={15}/>
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      );

      // ── SETTINGS ────────────────────────────────────────────────────────────
      case 'settings': return (
        <div style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
          {[
            { key:'registrationOpen',   label:'User Registration',         desc:'Allow new users to create accounts on QuickNews.',           color:'#22c55e' },
            { key:'commentsEnabled',    label:'Comments',                  desc:'Allow users to comment on news articles.',                   color:'#38bdf8' },
            { key:'votingEnabled',      label:'Trust Voting',              desc:'Allow users to cast Trust / Dispute votes on People\'s News.', color:'#a78bfa' },
            { key:'autoApprove',        label:'Auto-Approve Community Posts', desc:'New posts go live immediately without manual review.',      color:'#fb923c' },
            { key:'antiFake',           label:'Anti-Fake Filter',          desc:'Auto-hide posts when Dispute votes exceed 70%.',             color:'#ef4444' },
            { key:'maintenance',        label:'Maintenance Mode',          desc:'Pause the site for all non-admin users temporarily.',        color:'#f59e0b' },
            { key:'ttsEnabled',         label:'Read Aloud (TTS)',          desc:'Allow users to listen to audio text-to-speech summaries.',  color:'#e879f9' },
            { key:'tickerEnabled',      label:'Breaking News Ticker',      desc:'Display live breaking headlines ticker at top.',             color:'#ef4444' },
            { key:'carouselEnabled',    label:'Trending Carousel',         desc:'Display featured hero news slider.',                         color:'#f97316' },
            { key:'pollsEnabled',       label:'Opinion Polls Widget',      desc:'Display live citizen opinion polls widget.',                 color:'#a855f7' },
            { key:'leaderboardEnabled', label:'Reporters Leaderboard',     desc:'Display community reporter standings widget.',               color:'#fbbf24' },
          ].map(item => (
            <div key={item.key} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',background:'#1a1a1a',padding:'1.1rem 1.25rem',borderRadius:'14px',border:`1px solid ${settings[item.key]?`${item.color}30`:'rgba(255,255,255,.07)'}` }}>
              <div style={{ paddingRight:'1rem' }}>
                <h4 style={{ margin:'0 0 .2rem',fontSize:'1rem',fontWeight:700,color:'#e4e4e7' }}>{item.label}</h4>
                <p style={{ margin:0,fontSize:'.82rem',color:'#555' }}>{item.desc}</p>
              </div>
              <Toggle on={settings[item.key] !== false} onChange={()=>updateSetting(item.key, settings[item.key] === false ? true : false)} color={item.color} />
            </div>
          ))}

          {/* Broadcast Push Notification Dispatcher */}
          <div style={{ background:'#1a1a1a',padding:'1.25rem',borderRadius:'14px',border:'1px solid rgba(56,189,248,.2)',marginTop:'.5rem' }}>
            <h4 style={{ margin:'0 0 .75rem',fontWeight:700,color:'#38bdf8',display:'flex',alignItems:'center',gap:'.5rem' }}>
              <Bell size={16} color="#38bdf8"/> Dispatch Push Alert to All Users
            </h4>
            <form onSubmit={handleDispatchPush} style={{ display:'flex',flexDirection:'column',gap:'.75rem' }}>
              <input
                type="text"
                value={pushTitle}
                onChange={e=>setPushTitle(e.target.value)}
                placeholder="Alert Title (e.g. 📢 Emergency Weather Warning)"
                required
                style={{ width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'10px',padding:'.65rem .9rem',color:'#fff',fontSize:'.88rem',boxSizing:'border-box' }}
              />
              <textarea
                value={pushBody}
                onChange={e=>setPushBody(e.target.value)}
                rows={2}
                placeholder="Alert Body message..."
                required
                style={{ width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'10px',padding:'.65rem .9rem',color:'#fff',fontSize:'.88rem',resize:'none',boxSizing:'border-box',fontFamily:'inherit' }}
              />
              <button
                type="submit"
                style={{ background:'#38bdf8',border:'none',padding:'.65rem 1.25rem',borderRadius:'99px',color:'#000',fontWeight:700,cursor:'pointer',fontSize:'.88rem',alignSelf:'flex-start' }}
              >
                🔔 Push Alert to All Bell Triggers
              </button>
            </form>
          </div>

          {/* Broadcast message */}
          <div style={{ background:'#1a1a1a',padding:'1.25rem',borderRadius:'14px',border:'1px solid rgba(255,255,255,.07)',marginTop:'.5rem' }}>
            <h4 style={{ margin:'0 0 .75rem',fontWeight:700,color:'#e4e4e7',display:'flex',alignItems:'center',gap:'.5rem' }}><Bell size={16} color="#fb923c"/> Site-wide Announcement Banner</h4>
            <textarea
              value={broadcastMsg}
              onChange={e=>setBroadcastMsg(e.target.value)}
              rows={2}
              placeholder="Type an announcement banner message visible on homepage top…"
              style={{ width:'100%',background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'10px',padding:'.75rem',color:'#fff',fontSize:'.88rem',resize:'none',boxSizing:'border-box',fontFamily:'inherit' }}
            />
            <button
              onClick={()=>{ if(broadcastMsg.trim()){ localStorage.setItem('qn_broadcast', broadcastMsg.trim()); notify_('📢 Announcement saved!'); }}}
              style={{ marginTop:'.65rem',background:'#fb923c',border:'none',padding:'.6rem 1.25rem',borderRadius:'99px',color:'#000',fontWeight:700,cursor:'pointer',fontSize:'.88rem' }}
            >
              📢 Publish Banner
            </button>
            {localStorage.getItem('qn_broadcast') && (
              <button onClick={()=>{ localStorage.removeItem('qn_broadcast'); notify_('Announcement removed.'); }} style={{ marginTop:'.5rem',marginLeft:'.5rem',background:'transparent',border:'1px solid #ef4444',color:'#ef4444',padding:'.5rem .9rem',borderRadius:'8px',cursor:'pointer',fontSize:'.82rem' }}>
                Remove
              </button>
            )}
          </div>

          {/* Reset all data */}
          <div style={{ padding:'1rem 1.25rem',borderRadius:'12px',border:'1px solid rgba(239,68,68,.3)',background:'rgba(239,68,68,.05)',marginTop:'.5rem' }}>
            <h4 style={{ margin:'0 0 .75rem',color:'#ef4444',fontWeight:700 }}>⚠️ Danger Zone</h4>
            <div style={{ display:'flex',gap:'.5rem',flexWrap:'wrap' }}>
              <button onClick={()=>{ if(window.confirm('Delete ALL user accounts? Cannot be undone.')){ localStorage.removeItem('quicknews_user_db'); setUsers([]); notify_('All users deleted.'); }}} style={{ background:'transparent',border:'1px solid #ef4444',color:'#ef4444',padding:'.5rem .9rem',borderRadius:'8px',cursor:'pointer',fontWeight:600,fontSize:'.82rem',display:'flex',alignItems:'center',gap:'.35rem' }}>
                <Trash2 size={13}/> Delete All Users
              </button>
              <button onClick={()=>{ if(window.confirm('Clear all comments?')){ clearAllComments(); }}} style={{ background:'transparent',border:'1px solid #ef4444',color:'#ef4444',padding:'.5rem .9rem',borderRadius:'8px',cursor:'pointer',fontWeight:600,fontSize:'.82rem',display:'flex',alignItems:'center',gap:'.35rem' }}>
                <Trash2 size={13}/> Clear All Comments
              </button>
              <button onClick={()=>{ if(window.confirm('Clear all banned users?')){ setBanned([]); localStorage.removeItem('qn_banned'); notify_('Ban list cleared.'); }}} style={{ background:'transparent',border:'1px solid #f59e0b',color:'#f59e0b',padding:'.5rem .9rem',borderRadius:'8px',cursor:'pointer',fontWeight:600,fontSize:'.82rem',display:'flex',alignItems:'center',gap:'.35rem' }}>
                <Unlock size={13}/> Unban Everyone
              </button>
              <button onClick={()=>{ if(window.confirm('WARNING: Factory reset system storage? All local data will be wiped.')){ localStorage.clear(); window.location.reload(); }}} style={{ background:'#ef4444',border:'none',color:'#fff',padding:'.5rem .9rem',borderRadius:'8px',cursor:'pointer',fontWeight:700,fontSize:'.82rem',display:'flex',alignItems:'center',gap:'.35rem' }}>
                <RefreshCw size={13}/> Full Factory System Reset
              </button>
            </div>
          </div>
        </div>
      );

      case 'polls': return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
          {/* Create Poll Card Form */}
          <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(255,255,255,.07)' }}>
            <h3 style={{ margin: '0 0 1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              <PlusCircle size={18} color="#38bdf8" /> Create New Opinion Poll
            </h3>
            <form onSubmit={handleCreatePoll} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '.82rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>Question</label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="e.g. Do you support free public transit?"
                  required
                  style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '10px', padding: '.7rem', color: '#fff', fontSize: '.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '.82rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>Option A *</label>
                  <input
                    type="text"
                    value={pollOptA}
                    onChange={e => setPollOptA(e.target.value)}
                    placeholder="e.g. Yes, absolutely"
                    required
                    style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '10px', padding: '.7rem', color: '#fff', fontSize: '.88rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '.82rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>Option B *</label>
                  <input
                    type="text"
                    value={pollOptB}
                    onChange={e => setPollOptB(e.target.value)}
                    placeholder="e.g. No, bad idea"
                    required
                    style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '10px', padding: '.7rem', color: '#fff', fontSize: '.88rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '.82rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>Option C (Optional)</label>
                  <input
                    type="text"
                    value={pollOptC}
                    onChange={e => setPollOptC(e.target.value)}
                    placeholder="e.g. Only for students"
                    style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '10px', padding: '.7rem', color: '#fff', fontSize: '.88rem', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '.82rem', color: '#a1a1aa', fontWeight: 600, display: 'block', marginBottom: '.35rem' }}>Option D (Optional)</label>
                  <input
                    type="text"
                    value={pollOptD}
                    onChange={e => setPollOptD(e.target.value)}
                    placeholder="e.g. Undecided"
                    style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '10px', padding: '.7rem', color: '#fff', fontSize: '.88rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{ background: '#38bdf8', border: 'none', borderRadius: '10px', padding: '.75rem', color: '#000', fontWeight: 700, fontSize: '.9rem', cursor: 'pointer', marginTop: '.25rem' }}
              >
                🗳️ Deploy New Poll
              </button>
            </form>
          </div>

          {/* Manage Existing Polls */}
          <div>
            <h3 style={{ margin: '0 0 1rem', fontWeight: 800, color: '#fff' }}>Existing Polls ({polls.length})</h3>
            {polls.length === 0 ? (
              <div style={{ padding: '3rem', background: '#1a1a1a', borderRadius: '18px', textAlign: 'center', color: '#555' }}>
                No active or past polls. Create one above!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {polls.map(poll => {
                  const votes = poll.votes || {};
                  const total = Object.values(votes).reduce((sum, v) => sum + v, 0);

                  return (
                    <div key={poll.id} style={{ background: '#1a1a1a', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '.95rem' }}>{poll.question}</span>
                        <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: poll.active ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)', color: poll.active ? '#22c55e' : '#ef4444' }}>
                          {poll.active ? 'Active' : 'Closed'}
                        </span>
                      </div>

                      {/* Vote breakdown bar percentages */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                        {poll.options.map(opt => {
                          const count = votes[opt] || 0;
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <div key={opt} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '.8rem', color: '#d4d4d8', background: 'rgba(255,255,255,.03)', padding: '.45rem .75rem', borderRadius: '8px' }}>
                              <span>{opt}</span>
                              <span style={{ fontWeight: 700 }}>{pct}% ({count} votes)</span>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.78rem', color: '#555', borderTop: '1px solid rgba(255,255,255,.04)', paddingTop: '.65rem' }}>
                        <span>Total votes: {total} · Created {new Date(poll.createdAt).toLocaleDateString()}</span>
                        <div style={{ display: 'flex', gap: '.5rem' }}>
                          <button onClick={() => togglePollActive(poll.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.2)', color: '#fff', padding: '.3rem .75rem', borderRadius: '6px', fontSize: '.78rem', cursor: 'pointer' }}>
                            {poll.active ? 'Close Poll' : 'Reopen Poll'}
                          </button>
                          <button onClick={() => deletePoll(poll.id)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '.3rem .75rem', borderRadius: '6px', fontSize: '.78rem', cursor: 'pointer' }}>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="modal-overlay">
      <style>{`
        .admin-modal-container {
          display: flex;
          flex-direction: row;
          max-width: 1060px;
          width: 96%;
          border-radius: 24px;
          background: #0e0e0e;
          border: 1px solid rgba(255,255,255,.12);
          color: #f8fafc;
          max-height: 92vh;
          overflow: hidden;
        }
        .admin-sidebar {
          width: 230px;
          background: #080808;
          border-right: 1px solid rgba(255,255,255,.08);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        .admin-sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: .35rem;
          flex: 1;
        }
        @media (max-width: 768px) {
          .admin-modal-container {
            flex-direction: column !important;
            max-height: 95vh !important;
            width: 100% !important;
            border-radius: 16px !important;
          }
          .admin-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,.08) !important;
            padding: 0.85rem 1rem !important;
          }
          .admin-sidebar-brand {
            margin-bottom: 0.75rem !important;
          }
          .admin-sidebar-nav {
            flex-direction: row !important;
            overflow-x: auto !important;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 0.25rem;
          }
          .admin-sidebar-nav::-webkit-scrollbar {
            display: none;
          }
          .admin-sidebar-nav button {
            white-space: nowrap !important;
            padding: 0.5rem 0.85rem !important;
          }
          .admin-sidebar-footer {
            display: none !important;
          }
        }
      `}</style>

      <div className="admin-modal-container">

        {/* ── Sidebar ── */}
        <div className="admin-sidebar">
          <div className="admin-sidebar-brand" style={{ display:'flex',alignItems:'center',gap:'.6rem',marginBottom:'2rem',color:'#ef4444' }}>
            <ShieldAlert size={24}/><span style={{ fontSize:'1.2rem',fontWeight:800 }}>Admin</span>
          </div>

          <nav className="admin-sidebar-nav">
            <NavBtn icon={<BarChart3 size={18}/>}  label="Analytics"    active={tab==='analytics'} onClick={()=>setTab('analytics')} />
            <NavBtn icon={<CheckCircle size={18}/>}label="Manage Polls" active={tab==='polls'}     onClick={()=>setTab('polls')} />
            <NavBtn icon={<Newspaper size={18}/>}  label="Manage News"  active={tab==='news'}      onClick={()=>setTab('news')}      badge={posts.filter(p=>!p.verified).length} />
            <NavBtn icon={<Users size={18}/>}       label="Users"        active={tab==='users'}     onClick={()=>setTab('users')}     badge={bannedCount} />
            <NavBtn icon={<Settings size={18}/>}    label="Settings"     active={tab==='settings'}  onClick={()=>setTab('settings')} />
          </nav>

          <div className="admin-sidebar-footer" style={{ marginTop:'auto',paddingTop:'1rem',borderTop:'1px solid rgba(255,255,255,.06)',fontSize:'.75rem',color:'#333' }}>
            QuickNews Admin v2.0
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ flex:1,display:'flex',flexDirection:'column',overflow:'hidden' }}>
          {/* Top bar */}
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem 1.25rem',borderBottom:'1px solid rgba(255,255,255,.07)',flexShrink:0 }}>
            <div>
              <h2 style={{ margin:0,fontSize:'clamp(1.1rem, 2.5vw, 1.4rem)',fontWeight:800,textTransform:'capitalize' }}>
                {tab === 'analytics' ? '📊 Analytics' : tab === 'polls' ? '🗳️ Manage Polls' : tab === 'news' ? '📰 Manage News' : tab === 'users' ? '👥 Users' : '⚙️ Settings'}
              </h2>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,.08)',border:'none',borderRadius:'50%',padding:'.5rem',color:'#fff',cursor:'pointer',display:'flex' }}>
              <X size={20}/>
            </button>
          </div>

          {/* Notification toast */}
          {notify && (
            <div style={{ margin:'.75rem 1.25rem 0',padding:'.7rem 1rem',background:'rgba(56,189,248,.12)',border:'1px solid rgba(56,189,248,.3)',borderRadius:'10px',fontSize:'.88rem',color:'#38bdf8',fontWeight:600,animation:'fadeIn .2s' }}>
              {notify}
            </div>
          )}

          {/* Content */}
          <div style={{ flex:1,overflowY:'auto',padding:'1.25rem' }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
