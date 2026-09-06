import React from 'react'

export default function HeroSection({ articleCount }) {
  return (
    <div className="hero-section" style={{padding:'2rem 1rem',textAlign:'center'}}
    >
        <h1>Live Verified News Feed</h1>
        <p>Showing {articleCount} top stories right now.</p>

    </div>
  )
};
