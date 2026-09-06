import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CategoryTabs from './components/CategoryTabs';
import NewsCard from './components/NewsCard';
import CommunityModal from './components/CommunityModal';
import AdminDashboardModal from './components/AdminDashboardModal';
import AuthModal from './components/AuthModal';
import BreakingTicker from './components/BreakingTicker';
import TrendingCarousel from './components/TrendingCarousel';
import UserProfileModal from './components/UserProfileModal';
import Footer from './components/Footer';
import { getTopNews } from './services/NewsApi';
import { useNotificationEngine } from './components/NotificationDropdown';
import PollWidget from './components/PollWidget';
import CommunityLeaderboard from './components/CommunityLeaderboard';

export default function App() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [feedType, setFeedType] = useState('all'); // 'all', 'google', 'community'
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [selectedLang, setSelectedLang] = useState('en');
  
  // Auth & Modals State
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('quicknews_current_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [savedCount, setSavedCount] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`qn_bookmarks_${user?.id}`) || '[]').length; } catch { return 0; }
  });

  // Sync saved count & live saved feed updates
  useEffect(() => {
    const handleActivity = () => {
      try {
        const count = JSON.parse(localStorage.getItem(`qn_bookmarks_${user?.id}`) || '[]').length;
        setSavedCount(count);
        if (feedType === 'saved') {
          const saved = JSON.parse(localStorage.getItem(`qn_bookmarks_${user?.id}`) || '[]');
          setNews(saved);
        }
      } catch {}
    };
    handleActivity();
    window.addEventListener('storage', handleActivity);
    window.addEventListener('qn_user_activity_updated', handleActivity);
    return () => {
      window.removeEventListener('storage', handleActivity);
      window.removeEventListener('qn_user_activity_updated', handleActivity);
    };
  }, [user?.id, feedType]);

  // Run notification simulation & listener engine
  useNotificationEngine(user, setNotificationsCount);

  // PWA Install prompt listener
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
    }
  }, [darkMode]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    if (feedType === 'saved') {
      // Load bookmarked articles from localStorage
      try {
        const saved = JSON.parse(localStorage.getItem(`qn_bookmarks_${user?.id}`) || '[]');
        if (isMounted) {
          setNews(saved);
          setLoading(false);
        }
      } catch {
        if (isMounted) { setNews([]); setLoading(false); }
      }
    } else {
      getTopNews(category, searchQuery, feedType, selectedLang, user?.location || '').then((data) => {
        if (isMounted) {
          setNews(data);
          setLoading(false);
        }
      });
    }

    return () => { isMounted = false; };
  }, [category, searchQuery, feedType, selectedLang, user?.location]);

  const handleAddCommunityNews = (newStory) => {
    setNews([newStory, ...news]);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('quicknews_current_user');
    setUser(null);
    setIsAdminModalOpen(false);
  };

  const appSettings = (() => {
    try { return JSON.parse(localStorage.getItem('qn_settings') || '{}'); } catch { return {}; }
  })();

  const isMaintenanceMode = (() => {
    return appSettings.maintenance && user?.role !== 'ADMIN';
  })();

  const broadcastMsg = (() => {
    try { return localStorage.getItem('qn_broadcast') || null; } catch { return null; }
  })();

  if (isMaintenanceMode) {
    return (
      <div style={{ minHeight:'100vh',background:'#0a0a0a',color:'#fff',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',textAlign:'center' }}>
        <div style={{ fontSize:'4rem',marginBottom:'1rem' }}>⚙5</div>
        <h1 style={{ fontSize:'2rem',fontWeight:'800',marginBottom:'.5rem' }}>System Maintenance</h1>
        <p style={{ color:'#a1a1aa',maxWidth:'450px',lineHeight:'1.6',marginBottom:'1.5rem' }}>
          QuickNews is currently undergoing scheduled maintenance by the Admin. Please check back shortly.
        </p>
        <button onClick={() => setIsAuthModalOpen(true)} style={{ background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.2)',color:'#fff',padding:'.6rem 1.2rem',borderRadius:'99px',cursor:'pointer',fontWeight:600,fontSize:'.85rem' }}>
          Admin Login
        </button>
        {isAdminModalOpen && <AdminDashboardModal isOpen={isAdminModalOpen} onClose={() => setIsAdminModalOpen(false)} />}
        {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />}
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="ambient-glow">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onSearch={setSearchQuery}
        onOpenCommunityModal={() => setIsCommunityModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        user={user}
        onLogout={handleLogout}
        onViewSaved={() => setFeedType('saved')}
        savedCount={savedCount}
        notificationsCount={notificationsCount}
        isInstallable={isInstallable}
        onInstall={handleInstallApp}
        selectedLang={selectedLang}
        setSelectedLang={setSelectedLang}
      />

      {/* Admin Site-wide Announcement Banner */}
      {broadcastMsg && (
        <div style={{
          background: 'linear-gradient(135deg,#fb923c,#f43f5e)',
          color: '#fff',
          padding: '0.6rem 1rem',
          borderRadius: '12px',
          margin: '0.75rem 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 700,
          fontSize: 'clamp(0.78rem, 2.5vw, 0.9rem)',
          boxShadow: '0 4px 14px rgba(251,146,60,0.3)',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}>
          <span style={{ flex: 1, minWidth: 0 }}>📢 {broadcastMsg}</span>
          <button onClick={() => { localStorage.removeItem('qn_broadcast'); window.location.reload(); }}
            style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', minWidth: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {appSettings.tickerEnabled !== false && <BreakingTicker darkMode={darkMode} />}

      {/* ── Responsive split layout ── */}
      <style>{`
        .split-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          width: 100%;
          box-sizing: border-box;
        }
        @media (min-width: 992px) {
          .split-layout {
            grid-template-columns: 1.95fr 1.05fr;
            gap: 2rem;
          }
        }
        .split-col { display: flex; flex-direction: column; gap: 1.25rem; min-width: 0; }
        @media (min-width: 992px) { .split-col { gap: 1.5rem; } }
      `}</style>

      {/* Main Grid */}
      <div className="split-layout">

        {/* Left Content Column */}
        <div className="split-col">
          {appSettings.carouselEnabled !== false && (
            <TrendingCarousel articles={news} darkMode={darkMode} selectedLang={selectedLang} />
          )}

          <CategoryTabs
            activeCategory={category}
            onCategoryChange={setCategory}
            activeFeed={feedType}
            onFeedChange={setFeedType}
            selectedLang={selectedLang}
            user={user}
          />

          <main className="news-grid" style={{ margin: 0, padding: 0 }}>
            {loading ? (
              [1, 2, 3, 4].map((idx) => (
                <div key={idx} className="card" style={{ minHeight: '320px', opacity: 0.5 }}>
                  <div style={{ height: '190px', background: 'var(--bg-secondary)' }}></div>
                  <div style={{ padding: '1rem' }}>
                    <div style={{ height: '18px', width: '70%', background: 'var(--bg-secondary)', marginBottom: '10px', borderRadius: '6px' }}></div>
                    <div style={{ height: '14px', width: '100%', background: 'var(--bg-secondary)', marginBottom: '6px', borderRadius: '6px' }}></div>
                    <div style={{ height: '14px', width: '80%', background: 'var(--bg-secondary)', borderRadius: '6px' }}></div>
                  </div>
                </div>
              ))
            ) : news.length > 0 ? (
              news.map((item) => (
                <NewsCard
                  key={item.id}
                  article={item}
                  selectedLang={selectedLang}
                  user={user}
                  darkMode={darkMode}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                />
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <h3 style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>{selectedLang === 'mr' ? 'या प्रवाहात कोणत्याही बातम्या आढळल्या नाहीत' : selectedLang === 'ta' ? 'இந்த பிரிவில் செய்திகள் எதுவும் கிடைக்கவில்லை' : selectedLang === 'hi' ? 'इस स्ट्रीम में कोई समाचार नहीं मिला' : 'No stories found in this stream'}</h3>
              </div>
            )}
          </main>
        </div>

        {/* Right Sidebar Column */}
        <div className="split-col">
          {appSettings.pollsEnabled !== false && (
            <PollWidget user={user} onOpenAuthModal={() => setIsAuthModalOpen(true)} darkMode={darkMode} selectedLang={selectedLang} />
          )}
          {appSettings.leaderboardEnabled !== false && (
            <CommunityLeaderboard user={user} darkMode={darkMode} selectedLang={selectedLang} />
          )}
        </div>

      </div>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <CommunityModal
        isOpen={isCommunityModalOpen}
        onClose={() => setIsCommunityModalOpen(false)}
        onAddNews={handleAddCommunityNews}
        user={user}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        darkMode={darkMode}
        onLogout={handleLogout}
        onViewSaved={() => { setFeedType('saved'); setIsProfileModalOpen(false); }}
      />

      <Footer />
    </div>
  );
}