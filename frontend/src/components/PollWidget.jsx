import React, { useState, useEffect } from 'react';
import { CheckCircle2, Lock, ChevronLeft, ChevronRight, Vote, Check } from 'lucide-react';

const INITIAL_POLLS = [
  {
    id: 'poll-1',
    question: 'Should public transport be completely free in major metros?',
    options: ['Yes, fully free', 'No, reduce fares instead', 'Only for students/seniors', 'Keep status quo'],
    votes: {
      'Yes, fully free': 45,
      'No, reduce fares instead': 22,
      'Only for students/seniors': 35,
      'Keep status quo': 8
    },
    active: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'poll-2',
    question: 'Do you support 4-day work week mandates for corporate sectors?',
    options: ['Yes, increases productivity', 'No, bad for economy', 'Should be company-specific', 'Undecided'],
    votes: {
      'Yes, increases productivity': 87,
      'No, bad for economy': 14,
      'Should be company-specific': 42,
      'Undecided': 5
    },
    active: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
];

export default function PollWidget({ user, onOpenAuthModal, darkMode = true, selectedLang = 'en' }) {
  const [polls, setPolls] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userVotes, setUserVotes] = useState({});

  // Robust userId key
  const userId = user?.id || user?.email || 'guest';

  useEffect(() => {
    try {
      const stored = localStorage.getItem('qn_polls');
      if (stored) {
        setPolls(JSON.parse(stored));
      } else {
        localStorage.setItem('qn_polls', JSON.stringify(INITIAL_POLLS));
        setPolls(INITIAL_POLLS);
      }
    } catch {
      setPolls(INITIAL_POLLS);
    }

    try {
      const votes = JSON.parse(localStorage.getItem(`qn_poll_votes_${userId}`) || '{}');
      setUserVotes(votes);
    } catch {}
  }, [userId]);

  const handleVote = (pollId, option) => {
    if (!user) {
      onOpenAuthModal();
      return;
    }

    const previousVote = userVotes[pollId];

    try {
      const nextPolls = polls.map(p => {
        if (p.id === pollId) {
          const currentVotes = { ...(p.votes || {}) };
          
          // Deduct previous vote if changing selection
          if (previousVote && previousVote !== option) {
            currentVotes[previousVote] = Math.max(0, (currentVotes[previousVote] || 1) - 1);
          }

          // Add vote only if changing or first vote
          if (previousVote !== option) {
            currentVotes[option] = (currentVotes[option] || 0) + 1;
          }

          return { ...p, votes: currentVotes };
        }
        return p;
      });

      setPolls(nextPolls);
      localStorage.setItem('qn_polls', JSON.stringify(nextPolls));

      const nextUserVotes = { ...userVotes, [pollId]: option };
      setUserVotes(nextUserVotes);
      localStorage.setItem(`qn_poll_votes_${userId}`, JSON.stringify(nextUserVotes));

      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error(e);
    }
  };

  if (polls.length === 0) return null;

  const safeIdx = Math.min(currentIndex, polls.length - 1);
  const activePoll = polls[safeIdx] || polls[0];

  const votes = activePoll.votes || {};
  const total = Object.values(votes).reduce((sum, v) => sum + v, 0);
  const votedOption = userVotes[activePoll.id];
  const hasVoted = !!votedOption;
  const isClosed = !activePoll.active;

  // Theme Colors
  const bgColor = darkMode ? '#181820' : '#ffffff';
  const textClr = darkMode ? '#f8fafc' : '#0f172a';
  const borderClr = darkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
  const mutedClr = darkMode ? '#71717a' : '#64748b';

  return (
    <div
      style={{
        background: bgColor,
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
      {/* Header with Title and Pagination Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
          <Vote size={18} color="#a855f7" />
          <span style={{ fontWeight: 800, fontSize: '.95rem', color: textClr }}>
            Daily Opinion Poll
          </span>
          <span style={{
            fontSize: '.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: '99px',
            background: isClosed ? (darkMode ? 'rgba(239,68,68,.15)' : 'rgba(239,68,68,.1)') : (darkMode ? 'rgba(34,197,94,.15)' : 'rgba(34,197,94,.1)'),
            color: isClosed ? '#ef4444' : '#22c55e'
          }}>
            {isClosed ? 'CLOSED' : 'LIVE'}
          </span>
        </div>

        {/* Carousel arrows */}
        {polls.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
            <button
              onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : polls.length - 1))}
              title="Previous Poll"
              style={{
                background: darkMode ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)',
                border: 'none', borderRadius: '50%', width: '26px', height: '26px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: textClr, cursor: 'pointer', transition: 'background .15s'
              }}
            >
              <ChevronLeft size={15} />
            </button>
            <span style={{ fontSize: '.72rem', color: mutedClr, fontWeight: 700, padding: '0 2px' }}>
              {safeIdx + 1}/{polls.length}
            </span>
            <button
              onClick={() => setCurrentIndex((prev) => (prev < polls.length - 1 ? prev + 1 : 0))}
              title="Next Poll"
              style={{
                background: darkMode ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.04)',
                border: 'none', borderRadius: '50%', width: '26px', height: '26px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: textClr, cursor: 'pointer', transition: 'background .15s'
              }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Question */}
      <h3 style={{ margin: 0, fontSize: '.92rem', fontWeight: 700, lineHeight: 1.45, color: textClr }}>
        {activePoll.question}
      </h3>

      {/* Options List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
        {activePoll.options.map((option) => {
          const count = votes[option] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isSelected = votedOption === option;

          return (
            <button
              key={option}
              disabled={isClosed}
              onClick={() => handleVote(activePoll.id, option)}
              style={{
                position: 'relative',
                width: '100%',
                padding: '.7rem .9rem',
                minHeight: '44px',
                borderRadius: '12px',
                border: isSelected
                  ? '2px solid #a855f7'
                  : `1px solid ${darkMode ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.1)'}`,
                background: isSelected
                  ? (darkMode ? 'rgba(168,85,247,.18)' : 'rgba(168,85,247,.08)')
                  : (darkMode ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.02)'),
                textAlign: 'left',
                cursor: isClosed ? 'default' : 'pointer',
                color: textClr,
                fontSize: 'clamp(.8rem, 2.5vw, .84rem)',
                fontWeight: isSelected ? 700 : 600,
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '.5rem',
                transition: 'all .2s'
              }}
            >
              {/* Progress bar background fill */}
              {(hasVoted || isClosed) && (
                <div style={{
                  position: 'absolute',
                  top: 0, bottom: 0, left: 0,
                  width: `${pct}%`,
                  background: isSelected ? 'linear-gradient(90deg, #a855f7, #6366f1)' : (darkMode ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'),
                  opacity: isSelected ? 0.35 : 0.6,
                  zIndex: 0,
                  transition: 'width .6s ease-out'
                }} />
              )}

              {/* Radio Circle & Label */}
              <span style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <span style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  border: isSelected ? '2px solid #a855f7' : `1.5px solid ${mutedClr}`,
                  background: isSelected ? '#a855f7' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                </span>
                <span>{option}</span>
                {isSelected && (
                  <span style={{ fontSize: '.68rem', color: '#a855f7', fontWeight: 800, background: 'rgba(168,85,247,.15)', padding: '1px 6px', borderRadius: '99px' }}>
                    YOUR VOTE
                  </span>
                )}
              </span>

              {/* Percentage & Vote Count */}
              {(hasVoted || isClosed) && (
                <span style={{ zIndex: 1, fontWeight: 800, fontSize: '.8rem', color: isSelected ? '#a855f7' : mutedClr }}>
                  {pct}% <span style={{ fontWeight: 500, fontSize: '.72rem', opacity: .8 }}>({count})</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.75rem', color: mutedClr, paddingTop: '.25rem', borderTop: `1px solid ${borderClr}` }}>
        <span>{total} total vote{total !== 1 ? 's' : ''} {hasVoted && '· Click an option to change vote'}</span>
        {!user && !isClosed && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '.25rem', color: '#6366f1', fontWeight: 700, cursor: 'pointer' }} onClick={onOpenAuthModal}>
            <Lock size={11} /> Sign in to vote
          </span>
        )}
      </div>
    </div>
  );
}
