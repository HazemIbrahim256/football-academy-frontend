"use client";
import { useState } from "react";
// using plain <img> to avoid Next image import issues with this file

export default function LoginPage() {
  const [username, setUsername] = useState("coach1");
  const [password, setPassword] = useState("coach123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error(`Login failed: ${res.status}`);
      const data = await res.json();
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      window.location.href = "/groups";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 gap-4">
      <img src="/logo.png" alt="El Capitano Soccer Academy Logo" className="h-56 w-auto drop-shadow" />
      <div className="w-full max-w-md bg-white text-black border border-brand-maroon/30 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-brand-red">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-black">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md px-3 py-2 bg-white text-black placeholder:text-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
              />
          </div>
          <div>
            <label className="block text-sm mb-1 text-black">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md px-3 py-2 bg-white text-black placeholder:text-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"
              />
          </div>
          {error && (
            <p className="text-brand-red text-sm bg-brand-red/10 border border-brand-red/30 rounded px-2 py-1">{error}</p>
          )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-brand-red hover:bg-brand-maroon text-white font-medium px-4 py-2 transition-colors disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
        </form>
      </div>
    </main>
  );
}