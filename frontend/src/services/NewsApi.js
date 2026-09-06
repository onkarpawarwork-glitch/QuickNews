import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// RSS → JSON proxy (no key required)
// ─────────────────────────────────────────────────────────────────────────────
const RSS2JSON = 'https://api.rss2json.com/v1/api.json?rss_url=';

// ─────────────────────────────────────────────────────────────────────────────
// Spring Boot Community API
// ─────────────────────────────────────────────────────────────────────────────
const COMMUNITY_API = 'http://localhost:8080/api/community/posts';

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE-SPECIFIC FREE RSS SOURCES
// Supports: English (en), Marathi (mr), Tamil (ta), Hindi (hi), Telugu (te)
// ─────────────────────────────────────────────────────────────────────────────
export const LANGUAGE_SOURCES = {
  en: {
    general: [
      { name: 'BBC World',       icon: '🇬🇧', url: 'http://feeds.bbci.co.uk/news/world/rss.xml' },
      { name: 'Al Jazeera',      icon: '🌍', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
      { name: 'Times of India',  icon: '🇮🇳', url: 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms' },
      { name: 'The Hindu',       icon: '🇮🇳', url: 'https://www.thehindu.com/feeder/default.rss' },
      { name: 'Google News IN',  icon: '🔎', url: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en' },
    ],
    technology: [
      { name: 'BBC Tech',        icon: '🇬🇧', url: 'http://feeds.bbci.co.uk/news/technology/rss.xml' },
      { name: 'Google Tech',     icon: '🔎', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-IN&gl=IN&ceid=IN:en' },
      { name: 'TechCrunch',      icon: '💡', url: 'https://techcrunch.com/feed/' },
      { name: 'Wired',           icon: '⚡', url: 'https://www.wired.com/feed/rss' },
    ],
    business: [
      { name: 'BBC Business',    icon: '🇬🇧', url: 'http://feeds.bbci.co.uk/news/business/rss.xml' },
      { name: 'Google Business', icon: '🔎', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-IN&gl=IN&ceid=IN:en' },
      { name: 'The Hindu Biz',   icon: '🇮🇳', url: 'https://www.thehindu.com/business/feeder/default.rss' },
    ],
    sports: [
      { name: 'ESPN',            icon: '🏆', url: 'https://www.espn.com/espn/rss/news' },
      { name: 'BBC Sport',       icon: '🇬🇧', url: 'http://feeds.bbci.co.uk/sport/rss.xml' },
      { name: 'Google Sports',   icon: '🔎', url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-IN&gl=IN&ceid=IN:en' },
    ],
    science: [
      { name: 'NASA',            icon: '🚀', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' },
      { name: 'BBC Science',     icon: '🇬🇧', url: 'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml' },
    ],
    health: [
      { name: 'BBC Health',      icon: '🇬🇧', url: 'http://feeds.bbci.co.uk/news/health/rss.xml' },
      { name: 'Google Health',   icon: '🔎', url: 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-IN&gl=IN&ceid=IN:en' },
    ],
    entertainment: [
      { name: 'BBC Entertain.',  icon: '🇬🇧', url: 'http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml' },
      { name: 'Google Entmt.',   icon: '🔎', url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=en-IN&gl=IN&ceid=IN:en' },
    ],
    politics: [
      { name: 'Google Politics', icon: '🏛️', url: 'https://news.google.com/rss/search?q=politics&hl=en-IN&gl=IN&ceid=IN:en' },
      { name: 'BBC Politics',    icon: '🇬🇧', url: 'http://feeds.bbci.co.uk/news/politics/rss.xml' },
    ],
    education: [
      { name: 'Google Education', icon: '🎓', url: 'https://news.google.com/rss/search?q=education+jobs&hl=en-IN&gl=IN&ceid=IN:en' },
    ],
    automobile: [
      { name: 'Google Auto',     icon: '🚗', url: 'https://news.google.com/rss/search?q=automobile+cars&hl=en-IN&gl=IN&ceid=IN:en' },
    ],
    environment: [
      { name: 'Google Climate',  icon: '🌿', url: 'https://news.google.com/rss/search?q=environment+climate&hl=en-IN&gl=IN&ceid=IN:en' },
    ]
  },

  // ── MARATHI (मराठी) ────────────────────────────────────────────────────────
  mr: {
    general: [
      { name: 'Google बातम्या (मराठी)', icon: '🚩', url: 'https://news.google.com/rss?hl=mr&gl=IN&ceid=IN:mr' },
      { name: 'सकाळ',                icon: '📰', url: 'https://www.esakal.com/rss.xml' },
      { name: 'झी २४ तास',            icon: '📺', url: 'https://zeenews.india.com/marathi/rss.xml' },
    ],
    technology: [
      { name: 'Google टेक (मराठी)',   icon: '💡', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=mr&gl=IN&ceid=IN:mr' },
    ],
    business: [
      { name: 'Google व्यापार (मराठी)', icon: '📈', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=mr&gl=IN&ceid=IN:mr' },
    ],
    sports: [
      { name: 'Google क्रीडा (मराठी)',  icon: '🏆', url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=mr&gl=IN&ceid=IN:mr' },
    ],
    science: [
      { name: 'Google विज्ञान (मराठी)', icon: '🚀', url: 'https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=mr&gl=IN&ceid=IN:mr' },
    ],
    health: [
      { name: 'Google आरोग्य (मराठी)', icon: '🩺', url: 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=mr&gl=IN&ceid=IN:mr' },
    ],
    entertainment: [
      { name: 'Google मनोरंजन (मराठी)', icon: '🎬', url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=mr&gl=IN&ceid=IN:mr' },
    ],
    politics: [
      { name: 'Google राजकारण',       icon: '🏛️', url: 'https://news.google.com/rss/search?q=%E0%A4%B0%E0%A4%BE%E0%A4%9C%E0%A4%95%E0%A4%BE%E0%A4%B0%E0%A4%A3&hl=mr&gl=IN&ceid=IN:mr' },
    ],
    education: [
      { name: 'Google शिक्षण',        icon: '🎓', url: 'https://news.google.com/rss/search?q=%E0%A4%B6%E0%A4%BF%E0%A4%95%E0%A5%8D%E0%A4%B7%E0%A4%A3&hl=mr&gl=IN&ceid=IN:mr' },
    ],
    automobile: [
      { name: 'Google ऑटो',           icon: '🚗', url: 'https://news.google.com/rss/search?q=automobile&hl=mr&gl=IN&ceid=IN:mr' },
    ],
    environment: [
      { name: 'Google पर्यावरण',      icon: '🌿', url: 'https://news.google.com/rss/search?q=environment&hl=mr&gl=IN&ceid=IN:mr' },
    ]
  },

  // ── TAMIL (தமிழ்) ─────────────────────────────────────────────────────────
  ta: {
    general: [
      { name: 'கூகிள் செய்திகள் (தமிழ்)', icon: '🏛️', url: 'https://news.google.com/rss?hl=ta&gl=IN&ceid=IN:ta' },
      { name: 'BBC தமிழ்',               icon: '🇬🇧', url: 'https://feeds.bbci.co.uk/tamil/rss.xml' },
      { name: 'தினகரன்',                icon: '📰', url: 'https://www.dinakaran.com/rss_detail.asp' },
    ],
    technology: [{ name: 'கூகிள் தொழில்நுட்பம்', icon: '💡', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=ta&gl=IN&ceid=IN:ta' }],
    business: [{ name: 'கூகிள் வணிகம்', icon: '📈', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ta&gl=IN&ceid=IN:ta' }],
    sports: [{ name: 'கூகிள் விளையாட்டு', icon: '🏆', url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=ta&gl=IN&ceid=IN:ta' }],
    science: [{ name: 'கூகிள் அறிவியல்', icon: '🚀', url: 'https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=ta&gl=IN&ceid=IN:ta' }],
    health: [{ name: 'கூகிள் சுகாதாரம்', icon: '🩺', url: 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=ta&gl=IN&ceid=IN:ta' }],
    entertainment: [{ name: 'கூகிள் பொழுதுபோக்கு', icon: '🎬', url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=ta&gl=IN&ceid=IN:ta' }],
    politics: [{ name: 'கூகிள் அரசியல்', icon: '🏛️', url: 'https://news.google.com/rss/search?q=politics&hl=ta&gl=IN&ceid=IN:ta' }],
    education: [{ name: 'கூகிள் கல்வி', icon: '🎓', url: 'https://news.google.com/rss/search?q=education&hl=ta&gl=IN&ceid=IN:ta' }],
    automobile: [{ name: 'கூகிள் வாகனங்கள்', icon: '🚗', url: 'https://news.google.com/rss/search?q=automobile&hl=ta&gl=IN&ceid=IN:ta' }],
    environment: [{ name: 'கூகிள் சுற்றுச்சூழல்', icon: '🌿', url: 'https://news.google.com/rss/search?q=environment&hl=ta&gl=IN&ceid=IN:ta' }]
  },

  // ── HINDI (हिंदी) ─────────────────────────────────────────────────────────
  hi: {
    general: [
      { name: 'Google समाचार (हिंदी)', icon: '🇮🇳', url: 'https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi' },
      { name: 'BBC हिंदी',             icon: '🇬🇧', url: 'https://feeds.bbci.co.uk/hindi/rss.xml' },
      { name: 'आज तक',                icon: '📺', url: 'https://aajtak.in/rss.xml' },
    ],
    technology: [{ name: 'Google टेक (हिंदी)', icon: '💡', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=hi&gl=IN&ceid=IN:hi' }],
    business: [{ name: 'Google व्यापार (हिंदी)', icon: '📈', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=hi&gl=IN&ceid=IN:hi' }],
    sports: [{ name: 'Google खेल (हिंदी)', icon: '🏆', url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=hi&gl=IN&ceid=IN:hi' }],
    science: [{ name: 'Google विज्ञान (हिंदी)', icon: '🚀', url: 'https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=hi&gl=IN&ceid=IN:hi' }],
    health: [{ name: 'Google स्वास्थ्य (हिंदी)', icon: '🩺', url: 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=hi&gl=IN&ceid=IN:hi' }],
    entertainment: [{ name: 'Google मनोरंजन (हिंदी)', icon: '🎬', url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=hi&gl=IN&ceid=IN:hi' }],
    politics: [{ name: 'Google राजनीति', icon: '🏛️', url: 'https://news.google.com/rss/search?q=%E0%A4%B0%E0%A4%BE%E0%A4%9C%E0%A4%A8%E0%A5%80%E0%A4%A4%E0%A4%BF&hl=hi&gl=IN&ceid=IN:hi' }],
    education: [{ name: 'Google शिक्षा', icon: '🎓', url: 'https://news.google.com/rss/search?q=%E0%A4%B6%E0%A4%BF%E0%A4%95%E0%A5%8D%E0%A4%B7%E0%A4%BE&hl=hi&gl=IN&ceid=IN:hi' }],
    automobile: [{ name: 'Google ऑटो', icon: '🚗', url: 'https://news.google.com/rss/search?q=automobile&hl=hi&gl=IN&ceid=IN:hi' }],
    environment: [{ name: 'Google पर्यावरण', icon: '🌿', url: 'https://news.google.com/rss/search?q=environment&hl=hi&gl=IN&ceid=IN:hi' }]
  },

  // ── TELUGU (తెలుగు) ───────────────────────────────────────────────────────
  te: {
    general: [
      { name: 'Google వార్తలు (తెలుగు)', icon: '🏛️', url: 'https://news.google.com/rss?hl=te&gl=IN&ceid=IN:te' },
      { name: 'BBC తెలుగు',              icon: '🇬🇧', url: 'https://feeds.bbci.co.uk/telugu/rss.xml' },
    ],
    technology: [{ name: 'Google టెక్నాలజీ', icon: '💡', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=te&gl=IN&ceid=IN:te' }],
    business: [{ name: 'Google బిజినెస్', icon: '📈', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=te&gl=IN&ceid=IN:te' }],
    sports: [{ name: 'Google స్పోర్ట్స్', icon: '🏆', url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=te&gl=IN&ceid=IN:te' }],
    science: [{ name: 'Google సైన్స్', icon: '🚀', url: 'https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=te&gl=IN&ceid=IN:te' }],
    health: [{ name: 'Google ఆరోగ్యం', icon: '🩺', url: 'https://news.google.com/rss/headlines/section/topic/HEALTH?hl=te&gl=IN&ceid=IN:te' }],
    entertainment: [{ name: 'Google వినోదం', icon: '🎬', url: 'https://news.google.com/rss/headlines/section/topic/ENTERTAINMENT?hl=te&gl=IN&ceid=IN:te' }],
    politics: [{ name: 'Google రాజకీయం', icon: '🏛️', url: 'https://news.google.com/rss/search?q=politics&hl=te&gl=IN&ceid=IN:te' }],
    education: [{ name: 'Google విద్య', icon: '🎓', url: 'https://news.google.com/rss/search?q=education&hl=te&gl=IN&ceid=IN:te' }],
    automobile: [{ name: 'Google ఆటో', icon: '🚗', url: 'https://news.google.com/rss/search?q=automobile&hl=te&gl=IN&ceid=IN:te' }],
    environment: [{ name: 'Google పర్యావరణం', icon: '🌿', url: 'https://news.google.com/rss/search?q=environment&hl=te&gl=IN&ceid=IN:te' }]
  }
};

export const FREE_SOURCES = LANGUAGE_SOURCES.en;

// ─────────────────────────────────────────────────────────────────────────────
// HD Fallback Images per category
// ─────────────────────────────────────────────────────────────────────────────
const IMG = {
  technology:    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
  business:      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
  sports:        'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
  entertainment: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
  science:       'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=800&q=80',
  health:        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
  politics:      'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
  education:     'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
  automobile:    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  environment:   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  general:       'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80',
};

const strip = html => (html || '').replace(/<[^>]*>?/gm, '').trim();
const timeNow = () => new Date().toISOString();

const CAT_KEYWORDS = {
  technology:    ['technology','computer','code','circuit','data','robot','server','ai'],
  business:      ['business','finance','market','office','money','trade','economy'],
  sports:        ['sports','stadium','athlete','race','football','cricket','game'],
  entertainment: ['film','cinema','music','concert','stage','theatre','art'],
  science:       ['science','space','research','lab','nature','discovery','stars'],
  health:        ['health','medicine','hospital','wellness','fitness','doctor'],
  politics:      ['politics','government','election','policy','parliament','vote'],
  education:     ['education','school','university','jobs','exam','college','student'],
  automobile:    ['car','vehicle','electric','automobile','engine','drive'],
  environment:   ['environment','climate','nature','forest','solar','earth'],
  general:       ['news','city','world','people','street','globe','society'],
};

const pickImage = (item, catKey, titleSeed = '') => {
  if (item?.thumbnail && item.thumbnail.startsWith('http') && item.thumbnail.length > 10)
    return item.thumbnail;
  if (item?.enclosure?.link && item.enclosure.link.startsWith('http'))
    return item.enclosure.link;

  const seed = titleSeed
    ? titleSeed.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    : Math.floor(Math.random() * 1000);

  const keywords = CAT_KEYWORDS[catKey] || CAT_KEYWORDS.general;
  const keyword  = keywords[seed % keywords.length];

  return `https://picsum.photos/seed/${seed + keyword}/800/450`;
};

// Fetch a single RSS feed via rss2json proxy
const fetchRSS = async (rssUrl, sourceName, icon, catKey) => {
  try {
    const res = await axios.get(`${RSS2JSON}${encodeURIComponent(rssUrl)}`, { timeout: 5000 });
    if (!res?.data?.items?.length) return [];
    return res.data.items.slice(0, 10).map((item, idx) => {
      const title = strip(item.title?.split(' - ')[0] || 'News Update').substring(0, 140);
      return {
        id: `${sourceName.replace(/\s/g, '-')}-${idx}-${Date.now()}`,
        title,
        description: strip(item.description || item.content || '').substring(0, 250) + '...',
        category: catKey,
        source: { name: `${icon} ${sourceName}` },
        publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : timeNow(),
        image: pickImage(item, catKey, title),
        url: item.link || '#',
        likes: Math.floor(Math.random() * 500) + 50,
        comments: Math.floor(Math.random() * 40) + 3,
        isCommunity: false,
      };
    });
  } catch {
    return [];
  }
};

const getLocalReports = () => {
  try { return JSON.parse(localStorage.getItem('quicknews_user_reports') || '[]'); }
  catch { return []; }
};

export const saveLocalReportedNews = (story) => {
  try {
    const list = getLocalReports();
    localStorage.setItem('quicknews_user_reports', JSON.stringify([story, ...list]));
  } catch (e) { console.warn('localStorage write failed', e); }
};

const BACKUP_COMMUNITY = [
  { id:'c-1', title:'Next-gen chip design leaks in local dev group', description:'Board-level schematics surfaced hours before the official reveal.', category:'technology', source:{name:'g/hardware'}, publishedAt: new Date(Date.now()-1000*60*240).toISOString(), image:IMG.technology, trustVotes:842, notTrustVotes:158, isCommunity:true },
  { id:'c-2', title:'Solar power grid commissioned in Mysuru village', description:'Villagers now get 24/7 clean electricity from community solar panels.', category:'science', source:{name:'g/greenenergy'}, publishedAt: new Date(Date.now()-1000*60*120).toISOString(), image:IMG.science, trustVotes:512, notTrustVotes:42, isCommunity:true },
  { id:'c-3', title:'Bengaluru startup funds AI healthcare diagnosis app', description:'Seed funding secured for early heart anomaly detection model.', category:'health', source:{name:'g/healthtech'}, publishedAt: new Date(Date.now()-1000*60*180).toISOString(), image:IMG.health, trustVotes:340, notTrustVotes:15, isCommunity:true },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: getTopNews
// ─────────────────────────────────────────────────────────────────────────────
export const getTopNews = async (category = 'all', searchQuery = '', feedType = 'all', selectedLang = 'en', userLocation = '') => {
  const catKey = (category || 'all').toLowerCase();
  const langKey = LANGUAGE_SOURCES[selectedLang] ? selectedLang : 'en';
  const langSources = LANGUAGE_SOURCES[langKey];

  let targetLocation = userLocation;
  if (!targetLocation) {
    try {
      const u = JSON.parse(localStorage.getItem('quicknews_current_user') || 'null');
      targetLocation = u?.location || 'Maharashtra (Mumbai/Pune)';
    } catch {
      targetLocation = 'Maharashtra (Mumbai/Pune)';
    }
  }
  const cleanLoc = targetLocation.split('(')[0].trim();

  // ── NEAR ME / LOCAL NEWS STREAM ───────────────────────────────────────────
  if (feedType === 'nearme') {
    let localStories = [];
    const localRssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanLoc + ' ' + (catKey !== 'all' ? catKey : ''))}&hl=en-IN&gl=IN&ceid=IN:en`;
    
    try {
      const items = await fetchRSS(localRssUrl, `Local (${cleanLoc})`, '📍', catKey === 'all' ? 'general' : catKey);
      localStories = items.map(item => ({ ...item, isLocal: true, locationTag: cleanLoc }));
    } catch {}

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      localStories = localStories.filter(i => i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q));
    }
    return localStories;
  }

  // ── PEOPLE'S NEWS ─────────────────────────────────────────────────────────
  let communityPosts = [];

  if (feedType === 'all' || feedType === 'community') {
    try {
      const res = await axios.get(COMMUNITY_API, { timeout: 2500 });
      if (Array.isArray(res?.data)) {
        communityPosts = res.data.map(item => ({
          id: `db-${item.id}`,
          title: item.title,
          description: item.description,
          category: (item.category || 'general').toLowerCase(),
          source: { name: item.sourceName || 'g/community' },
          publishedAt: item.createdAt || timeNow(),
          image: item.imageUrl || IMG[(item.category || '').toLowerCase()] || IMG.general,
          trustVotes: item.trustVotes || 1,
          notTrustVotes: item.notTrustVotes || 0,
          isCommunity: true,
        }));
      }
    } catch {}

    getLocalReports().forEach(local => {
      if (!communityPosts.some(p => p.title === local.title)) {
        const c = (local.category || 'general').toLowerCase();
        communityPosts.push({ ...local, category: c, image: local.imageUrl || local.image || IMG[c] || IMG.general, isCommunity: true });
      }
    });

    BACKUP_COMMUNITY.forEach(b => {
      if (!communityPosts.some(p => p.title === b.title)) communityPosts.push(b);
    });

    if (catKey !== 'all') communityPosts = communityPosts.filter(p => p.category === catKey);
  }

  // ── WORLD NEWS (Language-Specific RSS Aggregation) ────────────────────────
  let worldStories = [];

  if (feedType === 'all' || feedType === 'google') {
    const sourceList = catKey === 'all'
      ? langSources.general
      : (langSources[catKey] || langSources.general);

    const fetched = await Promise.allSettled(
      sourceList.map(src => fetchRSS(src.url, src.name, src.icon, catKey === 'all' ? 'general' : catKey))
    );

    fetched.forEach(result => {
      if (result.status === 'fulfilled') worldStories.push(...result.value);
    });

    // Deduplicate by title similarity
    const seen = new Set();
    worldStories = worldStories.filter(item => {
      const key = item.title.substring(0, 50).toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    worldStories.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  // ── STREAM ISOLATION ──────────────────────────────────────────────────────
  let feed = [];
  if (feedType === 'google') {
    feed = worldStories.filter(i => !i.isCommunity);
  } else if (feedType === 'community') {
    feed = communityPosts.filter(i => i.isCommunity);
  } else {
    feed = [...communityPosts, ...worldStories];
  }

  // ── STRICT CATEGORY ISOLATION (No mixing between tabs!) ────────────────────
  if (catKey !== 'all') {
    feed = feed.filter(i => (i.category || 'general').toLowerCase() === catKey);
  }

  // ── SEARCH FILTER ─────────────────────────────────────────────────────────
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    feed = feed.filter(i =>
      i.title?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q)
    );
  }

  return feed;
};