import { useState } from 'react';

export function useLeaderboard(size: number) {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState<string | null>(null);

  const syncLeaderboard = async () => {
    setError(null);

    try {
      const res = await fetch(`/api/leaderboard?size=${Math.floor(size)}`);
      if (res.ok) {
        const _ = await res.json();
        setEntries(Array.isArray(_) ? _ : []);
      } else {
        setEntries([]);
        throw new Error("Leaderboard syncing failed");
      }
    } catch (error: unknown) {
      setError((error as Error).message);
    }
  };

  return { syncLeaderboard, entries, error };
}
