import { useEffect, useState } from "react";

// Re-renders every `ms` so "Starts in 10 min" labels stay fresh.
export default function useNow(ms = 60000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
