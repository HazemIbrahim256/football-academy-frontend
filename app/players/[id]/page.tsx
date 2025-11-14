"use client";
import { useEffect, useState, useRef } from "react";
import { api, API_URL } from "@/lib/api";
import Link from "next/link";

type Evaluation = {
  id: number;
  evaluated_at?: string;
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
  tall?: number | null;
  weight?: number | null;
  feet?: "L" | "R" | "B" | null;
  attendance_days?: number | null;
};

export default function PlayerPage({ params }: { params: { id: string } }) {
  const playerId = Number(params.id);
  const [player, setPlayer] = useState<Player | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesInput, setNotesInput] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [skillsForm, setSkillsForm] = useState<{
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
  }>({
    // Technical Skills
    ball_control: null,
    passing: null,
    dribbling: null,
    shooting: null,
    using_both_feet: null,
    // Physical Abilities
    speed: null,
    agility: null,
    endurance: null,
    strength: null,
    // Technical Understanding
    positioning: null,
    decision_making: null,
    game_awareness: null,
    teamwork: null,
    // Psychological and Social
    respect: null,
    sportsmanship: null,
    confidence: null,
    leadership: null,
    // Overall
    attendance_and_punctuality: null,
  });
  const [savingSkills, setSavingSkills] = useState(false);
  // Creation form state (for players with no evaluation yet)
  const [showCreateEvalForm, setShowCreateEvalForm] = useState(false);
  const [savingCreateEval, setSavingCreateEval] = useState(false);
  const [createForm, setCreateForm] = useState<{
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
    notes: string;
  }>({
    // Technical Skills
    ball_control: null,
    passing: null,
    dribbling: null,
    shooting: null,
    using_both_feet: null,
    // Physical Abilities
    speed: null,
    agility: null,
    endurance: null,
    strength: null,
    // Technical Understanding
    positioning: null,
    decision_making: null,
    game_awareness: null,
    teamwork: null,
    // Psychological and Social
    respect: null,
    sportsmanship: null,
    confidence: null,
    leadership: null,
    // Overall
    attendance_and_punctuality: null,
    notes: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const p = await api<Player>(`/api/players/${playerId}/?month=${selectedMonth}`);
        setPlayer(p);
        const evs = await api<Evaluation[]>(`/api/evaluations/?player=${playerId}&month=${selectedMonth}`);
        setEvaluation(evs[0] || null);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [playerId, selectedMonth]);

  // Listen for attendance updates from other pages and refresh the local summary when they match
  useEffect(() => {
    if (typeof window === "undefined") return;
    const bc = new BroadcastChannel("attendance-updates");
    bc.onmessage = (evt) => {
      const data = evt.data as { playerId: number; month: string; days: number };
      if (!data) return;
      if (data.playerId === playerId && data.month === selectedMonth) {
        setPlayer((prev) => (prev ? { ...prev, attendance_days: data.days } : prev));
      }
    };
    return () => bc.close();
  }, [playerId, selectedMonth]);

  const downloadPlayerPdf = async () => {
    try {
      const blob = await api<Blob>(`/api/players/${playerId}/report-pdf/?month=${selectedMonth}`);
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
      const clampOrNull = (v: any) => (typeof v === "number" ? Math.min(5, Math.max(1, v)) : null);
      const payload = {
        player: playerId,
        evaluated_at: `${selectedMonth}-01`,
        // Technical Skills
        ball_control: clampOrNull(createForm.ball_control),
        passing: clampOrNull(createForm.passing),
        dribbling: clampOrNull(createForm.dribbling),
        shooting: clampOrNull(createForm.shooting),
        using_both_feet: clampOrNull(createForm.using_both_feet),
        // Physical Abilities
        speed: clampOrNull(createForm.speed),
        agility: clampOrNull(createForm.agility),
        endurance: clampOrNull(createForm.endurance),
        strength: clampOrNull(createForm.strength),
        // Technical Understanding
        positioning: clampOrNull(createForm.positioning),
        decision_making: clampOrNull(createForm.decision_making),
        game_awareness: clampOrNull(createForm.game_awareness),
        teamwork: clampOrNull(createForm.teamwork),
        // Psychological and Social
        respect: clampOrNull(createForm.respect),
        sportsmanship: clampOrNull(createForm.sportsmanship),
        confidence: clampOrNull(createForm.confidence),
        leadership: clampOrNull(createForm.leadership),
        // Overall
        attendance_and_punctuality: clampOrNull(createForm.attendance_and_punctuality),
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
      ball_control: evaluation.ball_control ?? null,
      passing: evaluation.passing ?? null,
      dribbling: evaluation.dribbling ?? null,
      shooting: evaluation.shooting ?? null,
      using_both_feet: evaluation.using_both_feet ?? null,
      speed: evaluation.speed ?? null,
      agility: evaluation.agility ?? null,
      endurance: evaluation.endurance ?? null,
      strength: evaluation.strength ?? null,
      positioning: evaluation.positioning ?? null,
      decision_making: evaluation.decision_making ?? null,
      game_awareness: evaluation.game_awareness ?? null,
      teamwork: evaluation.teamwork ?? null,
      respect: evaluation.respect ?? null,
      sportsmanship: evaluation.sportsmanship ?? null,
      confidence: evaluation.confidence ?? null,
      leadership: evaluation.leadership ?? null,
      attendance_and_punctuality: evaluation.attendance_and_punctuality ?? null,
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
      const clampOrNull = (v: any) => (typeof v === "number" ? Math.min(5, Math.max(1, v)) : null);
      const payload = {
        // Technical Skills
        ball_control: clampOrNull(skillsForm.ball_control),
        passing: clampOrNull(skillsForm.passing),
        dribbling: clampOrNull(skillsForm.dribbling),
        shooting: clampOrNull(skillsForm.shooting),
        using_both_feet: clampOrNull(skillsForm.using_both_feet),
        // Physical Abilities
        speed: clampOrNull(skillsForm.speed),
        agility: clampOrNull(skillsForm.agility),
        endurance: clampOrNull(skillsForm.endurance),
        strength: clampOrNull(skillsForm.strength),
        // Technical Understanding
        positioning: clampOrNull(skillsForm.positioning),
        decision_making: clampOrNull(skillsForm.decision_making),
        game_awareness: clampOrNull(skillsForm.game_awareness),
        teamwork: clampOrNull(skillsForm.teamwork),
        // Psychological and Social
        respect: clampOrNull(skillsForm.respect),
        sportsmanship: clampOrNull(skillsForm.sportsmanship),
        confidence: clampOrNull(skillsForm.confidence),
        leadership: clampOrNull(skillsForm.leadership),
        // Overall
        attendance_and_punctuality: clampOrNull(skillsForm.attendance_and_punctuality),
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
      <p className="text-gray-700 mb-2">
        Age: {player.age}
        {player.phone ? ` • Phone: ${player.phone}` : ""}
        {typeof player.tall === "number" ? ` • Tall: ${player.tall} cm` : ""}
        {typeof player.weight === "number" ? ` • Weight: ${player.weight} kg` : ""}
        {player.feet ? ` • Feet: ${({ L: "Left", R: "Right", B: "Both" } as const)[player.feet]}` : ""}
      </p>
      <section className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Evaluation</h2>
          <label className="text-sm inline-flex items-center gap-2">
            <span>Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
          </label>
        </div>
        {evaluation ? (
          <ul className="grid grid-cols-2 gap-2 text-sm mb-3">
            {/* Technical Skills */}
            <li className="col-span-2 font-medium mt-2 rounded px-2 py-1 bg-yellow-200 text-gray-900 ring-2 ring-yellow-300">Technical Skills</li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Ball control:</span>
                  <RatingButtons
                    value={skillsForm.ball_control}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, ball_control: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Ball control: {evaluation.ball_control}{evaluation.ball_control != null ? ` (${ratingLabel(evaluation.ball_control)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Passing:</span>
                  <RatingButtons
                    value={skillsForm.passing}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, passing: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Passing: {evaluation.passing}{evaluation.passing != null ? ` (${ratingLabel(evaluation.passing)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Dribbling:</span>
                  <RatingButtons
                    value={skillsForm.dribbling}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, dribbling: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Dribbling: {evaluation.dribbling}{evaluation.dribbling != null ? ` (${ratingLabel(evaluation.dribbling)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Shooting:</span>
                  <RatingButtons
                    value={skillsForm.shooting}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, shooting: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Shooting: {evaluation.shooting}{evaluation.shooting != null ? ` (${ratingLabel(evaluation.shooting)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Using both feet:</span>
                  <RatingButtons
                    value={skillsForm.using_both_feet}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, using_both_feet: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Using both feet: {evaluation.using_both_feet}{evaluation.using_both_feet != null ? ` (${ratingLabel(evaluation.using_both_feet)})` : ""}</>
              )}
            </li>

            {/* Physical Abilities */}
            <li className="col-span-2 font-medium mt-2 rounded px-2 py-1 bg-yellow-200 text-gray-900 ring-2 ring-yellow-300">Physical Abilities</li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Speed:</span>
                  <RatingButtons
                    value={skillsForm.speed}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, speed: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Speed: {evaluation.speed}{evaluation.speed != null ? ` (${ratingLabel(evaluation.speed)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Agility:</span>
                  <RatingButtons
                    value={skillsForm.agility}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, agility: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Agility: {evaluation.agility}{evaluation.agility != null ? ` (${ratingLabel(evaluation.agility)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Endurance:</span>
                  <RatingButtons
                    value={skillsForm.endurance}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, endurance: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Endurance: {evaluation.endurance}{evaluation.endurance != null ? ` (${ratingLabel(evaluation.endurance)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Strength:</span>
                  <RatingButtons
                    value={skillsForm.strength}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, strength: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Strength: {evaluation.strength}{evaluation.strength != null ? ` (${ratingLabel(evaluation.strength)})` : ""}</>
              )}
            </li>

            {/* Technical Understanding */}
            <li className="col-span-2 font-medium mt-2 rounded px-2 py-1 bg-yellow-200 text-gray-900 ring-2 ring-yellow-300">Technical Understanding</li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Positioning:</span>
                  <RatingButtons
                    value={skillsForm.positioning}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, positioning: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Positioning: {evaluation.positioning}{evaluation.positioning != null ? ` (${ratingLabel(evaluation.positioning)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Decision making:</span>
                  <RatingButtons
                    value={skillsForm.decision_making}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, decision_making: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Decision making: {evaluation.decision_making}{evaluation.decision_making != null ? ` (${ratingLabel(evaluation.decision_making)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Game awareness:</span>
                  <RatingButtons
                    value={skillsForm.game_awareness}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, game_awareness: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Game awareness: {evaluation.game_awareness}{evaluation.game_awareness != null ? ` (${ratingLabel(evaluation.game_awareness)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Teamwork:</span>
                  <RatingButtons
                    value={skillsForm.teamwork}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, teamwork: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Teamwork: {evaluation.teamwork}{evaluation.teamwork != null ? ` (${ratingLabel(evaluation.teamwork)})` : ""}</>
              )}
            </li>

            {/* Psychological and Social */}
            <li className="col-span-2 font-medium mt-2 rounded px-2 py-1 bg-yellow-200 text-gray-900 ring-2 ring-yellow-300">Psychological and Social</li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Respect:</span>
                  <RatingButtons
                    value={skillsForm.respect}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, respect: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Respect: {evaluation.respect}{evaluation.respect != null ? ` (${ratingLabel(evaluation.respect)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Sportsmanship:</span>
                  <RatingButtons
                    value={skillsForm.sportsmanship}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, sportsmanship: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Sportsmanship: {evaluation.sportsmanship}{evaluation.sportsmanship != null ? ` (${ratingLabel(evaluation.sportsmanship)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Confidence:</span>
                  <RatingButtons
                    value={skillsForm.confidence}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, confidence: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>Confidence: {evaluation.confidence}{evaluation.confidence != null ? ` (${ratingLabel(evaluation.confidence)})` : ""}</>
              )}
            </li>
            <li>
              {editingSkills ? (
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Leadership:</span>
                  <RatingButtons
                    value={skillsForm.leadership}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, leadership: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
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
                <div className="text-sm flex items-center gap-2 w-full">
                  <span className="shrink-0 w-44">Attendance and punctuality:</span>
                  <RatingButtons
                    value={skillsForm.attendance_and_punctuality}
                    onChange={(n) => setSkillsForm((prev) => ({ ...prev, attendance_and_punctuality: n }))}
                    className="flex-1 justify-between"
                  />
                </div>
              ) : (
                <>
                  Attendance and punctuality: {evaluation.attendance_and_punctuality}
                  {evaluation.attendance_and_punctuality != null ? ` (${ratingLabel(evaluation.attendance_and_punctuality)})` : ""}
                  {" "}
                  <span className="ml-2 text-xs text-gray-600">
                    Monthly attendance: {(player?.attendance_days ?? 0)}/8 ({Math.round((((player?.attendance_days ?? 0) / 8) * 100))}%)
                  </span>
                </>
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
                  <SectionHeader title="Technical Skills" />
                  {(
                    [
                      ["ball_control", "Ball control"],
                      ["passing", "Passing"],
                      ["dribbling", "Dribbling"],
                      ["shooting", "Shooting"],
                      ["using_both_feet", "Using both feet"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="text-sm flex items-center gap-2 w-full">
                      <span className="shrink-0 w-44">{label}:</span>
                      <RatingButtons
                        value={(createForm as any)[key]}
                        onChange={(n) => setCreateForm((prev) => ({ ...prev, [key]: n }))}
                        className="flex-1 justify-between"
                      />
                    </div>
                  ))}
                  <SectionHeader title="Physical Abilities" />
                  {(
                    [
                      ["speed", "Speed"],
                      ["agility", "Agility"],
                      ["endurance", "Endurance"],
                      ["strength", "Strength"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="text-sm flex items-center gap-2 w-full">
                      <span className="shrink-0 w-44">{label}:</span>
                      <RatingButtons
                        value={(createForm as any)[key]}
                        onChange={(n) => setCreateForm((prev) => ({ ...prev, [key]: n }))}
                        className="flex-1 justify-between"
                      />
                    </div>
                  ))}
                  <SectionHeader title="Technical Understanding" />
                  {(
                    [
                      ["positioning", "Positioning"],
                      ["decision_making", "Decision making"],
                      ["game_awareness", "Game awareness"],
                      ["teamwork", "Teamwork"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="text-sm flex items-center gap-2 w-full">
                      <span className="shrink-0 w-44">{label}:</span>
                      <RatingButtons
                        value={(createForm as any)[key]}
                        onChange={(n) => setCreateForm((prev) => ({ ...prev, [key]: n }))}
                        className="flex-1 justify-between"
                      />
                    </div>
                  ))}
                  <SectionHeader title="Psychological and Social" />
                  {(
                    [
                      ["respect", "Respect"],
                      ["sportsmanship", "Sportsmanship"],
                      ["confidence", "Confidence"],
                      ["leadership", "Leadership"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="text-sm flex items-center gap-2 w-full">
                      <span className="shrink-0 w-44">{label}:</span>
                      <RatingButtons
                        value={(createForm as any)[key]}
                        onChange={(n) => setCreateForm((prev) => ({ ...prev, [key]: n }))}
                        className="flex-1 justify-between"
                      />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <div className="text-sm flex items-center gap-2 w-full">
                      <span className="shrink-0 w-44">Attendance and punctuality:</span>
                      <RatingButtons
                        value={createForm.attendance_and_punctuality}
                        onChange={(n) => setCreateForm((prev) => ({ ...prev, attendance_and_punctuality: n }))}
                        className="flex-1 justify-between"
                      />
                    </div>
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

// Button group for selecting a 1–5 rating
function RatingButtons({
  value,
  onChange,
  className,
}: {
  value: number | null;
  onChange: (n: number) => void;
  className?: string;
}) {
  const options = [1, 2, 3, 4, 5];
  const current = typeof value === "number" ? value : null;
  return (
    <div className={`flex w-full gap-1 justify-between ${className ?? ""}`}>
      {options.map((n) => (
        <button
          key={n}
          type="button"
          className={`px-2 py-1 rounded text-sm transition-colors ${
            n === current
              ? "bg-brand-red text-white border border-brand-red cursor-default"
              : "border border-gray-300 bg-white text-gray-800 hover:border-gray-400 cursor-pointer"
          }`}
          aria-pressed={n === current}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ title, className }: { title: string; className?: string }) {
  return (
    <div
      className={`col-span-2 font-medium mt-2 rounded px-2 py-1 bg-yellow-200 text-gray-900 ring-2 ring-yellow-300 ${
        className ?? ""
      }`}
    >
      {title}
    </div>
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