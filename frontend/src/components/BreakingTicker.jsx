import React, { useState, useEffect } from 'react';
import { Zap, Circle } from 'lucide-react';
import axios from 'axios';

// ─── Fetch breaking headlines from Google News RSS ────────────────────────────
const fetchBreakingHeadlines = async () => {
  const PROXY = 'https://api.allorigins.win/raw?url=';
  const RSS_URL = 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en';

  try {
    const res = await axios.get(`${PROXY}${encodeURIComponent(RSS_URL)}`, { timeout: 5000 });
    const parser = new DOMParser();
    const xml = parser.parseFromString(res.data, 'text/xml');
    const items = xml.querySelectorAll('item');

    const headlines = [];
    items.forEach((item, i) => {
      if (i >= 12) return; // top 12 headlines
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '#';
      const source = item.querySelector('source')?.textContent || '';
      if (title) headlines.push({ title, link, source });
    });

    return headlines;
  } catch {
    // Fallback headlines if RSS fails
    return [
      { title: 'Breaking: Stay tuned for the latest headlines', link: '#', source: 'QuickNews' },
      { title: 'Live updates from around the world on QuickNews', link: '#', source: 'QuickNews' },
    ];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
export default function BreakingTicker({ darkMode = true }) {
  const [headlines, setHeadlines] = useState([]);

  useEffect(() => {
    fetchBreakingHeadlines().then(setHeadlines);
    // Refresh every 5 minutes
    const interval = setInterval(() => fetchBreakingHeadlines().then(setHeadlines), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (headlines.length === 0) return null;

  // Double the items for seamless infinite loop
  const tickerItems = [...headlines, ...headlines];

  const bgColor = darkMode ? 'rgba(15,15,20,.85)' : 'rgba(255,255,255,.9)';
  const borderClr = darkMode ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.08)';
  const textClr = darkMode ? '#d4d4d8' : '#334155';
  const dotClr = darkMode ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)';
  const sourceClr = darkMode ? '#71717a' : '#94a3b8';

  // Calculate animation duration based on headline count for consistent speed
  const duration = headlines.length * 4;

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      background: bgColor,
      backdropFilter: 'blur(12px)',
      border: `1px solid ${borderClr}`,
      borderRadius: '14px',
      marginTop: '.85rem',
      padding: '.1rem 0'
    }}>
      <style>{`
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track:hover { animation-play-state: paused; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {/* BREAKING label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.35rem',
          padding: 'clamp(.4rem, 1.5vw, .55rem) clamp(.5rem, 2vw, .9rem)',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: '#fff',
          fontWeight: 800,
          fontSize: 'clamp(.68rem, 1.8vw, .75rem)',
          letterSpacing: '.05em',
          textTransform: 'uppercase',
          borderRadius: '12px 0 0 12px',
          flexShrink: 0,
          zIndex: 2,
          boxShadow: '4px 0 12px rgba(239,68,68,.2)'
        }}>
          <Zap size={13} fill="#fff" />
          <span>BREAKING</span>
        </div>

        {/* Scrolling headlines track */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Fade edges */}
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '40px', background: `linear-gradient(to right, ${darkMode ? 'rgba(15,15,20,.85)' : 'rgba(255,255,255,.9)'}, transparent)`, zIndex: 1, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '40px', background: `linear-gradient(to left, ${darkMode ? 'rgba(15,15,20,.85)' : 'rgba(255,255,255,.9)'}, transparent)`, zIndex: 1, pointerEvents: 'none' }} />

          <div
            className="ticker-track"
            style={{
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              animation: `tickerScroll ${duration}s linear infinite`,
              willChange: 'transform'
            }}
          >
            {tickerItems.map((item, i) => (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '.5rem',
                  padding: '.5rem 1.25rem',
                  color: textClr,
                  textDecoration: 'none',
                  fontSize: '.82rem',
                  fontWeight: 600,
                  transition: 'color .15s',
                  flexShrink: 0
                }}
                onMouseOver={e => e.currentTarget.style.color = '#6366f1'}
                onMouseOut={e => e.currentTarget.style.color = textClr}
              >
                <span>{item.title}</span>
                {item.source && (
                  <span style={{ fontSize: '.7rem', color: sourceClr, fontWeight: 700 }}>
                    — {item.source}
                  </span>
                )}
                <Circle size={4} fill={dotClr} color={dotClr} style={{ flexShrink: 0, marginLeft: '.5rem' }} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
