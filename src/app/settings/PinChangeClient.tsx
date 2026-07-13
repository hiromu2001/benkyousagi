'use client';

import { useCallback, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import Link from "next/link";
import { changePinAction } from "@/lib/auth-actions";
import { PinPad } from "@/app/login/PinPad";

// login/LoginClient.tsx の PIN_LENGTH と揃えて固定6桁にしている。
const PIN_LENGTH = 6;

type Step = "current" | "new" | "confirm" | "done";

const STEP_TITLES: Record<Step, string> = {
  current: "いまのPINを いれてね",
  new: "あたらしいPINを いれてね",
  confirm: "もう一度、おなじPINを いれてね",
  done: "",
};

export function PinChangeClient() {
  const [step, setStep] = useState<Step>("current");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetAll() {
    setStep("current");
    setCurrentPin("");
    setNewPin("");
    setPin("");
  }

  const submit = useCallback(
    (current: string, next: string, confirm: string) => {
      setError(null);
      startTransition(async () => {
        const result = await changePinAction(current, next, confirm);
        if (result?.error) {
          setError(result.error);
          resetAll();
          return;
        }
        setStep("done");
      });
    },
    [],
  );

  const handlePinChange = useCallback(
    (next: string) => {
      if (next.length > PIN_LENGTH || isPending) return;
      setError(null);
      setPin(next);
      if (next.length !== PIN_LENGTH) return;

      if (step === "current") {
        setCurrentPin(next);
        setPin("");
        setStep("new");
      } else if (step === "new") {
        setNewPin(next);
        setPin("");
        setStep("confirm");
      } else if (step === "confirm") {
        submit(currentPin, newPin, next);
      }
    },
    [step, currentPin, newPin, isPending, submit],
  );

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <h1 className="text-xl font-bold text-charcoal">PINを へんこうしました！</h1>
        <Link
          href="/"
          className="rounded-full bg-apricot px-8 py-3 text-lg font-bold text-charcoal shadow-md transition-transform active:scale-95 sm:hover:scale-[1.02]"
        >
          ホームへもどる
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-charcoal-soft transition-colors hover:text-charcoal"
      >
        ← もどる
      </Link>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <h1 className="text-xl font-bold text-charcoal">{STEP_TITLES[step]}</h1>

          <div className="flex gap-3">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
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

          <PinPad value={pin} maxLength={PIN_LENGTH} disabled={isPending} onChange={handlePinChange} />

          <p
            className={clsx(
              "h-5 text-sm text-charcoal-soft transition-opacity",
              isPending ? "opacity-100" : "opacity-0",
            )}
          >
            まっててね…
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
