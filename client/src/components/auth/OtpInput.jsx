import { useEffect, useRef } from "react";

// Six boxes for a one-time code. Works with the keyboard, with paste ("123456") and with the
// "one-time code" autofill on phones. The boxes shrink to fit narrow screens (the old fixed
// 48px boxes overflowed on small phones).
export default function OtpInput({ value = "", onChange, onComplete, disabled = false, autoFocus = true, length = 6 }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => { if (autoFocus) refs.current[0]?.focus(); }, [autoFocus]);

  const commit = (next) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };
  const setAt = (i, ch) => {
    const arr = digits.slice();
    arr[i] = ch;
    commit(arr.join(""));
  };

  const onInput = (e, i) => {
    const typed = e.target.value.replace(/\D/g, "");
    if (!typed) return setAt(i, "");
    if (typed.length > 1) { // autofill / fast typing gave several digits at once
      const arr = value.split("");
      typed.split("").forEach((c, k) => { if (i + k < length) arr[i + k] = c; });
      commit(arr.join("").slice(0, length));
      refs.current[Math.min(i + typed.length, length - 1)]?.focus();
      return;
    }
    setAt(i, typed);
    if (i < length - 1) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (e, i) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) { e.preventDefault(); setAt(i - 1, ""); refs.current[i - 1]?.focus(); }
    else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (e) => {
    const text = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    commit(text);
    refs.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${length}, minmax(0, 1fr))` }} onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          disabled={disabled}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => onInput(e, i)}
          onKeyDown={(e) => onKeyDown(e, i)}
          onFocus={(e) => e.target.select()}
          className={`w-full aspect-square max-h-16 min-w-0 rounded-xl text-center text-xl sm:text-2xl font-semibold text-white bg-white/10 border outline-none transition focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 disabled:opacity-50 ${d ? "border-indigo-400/60" : "border-white/15"}`}
        />
      ))}
    </div>
  );
}
