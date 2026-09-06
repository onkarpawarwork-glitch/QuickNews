import React from 'react';
import {
  Globe, Cpu, Briefcase, Trophy, Film,
  FlaskConical, HeartPulse, Landmark, GraduationCap, Car, Leaf
} from 'lucide-react';
import { t } from '../utils/i18n';

const CATEGORY_ITEMS = [
  { id: 'all', key: 'allTopics', icon: Globe },
  { id: 'technology', key: 'technology', icon: Cpu },
  { id: 'business', key: 'business', icon: Briefcase },
  { id: 'sports', key: 'sports', icon: Trophy },
  { id: 'entertainment', key: 'entertainment', icon: Film },
  { id: 'science', key: 'science', icon: FlaskConical },
  { id: 'health', key: 'health', icon: HeartPulse },
  { id: 'politics', key: 'politics', icon: Landmark },
  { id: 'education', key: 'education', icon: GraduationCap },
  { id: 'automobile', key: 'automobile', icon: Car },
  { id: 'environment', key: 'environment', icon: Leaf },
];

export default function CategoryTabs({ activeCategory, onCategoryChange, activeFeed, onFeedChange, selectedLang = 'en', user }) {
  const feedTypes = [
    { id: 'all', label: t(selectedLang, 'allStream') },
    { id: 'google', label: t(selectedLang, 'worldNews') },
    { id: 'community', label: t(selectedLang, 'peoplesNews') },
    { id: 'nearme', label: t(selectedLang, 'nearMe') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0' }}>
      {/* 1. Feed Stream Switcher Bar (Smooth Touch Scroll on Mobile) */}
      <div style={{ width: '100%', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', display: 'flex' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'var(--bg-card)',
          padding: '0.35rem',
          borderRadius: '99px',
          border: '1px solid var(--border-color)',
          maxWidth: '580px',
          margin: '0 auto',
          minWidth: 'max-content'
        }}>
          {feedTypes.map(feed => (
            <button
              key={feed.id}
              onClick={() => onFeedChange(feed.id)}
              style={{
                flexShrink: 0,
                padding: '0.5rem 0.85rem',
                minHeight: '38px',
                borderRadius: '99px',
                border: 'none',
                background: activeFeed === feed.id ? 'var(--accent-gradient)' : 'transparent',
                color: activeFeed === feed.id ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: '700',
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s'
              }}
            >
              <span>{feed.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Topic Category Filter Bar */}
      <div className="category-tabs">
        {CATEGORY_ITEMS.map((cat) => {
          const Icon = cat.icon;
          const labelText = t(selectedLang, cat.key);
          return (
            <button
              key={cat.id}
              className={`tab-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => onCategoryChange(cat.id)}
            >
              <Icon size={16} />
              <span>{labelText}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
