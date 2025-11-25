import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Menu, X, Zap, AlertCircle, ArrowUpRight, WifiOff } from 'lucide-react';

// --- CONFIGURATION: HIGH RELIABILITY SOURCES ---
const RSS_TO_JSON_API = "https://api.rss2json.com/v1/api.json?rss_url=";

const CATEGORIES = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    url: 'https://news.google.com/rss/search?q=OpenAI+ChatGPT+OR+Sam+Altman&hl=en-US&gl=US&ceid=US:en' 
  },
  { 
    id: 'google', 
    name: 'DeepMind', 
    url: 'https://news.google.com/rss/search?q=Google+DeepMind+OR+Gemini+AI+OR+Sundar+Pichai&hl=en-US&gl=US&ceid=US:en' 
  },
  { 
    id: 'grok', 
    name: 'Grok / xAI', 
    url: 'https://news.google.com/rss/search?q=xAI+Grok+OR+Elon+Musk+AI&hl=en-US&gl=US&ceid=US:en' 
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    url: 'https://news.google.com/rss/search?q=Anthropic+Claude+AI&hl=en-US&gl=US&ceid=US:en' 
  },
  { 
    id: 'meta', 
    name: 'Meta AI', 
    url: 'https://news.google.com/rss/search?q=Meta+AI+Llama+Mark+Zuckerberg&hl=en-US&gl=US&ceid=US:en' 
  },
  { 
    id: 'community', 
    name: 'Community', 
    url: 'https://news.google.com/rss/search?q=AI+Community+Discussion+OR+AI+Twitter+Drama&hl=en-US&gl=US&ceid=US:en' 
  }
];

export default function App() {
  const [activeCategory, setActiveCategory] = useState('openai');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // --- PWA: SERVICE WORKER REGISTRATION ---
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('Service Worker registered:', reg))
        .catch(err => console.log('Service Worker registration failed:', err));
    }

    // Network status listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- CORE FUNCTION: FETCH NEWS ---
  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    
    // Don't try to fetch if we know we are offline
    if (isOffline) {
      setLoading(false);
      return;
    }

    try {
      const category = CATEGORIES.find(c => c.id === activeCategory);
      const cacheBuster = `&t=${new Date().getTime()}`;
      const response = await fetch(`${RSS_TO_JSON_API}${encodeURIComponent(category.url)}${cacheBuster}`);
      const data = await response.json();
      
      if (data.status === 'ok') {
        setNews(data.items);
        setLastUpdated(new Date());
      } else {
        console.error("RSS Error:", data.message);
        setError(`Feed unavailable. Please try again later.`);
        // Don't clear news on error if we have cached data (handled by SW)
      }
    } catch (err) {
      console.error("Network Error:", err);
      setError("Network connection failed. Showing cached data if available.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    let intervalId;
    if (autoRefresh && !isOffline) {
      intervalId = setInterval(() => fetchNews(), 60000);
    }
    return () => clearInterval(intervalId);
  }, [activeCategory, autoRefresh, isOffline]);

  // Helper to clean up text
  const cleanText = (html) => {
    if (!html) return "";
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const diff = Math.floor((new Date() - date) / 1000);
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans selection:bg-black selection:text-white">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/95 border-b border-gray-200 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 text-black tracking-tight font-bold select-none">
            <Zap size={20} fill="currentColor" className="text-black" />
            <span className="hidden sm:inline">LUKMAN.AI</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8 text-sm font-medium">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`transition-colors duration-200 pb-1 border-b-2 ${
                  activeCategory === cat.id 
                    ? 'text-black border-black' 
                    : 'text-gray-500 border-transparent hover:text-black'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {isOffline ? (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded">
                <WifiOff size={14} /> OFFLINE
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                LIVE
              </div>
            )}
            
            <button 
              onClick={fetchNews} 
              className={`transition-colors text-gray-400 hover:text-black ${loading ? 'animate-spin text-black' : ''}`}
              title="Refresh"
              disabled={isOffline}
            >
              <RefreshCw size={18} />
            </button>

            <button 
              className="md:hidden text-gray-500"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-6 py-4 text-sm font-medium ${
                  activeCategory === cat.id 
                    ? 'bg-gray-50 text-black' 
                    : 'text-gray-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Section Title */}
        <div className="mb-12 flex items-baseline justify-between border-b border-gray-200 pb-4">
          <h2 className="text-4xl font-bold text-black tracking-tight">
            {CATEGORIES.find(c => c.id === activeCategory)?.name}
          </h2>
          <span className="font-mono text-xs text-gray-400 uppercase tracking-wider hidden sm:inline">
            UPDATED {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
        </div>

        {/* Error/Offline Display */}
        {(error || isOffline) && (
          <div className="mb-8 p-4 border border-red-200 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} /> 
            {isOffline 
              ? "You are currently offline. Showing cached content where available." 
              : error}
          </div>
        )}

        {/* Skeleton Loader */}
        {loading && news.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-5"></div>
                <div className="h-6 bg-gray-200 w-3/4 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 w-full rounded mb-2"></div>
                <div className="h-4 bg-gray-200 w-2/3 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* News Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
            {news.map((item, index) => (
              <article key={index} className="group flex flex-col h-full">
                
                {item.thumbnail && (
                  <div className="mb-5 overflow-hidden rounded-lg bg-gray-100 aspect-video border border-gray-100">
                    <img 
                      src={item.thumbnail} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {e.target.style.display='none'}} 
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">
                  <span>{item.author || 'News Source'}</span>
                  <span>{formatDate(item.pubDate)}</span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {cleanText(item.title)}
                  </a>
                </h3>

                <p className="text-base text-gray-600 line-clamp-3 mb-5 flex-1 leading-relaxed">
                  {cleanText(item.description).substring(0, 140)}...
                </p>

                <a 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-black group-hover:text-blue-600 transition-colors mt-auto"
                >
                  Read Story <ArrowUpRight size={16} />
                </a>
              </article>
            ))}
          </div>
        )}

        {!loading && !error && news.length === 0 && (
          <div className="py-24 text-center">
            <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
              <Zap size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">No updates found in this stream right now.</p>
          </div>
        )}
      </main>
    </div>
  );
}
