"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";

type Player = {
  id: number;
  name: string;
  phone?: string | null;
  age: number;
  group?: number | null;
};

type Group = {
  id: number;
  name: string;
  coach?: { id: number; user: { username: string; first_name: string; last_name: string; email: string } } | null;
};

export default function GroupDetail({ params }: { params: { id: string } }) {
  const groupId = Number(params.id);
  const [group, setGroup] = useState<Group | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | "">("");

  useEffect(() => {
    (async () => {
      try {
        const g = await api<Group>(`/api/groups/${groupId}/`);
        setGroup(g);
        const pInGroup = await api<Player[]>(`/api/players/?group=${groupId}`);
        setPlayers(pInGroup);
        const pAll = await api<Player[]>(`/api/players/`);
        setAllPlayers(pAll);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  const downloadGroupPdf = async () => {
    try {
      const blob = await api<Blob>(`/api/groups/${groupId}/report-pdf/`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `group-${groupId}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const resetGroupEvaluations = async () => {
    try {
      const res = await api<{ detail: string; updated: number }>(`/api/groups/${groupId}/reset-evaluations/`, { method: "POST" });
      alert(res?.detail || "Evaluations reset for this group.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const addExistingPlayer = async () => {
    if (!selectedPlayerId) {
      alert("Please select a player to add.");
      return;
    }
    try {
      const p = await api<Player>(`/api/players/${selectedPlayerId}/`, {
        method: "PATCH",
        body: JSON.stringify({ group: groupId }),
      });
      // Add to current group's players (avoid duplicates)
      setPlayers((prev) => (prev.find((x) => x.id === p.id) ? prev : [...prev, p]));
      // Clear selection and update available list
      setSelectedPlayerId("");
      setAllPlayers((prev) => prev.map((x) => (x.id === p.id ? { ...x, group: groupId } : x)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const deletePlayer = async (id: number) => {
    try {
      await api(`/api/players/${id}/`, { method: "DELETE" });
      setPlayers(players.filter((pl) => pl.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <p className="p-6">Loading group...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!group) return <p className="p-6">Group not found</p>;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-sm text-gray-700">
            Coach: {group.coach
              ? ((group.coach.user.first_name || group.coach.user.last_name)
                  ? `${group.coach.user.first_name} ${group.coach.user.last_name}`.trim()
                  : group.coach.user.username)
              : "Unassigned"}
          </p>
        </div>
        <div className="space-x-2">
          <button className="px-3 py-1" onClick={downloadGroupPdf}>
            Download Group PDF
          </button>
          <button className="px-3 py-1" onClick={resetGroupEvaluations}>
            Reset Evaluations
          </button>
        </div>
      </div>
      <section className="card mb-4">
        <h2 className="section-title mb-2">Add Existing Player</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <select
            className="select"
            value={selectedPlayerId as any}
            onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
          >
            <option value="">Select a player…</option>
            {allPlayers
              .filter((p) => p.group !== groupId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age} y/o{p.phone ? `, ${p.phone}` : ""})
                </option>
              ))}
          </select>
          <button className="px-4 py-2" onClick={addExistingPlayer}>Add Player</button>
        </div>
        <p className="text-sm text-gray-600">Only players not already in this group are shown.</p>
      </section>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {players.map((p) => (
          <li key={p.id} className="card">
            <p className="font-medium">{p.name}</p>
            <p className="text-sm text-gray-600">{p.phone ? `${p.phone} • ` : ""}{p.age} y/o</p>
            <Link className="underline text-sm" href={`/players/${p.id}`}>View Profile</Link>
            <button className="mt-2 px-3 py-1" onClick={() => deletePlayer(p.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Link className="underline" href="/groups">Back to Groups</Link>
      </div>
    </main>
  );
}