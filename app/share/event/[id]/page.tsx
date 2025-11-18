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
  participants?: any[];
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

interface VotingResults {
  category: string;
  totalVoters: number;
  winner?: {
    optionId: string;
    optionName: string;
    bordaScore: number;
    percentage: number;
    totalVotes: number;
  };
  optionScores: Array<{
    optionId: string;
    optionName: string;
    rank: number;
    bordaScore: number;
    percentage: number;
    preferenceBreakdown?: {
      rank1: number;
      rank2: number;
      rank3: number;
    };
    venue?: {
      name: string;
      address: string;
      photoUrl?: string;
      rating?: number;
    };
  }>;
}

interface RankingItem {
  optionId: string;
  name: string;
  rank: number;
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
  
  // Ranked voting state
  const [votingResults, setVotingResults] = useState<Record<string, VotingResults>>({});
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [rankingCategory, setRankingCategory] = useState<string | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [submittingVote, setSubmittingVote] = useState(false);
  
  // Check for dark mode preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('vybe_theme');
    // Default to LIGHT mode (like mobile app), only use dark if explicitly toggled
    setDarkMode(savedTheme === 'dark');
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
  
  // Fetch event data and voting results
  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;
      
      try {
        setLoading(true);
        
        const eventRes = await fetch(`/api/events/${eventId}`);
        if (!eventRes.ok) throw new Error('Event not found');
        const eventData = await eventRes.json();
        setEvent(eventData);
        
        if (eventData.votingCategories && eventData.votingCategories.length > 0) {
          setSelectedCategory(eventData.votingCategories[0]);
        }
        
        const optionsRes = await fetch(`/api/events/${eventId}/options`);
        const optionsData = await optionsRes.json();
        setOptions(optionsData.options || []);
        
        const votesRes = await fetch(`/api/events/${eventId}/votes`);
        const votesData = await votesRes.json();
        setVotes(votesData.votes || []);
        
        // Fetch voting results with Borda Count
        const resultsRes = await fetch(`/api/events/${eventId}/voting-results`);
        if (resultsRes.ok) {
          const resultsData = await resultsRes.json();
          const resultsMap: Record<string, VotingResults> = {};
          resultsData.results.forEach((result: VotingResults) => {
            resultsMap[result.category] = result;
          });
          setVotingResults(resultsMap);
        }
        
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
  
  // Open ranking modal for a category
  const handleOpenRankingModal = (category: string) => {
    const categoryOptions = options.filter(opt => opt.category === category);
    
    // Initialize ranking with all options
    const initialRanking = categoryOptions.map((opt, index) => ({
      optionId: opt._id,
      name: opt.label || opt.venue?.name || opt.name || 'Unknown',
      rank: index + 1,
    }));
    
    setRanking(initialRanking);
    setRankingCategory(category);
    setShowRankingModal(true);
  };
  
  // Move item up in ranking
  const moveRankUp = (index: number) => {
    if (index === 0) return;
    const newRanking = [...ranking];
    [newRanking[index - 1], newRanking[index]] = [newRanking[index], newRanking[index - 1]];
    newRanking.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    setRanking(newRanking);
  };
  
  // Move item down in ranking
  const moveRankDown = (index: number) => {
    if (index === ranking.length - 1) return;
    const newRanking = [...ranking];
    [newRanking[index], newRanking[index + 1]] = [newRanking[index + 1], newRanking[index]];
    newRanking.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    setRanking(newRanking);
  };
  
  // Submit ranked vote
  const handleSubmitVote = async () => {
    if (!rankingCategory || submittingVote) return;
    
    try {
      setSubmittingVote(true);
      
      // Submit vote with ranked preferences
      const response = await fetch(`/api/events/${eventId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: guestToken,
          category: rankingCategory,
          preferences: ranking.map(item => item.optionId),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit vote');
      
      // Refresh voting results
      const resultsRes = await fetch(`/api/events/${eventId}/voting-results`);
      if (resultsRes.ok) {
        const resultsData = await resultsRes.json();
        const resultsMap: Record<string, VotingResults> = {};
        resultsData.results.forEach((result: VotingResults) => {
          resultsMap[result.category] = result;
        });
        setVotingResults(resultsMap);
      }
      
      setShowRankingModal(false);
      setSubmittingVote(false);
    } catch (err: any) {
      console.error('Error submitting vote:', err);
      alert('Failed to submit vote. Please try again.');
      setSubmittingVote(false);
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
      
      const optionsRes = await fetch(`/api/events/${eventId}/options`);
      const optionsData = await optionsRes.json();
      setOptions(optionsData.options || []);
      
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
    const date = new Date(dateStr);
    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return { day: dayStr, time: timeStr };
  };
  
  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return '🍕';
      case 'house_party': return '🎉';
      case 'activity': return '✨';
      default: return '🎯';
    }
  };
  
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'restaurant': return darkMode ? '#FF5C8D' : '#FF5C8D';
      case 'house_party': return darkMode ? '#B968F9' : '#9C47AE';
      case 'activity': return darkMode ? '#00D9A3' : '#00D9A3';
      default: return darkMode ? '#9C47AE' : '#9C47AE';
    }
  };
  
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        darkMode ? 'bg-[#18181B]' : 'bg-[#F7F8FA]'
      }`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 mx-auto mb-6 ${
            darkMode ? 'border-purple-500' : 'border-[#9C47AE]'
          }`}></div>
          <p className={`text-xl font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Loading event...
          </p>
        </div>
      </div>
    );
  }
  
  if (error || !event) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
        darkMode ? 'bg-[#18181B]' : 'bg-[#F7F8FA]'
      }`}>
        <div className={`rounded-3xl p-12 max-w-md w-full text-center ${
          darkMode ? 'bg-gray-800 shadow-2xl' : 'bg-white shadow-lg'
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
  const { day, time } = formatDate(event.dateTimeStart);
  const eventColor = getEventTypeColor(event.type);
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-[#18181B]' : 'bg-[#F7F8FA]'
    }`}>
      {/* Header - Matching Mobile App Style */}
      <div className={`sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-900/95 border-b border-gray-800' 
          : 'bg-white/95 border-b border-gray-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            {/* VYBE Logo */}
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black" style={{ color: '#9C47AE' }}>
                VYBE
              </div>
              <div className={`h-6 w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
              <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Event Voting
              </span>
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl transition-all ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              aria-label="Toggle dark mode"
            >
              <span className="text-xl">{darkMode ? '☀️' : '🌙'}</span>
            </button>
          </div>
          
          {/* Event Title Card - Like Mobile */}
          <div className={`rounded-2xl p-4 ${
            darkMode ? 'bg-gray-800/50' : 'bg-white'
          }`}>
            <div className="flex items-start gap-3">
              <div 
                className="text-4xl w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ backgroundColor: eventColor + '20' }}
              >
                {getEventTypeIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className={`text-xl sm:text-2xl font-black mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {event.title}
                </h1>
                {event.description && (
                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {event.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                    darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span>📅</span>
                    <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {day}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                    darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                  }`}>
                    <span>🕐</span>
                    <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {time}
                    </span>
                  </div>
                  {event.city && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                      darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span>📍</span>
                      <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {event.city}
                      </span>
                    </div>
                  )}
                  {event.participants && event.participants.length > 0 && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                      darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <span>👥</span>
                      <span className={`font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {event.participants.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Category Tabs - Horizontal Scrollable Like Mobile */}
        {event.votingCategories && event.votingCategories.length > 0 && (
          <div className="mb-5 -mx-4 sm:mx-0">
            <div className="overflow-x-auto scrollbar-hide px-4 sm:px-0">
              <div className="flex gap-2 pb-2">
                {event.votingCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl font-bold transition-all whitespace-nowrap text-sm flex items-center gap-1.5 ${
                      selectedCategory === cat
                        ? 'text-white shadow-lg scale-105'
                        : darkMode
                          ? 'bg-gray-800 text-gray-300 hover:bg-gray-750'
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                    }`}
                    style={selectedCategory === cat ? { backgroundColor: eventColor } : {}}
                  >
                    <span>
                      {cat === 'place' && '📍'}
                      {cat === 'date_time' && '📅'}
                      {cat === 'cuisine' && '🍴'}
                      {cat === 'location' && '🗺️'}
                    </span>
                    <span>
                      {cat === 'place' && 'Place'}
                      {cat === 'date_time' && 'Date & Time'}
                      {cat === 'cuisine' && 'Cuisine'}
                      {cat === 'location' && 'Location'}
                      {!['place', 'date_time', 'cuisine', 'location'].includes(cat) && cat}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Winner Banner - Matching Mobile App Style */}
        {selectedCategory && event.status === 'finalized' && votingResults[selectedCategory]?.winner && (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 mb-6 border-2 border-yellow-400 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Top Winner</h3>
                <p className="text-xs font-bold text-gray-600">{selectedCategory?.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xl font-black text-gray-900">{votingResults[selectedCategory].winner!.optionName}</h4>
                <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                  <span className="text-lg font-black text-purple-600">{votingResults[selectedCategory].winner!.bordaScore}</span>
                  <span className="text-xs font-bold text-purple-600">pts</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-black text-purple-600">{votingResults[selectedCategory].winner!.percentage.toFixed(1)}%</span>
                <span className="text-gray-600 text-xs">
                  🥇 {votingResults[selectedCategory].winner!.totalVotes || 0} first choice{(votingResults[selectedCategory].winner!.totalVotes || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Rank Your Preferences Button */}
        {categoryOptions.length > 0 && event.status !== 'finalized' && (
          <button
            onClick={() => handleOpenRankingModal(selectedCategory)}
            className="w-full mb-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>📊</span>
            <span>Rank Your Preferences</span>
          </button>
        )}
        
        {/* Leaderboard - Matching Mobile App Style */}
        {selectedCategory && votingResults[selectedCategory]?.optionScores && votingResults[selectedCategory].optionScores.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">
                {selectedCategory.replace('_', ' ').toUpperCase()}
              </h2>
              <span className="text-sm font-bold text-gray-600">
                {votingResults[selectedCategory].totalVoters || 0} voter{votingResults[selectedCategory].totalVoters !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-3 mb-4">
              {votingResults[selectedCategory].optionScores.map((option) => {
                const getMedalColor = (rank: number) => {
                  if (rank === 1) return '#F59E0B'; // Gold
                  if (rank === 2) return '#C0C0C0'; // Silver
                  if (rank === 3) return '#CD7F32'; // Bronze
                  return '#6B7280';
                };
                
                const medalColor = getMedalColor(option.rank);
                
                return (
                  <div
                    key={option.optionId}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all"
                  >
                    {/* Rank Medal */}
                    <div 
                      className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-black text-sm"
                      style={{ backgroundColor: medalColor + '20', color: medalColor }}
                    >
                      {option.rank}
                    </div>
                    
                    {/* Option Info */}
                    <div className="flex-1 min-w-0">
                      {/* Name & Score */}
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0 pr-3">
                          <h3 className="font-bold text-gray-900 truncate">{option.optionName}</h3>
                          {option.venue?.address && (
                            <p className="text-xs text-gray-600 mt-0.5 truncate">{option.venue.address}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-lg flex-shrink-0">
                          <span className="text-base font-black text-purple-600">{option.bordaScore}</span>
                          <span className="text-[10px] font-bold text-purple-600">pts</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.max(10, option.percentage)}%`,
                            background: `linear-gradient(90deg, ${medalColor}66, ${medalColor}33)`
                          }}
                        />
                      </div>
                      
                      {/* Stats Row */}
                      <div className="flex items-center gap-3 text-xs">
                        {option.preferenceBreakdown && (
                          <>
                            <div className="flex items-center gap-1">
                              <span className="text-purple-600">🥇</span>
                              <span className="text-gray-600">1st:</span>
                              <span className="font-bold text-gray-900">{option.preferenceBreakdown.rank1 || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-purple-600">✓</span>
                              <span className="text-gray-600">2nd:</span>
                              <span className="font-bold text-gray-900">{option.preferenceBreakdown.rank2 || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-purple-600">•</span>
                              <span className="text-gray-600">3rd:</span>
                              <span className="font-bold text-gray-900">{option.preferenceBreakdown.rank3 || 0}</span>
                            </div>
                          </>
                        )}
                        <span className="ml-auto font-bold text-purple-600">{option.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Options Grid - Card Style Like Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {categoryOptions.length === 0 ? (
            <div className={`md:col-span-2 rounded-2xl p-12 text-center ${
              darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}>
              <div className="text-6xl mb-4">🤔</div>
              <p className={`text-lg font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                No options yet
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Be the first to add one!
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
                  onClick={() => handleVote(option._id)}
                  className={`rounded-2xl overflow-hidden transition-all cursor-pointer hover:scale-[1.02] ${
                    darkMode ? 'bg-gray-800' : 'bg-white shadow-sm hover:shadow-md'
                  } ${isUserVote ? 'ring-4' : ''}`}
                  style={isUserVote ? { ringColor: eventColor } : {}}
                >
                  {option.venue?.photoUrl && (
                    <div className="h-40 overflow-hidden relative">
                      <img
                        src={option.venue.photoUrl}
                        alt={optionName}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                      {isUserVote && (
                        <div 
                          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                          style={{ backgroundColor: eventColor }}
                        >
                          ✓
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-3">
                        <h3 className={`text-base font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {optionName}
                        </h3>
                        {option.venue?.address && (
                          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {option.venue.address}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-2xl font-black`} style={{ color: eventColor }}>
                          {option.votes}
                        </div>
                        <div className={`text-[10px] font-bold ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          votes
                        </div>
                      </div>
                    </div>
                    
                    {option.description && (
                      <p className={`text-xs mb-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                        {option.description}
                      </p>
                    )}
                    
                    {option.venue && (
                      <div className="flex items-center gap-3 text-xs mb-2.5">
                        {option.venue.rating && (
                          <span className={`flex items-center gap-1 font-bold ${
                            darkMode ? 'text-yellow-400' : 'text-yellow-600'
                          }`}>
                            ⭐ {option.venue.rating.toFixed(1)}
                          </span>
                        )}
                        {option.venue.priceLevel && (
                          <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            {'$'.repeat(option.venue.priceLevel)}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Progress Bar */}
                    <div className={`rounded-full h-2 overflow-hidden ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <div
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${votePercentage}%`,
                          backgroundColor: eventColor 
                        }}
                      />
                    </div>
                    <p className={`text-[10px] font-bold mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {votePercentage}% of votes
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Add Option Card */}
        <div className={`rounded-2xl p-5 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>
          {!showAddOption ? (
            <button
              onClick={() => setShowAddOption(true)}
              className={`w-full py-3.5 border-2 border-dashed rounded-xl font-bold transition-all text-sm ${
                darkMode 
                  ? 'border-gray-700 text-gray-400 hover:border-purple-500 hover:text-purple-400' 
                  : 'border-gray-300 text-gray-600 hover:border-[#9C47AE] hover:text-[#9C47AE]'
              }`}
            >
              + Add Your Option
            </button>
          ) : (
            <div className="space-y-3">
              <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Add Your Option
              </h3>
              <input
                type="text"
                placeholder="Option name"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#9C47AE]'
                } border-2 focus:outline-none`}
              />
              <textarea
                placeholder="Description (optional)"
                value={newOptionDescription}
                onChange={(e) => setNewOptionDescription(e.target.value)}
                rows={3}
                className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#9C47AE]'
                } border-2 focus:outline-none`}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAddOption}
                  disabled={!newOptionName.trim() || votingInProgress}
                  className="flex-1 py-3 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  style={{ backgroundColor: eventColor }}
                >
                  {votingInProgress ? 'Adding...' : 'Add Option'}
                </button>
                <button
                  onClick={() => {
                    setShowAddOption(false);
                    setNewOptionName('');
                    setNewOptionDescription('');
                  }}
                  className={`px-6 py-3 font-bold rounded-xl transition-all text-sm ${
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
          darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
        }`}>
          <p className={`text-base font-bold mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Want to create your own event?
          </p>
          <a
            href="https://vybe.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3.5 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm"
            style={{ backgroundColor: eventColor }}
          >
            Download VYBE App 🚀
          </a>
        </div>
      </div>
      
      {/* Ranking Modal - Matching Mobile App Style */}
      {showRankingModal && rankingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowRankingModal(false)}>
          <div className={`rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="mb-6">
              <h2 className={`text-2xl font-black mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Rank Your Preferences
              </h2>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Use arrows to reorder • Top choice gets most points
              </p>
            </div>
            
            {/* Ranking List */}
            <div className="space-y-2 mb-6">
              {ranking.map((item, index) => {
                const getMedalColor = (rank: number) => {
                  if (rank === 1) return { bg: '#FEF3C7', text: '#F59E0B', border: '#FCD34D' }; // Gold
                  if (rank === 2) return { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' }; // Silver
                  if (rank === 3) return { bg: '#FED7AA', text: '#EA580C', border: '#FDBA74' }; // Bronze
                  return { bg: '#F9FAFB', text: '#9CA3AF', border: '#E5E7EB' };
                };
                
                const colors = getMedalColor(item.rank);
                
                return (
                  <div 
                    key={item.optionId} 
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                      darkMode ? 'bg-gray-700' : 'bg-white'
                    }`}
                    style={{ borderColor: colors.border }}
                  >
                    {/* Rank Badge */}
                    <div 
                      className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-black text-lg"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {item.rank}
                    </div>
                    
                    {/* Option Name */}
                    <div className={`flex-1 font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {item.name}
                    </div>
                    
                    {/* Controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveRankUp(index)}
                        disabled={index === 0}
                        className="p-2 w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 hover:bg-purple-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveRankDown(index)}
                        disabled={index === ranking.length - 1}
                        className="p-2 w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 hover:bg-purple-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold"
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmitVote}
                disabled={submittingVote}
                className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 shadow-md"
              >
                {submittingVote ? '⏳ Submitting...' : '✓ Submit Vote'}
              </button>
              <button
                onClick={() => setShowRankingModal(false)}
                disabled={submittingVote}
                className={`px-6 py-4 font-bold rounded-xl transition-all disabled:opacity-50 ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
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
