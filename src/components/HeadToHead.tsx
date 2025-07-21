'use client';

import { useState, useEffect, useCallback } from 'react';
import { StartGGClient, HeadToHeadSet } from '@/lib/startgg-client';

interface HeadToHeadProps {
  player1Slug: string;
  player2Slug: string;
}

export default function HeadToHead({ player1Slug, player2Slug }: HeadToHeadProps) {
  const [headToHeadSets, setHeadToHeadSets] = useState<HeadToHeadSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHeadToHead = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_STARTGG_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      setError('API key is not configured. Please set NEXT_PUBLIC_STARTGG_API_KEY in .env.local');
      return;
    }

    if (!player1Slug || !player2Slug) {
      setError('Both player slugs are required');
      return;
    }

    if (player1Slug === player2Slug) {
      setError('Cannot compare a player against themselves');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new StartGGClient(apiKey);
      const sets = await client.getHeadToHeadHistory(player1Slug, player2Slug, 200);
      setHeadToHeadSets(sets);
      
      if (sets.length === 0) {
        console.log(`No matches found between ${player1Slug} and ${player2Slug}. This could mean:
1. The players have never faced each other
2. The player slugs are incorrect
3. The matches are not yet indexed by start.gg`);
      }
    } catch (err) {
      console.error('Head-to-head fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch head-to-head history');
    } finally {
      setLoading(false);
    }
  }, [player1Slug, player2Slug]);

  useEffect(() => {
    if (player1Slug && player2Slug) {
      fetchHeadToHead();
    }
  }, [player1Slug, player2Slug, fetchHeadToHead]);

  const getWinCount = (isPlayer1: boolean) => {
    return headToHeadSets.filter(set => 
      isPlayer1 ? set.player1Info.isWinner : set.player2Info.isWinner
    ).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-red-800 font-semibold">Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (headToHeadSets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No head-to-head matches found between these players.
      </div>
    );
  }

  const player1Name = headToHeadSets[0]?.player1Info.gamerTag || player1Slug.replace('user/', '');
  const player2Name = headToHeadSets[0]?.player2Info.gamerTag || player2Slug.replace('user/', '');
  const player1Wins = getWinCount(true);
  const player2Wins = getWinCount(false);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
          Head-to-Head Record
        </h2>
        <div className="flex justify-center items-center space-x-8">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{player1Name}</div>
            <div className="text-3xl font-bold text-blue-600">{player1Wins}</div>
          </div>
          <div className="text-2xl font-bold text-gray-400">-</div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">{player2Name}</div>
            <div className="text-3xl font-bold text-purple-600">{player2Wins}</div>
          </div>
        </div>
        <div className="text-center mt-4 text-sm text-gray-600">
          Total matches: {headToHeadSets.length}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Match History</h3>
        <div className="grid gap-4">
          {headToHeadSets.map((set) => (
            <div
              key={set.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">
                    {set.event.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {set.event.tournament.name}
                  </p>
                  {set.fullRoundText && (
                    <p className="text-xs text-gray-500 mt-1">
                      {set.fullRoundText}
                    </p>
                  )}
                  {set.completedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(set.completedAt * 1000).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-semibold mb-2">
                    {set.displayScore}
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      set.player1Info.isWinner 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {set.player1Info.gamerTag}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      set.player2Info.isWinner 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {set.player2Info.gamerTag}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}