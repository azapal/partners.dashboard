import type { ChangeEvent, ClipboardEvent, KeyboardEvent, MutableRefObject } from "react";

/**
 * The five code boxes on the two employee OTP screens. Presentation only — the
 * screens own the digits, focus handling and paste parsing, exactly as before.
 */
export const OtpCodeField = ({
  digits,
  inputRefs,
  onInput,
  onKeyDown,
  onPaste,
  hasError,
  disabled,
}: {
  digits: string[];
  inputRefs: MutableRefObject<HTMLInputElement[]>;
  onInput: (e: ChangeEvent<HTMLInputElement>, index: number) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>, index: number) => void;
  onPaste: (e: ClipboardEvent<HTMLInputElement>) => void;
  hasError?: boolean;
  disabled?: boolean;
}) => (
  <div className="flex justify-between gap-2 sm:gap-3" role="group" aria-label="One-time code">
    {digits.map((digit, index) => (
      <input
        key={index}
        ref={(el) => { if (el) inputRefs.current[index] = el; }}
        type="text"
        inputMode="numeric"
        autoComplete={index === 0 ? "one-time-code" : "off"}
        pattern="[0-9]*"
        maxLength={1}
        aria-label={`Digit ${index + 1}`}
        value={digit}
        disabled={disabled}
        onChange={(e) => onInput(e, index)}
        onKeyDown={(e) => onKeyDown(e, index)}
        onPaste={onPaste}
        onFocus={(e) => e.target.select()}
        className={`h-14 w-full min-w-0 max-w-16 rounded-2xl border bg-white text-center text-2xl font-semibold text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-orange-100 disabled:opacity-60 ${
          hasError ? "border-red-300" : digit ? "border-slate-300 bg-orange-50/30" : "border-slate-200"
        }`}
      />
    ))}
  </div>
);
