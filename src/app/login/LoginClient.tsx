'use client';

import { useCallback, useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { loginAction } from "@/lib/auth-actions";
import { RIBBON_COLOR_HEX } from "@/lib/theme";
import { RabbitAvatar } from "./RabbitAvatar";
import { PinPad } from "./PinPad";

export type LoginUser = {
  id: string;
  displayName: string;
  rabbit: {
    name: string;
    ribbonColor: keyof typeof RIBBON_COLOR_HEX;
  } | null;
};

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 6;

function ribbonHexOf(user: LoginUser): string {
  return RIBBON_COLOR_HEX[user.rabbit?.ribbonColor ?? "CREAM"];
}

export function LoginClient({ users }: { users: LoginUser[] }) {
  const [selectedUser, setSelectedUser] = useState<LoginUser | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = useCallback(
    (pinValue: string) => {
      if (!selectedUser || isPending) return;
      if (pinValue.length < MIN_PIN_LENGTH) return;

      setError(null);
      startTransition(async () => {
        const result = await loginAction(selectedUser.id, pinValue);
        if (result?.error) {
          setError(result.error);
          setPin("");
        }
      });
    },
    [selectedUser, isPending],
  );

  const handlePinChange = useCallback(
    (next: string) => {
      if (next.length > MAX_PIN_LENGTH) return;
      setError(null);
      setPin(next);
      if (next.length === MAX_PIN_LENGTH) {
        submit(next);
      }
    },
    [submit],
  );

  function handleSelect(user: LoginUser) {
    setSelectedUser(user);
    setPin("");
    setError(null);
  }

  function handleBack() {
    setSelectedUser(null);
    setPin("");
    setError(null);
  }

  // PC版でも物理キーボードから直接入力できるように(REQUIREMENTS.md 4章: PC版を作り込む方針)。
  useEffect(() => {
    if (!selectedUser) return;

    function onKeyDown(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handlePinChange(pin.length < MAX_PIN_LENGTH ? pin + e.key : pin);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handlePinChange(pin.slice(0, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        submit(pin);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedUser, pin, handlePinChange, submit]);

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <p className="text-sm font-bold tracking-wide text-charcoal-soft">べんきょうさぎ</p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedUser ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <h1 className="mb-1 text-center text-2xl font-bold text-charcoal">どっちのうさぎ？</h1>
            <p className="mb-8 text-center text-sm text-charcoal-soft">じぶんの うさぎを タップしてね</p>

            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelect(user)}
                  style={{ backgroundColor: `${ribbonHexOf(user)}33` }}
                  className="flex flex-col items-center gap-3 rounded-3xl p-6 shadow-sm ring-1 ring-charcoal/10 transition-transform hover:-translate-y-0.5 hover:shadow-md active:scale-95"
                >
                  <RabbitAvatar ribbonColorHex={ribbonHexOf(user)} size={88} />
                  <span className="text-lg font-bold text-charcoal">{user.rabbit?.name ?? "おもち"}</span>
                  <span className="text-xs text-charcoal-soft">{user.displayName}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <button
              type="button"
              onClick={handleBack}
              disabled={isPending}
              className="self-start text-sm text-charcoal-soft transition-colors hover:text-charcoal disabled:opacity-40"
            >
              ← もどる
            </button>

            <div className="flex flex-col items-center gap-2">
              <RabbitAvatar ribbonColorHex={ribbonHexOf(selectedUser)} size={64} />
              <p className="text-xs text-charcoal-soft">
                {selectedUser.rabbit?.name ?? "おもち"}（{selectedUser.displayName}）
              </p>
              <h2 className="text-xl font-bold text-charcoal">PINを いれてね</h2>
            </div>

            <div className="flex gap-3">
              {Array.from({ length: Math.max(pin.length, MIN_PIN_LENGTH) }).map((_, i) => (
                <span
                  key={i}
                  className={clsx(
                    "h-4 w-4 rounded-full border-2 border-pink-deep transition-colors",
                    i < pin.length ? "bg-pink-deep" : "bg-transparent",
                  )}
                />
              ))}
            </div>

            <div
              role="alert"
              className={clsx(
                "min-h-11 w-full max-w-xs rounded-2xl px-4 py-2 text-center text-sm text-charcoal transition-opacity",
                error ? "bg-pink/70 shadow-sm opacity-100" : "opacity-0",
              )}
            >
              {error}
            </div>

            <PinPad value={pin} maxLength={MAX_PIN_LENGTH} disabled={isPending} onChange={handlePinChange} />

            <button
              type="button"
              onClick={() => submit(pin)}
              disabled={pin.length < MIN_PIN_LENGTH || isPending}
              className="w-full max-w-xs rounded-2xl bg-apricot py-3 text-base font-bold text-charcoal shadow-sm transition-transform active:scale-95 disabled:opacity-40"
            >
              {isPending ? "まっててね…" : "ログインする"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
