import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, Flame, Info } from 'lucide-react';

const PRELOADED_LEADERS = [
  {
    name: 'Ananya Sen',
    role: 'Citizen Expert',
    posts: 12,
    trust: 96,
    points: 1680,
    avatarColor: '#fbbf24',
  },
  {
    name: 'Vikram Malhotra',
    role: 'Rural Journalist',
    posts: 9,
    trust: 93,
    points: 1365,
    avatarColor: '#94a3b8',
  },
  {
    name: 'Sneha Patil',
    role: 'Local Eye',
    posts: 8,
    trust: 91,
    points: 1255,
    avatarColor: '#d97706',
  }
];

export default function CommunityLeaderboard({ user, darkMode = true, selectedLang = 'en' }) {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    try {
      const reports = JSON.parse(localStorage.getItem('quicknews_user_reports') || '[]');
      const userReportsCount = reports.length;

      let userAvgTrust = 94;
      if (userReportsCount > 0) {
        const sum = reports.reduce((acc, r) => acc + (r.trustScore || 94), 0);
        userAvgTrust = Math.round(sum / userReportsCount);
      }

      const userRepPoints = userReportsCount * 100 + userAvgTrust * 5;
      const dynamicList = [...PRELOADED_LEADERS];

      if (user && userReportsCount > 0) {
        dynamicList.push({
          name: `${user.name} (You)`,
          role: 'Citizen Reporter',
          posts: userReportsCount,
          trust: userAvgTrust,
          points: userRepPoints,
          avatarColor: '#38bdf8',
          isCurrentUser: true
        });
      }

      dynamicList.sort((a, b) => b.points - a.points);
      setLeaders(dynamicList.slice(0, 3)); // Top 3
    } catch {
      setLeaders(PRELOADED_LEADERS);
    }
  }, [user]);

  const bg = darkMode ? '#181820' : '#ffffff';
  const textClr = darkMode ? '#f8fafc' : '#0f172a';
  const borderClr = darkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
  const mutedClr = darkMode ? '#71717a' : '#64748b';
  const cardBg = darkMode ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)';
  const highlightBg = darkMode ? 'rgba(99,102,241,.1)' : 'rgba(99,102,241,.05)';
  const highlightBorder = darkMode ? 'rgba(99,102,241,.3)' : 'rgba(99,102,241,.2)';

  const getRankBadge = (idx) => {
    switch (idx) {
      case 0: return '👑';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${idx + 1}`;
    }
  };

  return (
    <div
      style={{
        background: bg,
        borderRadius: '20px',
        border: `1px solid ${borderClr}`,
        padding: '1.2rem 1.25rem',
        boxShadow: darkMode ? '0 10px 30px rgba(0,0,0,.35)' : '0 8px 24px rgba(0,0,0,.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'all .25s ease'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
          <Award size={18} color="#fbbf24" />
          <span style={{ fontWeight: 800, fontSize: '.95rem', color: textClr }}>
            Top Reporters
          </span>
        </div>
        <span style={{ fontSize: '.7rem', color: '#fbbf24', fontWeight: 700, background: 'rgba(251,191,36,.12)', padding: '2px 8px', borderRadius: '99px' }}>
          WEEKLY
        </span>
      </div>

      {/* Ranks list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
        {leaders.map((l, idx) => {
          const initials = l.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

          return (
            <div
              key={l.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '.65rem',
                padding: '.6rem .75rem',
                borderRadius: '12px',
                background: l.isCurrentUser ? highlightBg : cardBg,
                border: l.isCurrentUser ? `1px solid ${highlightBorder}` : `1px solid ${borderClr}`,
                transition: 'all .15s'
              }}
            >
              {/* Rank */}
              <span style={{ fontSize: '1rem', width: '22px', textAlign: 'center' }}>
                {getRankBadge(idx)}
              </span>

              {/* Avatar */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: l.avatarColor, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '.78rem', flexShrink: 0
              }}>
                {initials}
              </div>

              {/* User details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '.84rem', color: textClr, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.name}
                  </span>
                  <ShieldCheck size={12} color="#22c55e" style={{ flexShrink: 0 }} />
                </div>
                <div style={{ fontSize: '.7rem', color: mutedClr }}>
                  {l.posts} reports · <span style={{ color: '#22c55e', fontWeight: 600 }}>{l.trust}% trust</span>
                </div>
              </div>

              {/* Points */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.2rem', flexShrink: 0 }}>
                <Flame size={12} color="#f97316" />
                <span style={{ fontWeight: 800, fontSize: '.82rem', color: textClr }}>
                  {l.points}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
