'use client';

import { useState } from 'react';
import HeadToHead from '@/components/HeadToHead';

export default function HeadToHeadPage() {
  const [player1Slug, setPlayer1Slug] = useState<string>('');
  const [player2Slug, setPlayer2Slug] = useState<string>('');
  const [searchedPlayer1, setSearchedPlayer1] = useState<string | null>(null);
  const [searchedPlayer2, setSearchedPlayer2] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (player1Slug.trim() && player2Slug.trim()) {
      setSearchedPlayer1(player1Slug.trim());
      setSearchedPlayer2(player2Slug.trim());
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="player1" className="block text-sm font-medium text-gray-700 mb-2">
                  Player 1 Slug
                </label>
                <input
                  type="text"
                  id="player1"
                  value={player1Slug}
                  onChange={(e) => setPlayer1Slug(e.target.value)}
                  placeholder="Enter first player slug (e.g., b149c474)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="player2" className="block text-sm font-medium text-gray-700 mb-2">
                  Player 2 Slug
                </label>
                <input
                  type="text"
                  id="player2"
                  value={player2Slug}
                  onChange={(e) => setPlayer2Slug(e.target.value)}
                  placeholder="Enter second player slug (e.g., a3f2d8e1)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                className="px-8 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Compare Players
              </button>
            </div>
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