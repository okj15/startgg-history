'use client';

import { useState } from 'react';
import HeadToHead from '@/components/HeadToHead';
import PlayerSearch from '@/components/PlayerSearch';
import { PlayerSearchResult } from '@/lib/startgg-client';

export default function HeadToHeadPage() {
  const [selectedPlayer1, setSelectedPlayer1] = useState<PlayerSearchResult | null>(null);
  const [selectedPlayer2, setSelectedPlayer2] = useState<PlayerSearchResult | null>(null);
  const [searchedPlayer1, setSearchedPlayer1] = useState<string | null>(null);
  const [searchedPlayer2, setSearchedPlayer2] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayer1?.slug && selectedPlayer2?.slug) {
      setSearchedPlayer1(selectedPlayer1.slug);
      setSearchedPlayer2(selectedPlayer2.slug);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Head-to-Head Analysis
          </h1>
          <p className="text-lg text-gray-600">
            Compare two players and view their match history
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PlayerSearch
                onPlayerSelect={setSelectedPlayer1}
                placeholder="Enter player name or slug (e.g., fe93cbdc)"
                label="Player 1"
                selectedPlayer={selectedPlayer1}
              />
              <PlayerSearch
                onPlayerSelect={setSelectedPlayer2}
                placeholder="Enter player name or slug (e.g., c377c071)"
                label="Player 2"
                selectedPlayer={selectedPlayer2}
              />
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={!selectedPlayer1 || !selectedPlayer2}
                className="px-8 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Compare Players
              </button>
            </div>
            
            {selectedPlayer1 && selectedPlayer2 && (
              <div className="text-center text-sm text-gray-600">
                Comparing <strong>{selectedPlayer1.gamerTag}</strong> vs <strong>{selectedPlayer2.gamerTag}</strong>
              </div>
            )}
          </form>
        </div>

        {searchedPlayer1 && searchedPlayer2 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <HeadToHead player1Slug={searchedPlayer1} player2Slug={searchedPlayer2} />
          </div>
        )}
      </div>
    </div>
  );
}