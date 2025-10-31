'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Event {
  _id: string;
  title: string;
  description: string;
  type: string;
  dateTimeStart: string;
  city: string;
  area: string;
  status: string;
  votingCategories: string[];
  createdBy?: string;
}

interface Option {
  _id: string;
  eventId: string;
  category: string;
  label: string;
  name?: string;
  description?: string;
  votes: number;
  venue?: {
    name: string;
    address: string;
    photoUrl?: string;
    rating?: number;
    priceLevel?: number;
  };
  isAIGenerated?: boolean;
}

interface Vote {
  _id: string;
  eventId: string;
  optionId: string;
  category: string;
  voterId?: string;
  guestToken?: string;
}

export default function ShareEventPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [options, setOptions] = useState<Option[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('place');
  const [guestToken, setGuestToken] = useState<string>('');
  const [votingInProgress, setVotingInProgress] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionDescription, setNewOptionDescription] = useState('');
  const [showAddOption, setShowAddOption] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Check for dark mode preference
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('vybe_theme');
    setDarkMode(savedTheme === 'dark' || (savedTheme === null && prefersDark));
    
    // Listen for theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('vybe_theme') === null) {
        setDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Generate or retrieve guest token
  useEffect(() => {
    let token = localStorage.getItem('vybe_guest_token');
    if (!token) {
      token = `guest_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('vybe_guest_token', token);
    }
    setGuestToken(token);
  }, []);
  
  // Fetch event data
  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;
      
      try {
        setLoading(true);
        
        // Fetch event details
        const eventRes = await fetch(`/api/events/${eventId}`);
        if (!eventRes.ok) throw new Error('Event not found');
        const eventData = await eventRes.json();
        setEvent(eventData);
        
        // Set initial category
        if (eventData.votingCategories && eventData.votingCategories.length > 0) {
          setSelectedCategory(eventData.votingCategories[0]);
        }
        
        // Fetch options
        const optionsRes = await fetch(`/api/events/${eventId}/options`);
        const optionsData = await optionsRes.json();
        setOptions(optionsData.options || []);
        
        // Fetch votes
        const votesRes = await fetch(`/api/events/${eventId}/votes`);
        const votesData = await votesRes.json();
        setVotes(votesData.votes || []);
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching event:', err);
        setError(err.message || 'Failed to load event');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId]);
  
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('vybe_theme', newMode ? 'dark' : 'light');
  };
  
  const handleVote = async (optionId: string) => {
    if (!guestToken || votingInProgress) return;
    
    try {
      setVotingInProgress(true);
      
      const response = await fetch(`/api/events/${eventId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionId,
          category: selectedCategory,
          guestToken,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to vote');
      
      // Refresh votes and options
      const votesRes = await fetch(`/api/events/${eventId}/votes`);
      const votesData = await votesRes.json();
      setVotes(votesData.votes || []);
      
      const optionsRes = await fetch(`/api/events/${eventId}/options`);
      const optionsData = await optionsRes.json();
      setOptions(optionsData.options || []);
      
      setVotingInProgress(false);
    } catch (err: any) {
      console.error('Error voting:', err);
      alert('Failed to cast vote. Please try again.');
      setVotingInProgress(false);
    }
  };
  
  const handleAddOption = async () => {
    if (!newOptionName.trim() || votingInProgress) return;
    
    try {
      setVotingInProgress(true);
      
      const response = await fetch(`/api/events/${eventId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newOptionName.trim(),
          description: newOptionDescription.trim(),
          category: selectedCategory,
          isAIGenerated: false,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to add option');
      
      // Refresh options
      const optionsRes = await fetch(`/api/events/${eventId}/options`);
      const optionsData = await optionsRes.json();
      setOptions(optionsData.options || []);
      
      // Reset form
      setNewOptionName('');
      setNewOptionDescription('');
      setShowAddOption(false);
      setVotingInProgress(false);
    } catch (err: any) {
      console.error('Error adding option:', err);
      alert('Failed to add option. Please try again.');
      setVotingInProgress(false);
    }
  };
  
  const getUserVote = (category: string) => {
    return votes.find(v => v.category === category && v.guestToken === guestToken);
  };
  
  const getCategoryOptions = () => {
    return options.filter(opt => opt.category === selectedCategory);
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return '🍕';
      case 'house_party': return '🎉';
      case 'activity': return '✨';
      default: return '🎯';
    }
  };
  
  const getEventTypeGradient = (type: string) => {
    switch (type) {
      case 'restaurant': return darkMode 
        ? 'from-pink-500 via-pink-600 to-rose-600'
        : 'from-pink-400 via-pink-500 to-rose-500';
      case 'house_party': return darkMode
        ? 'from-purple-500 via-purple-600 to-fuchsia-600'
        : 'from-purple-400 via-purple-500 to-fuchsia-500';
      case 'activity': return darkMode
        ? 'from-emerald-500 via-teal-600 to-cyan-600'
        : 'from-emerald-400 via-teal-500 to-cyan-500';
      default: return darkMode
        ? 'from-blue-500 via-indigo-600 to-purple-600'
        : 'from-blue-400 via-indigo-500 to-purple-500';
    }
  };
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'
      }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 mx-auto mb-6 ${
            darkMode ? 'border-purple-500' : 'border-purple-600'
          }`}></div>
          <p className={`text-xl font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Loading your vybe...
          </p>
        </div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${
        darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'
      }`}>
        <div className={`rounded-3xl shadow-2xl p-12 max-w-md w-full text-center ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-7xl mb-6">😞</div>
          <h1 className={`text-3xl font-black mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Event Not Found
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {error || 'This event does not exist or has been deleted.'}
          </p>
        </div>
      </div>
    );
  }
  
  const currentVote = getUserVote(selectedCategory);
  const categoryOptions = getCategoryOptions();
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'
    }`}>
      {/* Header with VYBE Brand */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-900/90 border-gray-800' 
          : 'bg-white/90 border-gray-200'
      }`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* VYBE Logo */}
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent ${
                getEventTypeGradient(event.type)
              }`}>
                VYBE
              </div>
              <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Event Voting
              </span>
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-xl transition-all ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
          
          {/* Event Header */}
          <div className="flex items-start gap-4">
            <div className={`text-5xl flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br ${
              getEventTypeGradient(event.type)
            }`}>
              {getEventTypeIcon(event.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-2xl sm:text-3xl font-black mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {event.title}
              </h1>
              {event.description && (
                <p className={`text-sm sm:text-base mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {event.description}
                </p>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <span>📅</span>
                  <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formatDate(event.dateTimeStart)}
                  </span>
                </div>
                {event.city && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                    darkMode ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <span>📍</span>
                    <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {event.city}{event.area && `, ${event.area}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Category Tabs */}
        {event.votingCategories && event.votingCategories.length > 0 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {event.votingCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm sm:text-base ${
                  selectedCategory === cat
                    ? `bg-gradient-to-r ${getEventTypeGradient(event.type)} text-white shadow-lg scale-105`
                    : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-750'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                }`}
              >
                {cat === 'place' && '📍 Place'}
                {cat === 'date_time' && '📅 Date & Time'}
                {cat === 'cuisine' && '🍴 Cuisine'}
                {cat === 'location' && '🗺️ Location'}
                {!['place', 'date_time', 'cuisine', 'location'].includes(cat) && cat}
              </button>
            ))}
          </div>
        )}
        
        {/* Voting Instructions */}
        <div className={`rounded-2xl p-4 mb-6 border-l-4 ${
          darkMode 
            ? 'bg-purple-900/30 border-purple-500' 
            : 'bg-purple-50 border-purple-600'
        }`}>
          <p className={`font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-900'}`}>
            {currentVote 
              ? '✅ You voted! Tap another option to change your vote.' 
              : '👋 Cast your vote below! Your opinion matters.'}
          </p>
        </div>
        
        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {categoryOptions.length === 0 ? (
            <div className={`md:col-span-2 rounded-2xl p-12 text-center ${
              darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'
            }`}>
              <div className="text-6xl mb-4">🤔</div>
              <p className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                No options yet. Be the first to add one!
              </p>
            </div>
          ) : (
            categoryOptions.map((option) => {
              const isUserVote = currentVote?.optionId === option._id;
              const totalVotes = categoryOptions.reduce((sum, opt) => sum + opt.votes, 0);
              const votePercentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
              const optionName = option.label || option.venue?.name || option.name || 'Unknown';
              
              return (
                <div
                  key={option._id}
                  className={`rounded-2xl overflow-hidden transition-all cursor-pointer hover:scale-[1.02] ${
                    darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'
                  } ${isUserVote ? `ring-4 ${darkMode ? 'ring-purple-500' : 'ring-purple-600'}` : ''}`}
                  onClick={() => handleVote(option._id)}
                >
                  {option.venue?.photoUrl && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={option.venue.photoUrl}
                        alt={optionName}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className={`text-lg font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {optionName}
                          {isUserVote && (
                            <span className={`text-base ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>✓</span>
                          )}
                        </h3>
                        {option.venue?.address && (
                          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {option.venue.address}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent ${
                          getEventTypeGradient(event.type)
                        }`}>
                          {option.votes}
                        </div>
                        <div className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          votes
                        </div>
                      </div>
                    </div>
                    
                    {option.description && (
                      <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                        {option.description}
                      </p>
                    )}
                    
                    {option.venue && (
                      <div className="flex items-center gap-3 text-sm mb-3">
                        {option.venue.rating && (
                          <span className={`flex items-center gap-1 font-semibold ${
                            darkMode ? 'text-yellow-400' : 'text-yellow-600'
                          }`}>
                            ⭐ {option.venue.rating.toFixed(1)}
                          </span>
                        )}
                        {option.venue.priceLevel && (
                          <span className={`font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {'$'.repeat(option.venue.priceLevel)}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Vote Progress Bar */}
                    <div className={`rounded-full h-2.5 overflow-hidden ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div
                        className={`h-full transition-all duration-500 bg-gradient-to-r ${getEventTypeGradient(event.type)}`}
                        style={{ width: `${votePercentage}%` }}
                      />
                    </div>
                    <p className={`text-xs font-semibold mt-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {votePercentage}% of votes
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Add Option Section */}
        <div className={`rounded-2xl p-6 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
          {!showAddOption ? (
            <button
              onClick={() => setShowAddOption(true)}
              className={`w-full py-4 border-2 border-dashed rounded-xl font-bold transition-all ${
                darkMode 
                  ? 'border-gray-700 text-gray-400 hover:border-purple-500 hover:text-purple-400' 
                  : 'border-gray-300 text-gray-600 hover:border-purple-500 hover:text-purple-600'
              }`}
            >
              + Add Your Option
            </button>
          ) : (
            <div className="space-y-4">
              <h3 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Add Your Option
              </h3>
              <input
                type="text"
                placeholder="Option name"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                } border-2 focus:ring-0`}
              />
              <textarea
                placeholder="Description (optional)"
                value={newOptionDescription}
                onChange={(e) => setNewOptionDescription(e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 rounded-xl font-medium transition-all ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500'
                } border-2 focus:ring-0`}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAddOption}
                  disabled={!newOptionName.trim() || votingInProgress}
                  className={`flex-1 py-3 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r ${
                    getEventTypeGradient(event.type)
                  }`}
                >
                  {votingInProgress ? 'Adding...' : 'Add Option'}
                </button>
                <button
                  onClick={() => {
                    setShowAddOption(false);
                    setNewOptionName('');
                    setNewOptionDescription('');
                  }}
                  className={`px-6 py-3 font-bold rounded-xl transition-all ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer CTA */}
        <div className={`text-center rounded-2xl p-8 ${
          darkMode ? 'bg-gray-800' : 'bg-white shadow-lg'
        }`}>
          <p className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Want to create your own event?
          </p>
          <a
            href="https://vybe.app"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-block px-8 py-4 text-white font-black rounded-xl shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 bg-gradient-to-r ${
              getEventTypeGradient(event.type)
            }`}
          >
            Download VYBE App 🚀
          </a>
        </div>
      </div>
      
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
