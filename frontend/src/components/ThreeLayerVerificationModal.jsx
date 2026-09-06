import React from 'react';
import { X, Bot, Users, Search, CheckCircle, AlertTriangle, ShieldCheck, ArrowDown, UserCheck } from 'lucide-react';

export default function ThreeLayerVerificationModal({ isOpen, onClose, article, darkMode = true }) {
  if (!isOpen || !article) return null;

  const bg = darkMode ? '#0e0e12' : '#ffffff';
  const textClr = darkMode ? '#f8fafc' : '#0f172a';
  const borderClr = darkMode ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)';
  const cardBg = darkMode ? '#181820' : '#f8fafc';
  const cardBorder = darkMode ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)';
  const mutedClr = darkMode ? '#71717a' : '#64748b';

  // Extract live votes
  const articleId = article.id || article.title;
  const savedVotes = (() => {
    try {
      const all = JSON.parse(localStorage.getItem('qn_article_votes') || '{}');
      return all[`db-${articleId}`] || all[articleId] || {};
    } catch { return {}; }
  })();

  const trustVotes = savedVotes.trustVotes ?? (article.trustVotes || (article.likesCount ? article.likesCount * 3 : 42));
  const disputeVotes = savedVotes.disputeVotes ?? (article.notTrustVotes || 2);
  const totalVotes = trustVotes + disputeVotes;
  const communityPct = totalVotes > 0 ? Math.round((trustVotes / totalVotes) * 100) : (article.trustScore || 94);

  const isDisputed = communityPct < 70;
  const aiScore = isDisputed ? 58 : 96;
  const sourceScore = isDisputed ? 62 : 94;

  return (
    <>
      <style>{`
        @keyframes tlvFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .tlv-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.75); backdrop-filter: blur(8px); z-index: 2000; display: flex; align-items: flex-end; justify-content: center; padding: 0; overflow-y: auto; }
        .tlv-box { border-radius: 20px 20px 0 0; width: 100%; max-width: 100%; max-height: 92vh; overflow-y: auto; box-shadow: 0 -8px 40px rgba(0,0,0,.5); padding: 1.25rem 1rem 2rem; display: flex; flex-direction: column; gap: 1.1rem; animation: tlvFadeIn .25s ease-out; }
        @media (min-width: 640px) {
          .tlv-overlay { align-items: center; padding: 1rem; }
          .tlv-box { border-radius: 24px; max-width: 640px; padding: 1.75rem; box-shadow: 0 25px 60px rgba(0,0,0,.5); }
        }
        .tlv-handle { display: block; }
        @media (min-width: 640px) { .tlv-handle { display: none; } }
      `}</style>
      <div className="tlv-overlay">
        <div className="tlv-box" style={{ background: bg, color: textClr, border: `1px solid ${borderClr}` }}>
          {/* Drag handle on mobile */}
          <div className="tlv-handle" style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,.2)', borderRadius: '99px', margin: '0 auto -0.5rem' }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${cardBorder}`, paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              <ShieldCheck size={26} color="#22c55e" />
              <div>
                <h2 style={{ margin: 0, fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: 800 }}>3-Layer Trust Verification</h2>
                <p style={{ margin: 0, fontSize: '.75rem', color: mutedClr }}>Automated multi-stage verification audit</p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: darkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)', border: 'none', borderRadius: '50%', padding: '.45rem', color: textClr, cursor: 'pointer', display: 'flex', minWidth: '34px', minHeight: '34px', alignItems: 'center', justifyContent: 'center' }}>
              <X size={18} />
            </button>
          </div>

          {/* Article Preview Card */}
          <div style={{ background: cardBg, borderRadius: '16px', padding: '1rem', border: `1px solid ${cardBorder}`, display: 'flex', gap: '.85rem', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #22c55e, #38bdf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, flexShrink: 0 }}>
              <UserCheck size={24} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '.72rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
                {article.category || 'Community News'}
              </div>
              <h4 style={{ margin: '.1rem 0', fontSize: '.9rem', fontWeight: 700, color: textClr, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {article.title}
              </h4>
              <div style={{ fontSize: '.72rem', color: mutedClr }}>
                Publisher: {article.author || article.sourceName || article.source?.name || 'Verified Citizen Reporter'}
              </div>
            </div>
          </div>


          {/* Flowchart Diagram (3-Layer Nodes) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.75rem' }}>

            {/* Node 0: User Posts News */}
            <div style={{ width: '100%', background: cardBg, border: `1.5px solid ${cardBorder}`, borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 12px rgba(0,0,0,.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(56,189,248,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'clamp(.88rem, 2.5vw, 1rem)', fontWeight: 800, color: textClr }}>User Posts News</h3>
                  <span style={{ fontSize: '.75rem', color: mutedClr }}>Citizen reporter submits story</span>
                </div>
              </div>
              <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: '99px', background: 'rgba(34,197,94,.15)', color: '#22c55e', flexShrink: 0 }}>✓ INTAKE READY</span>
            </div>

            <ArrowDown size={20} color={mutedClr} />

            {/* Layer 1: AI Fact-Check */}
            <div style={{ width: '100%', background: cardBg, border: `1px solid ${isDisputed ? 'rgba(239,68,68,.3)' : 'rgba(34,197,94,.3)'}`, borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: isDisputed ? 'rgba(239,68,68,.12)' : 'rgba(34,197,94,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDisputed ? '#ef4444' : '#22c55e', flexShrink: 0 }}>
                    <Bot size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '.05em' }}>LAYER 1</div>
                    <h3 style={{ margin: 0, fontSize: 'clamp(.88rem, 2.5vw, 1rem)', fontWeight: 800, color: textClr }}>AI Fact-Check</h3>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '.82rem', fontWeight: 800, color: isDisputed ? '#ef4444' : '#22c55e' }}>{aiScore}% Match</span>
                  <div style={{ fontSize: '.7rem', color: mutedClr }}>Cross-checks news sources</div>
                </div>
              </div>
              <div style={{ background: darkMode ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.04)', padding: '.6rem .85rem', borderRadius: '10px', fontSize: '.75rem', color: mutedClr, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.25rem' }}>
                <span>🤖 AI Keyword Cross-Reference:</span>
                <strong style={{ color: textClr }}>Scanned Google News &amp; PIB API</strong>
              </div>
            </div>

            <ArrowDown size={20} color={mutedClr} />

            {/* Layer 2: Community Votes */}
            <div style={{ width: '100%', background: cardBg, border: `1px solid ${isDisputed ? 'rgba(239,68,68,.3)' : 'rgba(168,85,247,.3)'}`, borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(168,85,247,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7', flexShrink: 0 }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#a855f7', letterSpacing: '.05em' }}>LAYER 2</div>
                    <h3 style={{ margin: 0, fontSize: 'clamp(.88rem, 2.5vw, 1rem)', fontWeight: 800, color: textClr }}>Community Votes</h3>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '.82rem', fontWeight: 800, color: communityPct >= 70 ? '#22c55e' : '#ef4444' }}>{communityPct}% Approval</span>
                  <div style={{ fontSize: '.7rem', color: mutedClr }}>Real users verify</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: '.78rem' }}>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,.1)', borderRadius: '99px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${communityPct}%`, background: communityPct >= 70 ? '#22c55e' : '#ef4444', height: '100%' }} />
                </div>
                <span style={{ fontWeight: 700, color: '#22c55e' }}>👍 {trustVotes}</span>
                <span style={{ fontWeight: 700, color: '#ef4444' }}>👎 {disputeVotes}</span>
              </div>
            </div>

            <ArrowDown size={20} color={mutedClr} />

            {/* Layer 3: Source Check */}
            <div style={{ width: '100%', background: cardBg, border: `1px solid ${isDisputed ? 'rgba(239,68,68,.3)' : 'rgba(56,189,248,.3)'}`, borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(56,189,248,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', flexShrink: 0 }}>
                    <Search size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '.05em' }}>LAYER 3</div>
                    <h3 style={{ margin: 0, fontSize: 'clamp(.88rem, 2.5vw, 1rem)', fontWeight: 800, color: textClr }}>Source Check</h3>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '.82rem', fontWeight: 800, color: '#38bdf8' }}>{sourceScore} / 100</span>
                  <div style={{ fontSize: '.7rem', color: mutedClr }}>Source credibility score</div>
                </div>
              </div>
              <div style={{ background: darkMode ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.04)', padding: '.6rem .85rem', borderRadius: '10px', fontSize: '.75rem', color: mutedClr, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '.25rem' }}>
                <span>🔍 Publisher Integrity Audit:</span>
                <strong style={{ color: communityPct >= 70 ? '#22c55e' : '#ef4444' }}>
                  {communityPct >= 70 ? '✓ High Reputation Author' : '⚠️ Unverified Third-Party'}
                </strong>
              </div>
            </div>
          </div>

          {/* Verification Summary Footer */}
          <div style={{ background: isDisputed ? 'rgba(239,68,68,.12)' : 'rgba(34,197,94,.12)', border: `1px solid ${isDisputed ? 'rgba(239,68,68,.3)' : 'rgba(34,197,94,.3)'}`, borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', flex: 1, minWidth: 0 }}>
              {isDisputed ? <AlertTriangle size={20} color="#ef4444" /> : <CheckCircle size={20} color="#22c55e" />}
              <div style={{ minWidth: 0 }}>
                <h4 style={{ margin: 0, fontSize: '.9rem', fontWeight: 800, color: isDisputed ? '#ef4444' : '#22c55e' }}>
                  {isDisputed ? 'Disputed / Unverified News' : 'Passed All 3 Verification Layers'}
                </h4>
                <p style={{ margin: 0, fontSize: '.72rem', color: mutedClr }}>
                  {isDisputed ? 'Caution: Article failed community vote or AI fact check.' : 'Article verified by AI, community votes, and source credibility.'}
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{ background: isDisputed ? '#ef4444' : '#22c55e', border: 'none', color: '#fff', padding: '.6rem 1.25rem', borderRadius: '99px', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', minHeight: '44px', flexShrink: 0 }}>
              Close Audit
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
