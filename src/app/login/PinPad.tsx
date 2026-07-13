'use client';

import clsx from "clsx";

type PinPadProps = {
  value: string;
  maxLength: number;
  disabled?: boolean;
  onChange: (next: string) => void;
};

const DIGIT_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

export function PinPad({ value, maxLength, disabled, onChange }: PinPadProps) {
  const atMax = value.length >= maxLength;

  function pressDigit(digit: string) {
    if (disabled || atMax) return;
    onChange(value + digit);
  }

  function pressBackspace() {
    if (disabled || value.length === 0) return;
    onChange(value.slice(0, -1));
  }

  const digitButtonClass =
    "h-16 rounded-2xl bg-charcoal/5 text-2xl font-bold text-charcoal shadow-sm ring-1 ring-charcoal/10 transition-transform active:scale-90 disabled:opacity-40";

  return (
    <div className="grid w-full max-w-xs grid-cols-3 gap-3">
      {DIGIT_ROWS.flat().map((digit) => (
        <button
          key={digit}
          type="button"
          onClick={() => pressDigit(digit)}
          disabled={disabled || atMax}
          className={digitButtonClass}
        >
          {digit}
        </button>
      ))}

      <div aria-hidden="true" />

      <button
        type="button"
        onClick={() => pressDigit("0")}
        disabled={disabled || atMax}
        className={digitButtonClass}
      >
        0
      </button>

      <button
        type="button"
        onClick={pressBackspace}
        disabled={disabled || value.length === 0}
        aria-label="1もじ けす"
        className={clsx(digitButtonClass, "text-lg")}
      >
        ← けす
      </button>
    </div>
  );
}
