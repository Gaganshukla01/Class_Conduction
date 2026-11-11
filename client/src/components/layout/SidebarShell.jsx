import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import useScrollLock from "../../hooks/useScrollLock";
import useNavOffset from "../../hooks/useNavOffset";
import Portal from "../ui/Portal";

// App shell with a collapsible left sidebar - used by BOTH the student portal and the admin panel.
//  * Desktop (lg+): a slim icon rail. Hovering (or keyboard focus) expands it smoothly
//    over the content - the content never reflows, so it stays lag-free.
//  * Phone / tablet: a slim bar with a menu button opens a slide-over drawer.
//  * The shell is (viewport - site navbar) tall and only <main> scrolls, so the sidebar
//    and the page scroll independently and nothing is hidden under the navbar.
//
// items: [{ id, label, icon, badge? }]
export default function SidebarShell({
  items, active, onSelect, brand = "ClassWave", footer, children,
  gradient = "from-violet-900 via-purple-800 to-indigo-900",
}) {
  const [drawer, setDrawer] = useState(false);
  useScrollLock(drawer);
  useNavOffset();

  // close the drawer when the screen becomes desktop-sized
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e) => e.matches && setDrawer(false);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const select = (id) => { onSelect(id); setDrawer(false); };
  const current = items.find((i) => i.id === active);
  const totalBadge = items.reduce((n, i) => n + (i.badge > 0 && i.id !== active ? i.badge : 0), 0);

  return (
    <div
      className={`relative w-full flex flex-col lg:flex-row overflow-hidden bg-gradient-to-br ${gradient} text-white`}
      style={{ height: "calc(100dvh - var(--nav-h, 0px))" }}
    >
      {/* ---------- phone / tablet bar ---------- */}
      <div className="lg:hidden shrink-0 h-12 px-3 flex items-center gap-3 bg-slate-900/60 backdrop-blur-xl border-b border-white/10">
        <button onClick={() => setDrawer(true)} className="relative p-2 -ml-1 rounded-lg bg-white/10 active:bg-white/20" aria-label="Open menu">
          <Menu size={20} />
          {totalBadge > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500" />}
        </button>
        <span className="font-semibold truncate">{current?.label || brand}</span>
        <span className="ml-auto text-xs text-gray-300">{brand}</span>
      </div>

      {/* ---------- desktop rail (reserves 76px; the aside grows over the content) ---------- */}
      <div className="hidden lg:block relative w-[76px] shrink-0">
        <aside
          aria-label="Main navigation"
          className="group absolute inset-y-0 left-0 z-40 w-[76px] hover:w-64 focus-within:w-64 overflow-hidden flex flex-col
                     bg-slate-900/60 backdrop-blur-xl border-r border-white/10 shadow-xl
                     transition-[width] duration-300 ease-out will-change-[width]"
        >
          <div className="h-16 shrink-0 flex items-center gap-3 px-[22px] border-b border-white/10">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-slate-900">{brand[0]}</div>
            <span className="font-bold text-lg whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200">{brand}</span>
          </div>
          <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth py-3 px-3 space-y-1 [scrollbar-width:none] group-hover:[scrollbar-width:thin]">
            {items.map((item) => <NavButton key={item.id} item={item} active={active === item.id} onClick={() => select(item.id)} rail />)}
          </nav>
          {footer && <div className="shrink-0 border-t border-white/10 p-3">{footer({ rail: true })}</div>}
        </aside>
      </div>

      {/* ---------- the only scrolling area ---------- */}
      <main className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain scroll-smooth">{children}</main>

      {/* ---------- drawer (phone / tablet) ---------- */}
      <Portal>
        <div className={`lg:hidden fixed inset-0 z-[90] bg-black/60 transition-opacity duration-300 ${drawer ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={() => setDrawer(false)} />
        <aside
          className={`lg:hidden fixed inset-y-0 left-0 z-[95] w-72 max-w-[85vw] flex flex-col bg-slate-900/95 backdrop-blur-xl border-r border-white/10 transition-transform duration-300 ease-out text-white ${drawer ? "translate-x-0" : "-translate-x-full"}`}
          aria-hidden={!drawer}
        >
          <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-white/10">
            <span className="font-bold text-lg">{brand}</span>
            <button onClick={() => setDrawer(false)} className="p-2 rounded-lg hover:bg-white/10" aria-label="Close menu"><X size={20} /></button>
          </div>
          <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-1">
            {items.map((item) => <NavButton key={item.id} item={item} active={active === item.id} onClick={() => select(item.id)} />)}
          </nav>
          {footer && <div className="shrink-0 border-t border-white/10 p-3">{footer({ rail: false })}</div>}
        </aside>
      </Portal>
    </div>
  );
}

function NavButton({ item, active, onClick, rail = false }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={item.label}
      aria-current={active ? "page" : undefined}
      className={`relative w-full flex items-center gap-3 rounded-xl px-[13px] py-2.5 text-left transition-colors duration-200 outline-none focus-visible:ring-2 ring-cyan-300 ${
        active ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-lg" : "text-gray-300 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="relative shrink-0 w-[26px] flex justify-center">
        <Icon size={21} />
        {item.badge > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold leading-4 text-center text-white">{item.badge > 99 ? "99+" : item.badge}</span>}
      </span>
      <span className={`whitespace-nowrap text-sm font-medium ${rail ? "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 delay-75" : ""}`}>{item.label}</span>
    </button>
  );
}
