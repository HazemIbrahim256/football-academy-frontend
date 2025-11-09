"use client";

import { useEffect, useState } from "react";
import { api, API_URL } from "../../lib/api";

type MeResponse = {
  user: { id: number; username: string; first_name: string; last_name: string; email: string };
  coach: null | { id: number; bio: string; photo?: string | null; phone?: string };
  is_staff: boolean;
};

export default function ProfilePage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api<MeResponse>("/api/auth/me/", { method: "GET" });
        if (cancelled) return;
        setMe(data);
        setFirstName(data.user.first_name || "");
        setLastName(data.user.last_name || "");
        setEmail(data.user.email || "");
        setBio(data.coach?.bio || "");
        setPhone(data.coach?.phone || "");
      } catch (e: any) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("first_name", firstName);
      form.append("last_name", lastName);
      form.append("email", email);
      if (me?.coach || me?.is_staff) {
        form.append("bio", bio);
        form.append("phone", phone);
        if (photoFile) form.append("photo", photoFile);
      }
      const updated = await api<MeResponse>("/api/auth/me/", { method: "PATCH", body: form });
      setMe(updated);
      setPhotoFile(null);
    } catch (e: any) {
      setError(e?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading profile…</div>;
  }

  if (!me) {
    return <div className="p-6">Unable to load profile.</div>;
  }

  const displayName = (me.user.first_name || me.user.last_name)
    ? `${me.user.first_name} ${me.user.last_name}`.trim()
    : me.user.username;

  const coachPhotoVal = me.coach?.photo || null;
  const photoUrl = coachPhotoVal
    ? (coachPhotoVal.startsWith("http") ? coachPhotoVal : `${API_URL}${coachPhotoVal}`)
    : null;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold">My Profile</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 text-red-700 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center space-x-4">
        {photoUrl ? (
          <img src={photoUrl} alt="Avatar" className="w-16 h-16 rounded-full border object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 border flex items-center justify-center text-gray-600 text-lg">
            {(displayName || "").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <div className="text-lg font-medium">{displayName}</div>
          {me.user.email ? (
            <div className="text-sm text-gray-600">{me.user.email}</div>
          ) : (
            <>
              {me.coach?.phone && (
                <div className="text-sm text-gray-600">{me.coach.phone}</div>
              )}
              {me.coach?.bio && (
                <div className="text-sm text-gray-600">{me.coach.bio}</div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last name</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        {(me.coach || me.is_staff) && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
              {photoFile && (
                <div className="text-xs text-gray-600 mt-1">Selected: {photoFile.name}</div>
              )}
            </div>
          </>
        )}
      </div>

      {(me.coach || me.is_staff) && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              className="w-full border rounded px-3 py-2 min-h-[100px]"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="flex items-center space-x-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => {
            setFirstName(me.user.first_name || "");
            setLastName(me.user.last_name || "");
            setEmail(me.user.email || "");
            setBio(me.coach?.bio || "");
            setPhone(me.coach?.phone || "");
            setPhotoFile(null);
          }}
          className="px-4 py-2 rounded border"
        >
          Cancel
        </button>
      </div>

      <hr className="my-6" />
      <ChangePasswordSection />
    </div>
  );
}

function ChangePasswordSection() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onChangePassword = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (newPassword !== confirmPassword) {
        throw new Error("New password and confirmation do not match.");
      }
      await api<{ detail: string }>("/api/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      setSuccess("Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setError(e?.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Change Password</h2>
      {error && <div className="rounded border border-red-300 bg-red-50 text-red-700 p-3 text-sm">{error}</div>}
      {success && <div className="rounded border border-green-300 bg-green-50 text-green-700 p-3 text-sm">{success}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Current password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">New password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirm new password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
      </div>
      <div>
        <button onClick={onChangePassword} disabled={saving} className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
          {saving ? "Changing…" : "Change Password"}
        </button>
      </div>
    </div>
  );
}