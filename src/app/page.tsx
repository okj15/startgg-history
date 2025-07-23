'use client';

import { useState } from 'react';
import MatchHistory from '@/components/MatchHistory';
import PlayerSearch from '@/components/PlayerSearch';
import { PlayerSearchResult } from '@/lib/startgg-client';

export default function Home() {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchResult | null>(null);
  const [searchedPlayerId, setSearchedPlayerId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayer?.slug) {
      setSearchedPlayerId(selectedPlayer.slug);
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
            Search for a player to view their tournament match history
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <PlayerSearch
                  onPlayerSelect={setSelectedPlayer}
                  placeholder="Enter player name, gamertag, or slug (e.g., fe93cbdc)"
                  label="Player"
                  selectedPlayer={selectedPlayer}
                />
              </div>
              <button
                type="submit"
                disabled={!selectedPlayer}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                View History
              </button>
            </div>
            
            {selectedPlayer && (
              <div className="text-sm text-gray-600">
                Selected: <strong>{selectedPlayer.gamerTag}</strong>
                {selectedPlayer.recentTournaments && selectedPlayer.recentTournaments.length > 0 && (
                  <span className="ml-2 text-gray-400">
                    • Last seen: {selectedPlayer.recentTournaments[0].name}
                  </span>
                )}
              </div>
            )}
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