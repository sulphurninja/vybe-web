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
  createdByName?: string;
  hostId?: string;
  participants?: Array<{
    userId: string;
    userName?: string;
    role: string;
  }>;
}

interface OptionScore {
  optionId: string;
  optionName: string;
  bordaScore: number;
  totalVotes: number;
  rank: number;
  percentage: number;
  venue?: {
    photoUrl?: string;
    address?: string;
    rating?: number;
    priceLevel?: number;
  };
}

interface CategoryResults {
  category: string;
  totalVoters: number;
  optionScores: OptionScore[];
  winner: any;
  isTied: boolean;
  tieBreaker: string | null;
  status: string;
}

export default function EventPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [votingResults, setVotingResults] = useState<Record<string, CategoryResults>>({});
  const [votingStatus, setVotingStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // User/Guest State
  const [userName, setUserName] = useState<string>('');
  const [hasJoined, setHasJoined] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [guestToken, setGuestToken] = useState<string>('');
  
  // Voting State
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [rankingCategory, setRankingCategory] = useState<string | null>(null);
  const [ranking, setRanking] = useState<Array<{ optionId: string; name: string; rank: number }>>([]);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [joiningEvent, setJoiningEvent] = useState(false);
  
  // Location Details Dialog State
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  
  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Voting Status Modal State
  const [showVotingStatusModal, setShowVotingStatusModal] = useState(false);

  // Check for deep link and redirect to app if installed
  useEffect(() => {
    const appScheme = `vybe://event/${eventId}`;
    const appStoreLink = 'https://apps.apple.com/app/vybe'; // Replace with actual
    const playStoreLink = 'https://play.google.com/store/apps/details?id=com.vybe'; // Replace with actual
    
    // Try to open the app
    const timeout = setTimeout(() => {
      // If still on page after 1.5s, app probably not installed
      console.log('App not installed, showing web version');
    }, 1500);
    
    // Attempt to open app
    window.location.href = appScheme;
    
    return () => clearTimeout(timeout);
  }, [eventId]);

  // Generate or retrieve guest token
  useEffect(() => {
    let token = localStorage.getItem('vybe_guest_token');
    if (!token) {
      token = `guest_${Math.random().toString(36).substring(2, 15)}${Date.now()}`;
      localStorage.setItem('vybe_guest_token', token);
    }
    setGuestToken(token);
    
    // Check if user has already joined
    const savedName = localStorage.getItem(`vybe_event_${eventId}_name`);
    if (savedName) {
      setUserName(savedName);
      setHasJoined(true);
    }
  }, [eventId]);

  // Fetch event data and voting results
  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) return;
      
      try {
        setLoading(true);
        
        // Fetch event
        const eventRes = await fetch(`/api/events/${eventId}`);
        if (!eventRes.ok) throw new Error('Event not found');
        const eventData = await eventRes.json();
        setEvent(eventData);
        
        console.log('📊 Event data:', {
          id: eventData._id,
          title: eventData.title,
          votingCategories: eventData.votingCategories,
          participants: eventData.participants?.length,
        });
        
        if (eventData.votingCategories && eventData.votingCategories.length > 0) {
          setSelectedCategory(eventData.votingCategories[0]);
        }
        
        // Fetch voting results
        console.log('🔄 Fetching voting results from:', `/api/events/${eventId}/voting-results`);
        const resultsRes = await fetch(`/api/events/${eventId}/voting-results`);
        console.log('📡 Results response status:', resultsRes.status, resultsRes.statusText);
        
        if (!resultsRes.ok) {
          console.error('❌ Results API error:', resultsRes.status);
          const errorText = await resultsRes.text();
          console.error('❌ Error response:', errorText);
          throw new Error(`API error: ${resultsRes.status}`);
        }
        
        const resultsText = await resultsRes.text();
        console.log('📄 Raw response text:', resultsText.substring(0, 500) + '...');
        
        const resultsData = JSON.parse(resultsText);
        console.log('📊 Parsed voting results response:', resultsData);
        console.log('📊 Type of resultsData.results:', typeof resultsData.results);
        console.log('📊 resultsData.results is object?', resultsData.results && typeof resultsData.results === 'object');
        console.log('📊 Keys in resultsData.results:', resultsData.results ? Object.keys(resultsData.results) : 'null/undefined');
        
        // The API can return EITHER { results: {...} } OR just {...}
        // Check which format it is
        const results = resultsData.results || resultsData;
        console.log('📊 Setting votingResults state with:', results);
        console.log('📊 Keys being set:', Object.keys(results));
        
        // Force new object reference to trigger React re-render
        setVotingResults({ ...results });
        setForceUpdate(prev => prev + 1);
        
        // Verify state will update
        console.log('✅ State should now have categories:', Object.keys(results));
        
        console.log('📊 Voting results:', {
          rawResponse: resultsData,
          extractedResults: results,
          categories: Object.keys(results),
          firstCategory: eventData.votingCategories?.[0],
          firstCategoryResults: results[eventData.votingCategories?.[0]],
          hasFirstCategoryData: !!results[eventData.votingCategories?.[0]],
        });
        
        // Fetch voting status (who voted, who didn't)
        try {
          const statusRes = await fetch(`/api/events/${eventId}/voting-status`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setVotingStatus(statusData.statusByCategory || {});
            console.log('📊 Voting status loaded:', statusData);
          }
        } catch (err) {
          console.warn('⚠️ Could not load voting status:', err);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('❌ Error fetching event:', err);
        setError(err.message || 'Failed to load event');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [eventId]);

  const handleJoinEvent = async () => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    if (joiningEvent) {
      console.log('⚠️ Already joining event, please wait...');
      return;
    }
    
    try {
      setJoiningEvent(true);
      
      // Join as guest participant
      const response = await fetch(`/api/events/${eventId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestToken,
          userName: userName.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok && !data.alreadyJoined) {
        throw new Error(data.error || 'Failed to join event');
      }
      
      if (data.alreadyJoined) {
        console.log('✅ Already joined this event');
      }
      
      // Save name locally
      localStorage.setItem(`vybe_event_${eventId}_name`, userName.trim());
      setHasJoined(true);
      setShowJoinModal(false);
      
      // Refresh ALL data (event + voting results)
      const [eventRes, resultsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/voting-results`)
      ]);
      
      if (!eventRes.ok || !resultsRes.ok) {
        console.error('❌ API error:', { eventStatus: eventRes.status, resultsStatus: resultsRes.status });
        throw new Error('Failed to refresh data');
      }
      
      const eventData = await eventRes.json();
      const resultsData = await resultsRes.json();
      
      console.log('📥 Received results data:', {
        fullResponse: resultsData,
        results: resultsData.results,
        resultsType: typeof resultsData.results,
        resultsKeys: Object.keys(resultsData.results || resultsData || {}),
      });
      
      setEvent(eventData);
      // The API can return EITHER { results: {...} } OR just {...}
      const results = resultsData.results || resultsData;
      // Force new object reference to trigger React re-render
      setVotingResults({ ...results });
      setForceUpdate(prev => prev + 1);
      
      // Force re-render by updating selected category
      if (eventData.votingCategories && eventData.votingCategories.length > 0) {
        setSelectedCategory(eventData.votingCategories[0]);
      }
      
      console.log('✅ Data refreshed and state updated:', {
        participants: eventData.participants?.length,
        votingCategories: eventData.votingCategories,
        resultsCategories: Object.keys(results),
        firstCategoryResults: results[eventData.votingCategories?.[0]],
        selectedCategory: eventData.votingCategories?.[0],
      });
      
      setJoiningEvent(false);
    } catch (err: any) {
      console.error('❌ Failed to join event:', err);
      alert(err.message || 'Failed to join event');
      setJoiningEvent(false);
    }
  };

  const handleVote = (category: string) => {
    if (event.status !== 'voting') {
      alert('Voting has ended for this event');
      return;
    }
    if (!hasJoined) {
      setShowJoinModal(true);
      return;
    }
    
    const categoryResults = votingResults[category];
    if (!categoryResults || !categoryResults.optionScores || categoryResults.optionScores.length === 0) {
      alert('No options available to vote on');
      return;
    }
    
    // Initialize ranking
    const initialRanking = categoryResults.optionScores.map((opt, idx) => ({
      optionId: opt.optionId,
      name: opt.optionName,
      rank: idx + 1,
    }));
    
    setRanking(initialRanking);
    setRankingCategory(category);
    setShowRankingModal(true);
  };

  const handleSubmitVote = async () => {
    if (!rankingCategory || ranking.length === 0) return;
    
    try {
      setSubmittingVote(true);
      
      const preferences = ranking.map((item) => ({
        optionId: item.optionId,
        optionName: item.name,
        rank: item.rank,
      }));
      
      const response = await fetch(`/api/events/${eventId}/voting-preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: guestToken, // Use guestToken as userId for guests
          category: rankingCategory,
          preferences,
          voterName: userName,
          guestToken,
          isQuickPoll: false,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit vote');
      }
      
      // Refresh voting results
      const resultsRes = await fetch(`/api/events/${eventId}/voting-results`);
      const resultsData = await resultsRes.json();
      
      // The API can return EITHER { results: {...} } OR just {...}
      const results = resultsData.results || resultsData;
      console.log('📊 Refreshed results after vote:', {
        raw: resultsData,
        extracted: results,
        keys: Object.keys(results),
      });
      
      // Force new object reference to trigger React re-render
      setVotingResults({ ...results });
      setForceUpdate(prev => prev + 1);
      
      // Refresh voting status
      try {
        const statusRes = await fetch(`/api/events/${eventId}/voting-status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setVotingStatus(statusData.statusByCategory || {});
        }
      } catch (err) {
        console.warn('⚠️ Could not refresh voting status:', err);
      }
      
      setShowRankingModal(false);
      setRankingCategory(null);
      setRanking([]);
      setSubmittingVote(false);
      
      alert('Vote submitted successfully! 🎉');
    } catch (err: any) {
      alert(err.message || 'Failed to submit vote');
      setSubmittingVote(false);
    }
  };

  const moveRankUp = (index: number) => {
    if (index === 0) return;
    const newRanking = [...ranking];
    [newRanking[index - 1], newRanking[index]] = [newRanking[index], newRanking[index - 1]];
    // Update ranks
    newRanking.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    setRanking(newRanking);
  };

  const moveRankDown = (index: number) => {
    if (index === ranking.length - 1) return;
    const newRanking = [...ranking];
    [newRanking[index], newRanking[index + 1]] = [newRanking[index + 1], newRanking[index]];
    // Update ranks
    newRanking.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    setRanking(newRanking);
  };
  
  // Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newRanking = [...ranking];
    const draggedItem = newRanking[draggedIndex];
    
    // Remove from old position
    newRanking.splice(draggedIndex, 1);
    // Insert at new position
    newRanking.splice(index, 0, draggedItem);
    
    // Update ranks
    newRanking.forEach((item, idx) => {
      item.rank = idx + 1;
    });
    
    setRanking(newRanking);
    setDraggedIndex(index);
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
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
      case 'restaurant': return '#FF5C8D';
      case 'house_party': return '#9C47AE';
      case 'activity': return '#00D9A3';
      default: return '#9C47AE';
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-[#9C47AE] mx-auto mb-6"></div>
          <p className="text-xl font-bold text-gray-700">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F8FA]">
        <div className="rounded-3xl p-12 max-w-md w-full text-center bg-white shadow-lg">
          <div className="text-7xl mb-6">😞</div>
          <h1 className="text-3xl font-black mb-3 text-gray-900">Event Not Found</h1>
          <p className="text-lg text-gray-600">{error || 'This event does not exist or has been deleted.'}</p>
        </div>
      </div>
    );
  }

  const eventColor = getEventTypeColor(event.type);
  const currentCategoryResults = selectedCategory ? votingResults[selectedCategory] : null;

  // Debug logging
  console.log('🎯 Current state:', {
    selectedCategory,
    hasVotingResults: !!votingResults,
    votingResultsKeys: Object.keys(votingResults || {}),
    hasCurrentCategoryResults: !!currentCategoryResults,
    currentCategoryResults: currentCategoryResults ? {
      category: currentCategoryResults.category,
      optionScores: currentCategoryResults.optionScores?.length || 0,
      totalVoters: currentCategoryResults.totalVoters,
      status: currentCategoryResults.status,
    } : null,
    fullVotingResults: votingResults,
  });

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black" style={{ color: '#9C47AE' }}>VYBE</div>
              <div className="h-6 w-px bg-gray-300" />
              <span className="text-sm font-semibold text-gray-600">Event Voting</span>
            </div>
            
            {hasJoined && (
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
                <span className="text-emerald-600 text-sm">✓</span>
                <span className="text-emerald-700 text-xs font-bold">Joined as {userName}</span>
              </div>
            )}
          </div>
          
          {/* Event Title Card */}
          <div className="rounded-2xl p-4 bg-white shadow-sm">
            <div className="flex items-start gap-3">
              <div 
                className="text-4xl w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ backgroundColor: eventColor + '20' }}
              >
                {getEventTypeIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-black mb-1 text-gray-900">{event.title}</h1>
                {event.description && (
                  <p className="text-sm mb-2 text-gray-600">{event.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  {event.city && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50">
                      <span>📍</span>
                      <span className="font-semibold text-gray-700">{event.city}</span>
                    </div>
                  )}
                  {event.participants && event.participants.length > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50">
                      <span>👥</span>
                      <span className="font-semibold text-gray-700">{event.participants.length} participant{event.participants.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50">
                    <span>🗳️</span>
                    <span className="font-semibold text-gray-700">{event.status === 'voting' ? 'Voting Active' : 'Results'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Join Event CTA - Show if not joined */}
        {!hasJoined && (
          <div className="rounded-2xl p-6 mb-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
            <h2 className="text-2xl font-black mb-2">Join This Event! 🎉</h2>
            <p className="text-white/90 mb-4 text-sm">Enter your name to participate and vote (no app required)</p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full sm:w-auto px-6 py-3 bg-white text-purple-600 font-bold rounded-xl hover:shadow-xl transition-all"
            >
              Join & Vote Now
            </button>
          </div>
        )}
        
        {/* All Categories - No Tabs */}
        {event.votingCategories && event.votingCategories.map((category) => {
          const categoryResults = votingResults[category];
          const categoryStatus = votingStatus[category];
          
          return (
            <div key={category} className="mb-8">
              {/* Category Header */}
              <div className="mb-4">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <span>
                    {category === 'place' && '📍'}
                    {category === 'date_time' && '📅'}
                    {category === 'cuisine' && '🍴'}
                    {category === 'location' && '🗺️'}
                  </span>
                  {category.replace('_', ' ').toUpperCase()}
                </h2>
              </div>
              
              {/* Voting status cards removed - now using unified modal */}
        
        {/* Winner Banner - Matching Mobile App Style */}
        {event.status === 'finalized' && categoryResults?.winner && (
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 mb-6 border-2 border-yellow-400 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-md">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Top Winner</h3>
                <p className="text-xs font-bold text-gray-600">{category?.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xl font-black text-gray-900">{categoryResults.winner.optionName}</h4>
                <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-lg">
                  <span className="text-lg font-black text-purple-600">{categoryResults.winner.bordaScore}</span>
                  <span className="text-xs font-bold text-purple-600">pts</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-black text-purple-600">{categoryResults.winner.percentage.toFixed(1)}%</span>
                <span className="text-gray-600 text-xs">
                  🥇 {categoryResults.winner.totalVotes || 0} first choice{(categoryResults.winner.totalVotes || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Leaderboard - Matching Mobile App Style */}
        {categoryResults?.optionScores && categoryResults.optionScores.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-gray-900">
                All Options
              </h2>
              <span className="text-sm font-bold text-gray-600">
                {categoryResults.totalVoters || 0} voter{categoryResults.totalVoters !== 1 ? 's' : ''}
              </span>
            </div>
            
            {categoryResults.optionScores.length > 0 && (
              <div className="space-y-3 mb-4">
                {categoryResults.optionScores.map((option) => {
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
                      onClick={() => {
                        if (option.venue) {
                          setSelectedLocation(option);
                          setShowLocationDialog(true);
                        }
                      }}
                      className={`flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all ${option.venue ? 'cursor-pointer' : ''}`}
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
            )}
          </div>
        )}
        
        {/* Vote Button for this Category */}
        {hasJoined && event.status !== 'finalized' && (
          <button
            onClick={() => handleVote(category)}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>📊</span>
            <span>
              {categoryStatus?.voted?.some((v: any) => v.userId === guestToken) 
                ? `Change Vote on ${category.replace('_', ' ')}` 
                : `Vote on ${category.replace('_', ' ')}`}
            </span>
          </button>
        )}
              </div>
          );
        })}
        
        {/* Debug Section - Only shown if no categories */}
        {(!event.votingCategories || event.votingCategories.length === 0) && (
              <div className="text-center py-8 bg-white rounded-2xl p-8">
                <div className="text-4xl mb-2">⚠️</div>
                <p className="text-gray-600 font-bold">No categories for this event</p>
                <p className="text-gray-500 text-sm mt-2">
                  The event doesn't have any voting categories configured yet
                </p>
                
              </div>
        )}
        
        {/* Footer */}
        <div className="text-center rounded-2xl p-8 bg-white shadow-sm">
          <p className="text-base font-bold mb-4 text-gray-700">Want to create your own event?</p>
          <a
            href="https://vybewithfriends.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-3.5 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm"
            style={{ backgroundColor: eventColor }}
          >
            Download VYBE App 🚀
          </a>
        </div>
      </div>
      
      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowJoinModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black mb-2 text-gray-900">Join Event</h2>
            <p className="text-sm text-gray-600 mb-6">Enter your name to participate and vote</p>
            <input
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinEvent()}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none mb-4 font-semibold"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleJoinEvent}
                disabled={!userName.trim() || joiningEvent}
                className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joiningEvent ? 'Joining...' : 'Join & Vote'}
              </button>
              <button
                onClick={() => setShowJoinModal(false)}
                disabled={joiningEvent}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Location Details Dialog */}
      {showLocationDialog && selectedLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowLocationDialog(false)}>
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Location Image */}
            {selectedLocation.venue?.photoUrl && (
              <div className="h-64 overflow-hidden rounded-t-3xl relative">
                <img
                  src={selectedLocation.venue.photoUrl}
                  alt={selectedLocation.optionName}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setShowLocationDialog(false)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-all shadow-lg"
                >
                  ✕
                </button>
              </div>
            )}
            
            {/* Location Details */}
            <div className="p-6">
              {/* Header */}
              <h2 className="text-2xl font-black text-gray-900 mb-2">{selectedLocation.optionName}</h2>
              
              {/* Rating & Price */}
              {(selectedLocation.venue?.rating || selectedLocation.venue?.priceLevel) && (
                <div className="flex items-center gap-3 mb-4">
                  {selectedLocation.venue?.rating && (
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-lg">
                      <span className="text-yellow-600 font-bold">⭐ {selectedLocation.venue.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {selectedLocation.venue?.priceLevel && (
                    <div className="flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-lg">
                      <span className="text-green-600 font-bold">{'$'.repeat(selectedLocation.venue.priceLevel)}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Address */}
              {selectedLocation.venue?.address && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-1">📍</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-gray-600 mb-1">Address</h3>
                      <p className="text-gray-900">{selectedLocation.venue.address}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Voting Stats */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-1">📊</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-600 mb-2">Voting Results</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Borda Score:</span>
                        <span className="font-black text-purple-600">{selectedLocation.bordaScore} pts</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Percentage:</span>
                        <span className="font-black text-purple-600">{selectedLocation.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Rank:</span>
                        <span className="font-black text-gray-900">#{selectedLocation.rank}</span>
                      </div>
                    </div>
                    
                    {/* Preference Breakdown */}
                    {selectedLocation.preferenceBreakdown && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-600 mb-0.5">1st Choice</div>
                          <div className="text-lg font-black text-purple-600">{selectedLocation.preferenceBreakdown.rank1 || 0}</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-600 mb-0.5">2nd Choice</div>
                          <div className="text-lg font-black text-purple-600">{selectedLocation.preferenceBreakdown.rank2 || 0}</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2 text-center">
                          <div className="text-xs text-gray-600 mb-0.5">3rd Choice</div>
                          <div className="text-lg font-black text-purple-600">{selectedLocation.preferenceBreakdown.rank3 || 0}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedLocation.venue?.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedLocation.venue.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md text-center"
                  >
                    📍 Open in Maps
                  </a>
                )}
                <button
                  onClick={() => setShowLocationDialog(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Ranking Modal - Matching Mobile App Style */}
      {showRankingModal && rankingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowRankingModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-black mb-1 text-gray-900">Rank Your Preferences</h2>
              <p className="text-sm text-gray-600">
                Drag to reorder or use arrows • Top choice gets most points
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
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-4 bg-white rounded-xl border-2 transition-all hover:shadow-md cursor-move ${
                      draggedIndex === index ? 'opacity-50 scale-95' : ''
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
                    <div className="flex-1 font-bold text-gray-900">{item.name}</div>
                    
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
                className="px-6 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
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

