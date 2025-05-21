import { useState } from 'react';

export function useLeaderboard(size: number) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState<string | null>(null);

  const onSyncLeaderboard = async () => {
    setError(null);

    try {
      const res = await fetch(`/api/leaderboard?size=${size}`);
      if (res.ok) {
        const _ = await res.json();
        setLeaderboard(_);
      } else {
        setLeaderboard([]);
        throw new Error("Leaderboard syncing failed");
      }
    } catch (error: unknown) {
      setError((error as Error).message);
    }
  };

  return { leaderboard, onSyncLeaderboard };
}
