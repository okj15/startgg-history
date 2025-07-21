'use client';

import { useState } from 'react';
import MatchHistory from '@/components/MatchHistory';

export default function Home() {
  const [playerId, setPlayerId] = useState<string>('');
  const [searchedPlayerId, setSearchedPlayerId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerId.trim()) {
      setSearchedPlayerId(playerId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            start.gg Match History
          </h1>
          <p className="text-lg text-gray-600">
            Enter a player slug to view their tournament match history
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="playerId" className="block text-sm font-medium text-gray-700 mb-2">
                Player Slug
              </label>
              <input
                type="text"
                id="playerId"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder="Enter player slug (e.g., b149c474)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {searchedPlayerId && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <MatchHistory playerId={searchedPlayerId} />
          </div>
        )}
      </div>
    </div>
  );
}