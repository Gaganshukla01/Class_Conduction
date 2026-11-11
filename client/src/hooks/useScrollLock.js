import { useEffect } from "react";

// Ref-counted body scroll lock. Several modals can be open at once and the page
// is unlocked only when the LAST one closes. Only locks while `active` is true -
// the old code locked the page even when the modal was not visible, which is
// what froze scrolling in Class Notes / Resource Library.
let locks = 0;

export default function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    locks += 1;
    document.body.style.overflow = "hidden";
    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) document.body.style.overflow = "";
    };
  }, [active]);
}
