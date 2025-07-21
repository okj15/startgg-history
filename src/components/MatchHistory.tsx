'use client';

import { useState, useEffect, useCallback } from 'react';
import { StartGGClient } from '@/lib/startgg-client';

interface Set {
  id: number;
  displayScore: string;
  event: {
    name: string;
    tournament: {
      name: string;
    };
  };
}

interface MatchHistoryProps {
  playerId: string;
}

export default function MatchHistory({ playerId }: MatchHistoryProps) {
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMatchHistory = useCallback(async () => {
    const apiKey = process.env.NEXT_PUBLIC_STARTGG_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      setError('API key is not configured. Please set NEXT_PUBLIC_STARTGG_API_KEY in .env.local');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new StartGGClient(apiKey);
      const playerSets = await client.getPlayerSets(playerId, 20);
      setSets(playerSets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch match history');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    if (playerId) {
      fetchMatchHistory();
    }
  }, [playerId, fetchMatchHistory]);

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

  if (sets.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No match history found for this player.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Match History</h2>
      <div className="grid gap-4">
        {sets.map((set) => (
          <div
            key={set.id}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {set.event.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {set.event.tournament.name}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-semibold text-blue-600">
                  {set.displayScore}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}