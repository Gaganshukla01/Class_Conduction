import { useLayoutEffect } from "react";

// The site <Navbar/> is mounted above every page (main.jsx) and is sticky, so the
// dashboards must be (viewport height - navbar height) tall, not a full 100dvh.
// Publishes the navbar height as the CSS variable --nav-h and keeps it current
// (the navbar changes height on mobile / when its menu opens).
export default function useNavOffset() {
  useLayoutEffect(() => {
    const nav = document.querySelector("nav.sticky");
    const root = document.documentElement;
    if (!nav) { root.style.setProperty("--nav-h", "0px"); return undefined; }
    const set = () => root.style.setProperty("--nav-h", `${nav.offsetHeight}px`);
    set();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(set) : null;
    ro?.observe(nav);
    window.addEventListener("resize", set);
    return () => { ro?.disconnect(); window.removeEventListener("resize", set); root.style.removeProperty("--nav-h"); };
  }, []);
}
