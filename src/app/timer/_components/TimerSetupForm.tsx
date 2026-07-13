"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { createTagAction, deleteTagAction, startSessionAction } from "@/lib/timer-actions";
import {
  COUNTDOWN_MAX_MINUTES,
  COUNTDOWN_MIN_MINUTES,
  POMODORO_PRESETS,
  POMODORO_PRESET_LABELS,
  type PomodoroPresetId,
} from "@/lib/timer-config";

type TimerMode = "COUNTUP" | "COUNTDOWN" | "POMODORO";
type TagItem = { id: string; name: string };

const MODE_OPTIONS: { value: TimerMode; label: string; description: string }[] = [
  { value: "COUNTUP", label: "カウントアップ", description: "じかんを気にせず、はかるだけ" },
  { value: "COUNTDOWN", label: "カウントダウン", description: "めあての時間を決めて集中" },
  { value: "POMODORO", label: "ポモドーロ", description: "さぎょうと休けいをくり返す" },
];

export default function TimerSetupForm({ initialTags }: { initialTags: TagItem[] }) {
  const router = useRouter();

  const [mode, setMode] = useState<TimerMode>("COUNTUP");
  const [countdownMinutes, setCountdownMinutes] = useState(25);
  const [pomodoroPreset, setPomodoroPreset] = useState<PomodoroPresetId>("A");

  const [tags, setTags] = useState<TagItem[]>(initialTags);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [confirmDeleteTagId, setConfirmDeleteTagId] = useState<string | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);
  const confirmResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmResetTimer.current) clearTimeout(confirmResetTimer.current);
    };
  }, []);

  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((tagId) => tagId !== id) : [...prev, id],
    );
  }

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name || isCreatingTag) return;
    setIsCreatingTag(true);
    setError(null);
    try {
      const tag = await createTagAction(name);
      setTags((prev) => (prev.some((t) => t.id === tag.id) ? prev : [...prev, tag]));
      setSelectedTagIds((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
      setNewTagName("");
    } catch {
      setError("タグの作成に失敗しました");
    } finally {
      setIsCreatingTag(false);
    }
  }

  async function handleDeleteTagClick(tagId: string) {
    if (deletingTagId) return;

    if (confirmDeleteTagId !== tagId) {
      setConfirmDeleteTagId(tagId);
      if (confirmResetTimer.current) clearTimeout(confirmResetTimer.current);
      confirmResetTimer.current = setTimeout(() => setConfirmDeleteTagId(null), 3000);
      return;
    }

    if (confirmResetTimer.current) clearTimeout(confirmResetTimer.current);
    setConfirmDeleteTagId(null);
    setDeletingTagId(tagId);
    setError(null);

    // 楽観的UI: サーバーの完了を待たずに即座に一覧から消す(失敗時のみ元に戻す)。
    const prevTags = tags;
    const prevSelectedTagIds = selectedTagIds;
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    try {
      await deleteTagAction(tagId);
    } catch {
      setTags(prevTags);
      setSelectedTagIds(prevSelectedTagIds);
      setError("タグの削除に失敗したよ");
    } finally {
      setDeletingTagId(null);
    }
  }

  async function handleStart() {
    if (isStarting) return;
    setError(null);

    if (mode === "COUNTDOWN") {
      if (
        !Number.isFinite(countdownMinutes) ||
        countdownMinutes < COUNTDOWN_MIN_MINUTES ||
        countdownMinutes > COUNTDOWN_MAX_MINUTES
      ) {
        setError(`目標時間は${COUNTDOWN_MIN_MINUTES}〜${COUNTDOWN_MAX_MINUTES}分で設定してね`);
        return;
      }
    }

    setIsStarting(true);
    try {
      const targetSeconds = mode === "COUNTDOWN" ? countdownMinutes * 60 : null;
      const presetConfig = mode === "POMODORO" ? POMODORO_PRESETS[pomodoroPreset] : null;

      const { sessionId } = await startSessionAction(
        mode,
        targetSeconds,
        presetConfig,
        selectedTagIds,
      );

      const qs = new URLSearchParams();
      if (mode === "COUNTDOWN" && targetSeconds) {
        qs.set("target", String(targetSeconds));
      }
      if (mode === "POMODORO" && presetConfig) {
        qs.set("work", String(presetConfig.work));
        qs.set("shortBreak", String(presetConfig.shortBreak));
        qs.set("long", String(presetConfig.long));
        qs.set("sets", String(presetConfig.setsUntilLong));
      }

      const query = qs.toString();
      router.push(`/timer/run/${sessionId}${query ? `?${query}` : ""}`);
    } catch {
      setError("はじめられなかったよ。もう一度ためしてね");
      setIsStarting(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-3 text-sm font-bold text-charcoal-soft">タイマーのしゅるい</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              className={clsx(
                "rounded-2xl px-4 py-4 text-left shadow-sm transition active:scale-95",
                mode === option.value
                  ? "bg-pink-deep text-charcoal"
                  : "bg-milk text-charcoal-soft hover:bg-pink/40",
              )}
            >
              <p className="font-bold">{option.label}</p>
              <p className="mt-1 text-xs">{option.description}</p>
            </button>
          ))}
        </div>
      </section>

      {mode === "COUNTDOWN" && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-charcoal-soft">目標時間(分)</h2>
          <input
            type="number"
            inputMode="numeric"
            min={COUNTDOWN_MIN_MINUTES}
            max={COUNTDOWN_MAX_MINUTES}
            value={countdownMinutes}
            onChange={(e) => setCountdownMinutes(Number(e.target.value))}
            className="w-32 rounded-xl bg-milk px-4 py-3 text-lg font-bold text-charcoal shadow-sm outline-none ring-pink-deep focus:ring-2"
          />
          <p className="mt-2 text-xs text-charcoal-soft">
            {COUNTDOWN_MIN_MINUTES}〜{COUNTDOWN_MAX_MINUTES}分の間で設定してね
          </p>
        </section>
      )}

      {mode === "POMODORO" && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-charcoal-soft">プリセット</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(Object.keys(POMODORO_PRESETS) as PomodoroPresetId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setPomodoroPreset(id)}
                className={clsx(
                  "rounded-2xl px-4 py-4 text-left shadow-sm transition active:scale-95",
                  pomodoroPreset === id
                    ? "bg-lavender text-charcoal"
                    : "bg-milk text-charcoal-soft hover:bg-lavender/40",
                )}
              >
                <p className="font-bold">{POMODORO_PRESET_LABELS[id]}</p>
                <p className="mt-1 text-xs">4セットごとに長休けい(15分)</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold text-charcoal-soft">タグ(なくてもOK)</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className={clsx(
                "flex items-center gap-1 rounded-full pl-4 pr-1.5 py-2 text-sm font-bold shadow-sm transition",
                selectedTagIds.includes(tag.id)
                  ? "bg-mint text-charcoal"
                  : "bg-milk text-charcoal-soft",
              )}
            >
              <button
                type="button"
                onClick={() => toggleTag(tag.id)}
                className="active:scale-95"
              >
                {tag.name}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTagClick(tag.id)}
                disabled={deletingTagId === tag.id}
                aria-label={`${tag.name}を削除`}
                className={clsx(
                  "ml-1 rounded-full px-2 py-0.5 text-xs shadow-sm transition active:scale-95 disabled:opacity-50",
                  confirmDeleteTagId === tag.id
                    ? "bg-apricot text-charcoal"
                    : "bg-milk/70 text-charcoal-soft hover:bg-pink/40",
                )}
              >
                {confirmDeleteTagId === tag.id ? "もう一度でけす" : "×"}
              </button>
            </span>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateTag();
              }
            }}
            placeholder="あたらしいタグ"
            maxLength={20}
            className="flex-1 rounded-xl bg-milk px-4 py-2 text-sm text-charcoal shadow-sm outline-none ring-pink-deep focus:ring-2"
          />
          <button
            type="button"
            onClick={handleCreateTag}
            disabled={isCreatingTag || !newTagName.trim()}
            className="rounded-xl bg-apricot px-4 py-2 text-sm font-bold text-charcoal shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            ついか
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-charcoal">{error}</p>}

      <button
        type="button"
        onClick={handleStart}
        disabled={isStarting}
        className="rounded-full bg-pink-deep px-8 py-4 text-lg font-bold text-charcoal shadow-sm transition active:scale-95 disabled:opacity-50"
      >
        {isStarting ? "じゅんびちゅう..." : "はじめる"}
      </button>
    </div>
  );
}
