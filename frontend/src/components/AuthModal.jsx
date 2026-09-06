import React, { useState } from 'react';
import { X, ShieldAlert, User as UserIcon, CheckCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

// ─── Local user database (registered accounts) ─────────────────────────────
const getLocalUsers = () => {
  try { return JSON.parse(localStorage.getItem('quicknews_user_db') || '[]'); } catch { return []; }
};

const findLocalUser = (email, password) => {
  return getLocalUsers().find(u =>
    u.email.toLowerCase() === email.toLowerCase() && u.password === password
  ) || null;
};

const emailExists = (email) => {
  return getLocalUsers().some(u => u.email.toLowerCase() === email.toLowerCase());
};

const registerLocalUser = (newUser) => {
  try {
    const users = getLocalUsers();
    users.push(newUser);
    localStorage.setItem('quicknews_user_db', JSON.stringify(users));
  } catch {}
};

export const INDIAN_STATES = [
  'Maharashtra (Mumbai/Pune/Nagpur)',
  'Delhi NCR (New Delhi/Noida/Gurugram)',
  'Karnataka (Bengaluru/Mysuru)',
  'Tamil Nadu (Chennai/Coimbatore)',
  'Uttar Pradesh (Lucknow/Noida/Varanasi)',
  'Telangana (Hyderabad)',
  'Gujarat (Ahmedabad/Surat)',
  'West Bengal (Kolkata)',
  'Punjab (Chandigarh/Amritsar)',
  'Kerala (Kochi/Thiruvananthapuram)',
  'Rajasthan (Jaipur/Udaipur)',
  'Madhya Pradesh (Bhopal/Indore)',
  'Bihar (Patna)',
  'Andhra Pradesh (Visakhapatnam/Vijayawada)',
  'Odisha (Bhubaneswar)',
  'Haryana (Gurugram/Faridabad)',
  'Assam / North East (Guwahati)',
  'Jammu & Kashmir (Srinagar/Jammu)',
  'Goa (Panaji)',
  'Himachal Pradesh (Shimla)',
  'Uttarakhand (Dehradun)',
  'Jharkhand (Ranchi)',
  'Chhattisgarh (Raipur)',
  'International (USA / UK / Europe / Global)'
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [authMode, setAuthMode] = useState('user');   // 'user' | 'admin'
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [stateRegion, setStateRegion] = useState('Maharashtra (Mumbai/Pune)');
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPwd, setShowPwd]     = useState(false);

  if (!isOpen) return null;

  const reset = () => { setName(''); setEmail(''); setPassword(''); setErrorMsg(''); setSuccessMsg(''); };

  const switchTab = (mode) => { setAuthMode(mode); setIsSignup(false); reset(); };
  const switchMode = () => { setIsSignup(s => !s); reset(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimEmail = email.trim().toLowerCase();
    const trimPass  = password.trim();
    const trimName  = name.trim();

    // ── Basic validation ──────────────────────────────────────────────────
    if (!trimEmail || !trimPass) { setErrorMsg('Please fill in all fields.'); return; }
    if (isSignup && !trimName)   { setErrorMsg('Please enter your full name.'); return; }
    if (trimPass.length < 6)     { setErrorMsg('Password must be at least 6 characters.'); return; }

    setLoading(true);

    // ── ADMIN LOGIN — single authorised admin only ────────────────────────
    if (authMode === 'admin') {
      if (trimEmail === 'onkarpawar238@gmail.com' && trimPass === 'onkar@983') {
        const adminObj = { id: 0, name: 'Onkar Pawar', email: trimEmail, role: 'ADMIN', location: 'Maharashtra (Mumbai/Pune)' };
        localStorage.setItem('quicknews_current_user', JSON.stringify(adminObj));
        setLoading(false);
        onLoginSuccess(adminObj);
        onClose();
      } else {
        setErrorMsg('❌ Access denied. You are not authorised as an admin.');
        setLoading(false);
      }
      return;
    }

    // ── Check Admin Banned List ───────────────────────────────────────────
    try {
      const bannedList = JSON.parse(localStorage.getItem('qn_banned') || '[]');
      if (bannedList.includes(trimEmail) && authMode !== 'admin') {
        setErrorMsg('🚫 Your account has been suspended by the Admin.');
        setLoading(false);
        return;
      }
    } catch {}

    // ── Check Admin Settings (Registration Open) ─────────────────────────
    if (isSignup) {
      try {
        const settings = JSON.parse(localStorage.getItem('qn_settings') || '{}');
        if (settings.registrationOpen === false) {
          setErrorMsg('⚠️ New user registrations are currently paused by the Admin.');
          setLoading(false);
          return;
        }
      } catch {}

      if (emailExists(trimEmail)) {
        setErrorMsg('This email is already registered. Please sign in.');
        setLoading(false);
        return;
      }

      const newUser = {
        id: Date.now(),
        name: trimName,
        email: trimEmail,
        password: trimPass,
        location: stateRegion,
        role: 'USER'
      };

      try {
        const res = await axios.post('http://localhost:8080/api/auth/signup', newUser, { timeout: 3000 });
        const saved = { ...newUser, ...(res.data || {}) };
        registerLocalUser(saved);
        localStorage.setItem('quicknews_current_user', JSON.stringify(saved));
        setLoading(false);
        onLoginSuccess(saved);
        onClose();
      } catch {
        registerLocalUser(newUser);
        localStorage.setItem('quicknews_current_user', JSON.stringify(newUser));
        setLoading(false);
        onLoginSuccess(newUser);
        onClose();
      }
      return;
    }

    // ── USER LOGIN (only registered users can log in) ──────────────────────
    if (!isSignup) {
      // Try Spring Boot backend first
      try {
        const res = await axios.post('http://localhost:8080/api/auth/login', { email: trimEmail, password: trimPass }, { timeout: 3000 });
        if (res.data) {
          const userObj = res.data;
          localStorage.setItem('quicknews_current_user', JSON.stringify(userObj));
          setLoading(false);
          onLoginSuccess(userObj);
          onClose();
          return;
        }
      } catch (err) {
        // Backend offline — fall through to local check
      }

      // Backend offline: check local registered users only
      const localUser = findLocalUser(trimEmail, trimPass);
      if (localUser) {
        const { password: _, ...safeUser } = localUser;
        localStorage.setItem('quicknews_current_user', JSON.stringify(safeUser));
        setLoading(false);
        onLoginSuccess(safeUser);
        onClose();
      } else {
        // Check if email exists but password is wrong vs email not registered at all
        if (emailExists(trimEmail)) {
          setErrorMsg('❌ Incorrect password. Please try again.');
        } else {
          setErrorMsg('❌ No account found with this email. Please register first.');
        }
        setLoading(false);
      }
      return;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth:'460px', background:'#121212', border:'1px solid rgba(255,255,255,0.15)', color:'#f8fafc' }}>

        {/* Header */}
        <div className="modal-header" style={{ marginBottom:'1.2rem' }}>
          <div style={{ display:'flex',alignItems:'center',gap:'0.6rem' }}>
            <div style={{ background:authMode==='admin'?'#ef4444':'#38bdf8',padding:'0.5rem',borderRadius:'12px',color:'#000',display:'flex' }}>
              {authMode === 'admin' ? <ShieldAlert size={20}/> : <UserIcon size={20}/>}
            </div>
            <div>
              <h2 style={{ fontSize:'1.35rem',fontWeight:'800',lineHeight:'1.2' }}>
                {authMode === 'admin' ? 'Admin Portal' : isSignup ? 'Create Account' : 'Sign In'}
              </h2>
              <p style={{ fontSize:'0.78rem',color:'#a1a1aa' }}>
                {authMode === 'admin' ? 'Access the admin dashboard' : isSignup ? 'Join QuickNews for free' : 'Welcome back to QuickNews'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)',border:'none',borderRadius:'50%',padding:'0.4rem',color:'#fff',cursor:'pointer',display:'flex' }}>
            <X size={18}/>
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.4rem',background:'rgba(255,255,255,0.05)',padding:'0.25rem',borderRadius:'12px',marginBottom:'1.2rem' }}>
          <button type="button" onClick={() => switchTab('user')} style={{ padding:'0.6rem',minHeight:'44px',borderRadius:'9px',border:'none',background:authMode==='user'?'#38bdf8':'transparent',color:authMode==='user'?'#000':'#a1a1aa',fontWeight:'700',fontSize:'0.85rem',cursor:'pointer',transition:'all 0.2s' }}>
            👤 User
          </button>
          <button type="button" onClick={() => switchTab('admin')} style={{ padding:'0.6rem',minHeight:'44px',borderRadius:'9px',border:'none',background:authMode==='admin'?'#ef4444':'transparent',color:authMode==='admin'?'#fff':'#a1a1aa',fontWeight:'700',fontSize:'0.85rem',cursor:'pointer',transition:'all 0.2s' }}>
            ⚙️ Admin
          </button>
        </div>

        {/* Error / Success messages */}
        {errorMsg && (
          <div style={{ background:'rgba(239,68,68,0.12)',border:'1px solid rgba(239,68,68,0.4)',color:'#fca5a5',padding:'0.65rem 0.85rem',borderRadius:'10px',fontSize:'0.85rem',marginBottom:'1rem' }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.4)',color:'#86efac',padding:'0.65rem 0.85rem',borderRadius:'10px',fontSize:'0.85rem',marginBottom:'1rem',display:'flex',alignItems:'center',gap:'0.4rem' }}>
            <CheckCircle size={16}/> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name & Location — Signup only */}
          {isSignup && authMode === 'user' && (
            <>
              <div className="form-group" style={{ marginBottom:'1rem' }}>
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" placeholder="e.g. Rahul Sharma" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom:'1rem' }}>
                <label className="form-label">📍 Your State / Region (For Near Me News)</label>
                <select
                  className="form-input"
                  value={stateRegion}
                  onChange={e => setStateRegion(e.target.value)}
                  style={{ background: '#1c1c1c', color: '#fff', cursor: 'pointer' }}
                >
                  {INDIAN_STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Email */}
          <div className="form-group" style={{ marginBottom:'1rem' }}>
            <label className="form-label">{authMode === 'admin' ? 'Admin Email' : 'Email Address'}</label>
            <input type="email" className="form-input" placeholder={authMode === 'admin' ? 'admin@quicknews.in' : 'you@example.com'} value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom:'1.5rem' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                className="form-input"
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ width: '100%', boxSizing: 'border-box', paddingRight: '2.8rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{ position:'absolute', right:'0.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#a1a1aa', cursor:'pointer', display:'flex', padding:0 }}
              >
                {showPwd ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="btn-primary" disabled={loading} style={{ width:'100%',justifyContent:'center',padding:'0.8rem',borderRadius:'12px',fontSize:'0.95rem',fontWeight:'700',background:authMode==='admin'?'#ef4444':'var(--accent-gradient)',border:'none',color:'#fff',cursor:'pointer' }}>
            {loading
              ? 'Please wait…'
              : authMode === 'admin'
                ? '🔐 Login as Admin'
                : isSignup
                  ? '🚀 Create My Account'
                  : '⚡ Sign In'
            }
          </button>

          {/* Switch between Login ↔ Register (user mode only) */}
          {authMode === 'user' && (
            <p style={{ textAlign:'center',marginTop:'1.1rem',fontSize:'0.85rem',color:'#a1a1aa' }}>
              {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              <button type="button" onClick={switchMode} style={{ background:'none',border:'none',color:'#38bdf8',fontWeight:'700',cursor:'pointer',fontSize:'0.85rem' }}>
                {isSignup ? 'Sign In →' : 'Register Here →'}
              </button>
            </p>
          )}

          {/* Login reminder — shown on login tab */}
          {authMode === 'user' && !isSignup && (
            <p style={{ textAlign:'center',marginTop:'0.5rem',fontSize:'0.78rem',color:'#555' }}>
              Only registered accounts can sign in.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
