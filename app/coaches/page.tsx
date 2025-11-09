"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Coach = {
  id: number;
  user: { username: string; first_name: string; last_name: string; email: string };
  bio?: string;
};

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    email: "",
    bio: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api<Coach[]>("/api/coaches/");
        setCoaches(data);
        setIsAdmin(true);
      } catch (e: any) {
        setError("You must be an admin to manage coaches.");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const createCoach = async () => {
    try {
      const c = await api<Coach>("/api/coaches/create-with-user/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setCoaches([c, ...coaches]);
      setForm({ username: "", password: "", first_name: "", last_name: "", email: "", bio: "" });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const deleteCoach = async (id: number) => {
    try {
      await api(`/api/coaches/${id}/`, { method: "DELETE" });
      setCoaches(coaches.filter((c) => c.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <p className="p-6">Loading coaches...</p>;
  if (!isAdmin) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Coaches</h1>
      <section className="border rounded p-4 mb-6">
        <h2 className="font-medium mb-3">Add New Coach</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <input className="border rounded px-3 py-2" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input type="password" className="border rounded px-3 py-2" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <input className="border rounded px-3 py-2" placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <input className="border rounded px-3 py-2" placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          <input type="email" className="border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="border rounded px-3 py-2" placeholder="Bio (optional)" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <button className="rounded bg-white text-black px-4 py-2" onClick={createCoach}>Create Coach</button>
      </section>
      <ul className="space-y-3">
        {coaches.map((c) => (
          <li key={c.id} className="border rounded p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">{c.user.first_name} {c.user.last_name} ({c.user.username})</p>
              <p className="text-sm text-gray-600">{c.user.email}</p>
            </div>
            <div className="space-x-2">
              <a href={`/coaches/${c.id}`} className="rounded bg-black text-white px-3 py-1 no-underline">View</a>
              <button className="rounded bg-white text-black px-3 py-1" onClick={() => deleteCoach(c.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}