"use client";
import { useEffect, useState } from "react";
import { API_URL, api } from "@/lib/api";

type Group = {
  id: number;
  name: string;
  coach: { id: number; phone?: string; user: { email: string; first_name: string; last_name: string } } | null;
  player_count?: number;
};

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [newGroupCoachId, setNewGroupCoachId] = useState<number | "">("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api<Group[]>("/api/groups/");
        setGroups(data);
        // Determine admin by checking if coaches endpoint is accessible
        try {
          const coachList = await api<any[]>("/api/coaches/");
          setIsAdmin(true);
          setCoaches(coachList);
        } catch (err) {
          setIsAdmin(false);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const downloadGroupPdf = async (id: number) => {
    try {
      const blob = await api<Blob>(`/api/groups/${id}/report-pdf/`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `group-${id}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const createGroup = async () => {
    if (!isAdmin) return;
    if (!newGroupName || !newGroupCoachId) {
      alert("Please enter a name and select a coach.");
      return;
    }
    try {
      await api("/api/groups/", {
        method: "POST",
        body: JSON.stringify({ name: newGroupName, description: newGroupDescription, coach_id: newGroupCoachId }),
      });
      setNewGroupName("");
      setNewGroupDescription("");
      setNewGroupCoachId("");
      const data = await api<Group[]>("/api/groups/");
      setGroups(data);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const deleteGroup = async (id: number) => {
    try {
      await api(`/api/groups/${id}/`, { method: "DELETE" });
      setGroups(groups.filter((g) => g.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const resetGroupEvaluations = async (id: number) => {
    try {
      const res = await api<{ detail: string; updated: number }>(`/api/groups/${id}/reset-evaluations/`, { method: "POST" });
      alert(res?.detail || "Evaluations reset for this group.");
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <p className="p-6">Loading groups...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Groups</h1>
      {isAdmin && (
        <section className="card mb-6">
          <h2 className="section-title mb-3">Create New Group</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input className="input" placeholder="Group name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
            <input className="input" placeholder="Description (optional)" value={newGroupDescription} onChange={(e) => setNewGroupDescription(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="block text-sm mb-1">Assign Coach</label>
            <select className="select w-full" value={newGroupCoachId as any} onChange={(e) => setNewGroupCoachId(Number(e.target.value))}>
              <option value="">Select a coach</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.user.first_name} {c.user.last_name} ({c.user.username})
                </option>
              ))}
            </select>
          </div>
          <button className="px-4 py-2" onClick={createGroup}>Create Group</button>
        </section>
      )}
      <ul className="space-y-3">
        {groups.map((g) => (
          <li key={g.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{g.name}</p>
              {g.coach && (
                <p className="text-sm text-gray-600">
                  Coach: {g.coach.user.first_name} {g.coach.user.last_name} ({g.coach.phone || "Not set"})
                </p>
              )}
            </div>
            <div className="space-x-2">
              <a className="underline" href={`/groups/${g.id}`}>View</a>
              <button className="px-3 py-1" onClick={() => downloadGroupPdf(g.id)}>
                Download PDF
              </button>
              <button className="px-3 py-1" onClick={() => resetGroupEvaluations(g.id)}>
                Reset Evaluations
              </button>
              {isAdmin && (
                <button className="px-3 py-1" onClick={() => deleteGroup(g.id)}>
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}