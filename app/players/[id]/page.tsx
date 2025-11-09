"use client";
import { useEffect, useState, useRef } from "react";
import { api, API_URL } from "@/lib/api";
import Link from "next/link";

type Evaluation = {
  id: number;
  // Technical Skills
  ball_control: number | null;
  passing: number | null;
  dribbling: number | null;
  shooting: number | null;
  using_both_feet: number | null;
  // Physical Abilities
  speed: number | null;
  agility: number | null;
  endurance: number | null;
  strength: number | null;
  // Technical Understanding
  positioning: number | null;
  decision_making: number | null;
  game_awareness: number | null;
  teamwork: number | null;
  // Psychological and Social
  respect: number | null;
  sportsmanship: number | null;
  confidence: number | null;
  leadership: number | null;
  // Overall
  attendance_and_punctuality: number | null;
  average_rating: number;
  notes: string | null;
};

type Player = {
  id: number;
  name: string;
  age: number;
  phone?: string | null;
  group: number;
  photo: string | null;
};

export default function PlayerPage({ params }: { params: { id: string } }) {
  const playerId = Number(params.id);
  const [player, setPlayer] = useState<Player | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [skillsForm, setSkillsForm] = useState({
    // Technical Skills
    ball_control: 3,
    passing: 3,
    dribbling: 3,
    shooting: 3,
    using_both_feet: 3,
    // Physical Abilities
    speed: 3,
    agility: 3,
    endurance: 3,
    strength: 3,
    // Technical Understanding
    positioning: 3,
    decision_making: 3,
    game_awareness: 3,
    teamwork: 3,
    // Psychological and Social
    respect: 3,
    sportsmanship: 3,
    confidence: 3,
    leadership: 3,
    // Overall
    attendance_and_punctuality: 3,
  });
  const [savingSkills, setSavingSkills] = useState(false);
  // Creation form state (for players with no evaluation yet)
  const [showCreateEvalForm, setShowCreateEvalForm] = useState(false);
  const [savingCreateEval, setSavingCreateEval] = useState(false);
  const [createForm, setCreateForm] = useState({
    // Technical Skills
    ball_control: 3,
    passing: 3,
    dribbling: 3,
    shooting: 3,
    using_both_feet: 3,
    // Physical Abilities
    speed: 3,
    agility: 3,
    endurance: 3,
    strength: 3,
    // Technical Understanding
    positioning: 3,
    decision_making: 3,
    game_awareness: 3,
    teamwork: 3,
    // Psychological and Social
    respect: 3,
    sportsmanship: 3,
    confidence: 3,
    leadership: 3,
    // Overall
    attendance_and_punctuality: 3,
    notes: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const p = await api<Player>(`/api/players/${playerId}/`);
        setPlayer(p);
        const evs = await api<Evaluation[]>(`/api/evaluations/?player=${playerId}`);
        setEvaluation(evs[0] || null);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [playerId]);

  const downloadPlayerPdf = async () => {
    try {
      const blob = await api<Blob>(`/api/players/${playerId}/report-pdf/`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `player-${playerId}-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const makeSafeFilename = (file: File) => {
    const original = file.name || "photo";
    const match = original.match(/^(.*?)(\.[^.]+)?$/);
    const base = (match?.[1] || "photo").replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-").toLowerCase();
    const ext = match?.[2] || "";
    const maxBaseLength = 80; // ensure path stays < 100 chars with upload_to prefix
    return `${base.slice(0, maxBaseLength)}${ext}`;
  };

  const handlePhotoClick = () => {
    if (uploadingPhoto) return;
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPhoto(true);
      const form = new FormData();
      form.append("photo", file, makeSafeFilename(file));
      const updated = await api<Player>(`/api/players/${playerId}/`, {
        method: "PATCH",
        body: form,
      });
      setPlayer(updated);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingPhoto(false);
      e.target.value = ""; // reset so selecting the same file again still triggers change
    }
  };

  // Removed legacy extra skills helpers; evaluations now use fixed categories and skills.

  const startEditNotes = () => {
    if (!evaluation) return;
    setNotesInput(evaluation.notes || "");
    setEditingNotes(true);
  };

  const cancelEditNotes = () => {
    setEditingNotes(false);
  };

  const saveNotes = async () => {
    if (!evaluation) return;
    try {
      setSavingNotes(true);
      const saved = await api<Evaluation>(`/api/evaluations/${evaluation.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ notes: (notesInput.trim() || "") }),
      });
      setEvaluation(saved);
      setEditingNotes(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const createEvaluation = async () => {
    try {
      setSavingCreateEval(true);
      const payload = {
        player: playerId,
        // Technical Skills
        ball_control: Math.min(5, Math.max(1, Number(createForm.ball_control))),
        passing: Math.min(5, Math.max(1, Number(createForm.passing))),
        dribbling: Math.min(5, Math.max(1, Number(createForm.dribbling))),
        shooting: Math.min(5, Math.max(1, Number(createForm.shooting))),
        using_both_feet: Math.min(5, Math.max(1, Number(createForm.using_both_feet))),
        // Physical Abilities
        speed: Math.min(5, Math.max(1, Number(createForm.speed))),
        agility: Math.min(5, Math.max(1, Number(createForm.agility))),
        endurance: Math.min(5, Math.max(1, Number(createForm.endurance))),
        strength: Math.min(5, Math.max(1, Number(createForm.strength))),
        // Technical Understanding
        positioning: Math.min(5, Math.max(1, Number(createForm.positioning))),
        decision_making: Math.min(5, Math.max(1, Number(createForm.decision_making))),
        game_awareness: Math.min(5, Math.max(1, Number(createForm.game_awareness))),
        teamwork: Math.min(5, Math.max(1, Number(createForm.teamwork))),
        // Psychological and Social
        respect: Math.min(5, Math.max(1, Number(createForm.respect))),
        sportsmanship: Math.min(5, Math.max(1, Number(createForm.sportsmanship))),
        confidence: Math.min(5, Math.max(1, Number(createForm.confidence))),
        leadership: Math.min(5, Math.max(1, Number(createForm.leadership))),
        // Overall
        attendance_and_punctuality: Math.min(5, Math.max(1, Number(createForm.attendance_and_punctuality))),
        notes: (createForm.notes || "").trim(),
      };
      const saved = await api<Evaluation>(`/api/evaluations/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setEvaluation(saved);
      setShowCreateEvalForm(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCreateEval(false);
    }
  };

  const startEditSkills = () => {
    if (!evaluation) return;
    setSkillsForm({
      ball_control: evaluation.ball_control ?? 3,
      passing: evaluation.passing ?? 3,
      dribbling: evaluation.dribbling ?? 3,
      shooting: evaluation.shooting ?? 3,
      using_both_feet: evaluation.using_both_feet ?? 3,
      speed: evaluation.speed ?? 3,
      agility: evaluation.agility ?? 3,
      endurance: evaluation.endurance ?? 3,
      strength: evaluation.strength ?? 3,
      positioning: evaluation.positioning ?? 3,
      decision_making: evaluation.decision_making ?? 3,
      game_awareness: evaluation.game_awareness ?? 3,
      teamwork: evaluation.teamwork ?? 3,
      respect: evaluation.respect ?? 3,
      sportsmanship: evaluation.sportsmanship ?? 3,
      confidence: evaluation.confidence ?? 3,
      leadership: evaluation.leadership ?? 3,
      attendance_and_punctuality: evaluation.attendance_and_punctuality ?? 3,
    });
    setEditingSkills(true);
  };

  const cancelEditSkills = () => {
    setEditingSkills(false);
  };

  const saveSkills = async () => {
    if (!evaluation) return;
    try {
      setSavingSkills(true);
      const payload = {
        // Technical Skills
        ball_control: Math.min(5, Math.max(1, Number(skillsForm.ball_control))),
        passing: Math.min(5, Math.max(1, Number(skillsForm.passing))),
        dribbling: Math.min(5, Math.max(1, Number(skillsForm.dribbling))),
        shooting: Math.min(5, Math.max(1, Number(skillsForm.shooting))),
        using_both_feet: Math.min(5, Math.max(1, Number(skillsForm.using_both_feet))),
        // Physical Abilities
        speed: Math.min(5, Math.max(1, Number(skillsForm.speed))),
        agility: Math.min(5, Math.max(1, Number(skillsForm.agility))),
        endurance: Math.min(5, Math.max(1, Number(skillsForm.endurance))),
        strength: Math.min(5, Math.max(1, Number(skillsForm.strength))),
        // Technical Understanding
        positioning: Math.min(5, Math.max(1, Number(skillsForm.positioning))),
        decision_making: Math.min(5, Math.max(1, Number(skillsForm.decision_making))),
        game_awareness: Math.min(5, Math.max(1, Number(skillsForm.game_awareness))),
        teamwork: Math.min(5, Math.max(1, Number(skillsForm.teamwork))),
        // Psychological and Social
        respect: Math.min(5, Math.max(1, Number(skillsForm.respect))),
        sportsmanship: Math.min(5, Math.max(1, Number(skillsForm.sportsmanship))),
        confidence: Math.min(5, Math.max(1, Number(skillsForm.confidence))),
        leadership: Math.min(5, Math.max(1, Number(skillsForm.leadership))),
        // Overall
        attendance_and_punctuality: Math.min(5, Math.max(1, Number(skillsForm.attendance_and_punctuality))),
        // Notes preserved as-is
        notes: (evaluation.notes || "").trim(),
      };
      const saved = await api<Evaluation>(`/api/evaluations/${evaluation.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setEvaluation(saved);
      setEditingSkills(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingSkills(false);
    }
  };

  if (loading) return <p className="p-6">Loading player...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!player) return <p className="p-6">Player not found</p>;

  const photoUrl = player.photo
    ? (player.photo.startsWith("http") ? player.photo : `${API_URL}${player.photo}`)
    : null;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            onClick={handlePhotoClick}
            role="button"
            aria-label="Update player photo"
            title={uploadingPhoto ? "Uploading…" : "Click to update photo"}
            className={`${uploadingPhoto ? "cursor-wait opacity-60" : "cursor-pointer hover:ring-2 ring-blue-400"} w-20 h-20 rounded border overflow-hidden flex items-center justify-center`}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={`${player.name} photo`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600 text-sm">No Photo</div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          <h1 className="text-xl font-semibold">{player.name}</h1>
        </div>
        <button className="rounded bg-white text-black px-3 py-1" onClick={downloadPlayerPdf}>
          Download Player PDF
        </button>
      </div>
      <p className="text-gray-700 mb-2">Age: {player.age}{player.phone ? ` • Phone: ${player.phone}` : ""}</p>
      <section className="mt-4">
        <h2 className="font-medium mb-2">Evaluation</h2>
        {evaluation ? (
          <ul className="grid grid-cols-2 gap-2 text-sm mb-3">
            {/* Technical Skills */}
            <li className="col-span-2 font-medium mt-2">Technical Skills</li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Ball control:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.ball_control}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, ball_control: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Ball control: {evaluation.ball_control}{evaluation.ball_control != null ? ` (${ratingLabel(evaluation.ball_control)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Passing:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.passing}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, passing: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Passing: {evaluation.passing}{evaluation.passing != null ? ` (${ratingLabel(evaluation.passing)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Dribbling:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.dribbling}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, dribbling: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Dribbling: {evaluation.dribbling}{evaluation.dribbling != null ? ` (${ratingLabel(evaluation.dribbling)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Shooting:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.shooting}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, shooting: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Shooting: {evaluation.shooting}{evaluation.shooting != null ? ` (${ratingLabel(evaluation.shooting)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Using both feet:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.using_both_feet}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, using_both_feet: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Using both feet: {evaluation.using_both_feet}{evaluation.using_both_feet != null ? ` (${ratingLabel(evaluation.using_both_feet)})` : ""}</>
              )}
            </li>

            {/* Physical Abilities */}
            <li className="col-span-2 font-medium mt-2">Physical Abilities</li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Speed:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.speed}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, speed: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Speed: {evaluation.speed}{evaluation.speed != null ? ` (${ratingLabel(evaluation.speed)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Agility:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.agility}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, agility: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Agility: {evaluation.agility}{evaluation.agility != null ? ` (${ratingLabel(evaluation.agility)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Endurance:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.endurance}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, endurance: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Endurance: {evaluation.endurance}{evaluation.endurance != null ? ` (${ratingLabel(evaluation.endurance)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Strength:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.strength}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, strength: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Strength: {evaluation.strength}{evaluation.strength != null ? ` (${ratingLabel(evaluation.strength)})` : ""}</>
              )}
            </li>

            {/* Technical Understanding */}
            <li className="col-span-2 font-medium mt-2">Technical Understanding</li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Positioning:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.positioning}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, positioning: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Positioning: {evaluation.positioning}{evaluation.positioning != null ? ` (${ratingLabel(evaluation.positioning)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Decision making:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.decision_making}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, decision_making: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Decision making: {evaluation.decision_making}{evaluation.decision_making != null ? ` (${ratingLabel(evaluation.decision_making)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Game awareness:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.game_awareness}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, game_awareness: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Game awareness: {evaluation.game_awareness}{evaluation.game_awareness != null ? ` (${ratingLabel(evaluation.game_awareness)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Teamwork:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.teamwork}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, teamwork: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Teamwork: {evaluation.teamwork}{evaluation.teamwork != null ? ` (${ratingLabel(evaluation.teamwork)})` : ""}</>
              )}
            </li>

            {/* Psychological and Social */}
            <li className="col-span-2 font-medium mt-2">Psychological and Social</li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Respect:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.respect}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, respect: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Respect: {evaluation.respect}{evaluation.respect != null ? ` (${ratingLabel(evaluation.respect)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Sportsmanship:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.sportsmanship}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, sportsmanship: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Sportsmanship: {evaluation.sportsmanship}{evaluation.sportsmanship != null ? ` (${ratingLabel(evaluation.sportsmanship)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Confidence:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.confidence}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, confidence: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Confidence: {evaluation.confidence}{evaluation.confidence != null ? ` (${ratingLabel(evaluation.confidence)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Leadership:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.leadership}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, leadership: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Leadership: {evaluation.leadership}{evaluation.leadership != null ? ` (${ratingLabel(evaluation.leadership)})` : ""}</>
              )}
            </li>

            {/* Overall */}
            <li className="col-span-2">
              <div className="flex items-center justify-between">
                <span>
                  Average level: {ratingLabelFromAverage(evaluation.average_rating)} ({evaluation.average_rating?.toFixed(2)})
                </span>
                <div className="flex gap-2">
                  {editingSkills ? (
                    <>
                      <button
                        type="button"
                        className="rounded bg-brand-red hover:bg-brand-maroon text-white px-3 py-1 text-sm"
                        onClick={saveSkills}
                        disabled={savingSkills}
                      >
                        {savingSkills ? "Saving…" : "Save Skills"}
                      </button>
                      <button
                        type="button"
                        className="rounded border px-3 py-1 text-sm"
                        onClick={cancelEditSkills}
                        disabled={savingSkills}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="rounded border px-3 py-1 text-sm"
                      onClick={startEditSkills}
                    >
                      Edit Skills
                    </button>
                  )}
                </div>
              </div>
            </li>
            <li className="col-span-2">
              {editingSkills ? (
                <label className="text-sm">
                  <span className="mr-2">Attendance and punctuality:</span>
                  <select
                    className="border px-2 py-1 rounded w-36"
                    value={skillsForm.attendance_and_punctuality}
                    onChange={(e) => setSkillsForm((prev) => ({ ...prev, attendance_and_punctuality: Number(e.target.value) }))}
                  >
                    {RATING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <>Attendance and punctuality: {evaluation.attendance_and_punctuality}{evaluation.attendance_and_punctuality != null ? ` (${ratingLabel(evaluation.attendance_and_punctuality)})` : ""}</>
              )}
            </li>
            <li className="col-span-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="font-medium">Notes:</span>
                  {editingNotes ? (
                    <textarea
                      className="mt-1 border px-2 py-1 rounded w-full text-sm"
                      placeholder="Notes (optional)"
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                    />
                  ) : (
                    <span className="ml-1 text-sm">{evaluation.notes || "—"}</span>
                  )}
                </div>
                <div className="shrink-0 flex gap-2">
                  {editingNotes ? (
                    <>
                      <button
                        type="button"
                        className="rounded bg-brand-red hover:bg-brand-maroon text-white px-3 py-1 text-sm"
                        onClick={saveNotes}
                        disabled={savingNotes}
                      >
                        {savingNotes ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        className="rounded border px-3 py-1 text-sm"
                        onClick={cancelEditNotes}
                        disabled={savingNotes}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="rounded border px-3 py-1 text-sm"
                      onClick={startEditNotes}
                    >
                      {evaluation.notes ? "Edit Notes" : "Add Notes"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          </ul>
        ) : (
          <div className="mb-3">
            {!showCreateEvalForm ? (
              <button
                className="rounded bg-brand-red hover:bg-brand-maroon text-white px-3 py-1"
                onClick={() => setShowCreateEvalForm(true)}
              >
                Create Evaluation
              </button>
            ) : (
              <div className="space-y-2">
                {/* Create evaluation form: categories */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 font-medium mt-2">Technical Skills</div>
                  {(
                    [
                      ["ball_control", "Ball control"],
                      ["passing", "Passing"],
                      ["dribbling", "Dribbling"],
                      ["shooting", "Shooting"],
                      ["using_both_feet", "Using both feet"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="text-sm">
                      <span className="mr-2">{label}:</span>
                      <select
                        className="border px-2 py-1 rounded w-36"
                        value={(createForm as any)[key]}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      >
                        {RATING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <div className="col-span-2 font-medium mt-2">Physical Abilities</div>
                  {(
                    [
                      ["speed", "Speed"],
                      ["agility", "Agility"],
                      ["endurance", "Endurance"],
                      ["strength", "Strength"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="text-sm">
                      <span className="mr-2">{label}:</span>
                      <select
                        className="border px-2 py-1 rounded w-36"
                        value={(createForm as any)[key]}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      >
                        {RATING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <div className="col-span-2 font-medium mt-2">Technical Understanding</div>
                  {(
                    [
                      ["positioning", "Positioning"],
                      ["decision_making", "Decision making"],
                      ["game_awareness", "Game awareness"],
                      ["teamwork", "Teamwork"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="text-sm">
                      <span className="mr-2">{label}:</span>
                      <select
                        className="border px-2 py-1 rounded w-36"
                        value={(createForm as any)[key]}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      >
                        {RATING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <div className="col-span-2 font-medium mt-2">Psychological and Social</div>
                  {(
                    [
                      ["respect", "Respect"],
                      ["sportsmanship", "Sportsmanship"],
                      ["confidence", "Confidence"],
                      ["leadership", "Leadership"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="text-sm">
                      <span className="mr-2">{label}:</span>
                      <select
                        className="border px-2 py-1 rounded w-36"
                        value={(createForm as any)[key]}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      >
                        {RATING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <div className="col-span-2">
                    <label className="text-sm">
                      <span className="mr-2">Attendance and punctuality:</span>
                      <select
                        className="border px-2 py-1 rounded w-36"
                        value={createForm.attendance_and_punctuality}
                        onChange={(e) => setCreateForm((prev) => ({ ...prev, attendance_and_punctuality: Number(e.target.value) }))}
                      >
                        {RATING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
                <textarea
                  className="border px-2 py-1 rounded w-full text-sm"
                  placeholder="Notes (optional)"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button
                    className="rounded bg-brand-red hover:bg-brand-maroon text-white px-3 py-1"
                    onClick={createEvaluation}
                    disabled={savingCreateEval}
                  >
                    {savingCreateEval ? "Saving…" : "Save"}
                  </button>
                  <button
                    className="rounded border px-3 py-1"
                    onClick={() => setShowCreateEvalForm(false)}
                    disabled={savingCreateEval}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      <div className="mt-6">
        <Link className="underline" href={`/groups/${player.group}`}>Back to Group</Link>
      </div>
    </main>
  );
}

// Rating helpers
const RATING_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];

const RATING_TEXT: Record<number, string> = {
  1: "Bad",
  2: "Not bad",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

function ratingLabel(value?: number | null) {
  if (value == null || isNaN(Number(value))) return "—";
  const n = Number(value);
  return RATING_TEXT[n] ?? String(n);
}

function ratingLabelFromAverage(avg?: number) {
  if (typeof avg !== "number" || isNaN(avg)) return "—";
  const rounded = Math.min(5, Math.max(1, Math.round(avg)));
  return ratingLabel(rounded);
}