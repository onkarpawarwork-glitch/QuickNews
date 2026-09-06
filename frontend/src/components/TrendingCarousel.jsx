import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, ChevronLeft, ChevronRight, Heart, MessageSquare, Clock, ExternalLink } from 'lucide-react';

export default function TrendingCarousel({ articles = [], darkMode = true, selectedLang = 'en' }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const trending = articles
    .filter(a => a.title && a.title.length > 15)
    .slice(0, 8)
    .sort((a, b) => {
      const scoreA = (a.likes || a.likesCount || 0) + (a.comments || 0) + (a.title?.length > 60 ? 2 : 0);
      const scoreB = (b.likes || b.likesCount || 0) + (b.comments || 0) + (b.title?.length > 60 ? 2 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 5);

  const count = trending.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setActive(prev => (prev + 1) % count);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [count, paused]);

  if (count === 0) return null;

  const go = (dir) => {
    setActive(prev => (prev + dir + count) % count);
    clearInterval(timerRef.current);
    setPaused(false);
  };

  const item = trending[active];
  const fallbackImg = `https://picsum.photos/seed/${(item.title || 'news').split('').reduce((a, c) => a + c.charCodeAt(0), 0)}/1200/600`;
  const image = item.image || item.imageUrl || fallbackImg;

  const getTimeAgo = (d) => {
    if (!d) return '';
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
  };

  const cardBg    = darkMode ? '#0e0e12' : '#f8fafc';
  const textColor = darkMode ? '#fff' : '#0f172a';
  const mutedColor = darkMode ? '#a1a1aa' : '#64748b';
  const borderColor = darkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
  const arrowBg   = darkMode ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.06)';

  return (
    <div style={{ margin: '0.75rem 0' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.6rem' }}>
        <TrendingUp size={18} color="#ef4444" />
        <h2 style={{ margin: 0, fontSize: 'clamp(1rem, 3vw, 1.15rem)', fontWeight: 800, color: textColor }}>
          Trending Now
        </h2>
        <span style={{ fontSize: '.75rem', color: mutedColor, fontWeight: 600, marginLeft: '.15rem' }}>
          Top stories
        </span>
      </div>

      {/* Carousel container */}
      <div
        style={{
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          border: `1px solid ${borderColor}`,
          background: cardBg,
          boxShadow: darkMode ? '0 12px 40px rgba(0,0,0,.5)' : '0 12px 40px rgba(0,0,0,.08)'
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Image */}
        <div className="tc-img" style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            key={active}
            src={image}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'carouselFadeIn .5s ease' }}
            onError={e => { e.target.onerror = null; e.target.src = fallbackImg; }}
          />

          {/* Bottom gradient */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '78%',
            background: 'linear-gradient(transparent, rgba(0,0,0,.88))',
            pointerEvents: 'none'
          }} />

          {/* Trending badge */}
          <div style={{
            position: 'absolute', top: '10px', left: '10px',
            display: 'flex', alignItems: 'center', gap: '.3rem',
            padding: '.28rem .6rem', borderRadius: '99px',
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            color: '#fff', fontSize: 'clamp(.62rem, 2vw, .75rem)', fontWeight: 800,
            letterSpacing: '.04em', boxShadow: '0 4px 12px rgba(239,68,68,.4)'
          }}>
            🔥 #{active + 1} TRENDING
          </div>

          {/* Category badge */}
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            padding: '.25rem .55rem', borderRadius: '99px',
            background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)',
            color: '#fff', fontSize: 'clamp(.58rem, 1.8vw, .72rem)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.04em',
            border: '1px solid rgba(255,255,255,.2)'
          }}>
            {item.category || 'general'}
          </div>

          {/* Content overlay */}
          <div className="tc-overlay" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: 'clamp(.68rem, 2vw, .8rem)', color: 'rgba(255,255,255,.75)', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: '#fff' }}>{item.source?.name || 'QuickNews'}</span>
              <span>·</span>
              <Clock size={11} />
              <span>{getTimeAgo(item.publishedAt || item.createdAt)}</span>
            </div>

            <h3 style={{
              margin: 0, fontSize: 'clamp(1rem, 3.5vw, 1.5rem)', fontWeight: 800, lineHeight: 1.25,
              color: '#fff',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {item.title}
            </h3>

            {item.description && (
              <p className="tc-desc" style={{
                margin: 0, fontSize: 'clamp(.75rem, 2vw, .88rem)', color: 'rgba(255,255,255,.65)', lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
              }}>
                {item.description}
              </p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '.1rem', flexWrap: 'wrap', gap: '.35rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', fontSize: 'clamp(.68rem, 2vw, .82rem)', color: 'rgba(255,255,255,.6)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                  <Heart size={13} /> {item.likes || item.likesCount || 0}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '.2rem' }}>
                  <MessageSquare size={13} /> {item.comments || 0}
                </span>
              </div>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '.3rem',
                  padding: '.38rem .85rem', borderRadius: '99px',
                  background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,.2)',
                  color: '#fff', fontSize: 'clamp(.72rem, 2vw, .82rem)', fontWeight: 700,
                  textDecoration: 'none', minHeight: '36px',
                }}>
                  Read <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {/* Arrows — 44px touch targets */}
          {count > 1 && (
            <>
              <button onClick={() => go(-1)} aria-label="Previous" style={{
                position: 'absolute', top: '50%', left: '8px', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%',
                background: arrowBg, border: 'none', color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)',
              }}>
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => go(1)} aria-label="Next" style={{
                position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)',
                width: '44px', height: '44px', borderRadius: '50%',
                background: arrowBg, border: 'none', color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(6px)',
              }}>
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {count > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '.35rem', padding: '.5rem 0', background: darkMode ? '#0e0e12' : '#f8fafc' }}>
            {trending.map((_, i) => (
              <button key={i} onClick={() => setActive(i)} aria-label={`Slide ${i + 1}`} style={{
                width: i === active ? '22px' : '8px', height: '8px', borderRadius: '99px', border: 'none',
                background: i === active ? 'linear-gradient(135deg,#6366f1,#a855f7)' : darkMode ? 'rgba(255,255,255,.15)' : 'rgba(0,0,0,.12)',
                cursor: 'pointer', transition: 'all .3s', padding: 0
              }} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        /* Mobile-first carousel heights */
        .tc-img { height: 220px; }
        .tc-overlay { padding: 0.8rem 1rem; }
        .tc-desc { display: none; }

        @media (min-width: 480px) { .tc-img { height: 260px; } }
        @media (min-width: 640px) { .tc-desc { display: -webkit-box; } }
        @media (min-width: 768px) { .tc-img { height: 300px; } }
        @media (min-width: 992px) {
          .tc-img { height: 340px; }
          .tc-overlay { padding: 1.5rem 1.75rem; }
        }
        @keyframes carouselFadeIn {
          from { opacity: 0; transform: scale(1.03); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
