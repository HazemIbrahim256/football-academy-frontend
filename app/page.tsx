"use client";
import { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";

type MeResponse = {
  user: { id: number; username: string; first_name: string; last_name: string; email: string };
  coach: null | { id: number };
  is_staff: boolean;
};

type Player = { id: number; name: string; age: number; photo?: string | null; phone?: string | null };
type Group = { id: number; name: string; description: string; players: Player[] };
type Evaluation = {
  id: number;
  player: number;
  average_rating: number;
  updated_at: string;
};

export default function Home() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [coachCount, setCoachCount] = useState<number | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Removed dashboard view switcher; always show Academy Dashboard

  useEffect(() => {
    (async () => {
      try {
        // Determine user role
        const meData = await api<MeResponse>("/api/auth/me/");
        setMe(meData);
        // Fetch groups scoped to user permissions
        const g = await api<Group[]>("/api/groups/");
        setGroups(g);
        // If admin, also fetch coaches for count
        if (meData.is_staff) {
          const coaches = await api<any[]>("/api/coaches/");
          setCoachCount(coaches.length);
        }
        // Fetch evaluations for recent activity / best players (scoped by permissions)
        const evals = await api<Evaluation[]>("/api/evaluations/");
        setEvaluations(evals);
      } catch (e: any) {
        // Not logged in or error; show public landing
        setError(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalPlayers = groups.reduce((sum, g) => sum + (g.players?.length || 0), 0);
  const playerMap = new Map<number, Player>();
  groups.forEach((g) => g.players?.forEach((p) => playerMap.set(p.id, p)));
  const playerGroupMap = new Map<number, Group>();
  groups.forEach((g) => g.players?.forEach((p) => playerGroupMap.set(p.id, g)));

  const latestEvaluations = evaluations
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)
    .map((ev) => ({ ev, player: playerMap.get(ev.player) }));

  const sortedBestEvals = evaluations
    .slice()
    .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));

  let currentRank = 0;
  let lastRating: number | null = null;
  const bestPlayers: { ev: Evaluation; player: Player | undefined; photoUrl: string | null; group: Group | null; rank: number }[] = [];
  for (const ev of sortedBestEvals) {
    const rating = ev.average_rating ?? 0;
    if (lastRating === null || rating !== lastRating) {
      currentRank += 1; // dense ranking: next distinct rating increments by 1
      lastRating = rating;
    }
    if (currentRank > 10) break; // limit to 10 ranks
    const player = playerMap.get(ev.player);
    const photoUrl = player?.photo
      ? (player.photo.startsWith("http") ? player.photo : `${API_URL}${player.photo}`)
      : null;
    const group = playerGroupMap.get(ev.player) ?? null;
    bestPlayers.push({ ev, player, photoUrl, group, rank: currentRank });
  }

  const RATING_LABELS = ["Bad", "Not bad", "Good", "Very Good", "Excellent"] as const;
  const ratingLabel = (val: number) => {
    const v = Math.min(5, Math.max(1, Math.round(val)));
    return RATING_LABELS[v - 1];
  };

  return (
    <main>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Academy Dashboard</h1>
        </div>

      {!me && (
        <div className="space-y-4">
          <img src="/logo.png" alt="El Capitano Soccer Academy Logo" className="h-24 w-auto mx-auto drop-shadow" />
          <p className="text-gray-700">
            Welcome to the Football Academy. Please log in to view academy data.
          </p>
        <a href="/login" className="inline-block rounded-md bg-white text-brand-red border border-brand-red hover:bg-brand-red hover:text-white hover:border-brand-maroon font-medium px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red">Go to Login</a>
        </div>
      )}

      {me && (
        (() => {
          const myGroup = !me.is_staff && groups.length ? groups[0] : null;
          return (
            <>
              <div className={"grid gap-4 " + (me.is_staff ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}> 
                {me.is_staff && (
                  <div className="card">
                    <div className="text-sm text-gray-600">Coaches</div>
                    <div className="text-2xl font-semibold">{coachCount ?? "—"}</div>
                  </div>
                )}
                <div className="card">
                  <div className="text-sm text-gray-600">Groups</div>
                  <div className="text-2xl font-semibold">{groups.length}</div>
                </div>
                <div className="card">
                  <div className="text-sm text-gray-600">Players</div>
                  <div className="text-2xl font-semibold">{totalPlayers}</div>
                </div>
              </div>

              {!me.is_staff && (
                <div className="card">
                  <div className="text-sm text-gray-600">My Group</div>
                  {myGroup ? (
                    <div>
                      <div className="text-xl font-semibold">{myGroup.name}</div>
                      <div className="text-gray-700">{myGroup.description || "No description"}</div>
                      <div className="mt-2 text-sm">Players: {myGroup.players?.length || 0}</div>
                      <a className="underline text-sm mt-2 inline-block" href={`/groups/${myGroup.id}`}>View Group</a>
                    </div>
                  ) : (
                    <div className="text-gray-700">No group assigned.</div>
                  )}
                </div>
              )}

              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="section-title">Groups</h2>
                  <a href="/groups" className="underline text-sm">View All</a>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groups.slice(0, 6).map((g) => (
                    <li key={g.id} className="card">
                      <div className="font-medium">{g.name}</div>
                      <div className="text-sm text-gray-600">Players: {g.players?.length || 0}</div>
                      <a href={`/groups/${g.id}`} className="underline text-sm">View</a>
                    </li>
                  ))}
                  {!groups.length && (
                    <li className="text-gray-700">No groups available.</li>
                  )}
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="section-title">Best Players</h2>
                {bestPlayers.length ? (
                  <ul className="grid grid-cols-1 gap-4">
                    {bestPlayers.map(({ ev, player, photoUrl, group, rank }) => (
                      <li key={ev.id} className="card">
                        <div className="flex items-center gap-3">
                          {photoUrl ? (
                            <img src={photoUrl} alt={`${player?.name ?? `Player #${ev.player}`} photo`} className="w-10 h-10 rounded object-cover border" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 border flex items-center justify-center text-gray-600 text-xs">No Photo</div>
                          )}
                          <div className="font-medium">{`${rank}. ${player?.name ?? `Player #${ev.player}`}`}</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          Rating: {ratingLabel(ev.average_rating ?? 0)} ({(ev.average_rating ?? 0).toFixed(2)}){group ? (
                            <> • <a href={`/groups/${group.id}`} className="underline">{group.name}</a></>
                          ) : ""}
                        </div>
                        <a href={`/players/${ev.player}`} className="underline text-sm">View Player</a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700">No player ratings available yet.</p>
                )}
              </section>
              </>
            );
        })()
      )}
      </div>
    </main>
  );
}