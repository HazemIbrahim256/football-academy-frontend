"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, API_URL } from "@/lib/api";

export default function Navbar() {
  const [status, setStatus] = useState<"unknown" | "logged_in" | "logged_out">("unknown");
  const [userName, setUserName] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const access = typeof window !== "undefined" ? localStorage.getItem("access") : null;
    if (!access) {
      setStatus("logged_out");
      setIsStaff(false);
      return;
    }
    (async () => {
      try {
        const me = await api<{ user: any; coach: any | null; is_staff: boolean }>("/api/auth/me/");
        const name = me.user?.first_name || me.user?.last_name ? `${me.user.first_name || ""} ${me.user.last_name || ""}`.trim() : me.user?.username;
        setUserName(name || null);
        const photo = me.coach?.photo || null;
        if (photo) {
          setUserPhoto(photo.startsWith("http") ? photo : `${API_URL}${photo}`);
        } else {
          setUserPhoto(null);
        }
        setIsStaff(!!me.is_staff);
        setStatus("logged_in");
      } catch (e) {
        // Token likely invalid/expired — clear and reflect logged-out state
        try {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
        } catch {}
        setUserName(null);
        setUserPhoto(null);
        setIsStaff(false);
        setStatus("logged_out");
      }
    })();
  }, []);

  const logout = () => {
    try {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    } catch {}
    // Immediately reflect logged-out state to hide navbar before navigation
    setUserName(null);
    setUserPhoto(null);
    setStatus("logged_out");
    router.replace("/login");
  };

  // Hide the navbar entirely until the user is logged in
  if (status !== "logged_in") return null;

  return (
    <header className="bg-white text-black shadow-sm border-b border-brand-maroon/20">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <a href="/" className="flex items-center space-x-2 no-underline hover:opacity-90">
            <img src="/logo.png" alt="El Capitano Soccer Academy Logo" className="h-8 w-auto" />
            <span className="font-semibold text-black">El Capitano</span>
          </a>
          {isStaff && <a href="/groups" className="text-sm text-black no-underline hover:text-brand-red font-semibold">Groups</a>}
          <a href="/players" className="text-sm text-black no-underline hover:text-brand-red font-semibold">Players</a>
          {isStaff && <a href="/attendance" className="text-sm text-black no-underline hover:text-brand-red font-semibold">Attendance</a>}
          {isStaff && <a href="/coaches" className="text-sm text-black no-underline hover:text-brand-red font-semibold">Coaches</a>}
        </div>
        <div className="flex items-center space-x-3">
          <a href="/profile" className="flex items-center space-x-2 no-underline hover:opacity-90" title="My Profile">
            {userPhoto ? (
              <img src={userPhoto} alt="User photo" className="w-8 h-8 rounded-full object-cover border border-white/70" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-maroon/10 border border-brand-maroon/30 flex items-center justify-center text-brand-maroon text-xs">
                {userName ? userName.charAt(0).toUpperCase() : ""}
              </div>
            )}
            {userName && <span className="text-sm text-black">{userName}</span>}
          </a>
          <button onClick={logout} className="rounded bg-brand-red hover:bg-brand-maroon text-white px-3 py-1">Logout</button>
        </div>
      </nav>
    </header>
  );
}