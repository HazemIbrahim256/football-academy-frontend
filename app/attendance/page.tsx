"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type MeResponse = { is_staff: boolean };
type Player = {
  id: number;
  name: string;
  attendance_days: number;
};
type Group = {
  id: number;
  name: string;
  players: Player[];
};

export default function AttendancePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null); // player id currently saving
  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  useEffect(() => {
    (async () => {
      try {
        const meData = await api<MeResponse>("/api/auth/me/");
        setMe(meData);
      } catch {
        setMe({ is_staff: false });
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const gs = await api<Group[]>(`/api/groups/?month=${month}`);
        setGroups(gs);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [month]);

  const updateAttendance = async (playerId: number, days: number) => {
    setSaving(playerId);
    try {
      await api(`/api/players/${playerId}/attendance/?month=${month}`, {
        method: "PUT",
        body: JSON.stringify({ days }),
      });
      // Update local state
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          players: g.players.map((p) => (p.id === playerId ? { ...p, attendance_days: days } : p)),
        }))
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <main className="max-w-4xl mx-auto p-6">Loading...</main>;
  if (error) return <main className="max-w-4xl mx-auto p-6 text-red-600">{error}</main>;
  if (!me?.is_staff)
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-xl font-semibold mb-2">Attendance</h1>
        <p>You need admin access to manage attendance.</p>
      </main>
    );

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Attendance</h1>
      <p className="text-sm text-gray-600 mb-4">Enter the number of days attended for each player.</p>
      <div className="flex items-center space-x-3 mb-6">
        <label htmlFor="month" className="text-sm">Month:</label>
        <input
          id="month"
          type="month"
          className="input"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {groups.map((group) => (
        <section key={group.id} className="card mb-8">
          <h2 className="section-title mb-2">{group.name}</h2>
          <table className="fancy-table">
            <thead>
              <tr>
                <th>Player</th>
                <th className="w-48">Days Attended</th>
              </tr>
            </thead>
            <tbody>
              {group.players.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min={0}
                        max={365}
                        className="input w-24"
                        value={p.attendance_days ?? 0}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(365, Number(e.target.value)));
                          // Optimistic UI update
                          setGroups((prev) =>
                            prev.map((g) => ({
                              ...g,
                              players: g.players.map((pp) => (pp.id === p.id ? { ...pp, attendance_days: val } : pp)),
                            }))
                          );
                        }}
                        onBlur={(e) => updateAttendance(p.id, Number(e.target.value))}
                      />
                      <button
                        disabled={saving === p.id}
                        className="text-xs px-2 py-1 disabled:opacity-60"
                        onClick={() => updateAttendance(p.id, p.attendance_days ?? 0)}
                      >
                        {saving === p.id ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </main>
  );
}