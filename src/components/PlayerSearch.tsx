'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { StartGGClient, PlayerSearchResult } from '@/lib/startgg-client';

interface PlayerSearchProps {
  onPlayerSelect: (player: PlayerSearchResult) => void;
  placeholder?: string;
  label?: string;
  selectedPlayer?: PlayerSearchResult | null;
}

export default function PlayerSearch({
  onPlayerSelect,
  placeholder = "Search by player name or gamertag",
  label = "Player",
  selectedPlayer
}: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const searchPlayers = useCallback(async (searchQuery: string) => {
    const apiKey = process.env.NEXT_PUBLIC_STARTGG_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      setError('API key is not configured');
      return;
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new StartGGClient(apiKey);
      const searchResults = await client.searchPlayers(searchQuery);
      setResults(searchResults);
      
      // If no results from API, provide manual slug option
      if (searchResults.length === 0) {
        console.log(`No search results for "${searchQuery}". User can manually use as slug.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(null); // Don't show error, just allow manual slug entry
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Don't search if a player is already selected
    if (selectedPlayer) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchPlayers(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchPlayers, selectedPlayer]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear selected player when user types
    if (selectedPlayer) {
      onPlayerSelect(null as unknown as PlayerSearchResult); // Clear selection
    }
    setQuery(e.target.value);
    setShowResults(true);
  };

  const handlePlayerSelect = (player: PlayerSearchResult) => {
    if (!player.slug) {
      setError('This player does not have a valid profile URL');
      return;
    }
    
    // Don't update query when a player is selected from results
    // This prevents re-triggering search
    setShowResults(false);
    setError(null);
    onPlayerSelect(player);
  };

  const handleInputFocus = () => {
    setShowResults(true);
  };

  return (
    <div className="relative" ref={searchRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={selectedPlayer ? selectedPlayer.gamerTag : query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
          readOnly={!!selectedPlayer}
        />
        
        {selectedPlayer && (
          <button
            type="button"
            onClick={() => {
              onPlayerSelect(null as unknown as PlayerSearchResult);
              setQuery('');
              setResults([]);
              setError(null);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
        
        {loading && !selectedPlayer && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {query.length >= 2 && !loading && results.length === 0 && !showResults && !selectedPlayer && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800 mb-3">
            <strong>Player not found?</strong> Here are your options:
          </p>
          
          <div className="space-y-2">
            <button
              onClick={() => {
                const googleSearchUrl = `https://www.google.com/search?q=site:start.gg/user "${query}"`;
                window.open(googleSearchUrl, '_blank');
              }}
              className="block w-full text-left px-3 py-2 bg-blue-100 text-blue-800 text-sm rounded hover:bg-blue-200 transition-colors"
            >
              🔍 Search Google for &quot;{query}&quot; on start.gg
            </button>
            
            <button
              onClick={() => {
                const slug = query.startsWith('user/') ? query : query;
                const mockPlayer: PlayerSearchResult = {
                  id: Date.now(),
                  gamerTag: query,
                  slug: slug,
                  name: query,
                  recentTournaments: []
                };
                handlePlayerSelect(mockPlayer);
              }}
              className="block w-full text-left px-3 py-2 bg-gray-100 text-gray-800 text-sm rounded hover:bg-gray-200 transition-colors"
            >
              📝 Use &quot;{query}&quot; as player slug directly
            </button>
          </div>
          
          <p className="text-xs text-amber-700 mt-2">
            💡 Tip: Copy the slug from start.gg profile URLs (e.g., start.gg/user/<strong>abc123</strong>)
          </p>
        </div>
      )}

      {showResults && (query.length >= 2 || results.length > 0) && !selectedPlayer && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {results.length === 0 && !loading && (
            <div className="px-3 py-2">
              <div className="text-sm text-gray-500 mb-2">
                {query.length < 2 ? 'Type at least 2 characters to search' : 'No players found by name'}
              </div>
              {query.length >= 2 && (
                <button
                  onClick={() => {
                    const slug = query.startsWith('user/') ? query : query;
                    const mockPlayer: PlayerSearchResult = {
                      id: Date.now(),
                      gamerTag: query,
                      slug: slug,
                      name: query,
                      recentTournaments: []
                    };
                    handlePlayerSelect(mockPlayer);
                  }}
                  className="w-full text-left px-2 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                >
                  Use &quot;{query}&quot; as player slug
                </button>
              )}
            </div>
          )}
          
          {results.map((player) => (
            <div
              key={player.id}
              onClick={() => handlePlayerSelect(player)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={`${player.gamerTag} avatar`}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-500">
                      {player.gamerTag.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {player.gamerTag}
                    </p>
                    {!player.slug && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        No Profile
                      </span>
                    )}
                  </div>
                  {player.name && player.name !== player.gamerTag && (
                    <p className="text-xs text-gray-500 truncate">
                      {player.name}
                    </p>
                  )}
                  {player.recentTournaments && player.recentTournaments.length > 0 ? (
                    <p className="text-xs text-gray-400 truncate">
                      Recent: {player.recentTournaments[0].name}
                      {player.recentTournaments[0].date && (
                        <span className="ml-1">
                          ({new Date(player.recentTournaments[0].date * 1000).getFullYear()})
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 truncate">
                      No recent activity
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}