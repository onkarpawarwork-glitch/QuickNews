import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Moon, Sun, PlusCircle, Zap, Globe, BarChart3,
  LogIn, LogOut, UserCheck, ShieldAlert, Bell, Download,
  Menu, X, Bookmark
} from 'lucide-react';
import { t } from '../utils/i18n';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({
  darkMode,
  setDarkMode,
  onSearch,
  onOpenCommunityModal,
  onOpenAdminModal,
  onOpenAuthModal,
  onOpenProfileModal,
  user,
  onLogout,
  onViewSaved,
  savedCount = 0,
  notificationsCount = 0,
  isInstallable = false,
  onInstall,
  selectedLang = 'en',
  setSelectedLang
}) {
  const [query, setQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Close drawer on route/resize
  useEffect(() => {
    const closeOnResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', closeOnResize);
    return () => window.removeEventListener('resize', closeOnResize);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchRef.current) searchRef.current.focus();
  }, [isSearchOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
    setIsSearchOpen(false);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  /* ─── Shared style tokens ─── */
  const btnBase = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-primary)',
    width: '44px', height: '44px',
    minWidth: '44px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
    transition: 'all 0.2s',
  };

  const Badge = ({ count }) => count > 0 ? (
    <span style={{
      position: 'absolute', top: '-3px', right: '-3px',
      background: '#ef4444', color: '#fff',
      fontSize: '.6rem', fontWeight: 800,
      width: '16px', height: '16px', borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {count > 9 ? '9+' : count}
    </span>
  ) : null;

  /* ─── Desktop search bar ─── */
  const DesktopSearch = () => (
    <form className="search-box" onSubmit={handleSubmit} style={{ display: 'flex' }}>
      <Search className="search-icon-left" size={17} />
      <input
        type="text"
        className="search-input"
        placeholder={t(selectedLang, 'searchPlaceholder')}
        value={query}
        onChange={e => { setQuery(e.target.value); onSearch(e.target.value); }}
      />
    </form>
  );

  /* ─── User pill (desktop) ─── */
  const UserPill = ({ onClick }) => (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem',
        background: user.role === 'ADMIN' ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.15)',
        border: user.role === 'ADMIN' ? '1px solid #ef4444' : '1px solid #38bdf8',
        color: user.role === 'ADMIN' ? '#ef4444' : '#38bdf8',
        padding: '0.4rem 0.75rem', borderRadius: '99px',
        fontSize: '0.82rem', fontWeight: 700,
        cursor: 'pointer', maxWidth: '160px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}
    >
      {user.role === 'ADMIN' ? <ShieldAlert size={14} /> : <UserCheck size={14} />}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</span>
    </button>
  );

  return (
    <>
      <header className="navbar">
        {/* ── Top row: always visible ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '0.6rem' }}>

          {/* Brand */}
          <div className="brand" onClick={() => { setQuery(''); onSearch(''); closeMobileMenu(); }}>
            <div className="brand-icon"><Zap size={20} fill="white" /></div>
            <span>Quick<span className="brand-accent">News</span></span>
          </div>

          {/* Desktop: Search bar (hidden on mobile) */}
          <div style={{ flex: 1, display: 'none' }} className="desktop-search-wrap">
            <DesktopSearch />
          </div>

          {/* Desktop: Nav controls (hidden on mobile, shown via CSS) */}
          <div style={{ display: 'none' }} className="desktop-nav-controls">
            <div className="nav-controls">
              {/* Language */}
              <div className="lang-selector">
                <Globe size={15} />
                <select className="lang-select" value={selectedLang} onChange={e => setSelectedLang(e.target.value)}>
                  <option value="en">🇬🇧 English</option>
                  <option value="mr">🚩 मराठी</option>
                  <option value="hi">🇮🇳 हिंदी</option>
                  <option value="ta">🏛️ தமிழ்</option>
                  <option value="te">🏛️ తెలుగు</option>
                </select>
              </div>

              {/* Report News */}
              <button className="btn-primary" onClick={onOpenCommunityModal}>
                <PlusCircle size={17} />
                <span>{t(selectedLang, 'reportNews')}</span>
              </button>

              {/* Saved */}
              {user && (
                <button style={btnBase} title="Saved" onClick={onViewSaved}>
                  <Bookmark size={18} />
                  <Badge count={savedCount} />
                </button>
              )}

              {/* Notifications */}
              <div style={{ position: 'relative' }}>
                <button style={btnBase} onClick={() => setIsNotificationsOpen(v => !v)}>
                  <Bell size={18} />
                  <Badge count={notificationsCount} />
                </button>
                <NotificationDropdown user={user} darkMode={darkMode} isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
              </div>

              {/* Admin */}
              {user?.role === 'ADMIN' && (
                <button style={{ ...btnBase, background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid #ef4444' }} onClick={onOpenAdminModal}>
                  <BarChart3 size={19} />
                </button>
              )}

              {/* User / Login */}
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <UserPill onClick={onOpenProfileModal} />
                  <button style={btnBase} onClick={onLogout} title="Logout">
                    <LogOut size={17} />
                  </button>
                </div>
              ) : (
                <button className="btn-primary" onClick={onOpenAuthModal}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>
                  <LogIn size={17} />
                  <span>{t(selectedLang, 'login')}</span>
                </button>
              )}

              {/* PWA Install */}
              {isInstallable && (
                <button style={{ ...btnBase, color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)' }} onClick={onInstall}>
                  <Download size={18} />
                </button>
              )}

              {/* Dark mode */}
              <button style={btnBase} onClick={() => setDarkMode(v => !v)}>
                {darkMode ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#6366f1" />}
              </button>
            </div>
          </div>

          {/* ── Mobile: compact icon row ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="mobile-nav-icons">

            {/* Mobile search toggle */}
            <button style={btnBase} onClick={() => setIsSearchOpen(v => !v)} aria-label="Search">
              {isSearchOpen ? <X size={18} /> : <Search size={18} />}
            </button>

            {/* Saved button (Icon only - no 'Saved' text) */}
            {user && (
              <button style={btnBase} title="Saved" onClick={onViewSaved} aria-label="Saved articles">
                <Bookmark size={18} />
                <Badge count={savedCount} />
              </button>
            )}

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button style={btnBase} onClick={() => setIsNotificationsOpen(v => !v)}>
                <Bell size={18} />
                <Badge count={notificationsCount} />
              </button>
              <NotificationDropdown user={user} darkMode={darkMode} isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
            </div>

            {/* Dark mode */}
            <button style={btnBase} onClick={() => setDarkMode(v => !v)}>
              {darkMode ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} color="#6366f1" />}
            </button>

            {/* Hamburger */}
            <button style={{ ...btnBase, background: isMobileMenuOpen ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: isMobileMenuOpen ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
              onClick={() => setIsMobileMenuOpen(v => !v)} aria-label="Menu">
              {isMobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* ── Mobile expandable search bar ── */}
        {isSearchOpen && (
          <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: '0.6rem', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search style={{ position: 'absolute', left: '0.8rem', color: 'var(--text-muted)', pointerEvents: 'none' }} size={17} />
            <input
              ref={searchRef}
              type="text"
              className="search-input"
              placeholder={t(selectedLang, 'searchPlaceholder')}
              value={query}
              onChange={e => { setQuery(e.target.value); onSearch(e.target.value); }}
              style={{ width: '100%' }}
            />
          </form>
        )}

        {/* ── Mobile Drawer ── */}
        {isMobileMenuOpen && (
          <nav style={{
            width: '100%',
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            animation: 'drawerSlide 0.2s ease',
          }}>
            {/* Language */}
            <div className="lang-selector" style={{ width: '100%', justifyContent: 'center' }}>
              <Globe size={15} />
              <select className="lang-select" value={selectedLang} onChange={e => setSelectedLang(e.target.value)} style={{ flex: 1 }}>
                <option value="en">🇬🇧 English</option>
                <option value="mr">🚩 मराठी (Marathi)</option>
                <option value="hi">🇮🇳 हिंदी (Hindi)</option>
                <option value="ta">🏛️ தமிழ் (Tamil)</option>
                <option value="te">🏛️ తెలుగు (Telugu)</option>
              </select>
            </div>

            {/* Actions row */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => { onOpenCommunityModal(); closeMobileMenu(); }} style={{ flex: 1, justifyContent: 'center', minWidth: '140px' }}>
                <PlusCircle size={17} />
                <span>{t(selectedLang, 'reportNews')}</span>
              </button>

              {isInstallable && (
                <button className="btn-primary" onClick={() => { onInstall(); closeMobileMenu(); }}
                  style={{ flex: '0 0 auto', justifyContent: 'center', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', boxShadow: 'none' }}>
                  <Download size={17} />
                </button>
              )}
            </div>

            {/* Admin */}
            {user?.role === 'ADMIN' && (
              <button onClick={() => { onOpenAdminModal(); closeMobileMenu(); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem', borderRadius: '10px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>
                <BarChart3 size={18} /> Admin Dashboard
              </button>
            )}

            {/* User / Login */}
            {user ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button onClick={() => { onOpenProfileModal(); closeMobileMenu(); }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.65rem', borderRadius: '10px', background: user.role === 'ADMIN' ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.15)', border: user.role === 'ADMIN' ? '1px solid #ef4444' : '1px solid #38bdf8', color: user.role === 'ADMIN' ? '#ef4444' : '#38bdf8', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', overflow: 'hidden' }}>
                  {user.role === 'ADMIN' ? <ShieldAlert size={16} /> : <UserCheck size={16} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                </button>
                <button onClick={() => { onLogout(); closeMobileMenu(); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.65rem', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', minWidth: '44px' }}>
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <button className="btn-primary" onClick={() => { onOpenAuthModal(); closeMobileMenu(); }}
                style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', boxShadow: 'none' }}>
                <LogIn size={17} />
                <span>{t(selectedLang, 'login')}</span>
              </button>
            )}
          </nav>
        )}
      </header>

      {/* ── Responsive breakpoint styles (injected once) ── */}
      <style>{`
        @keyframes drawerSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Mobile: show compact icons, hide desktop controls */
        .mobile-nav-icons { display: flex !important; }
        .desktop-search-wrap { display: none !important; }
        .desktop-nav-controls { display: none !important; }

        /* Desktop (768px+): flip visibility */
        @media (min-width: 768px) {
          .mobile-nav-icons { display: none !important; }
          .desktop-search-wrap { display: flex !important; flex: 1; min-width: 0; }
          .desktop-nav-controls { display: block !important; }
        }

        /* Ensure notification dropdown doesn't overflow on mobile */
        @media (max-width: 479px) {
          .notification-dropdown {
            right: -60px !important;
            width: calc(100vw - 2rem) !important;
            max-width: 360px !important;
          }
        }
      `}</style>
    </>
  );
}