"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, API_URL } from "@/lib/api";

type CoachDetail = {
  id: number;
  user: { username: string; first_name: string; last_name: string; email: string };
  bio?: string;
  phone?: string;
  photo?: string | null;
  groups?: { id: number; name: string }[];
};

export default function CoachDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [coach, setCoach] = useState<CoachDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allGroups, setAllGroups] = useState<{ id: number; name: string }[]>([]);
  const [assignGroupId, setAssignGroupId] = useState<number | "">("");
  const [moveFromGroupId, setMoveFromGroupId] = useState<number | "">("");
  const [moveToGroupId, setMoveToGroupId] = useState<number | "">("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api<CoachDetail>(`/api/coaches/${id}/`);
        setCoach(data);
        const groupsList = await api<{ id: number; name: string }[]>(`/api/groups/`);
        // Map to minimal shape
        setAllGroups(groupsList.map((g: any) => ({ id: g.id, name: g.name })));
      } catch (e: any) {
        setError("Unable to load coach details. Admin access required.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6">Loading coach…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!coach) return <div className="p-6">Coach not found.</div>;

  const displayName = (coach.user.first_name || coach.user.last_name)
    ? `${coach.user.first_name} ${coach.user.last_name}`.trim()
    : coach.user.username;
  const photoVal = coach.photo || null;
  const photoUrl = photoVal
    ? (photoVal.startsWith("http") ? photoVal : `${API_URL}${photoVal}`)
    : null;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <a href="/coaches" className="text-sm underline">Back to Coaches</a>
      <h1 className="text-xl font-semibold">Coach Details</h1>
      <div className="flex items-center space-x-4">
        {photoUrl ? (
          <img src={photoUrl} alt="Coach" className="w-20 h-20 rounded-full border object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 border flex items-center justify-center text-gray-600 text-lg">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-lg font-medium">{displayName}</div>
          <div className="text-sm text-gray-700">@{coach.user.username}</div>
          <div className="text-sm text-gray-600">{coach.user.email}</div>
        </div>
      </div>

      <section className="space-y-2">
        <div>
          <span className="font-medium">Bio:</span>
          <p className="mt-1 text-gray-700">{coach.bio || "No bio provided."}</p>
        </div>
        <div>
          <span className="font-medium">Phone:</span>
          <p className="mt-1 text-gray-700">{coach.phone || "Not set"}</p>
        </div>
        <div>
          <span className="font-medium">Groups:</span>
          {coach.groups && coach.groups.length > 0 ? (
            <ul className="mt-1 space-y-2">
              {coach.groups.map((g) => (
                <li key={g.id} className="flex items-center justify-between">
                  <a href={`/groups/${g.id}`} className="underline">{g.name}</a>
                  <button
                    className="rounded bg-brand-black text-white px-3 py-1"
                    aria-label={`Unassign from group ${g.name}`}
                    onClick={async () => {
                      if (!confirm(`Unassign this coach from "${g.name}"? Group and players stay.`)) return;
                      try {
                        await api(`/api/groups/${g.id}/`, { method: "PATCH", body: JSON.stringify({ coach_id: null }) });
                        const updated = await api<CoachDetail>(`/api/coaches/${id}/`);
                        setCoach(updated);
                      } catch (e: any) {
                        alert(e.message);
                      }
                    }}
                  >Unassign</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-gray-700">No groups assigned.</p>
          )}
        </div>
      </section>

      {/* Assign coach to an additional group */}
      <section className="space-y-3 border rounded p-4">
        <h2 className="font-medium">Assign to Group</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            className="border rounded px-3 py-2"
            value={assignGroupId as any}
            onChange={(e) => setAssignGroupId(Number(e.target.value))}
          >
            <option value="">Select a group…</option>
            {allGroups
              .filter((g) => !(coach?.groups || []).find((cg) => cg.id === g.id))
              .map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
          </select>
          <button
            className="rounded bg-brand-black text-white px-4 py-2"
            onClick={async () => {
              if (!assignGroupId || !coach) return;
              try {
                await api(`/api/groups/${assignGroupId}/`, { method: "PATCH", body: JSON.stringify({ coach_id: coach.id }) });
                // Refresh coach detail
                const updated = await api<CoachDetail>(`/api/coaches/${id}/`);
                setCoach(updated);
                setAssignGroupId("");
              } catch (e: any) {
                alert(e.message);
              }
            }}
          >Assign</button>
        </div>
        <p className="text-sm text-gray-600">Assign this coach to an additional group.</p>
      </section>

      {/* Move coach completely from one group to another (unassign old, assign new) */}
      <section className="space-y-3 border rounded p-4">
        <h2 className="font-medium">Move Coach Between Groups</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <select
            className="border rounded px-3 py-2"
            value={moveFromGroupId as any}
            onChange={(e) => setMoveFromGroupId(Number(e.target.value))}
          >
            <option value="">From group…</option>
            {(coach?.groups || []).map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <span className="text-center">→</span>
          <select
            className="border rounded px-3 py-2"
            value={moveToGroupId as any}
            onChange={(e) => setMoveToGroupId(Number(e.target.value))}
          >
            <option value="">To group…</option>
            {allGroups
              .filter((g) => !(coach?.groups || []).find((cg) => cg.id === g.id))
              .map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
          </select>
        </div>
        <button
          className="rounded bg-white text-black px-4 py-2"
          onClick={async () => {
            if (!coach || !moveFromGroupId || !moveToGroupId) { alert("Select both groups."); return; }
            try {
              // Unassign from old group (set coach to null), then assign to new group
              await api(`/api/groups/${moveFromGroupId}/`, { method: "PATCH", body: JSON.stringify({ coach_id: null }) });
              await api(`/api/groups/${moveToGroupId}/`, { method: "PATCH", body: JSON.stringify({ coach_id: coach.id }) });
              const updated = await api<CoachDetail>(`/api/coaches/${id}/`);
              setCoach(updated);
              setMoveFromGroupId("");
              setMoveToGroupId("");
            } catch (e: any) {
              alert(e.message);
            }
          }}
        >Move</button>
        <p className="text-sm text-gray-600">This will remove the coach from the selected "from" group and assign them to the "to" group.</p>
      </section>
    </main>
  );
}