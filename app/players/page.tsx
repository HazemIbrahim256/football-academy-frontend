"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type MeResponse = {
  user: { id: number; username: string; first_name: string; last_name: string; email: string };
  coach: null | { id: number };
  is_staff: boolean;
};
type Group = {
  id: number;
  name: string;
};

type Player = {
  id: number;
  name: string;
  age: number;
  birth_date?: string | null;
  phone?: string | null;
  group: number;
};

export default function PlayersPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editBirthDate, setEditBirthDate] = useState<string>("");
  const [editPhone, setEditPhone] = useState("");
  const [editGroupId, setEditGroupId] = useState<number | null>(null);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [editPhotoPreviewUrl, setEditPhotoPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const makeSafeFilename = (file: File) => {
    const original = file.name || "photo";
    const match = original.match(/^(.*?)(\.[^.]+)?$/);
    const base = (match?.[1] || "photo").replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").toLowerCase();
    const ext = match?.[2] || "";
    const maxBaseLength = 80; // keep path length < 100 with upload_to prefix
    const truncated = base.slice(0, maxBaseLength);
    return `${truncated}${ext}`;
  };

  // Fetch current user role to gate privileged actions
  useEffect(() => {
    (async () => {
      try {
        const meData = await api<MeResponse>("/api/auth/me/");
        setMe(meData);
      } catch (e) {
        // ignore – unauthenticated or normal users
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const gs = await api<Group[]>("/api/groups/");
        setGroups(gs);
        if (gs.length > 0) {
          setSelectedGroupId(gs[0].id);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedGroupId) {
        setPlayers([]);
        return;
      }
      try {
        const ps = await api<Player[]>(`/api/players/?group=${selectedGroupId}`);
        setPlayers(ps);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [selectedGroupId]);

  // Preview selected photo for Add Player
  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  // Preview selected photo for Edit Player
  useEffect(() => {
    if (!editPhotoFile) {
      setEditPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(editPhotoFile);
    setEditPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [editPhotoFile]);

  const addPlayer = async () => {
    if (!selectedGroupId) return;
    if (!name.trim() || !birthDate || !phone.trim()) {
      alert("Please fill in name, birth date and phone number.");
      return;
    }
    try {
      const form = new FormData();
      form.append("name", name);
      form.append("birth_date", birthDate);
      form.append("phone", phone);
      form.append("group", String(selectedGroupId));
      if (photoFile) form.append("photo", photoFile, makeSafeFilename(photoFile));
      await api<Player>("/api/players/", { method: "POST", body: form });
      setName("");
      setBirthDate("");
      setPhone("");
      setPhotoFile(null);
      const ps = await api<Player[]>(`/api/players/?group=${selectedGroupId}`);
      setPlayers(ps);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const deletePlayer = async (id: number) => {
    if (!confirm("Delete this player?")) return;
    try {
      await api(`/api/players/${id}/`, { method: "DELETE" });
      if (selectedGroupId) {
        const ps = await api<Player[]>(`/api/players/?group=${selectedGroupId}`);
        setPlayers(ps);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const startEdit = (p: Player) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditBirthDate(p.birth_date ?? "");
    setEditPhone(p.phone ?? "");
    setEditGroupId(p.group);
    setEditPhotoFile(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditBirthDate("");
    setEditPhone("");
    setEditGroupId(null);
    setEditPhotoFile(null);
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    if (!editName.trim() || !editBirthDate || !editPhone.trim() || !editGroupId) {
      alert("Please fill all fields for the player.");
      return;
    }
    try {
      const form = new FormData();
      form.append("name", editName);
      form.append("birth_date", editBirthDate);
      form.append("phone", editPhone);
      form.append("group", String(editGroupId));
      if (editPhotoFile) form.append("photo", editPhotoFile, makeSafeFilename(editPhotoFile));
      await api(`/api/players/${editingId}/`, { method: "PATCH", body: form });
      cancelEdit();
      if (selectedGroupId) {
        const ps = await api<Player[]>(`/api/players/?group=${selectedGroupId}`);
        setPlayers(ps);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Players</h1>

      <section className="mb-6">
        <label className="block text-sm mb-2">Select Group</label>
        <select
          className="border px-2 py-1 rounded"
          value={selectedGroupId ?? ""}
          onChange={(e) => setSelectedGroupId(Number(e.target.value))}
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </section>

      {me?.is_staff && (
        <section className="mb-6">
          <h2 className="font-medium mb-2">Add Player</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              className="border px-2 py-1 rounded"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="border px-2 py-1 rounded"
              type="date"
              placeholder="Birth Date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            <input
              className="border px-2 py-1 rounded"
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {photoPreviewUrl && (
              <div className="sm:col-span-4">
                <p className="text-xs text-gray-500">Selected photo preview</p>
                <img src={photoPreviewUrl} alt="Selected preview" className="mt-1 w-24 h-24 rounded border object-cover" />
              </div>
            )}
            <input
              className="border px-2 py-1 rounded"
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-gray-500 sm:col-span-4">Long filenames are auto-shortened when uploading.</p>
          </div>
          <button
            className="mt-3 inline-flex items-center rounded-md bg-white text-black px-3 py-1.5 text-sm shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
            onClick={addPlayer}
          >
            Add Player
          </button>
        </section>
      )}

      <section>
        <h2 className="font-medium mb-2">Players in Group</h2>
        {players.length === 0 ? (
          <p className="text-sm text-gray-600">No players yet.</p>
        ) : (
          <ul className="space-y-2">
            {players.map((p) => (
              <li key={p.id} className="border rounded px-3 py-2">
                {editingId === p.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <input
                        className="border px-2 py-1 rounded"
                        placeholder="Name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                      <input
                        className="border px-2 py-1 rounded"
                        type="date"
                        placeholder="Birth Date"
                        value={editBirthDate}
                        onChange={(e) => setEditBirthDate(e.target.value)}
                      />
                      <input
                        className="border px-2 py-1 rounded"
                        type="tel"
                        placeholder="Phone Number"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                    <select
                      className="border px-2 py-1 rounded"
                      value={editGroupId ?? ""}
                      onChange={(e) => setEditGroupId(Number(e.target.value))}
                    >
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    {editPhotoPreviewUrl && (
                      <div className="sm:col-span-5">
                        <p className="text-xs text-gray-500">Selected photo preview</p>
                        <img src={editPhotoPreviewUrl} alt="Selected preview" className="mt-1 w-24 h-24 rounded border object-cover" />
                      </div>
                    )}
                    <input
                      className="border px-2 py-1 rounded"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditPhotoFile(e.target.files?.[0] || null)}
                    />
                  </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="inline-flex items-center rounded-md bg-white text-black px-3 py-1.5 text-sm shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                        onClick={saveEdit}
                      >
                        Save
                      </button>
                      <button
                        className="inline-flex items-center rounded-md bg-white text-black px-3 py-1.5 text-sm ring-1 ring-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-gray-700">Age: {p.age}{p.phone ? ` • Phone: ${p.phone}` : ""} • Group: {groups.find(g => g.id === p.group)?.name ?? p.group}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        className="inline-flex items-center rounded-md bg-gray-100 text-gray-800 px-3 py-1.5 text-sm ring-1 ring-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                        href={`/players/${p.id}`}
                      >
                        View
                      </Link>
                      <Link
                        className="inline-flex items-center rounded-md bg-gray-100 text-gray-800 px-3 py-1.5 text-sm ring-1 ring-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                        href={`/groups/${p.group}`}
                      >
                        Group
                      </Link>
                      <button
                        className="inline-flex items-center rounded-md bg-white text-black px-3 py-1.5 text-sm shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                        onClick={() => startEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="inline-flex items-center rounded-md bg-white text-black px-3 py-1.5 text-sm shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                        onClick={() => deletePlayer(p.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}