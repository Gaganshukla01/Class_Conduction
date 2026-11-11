import { useEffect, useState } from "react";

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [query]);
  return matches;
}
