import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { ArrowDown, Download, Eye, FileText, Loader2, Paperclip, Send, Trash2, Users, Wifi, WifiOff, X } from "lucide-react";
import useMediaQuery from "../../hooks/useMediaQuery";
import MembersList from "./MembersList";
import { Modal } from "../questions/questionKit";
import { AppContent } from "../../context/Context";
import useChat from "../../hooks/useChat";
import { formatBytes, uploadChatFile, validateChatFile } from "../../utils/uploadPdf";
import PdfViewerModal from "../PdfViewerModal";
import Portal from "../ui/Portal";
import ExtraClassCard, { CancelledCard } from "./ExtraClassCard";

const dayLabel = (d) => {
  const date = new Date(d); const today = new Date(); const y = new Date(); y.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === y.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" });
};
const time = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
const COLORS = ["from-rose-500 to-pink-600", "from-sky-500 to-blue-600", "from-emerald-500 to-teal-600", "from-amber-500 to-orange-600", "from-violet-500 to-fuchsia-600", "from-cyan-500 to-sky-600"];
const colorFor = (id = "") => COLORS[[...String(id)].reduce((n, c) => n + c.charCodeAt(0), 0) % COLORS.length];

// Group chat for every student, teacher and admin. Fills the height of its parent.
export default function ChatView() {
  const { userData, backend_url } = useContext(AppContent);
  const me = userData?.userId;
  const isAdmin = userData?.userType === "admin";
  const { messages, loading, hasMore, online, live, typing, error, members, reload, loadMembers, send, remove, loadOlder, sendTyping } = useChat(true);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [showMembers, setShowMembers] = useState(false);
  const onlineNow = members.counts?.online ?? online;

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [sending, setSending] = useState(false);
  const [pdf, setPdf] = useState(null);
  const [zoom, setZoom] = useState(null);
  const [newBelow, setNewBelow] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const listRef = useRef(null);
  const endRef = useRef(null);
  const nearBottom = useRef(true);
  const prevCount = useRef(0);
  const prevScrollHeight = useRef(0);
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const typingTimer = useRef(null);

  const onScroll = () => {
    const el = listRef.current; if (!el) return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom.current) setNewBelow(false);
  };

  // Keep the view where the user is:
  //  - older messages were prepended  -> keep the same message under the cursor
  //  - a new message arrived          -> stick to the bottom (unless they scrolled up)
  const prepended = useRef(false);
  useLayoutEffect(() => {
    const el = listRef.current; if (!el) return;
    if (prepended.current) {
      el.scrollTop = el.scrollHeight - prevScrollHeight.current;
      prepended.current = false;
    } else if (messages.length > prevCount.current) {
      const last = messages[messages.length - 1];
      if (nearBottom.current || last?.senderId === me || prevCount.current === 0) endRef.current?.scrollIntoView({ block: "end" });
      else setNewBelow(true);
    }
    prevCount.current = messages.length;
  }, [messages, me]);

  const olderClick = async () => {
    const el = listRef.current; setLoadingOlder(true);
    prevScrollHeight.current = el.scrollHeight; prepended.current = true;
    try { await loadOlder(); } catch { prepended.current = false; toast.error("Could not load older messages"); } finally { setLoadingOlder(false); }
  };

  const grow = () => { const t = taRef.current; if (!t) return; t.style.height = "auto"; t.style.height = `${Math.min(t.scrollHeight, 140)}px`; };
  useEffect(grow, [text]);

  const onType = (e) => {
    setText(e.target.value);
    sendTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(false), 1500);
  };

  const pick = (f) => {
    if (!f) return;
    const problem = validateChatFile(f);
    if (problem) return toast.error(problem);
    setFile(f);
  };

  const submit = async () => {
    const body = text.trim();
    if ((!body && !file) || sending) return;
    setSending(true);
    try {
      let uploaded;
      if (file) { setProgress(0); uploaded = await uploadChatFile({ file, onProgress: setProgress }); }
      await send({ text: body, file: uploaded });
      setText(""); setFile(null); sendTyping(false);
      requestAnimationFrame(() => { grow(); endRef.current?.scrollIntoView({ block: "end" }); });
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally { setSending(false); setProgress(null); }
  };

  const onKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } };

  const del = async (m) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    try { await remove(m._id); } catch (e) { toast.error(e.response?.data?.message || "Could not delete"); }
  };

  // day separators + "same sender in a row" grouping
  const rows = useMemo(() => {
    const out = []; let prev = null;
    messages.forEach((m) => {
      if (!prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString()) out.push({ kind: "day", key: `d-${m._id}`, label: dayLabel(m.createdAt) });
      const compact = prev && prev.senderId === m.senderId && m.senderRole !== "system" && new Date(prev.createdAt).toDateString() === new Date(m.createdAt).toDateString() && new Date(m.createdAt) - new Date(prev.createdAt) < 5 * 60000 && prev.type !== "extra_class";
      out.push({ kind: "msg", key: m._id, m, compact });
      prev = m;
    });
    return out;
  }, [messages]);

  const typingNames = Object.values(typing).filter(Boolean);

  return (
    <div className="h-full min-h-0 flex flex-col rounded-3xl overflow-hidden border border-white/15 bg-slate-900/50 backdrop-blur-lg shadow-2xl">
      {/* header */}
      <div className="shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3 bg-white/10 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shrink-0"><Users size={20} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-white truncate">Community Chat</h2>
          <p className="text-xs text-gray-300 truncate">
            {typingNames.length ? `${typingNames.slice(0, 2).join(", ")} ${typingNames.length > 1 ? "are" : "is"} typing…` : "All students, teachers and admins"}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-300 shrink-0">
          {onlineNow != null && <span className="hidden sm:flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> {onlineNow} online</span>}
          <button onClick={() => setShowMembers((v) => !v)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${showMembers ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-gray-200"}`} aria-label="Show members" title="Members">
            <Users size={15} /><span className="hidden sm:inline">Members</span>{members.list.length > 0 && <span className="text-[11px] opacity-80">{members.list.length}</span>}
          </button>
          <span title={live ? "Real-time connection" : "Checking for new messages every few seconds"} className={`flex items-center gap-1 ${live ? "text-emerald-300" : "text-amber-300"}`}>
            {live ? <Wifi size={14} /> : <WifiOff size={14} />}<span className="hidden sm:inline">{live ? "Live" : "Auto-refresh"}</span>
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
      {/* messages */}
      <div className="relative flex-1 min-h-0">
        <div ref={listRef} onScroll={onScroll} className="absolute inset-0 overflow-y-auto overscroll-contain scroll-smooth px-3 sm:px-5 py-4 space-y-1">
          {hasMore && (
            <div className="text-center pb-2">
              <button onClick={olderClick} disabled={loadingOlder} className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 disabled:opacity-60">
                {loadingOlder ? "Loading…" : "Load older messages"}
              </button>
            </div>
          )}
          {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" /></div>}
          {!loading && error && <p className="text-center text-rose-300 text-sm py-6">{error}</p>}
          {!loading && !error && messages.length === 0 && (
            <div className="text-center py-16 text-gray-300"><Users className="mx-auto mb-3 text-gray-500" size={40} /><p className="font-medium text-white">No messages yet</p><p className="text-sm">Say hello to your class 👋</p></div>
          )}

          {rows.map((row) => row.kind === "day" ? (
            <div key={row.key} className="flex justify-center py-2"><span className="text-[11px] px-3 py-1 rounded-full bg-white/10 text-gray-300">{row.label}</span></div>
          ) : (
            <Message key={row.key} m={row.m} compact={row.compact} mine={row.m.senderId === me} canDelete={isAdmin || row.m.senderId === me} onDelete={() => del(row.m)} onPdf={setPdf} onZoom={setZoom} />
          ))}
          <div ref={endRef} />
        </div>
        {newBelow && (
          <button onClick={() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); setNewBelow(false); }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-sm font-semibold shadow-lg">
            <ArrowDown size={15} /> New messages
          </button>
        )}
      </div>

      {/* composer */}
      <div className="shrink-0 border-t border-white/10 bg-white/5 p-2.5 sm:p-3">
        {file && (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2">
            {file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} alt="" className="w-10 h-10 rounded-lg object-cover" onLoad={(e) => URL.revokeObjectURL(e.target.src)} /> : <FileText className="text-rose-300 shrink-0" size={24} />}
            <div className="min-w-0 flex-1"><p className="text-sm text-white truncate">{file.name}</p><p className="text-xs text-gray-400">{formatBytes(file.size)}{progress !== null ? ` · uploading ${progress}%` : ""}</p></div>
            {!sending && <button onClick={() => setFile(null)} className="p-1.5 rounded-lg hover:bg-white/10" aria-label="Remove attachment"><X size={16} /></button>}
          </div>
        )}
        <div className="flex items-end gap-2">
          <input ref={fileRef} type="file" accept="application/pdf,.pdf,image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
          <button onClick={() => fileRef.current?.click()} disabled={sending} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 disabled:opacity-50 shrink-0" aria-label="Attach a PDF or image" title="Attach a PDF or image"><Paperclip size={20} /></button>
          <textarea
            ref={taRef} value={text} onChange={onType} onKeyDown={onKeyDown} rows={1} disabled={sending}
            onPaste={(e) => { const f = [...(e.clipboardData?.files || [])][0]; if (f) { e.preventDefault(); pick(f); } }}
            placeholder="Type a message…  (Enter to send, Shift+Enter for a new line)"
            className="flex-1 resize-none rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 ring-cyan-400 max-h-36 select-text"
          />
          <button onClick={submit} disabled={sending || (!text.trim() && !file)} className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 disabled:opacity-40 shrink-0" aria-label="Send">
            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>

      </div>
      {showMembers && isDesktop && (
        <aside className="w-72 shrink-0 border-l border-white/10 bg-slate-900/40 min-h-0">
          <MembersList members={members} me={me} isAdmin={isAdmin} backend_url={backend_url} onMigrated={() => { reload(); loadMembers(); }} />
        </aside>
      )}
      </div>
      {showMembers && !isDesktop && (
        <Modal title="Members" onClose={() => setShowMembers(false)}>
          <div className="h-[60dvh] -m-4 sm:-m-5"><MembersList members={members} me={me} isAdmin={isAdmin} backend_url={backend_url} onMigrated={() => { reload(); loadMembers(); setShowMembers(false); }} /></div>
        </Modal>
      )}

      <PdfViewerModal item={pdf} onClose={() => setPdf(null)} />
      {zoom && (
        <Portal>
          <div className="fixed inset-0 z-[110] bg-black/85 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoom(null)}>
            <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10" aria-label="Close"><X size={22} /></button>
            <img src={zoom.viewUrl || zoom.url} alt={zoom.originalName || "Shared image"} className="max-h-full max-w-full rounded-lg bg-white" />
          </div>
        </Portal>
      )}
    </div>
  );
}

export function Message({ m, compact, mine, canDelete, onDelete, onPdf, onZoom }) {
  // system cards (extra class etc.)
  if (m.type === "extra_class" && m.card?.kind === "extra_class") {
    return (
      <div className="flex justify-center py-2"><div className="w-full max-w-sm"><p className="text-center text-[11px] text-gray-400 mb-1.5">📌 {m.senderName} · {time(m.createdAt)}</p><ExtraClassCard card={m.card} /></div></div>
    );
  }
  if (m.type === "system") {
    return (
      <div className="flex justify-center py-2">
        {m.card?.kind === "extra_class_cancelled" ? <CancelledCard card={m.card} /> : <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-gray-200">{m.text}</span>}
      </div>
    );
  }

  const staff = m.senderRole === "admin";
  return (
    <div className={`group flex gap-2 ${mine ? "flex-row-reverse" : ""} ${compact ? "mt-0.5" : "mt-3"}`}>
      <div className="w-8 shrink-0">
        {!compact && !mine && <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorFor(m.senderId)} flex items-center justify-center text-sm font-bold`}>{(m.senderName || "?")[0].toUpperCase()}</div>}
      </div>
      <div className={`max-w-[82%] sm:max-w-[70%] min-w-0 flex flex-col ${mine ? "items-end" : "items-start"}`}>
        {!compact && !mine && (
          <div className="flex items-center gap-2 mb-0.5 px-1">
            <span className="text-xs font-semibold text-gray-200">{m.senderName}</span>
            {staff && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-semibold">Teacher</span>}
          </div>
        )}
        <div className="relative flex items-center gap-1.5">
          {mine && canDelete && <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-rose-300 hover:bg-white/10 transition" aria-label="Delete message"><Trash2 size={14} /></button>}
          <div className={`rounded-2xl px-3.5 py-2 text-sm shadow ${mine ? "bg-gradient-to-br from-emerald-600 to-cyan-700 text-white rounded-tr-md" : "bg-white/12 bg-white/10 text-gray-100 rounded-tl-md"}`}>
            {m.file?.kind === "image" && (
              <button onClick={() => onZoom(m.file)} className="block -mx-1 -mt-0.5 mb-1.5 overflow-hidden rounded-xl cursor-zoom-in">
                <img src={m.file.thumbUrl || m.file.url} alt={m.file.originalName || "Shared image"} loading="lazy" className="max-h-64 w-auto max-w-full object-cover bg-white/10" />
              </button>
            )}
            {m.file?.kind === "pdf" && (
              <div className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2.5 mb-1.5 min-w-[220px]">
                <FileText className="text-rose-300 shrink-0" size={30} />
                <div className="min-w-0 flex-1"><p className="font-medium truncate">{m.file.originalName || "document.pdf"}</p><p className="text-xs opacity-70">PDF · {formatBytes(m.file.bytes)}</p></div>
                <button onClick={() => onPdf({ title: m.file.originalName || "PDF", file: m.file })} className="p-2 rounded-lg bg-white/15 hover:bg-white/25" aria-label="View PDF"><Eye size={16} /></button>
                <a href={m.file.downloadUrl} className="p-2 rounded-lg bg-white/15 hover:bg-white/25" aria-label="Download PDF"><Download size={16} /></a>
              </div>
            )}
            {m.text && <p className="whitespace-pre-wrap break-words select-text">{m.text}</p>}
            <p className={`text-[10px] mt-1 text-right ${mine ? "text-white/70" : "text-gray-400"}`}>{time(m.createdAt)}</p>
          </div>
          {!mine && canDelete && <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-rose-300 hover:bg-white/10 transition" aria-label="Delete message"><Trash2 size={14} /></button>}
        </div>
      </div>
    </div>
  );
}
