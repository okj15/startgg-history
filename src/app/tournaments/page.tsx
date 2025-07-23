'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StartGGClient, Tournament, TournamentSearchFilters } from '@/lib/startgg-client';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TournamentSearchFilters>({
    upcoming: true,
    perPage: 20, // Reduced to avoid complexity limit
    page: 1
  });

  const searchTournaments = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_STARTGG_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      setError('API key is not configured. Please set NEXT_PUBLIC_STARTGG_API_KEY in .env.local');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new StartGGClient(apiKey);
      
      const results = await client.searchTournaments(filters);
      setTournaments(results);
    } catch (err) {
      console.error('Tournament search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search tournaments');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    searchTournaments();
  }, [searchTournaments]);

  const handleFilterChange = (newFilters: Partial<TournamentSearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'TBA';
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStateLabel = (state?: number) => {
    switch (state) {
      case 1: return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
      case 2: return { label: 'Active', color: 'bg-green-100 text-green-800' };
      case 3: return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
      default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-600' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tournament Browser
          </h1>
          <p className="text-lg text-gray-600">
            Discover and explore fighting game tournaments
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Name
              </label>
              <input
                type="text"
                value={filters.query || ''}
                onChange={(e) => handleFilterChange({ query: e.target.value })}
                placeholder="Search tournaments..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.upcoming ? 'upcoming' : filters.past ? 'past' : 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'upcoming') {
                    handleFilterChange({ upcoming: true, past: false, state: undefined });
                  } else if (value === 'past') {
                    handleFilterChange({ upcoming: false, past: true, state: undefined });
                  } else {
                    handleFilterChange({ upcoming: false, past: false, state: undefined });
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="all">All</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game
              </label>
              <select
                value={filters.videogameId || ''}
                onChange={(e) => handleFilterChange({ videogameId: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Games</option>
                <option value="43868">Street Fighter 6</option>
                <option value="1">Street Fighter V</option>
                <option value="3">Tekken 7</option>
                <option value="33602">Tekken 8</option>
                <option value="5">Super Smash Bros. Ultimate</option>
                <option value="1386">Super Smash Bros. Melee</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={filters.countryCode || ''}
                onChange={(e) => handleFilterChange({ countryCode: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Countries</option>
                <option value="US">United States</option>
                <option value="JP">Japan</option>
                <option value="KR">South Korea</option>
                <option value="FR">France</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Size
              </label>
              <select
                value={filters.minEntrants || ''}
                onChange={(e) => handleFilterChange({ minEntrants: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Sizes</option>
                <option value="8">Small (8+)</option>
                <option value="32">Medium (32+)</option>
                <option value="64">Large (64+)</option>
                <option value="128">Major (128+)</option>
                <option value="256">Premier (256+)</option>
                <option value="512">Supermajor (512+)</option>
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={searchTournaments}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                onClick={() => setFilters({ perPage: 20, page: 1 })}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>



        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Tournament Grid */}
        {!loading && tournaments.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((tournament) => {
              const stateInfo = getStateLabel(tournament.state);
              return (
                <div
                  key={tournament.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {tournament.images && tournament.images.length > 0 && (
                    <img
                      src={tournament.images[0].url}
                      alt={tournament.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {tournament.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stateInfo.color}`}>
                        {stateInfo.label}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="w-4 h-4 mr-2">📅</span>
                        <span>{formatDate(tournament.startAt)}</span>
                      </div>
                      
                      {tournament.city && (
                        <div className="flex items-center">
                          <span className="w-4 h-4 mr-2">📍</span>
                          <span>{tournament.city}{tournament.countryCode && `, ${tournament.countryCode}`}</span>
                        </div>
                      )}
                      
                      {tournament.isOnline && (
                        <div className="flex items-center">
                          <span className="w-4 h-4 mr-2">💻</span>
                          <span>Online Event</span>
                        </div>
                      )}
                      
                      {tournament.numAttendees && (
                        <div className="flex items-center">
                          <span className="w-4 h-4 mr-2">👥</span>
                          <span>{tournament.numAttendees} attendees</span>
                        </div>
                      )}
                    </div>

                    {tournament.events && tournament.events.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Events</h4>
                        <div className="flex flex-wrap gap-1">
                          {tournament.events?.slice(0, 3).map((event) => (
                            <span
                              key={event.id}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                            >
                              {event.videogame?.displayName || event.name}
                              {event.numEntrants && ` (${event.numEntrants})`}
                            </span>
                          ))}
                          {tournament.events && tournament.events.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                              +{tournament.events.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <a
                        href={`https://start.gg/${tournament.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors text-center"
                      >
                        View on start.gg ↗
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && tournaments.length > 0 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => handleFilterChange({ page: Math.max(1, filters.page! - 1) })}
              disabled={filters.page === 1}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {filters.page}</span>
            <button
              onClick={() => handleFilterChange({ page: (filters.page || 1) + 1 })}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && tournaments.length === 0 && !error && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments found</h3>
            <p className="text-gray-600">Try adjusting your search filters to find more results, or use the Next button to see more pages.</p>
          </div>
        )}
      </div>
    </div>
  );
}