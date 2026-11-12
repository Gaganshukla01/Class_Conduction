import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowDown, ArrowLeft, Download, Eye, FileText, Loader2, Lock, Paperclip, Send, Trash2, Users, Wifi, WifiOff, X } from "lucide-react";
import { AppContent } from "../../context/Context";
import useChat from "../../hooks/useChat";
import useChatMembers from "../../hooks/useChatMembers";
import useMediaQuery from "../../hooks/useMediaQuery";
import { formatBytes, uploadChatFile, validateChatFile } from "../../utils/uploadPdf";
import PdfViewerModal from "../PdfViewerModal";
import Portal from "../ui/Portal";
import Avatar from "../ui/Avatar";
import MembersList from "./MembersList";
import { Modal } from "../questions/questionKit";
import ExtraClassCard, { CancelledCard } from "./ExtraClassCard";

const dayLabel = (d) => {
  const date = new Date(d); const today = new Date(); const y = new Date(); y.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === y.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" });
};
const time = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });

// One conversation: the Community channel or a private 1-to-1 chat. Fills its parent's height.
//   room: "community" | "dm:<student>:<teacher>"     peer: the other person (private chats)
export default function ChatView({ room = "community", peer, settings, socket, live, onBack, onRead, onSent, onSettingsChange, onOpenList }) {
  const { userData, backend_url } = useContext(AppContent);
  const me = userData?.userId;
  const isAdmin = userData?.userType === "admin";
  const isCommunity = room === "community";
  const { messages, loading, hasMore, typing, error, send, remove, loadOlder, sendTyping } = useChat(room, { socket, live, onRead });
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [showMembers, setShowMembers] = useState(false);
  const { members, loadMembers } = useChatMembers(isCommunity && showMembers);

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
  const prepended = useRef(false);
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const typingTimer = useRef(null);

  const canPost = !isCommunity || isAdmin || Boolean(settings?.studentsCanPost);

  // a new conversation starts at the bottom with an empty composer
  useEffect(() => { prevCount.current = 0; nearBottom.current = true; setText(""); setFile(null); setNewBelow(false); }, [room]);

  const onScroll = () => {
    const el = listRef.current; if (!el) return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom.current) setNewBelow(false);
  };

  // Keep the view where the user is: after "load older" keep the same message under the cursor;
  // for a new message stick to the bottom (unless the user scrolled up).
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
    if ((!body && !file) || sending || !canPost) return;
    setSending(true);
    try {
      let uploaded;
      if (file) { setProgress(0); uploaded = await uploadChatFile({ file, onProgress: setProgress }); }
      await send({ text: body, file: uploaded });
      setText(""); setFile(null); sendTyping(false);
      onSent?.();
      requestAnimationFrame(() => { grow(); endRef.current?.scrollIntoView({ block: "end" }); });
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally { setSending(false); setProgress(null); }
  };

  const onKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } };

  const del = async (m) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    try { await remove(m._id); onSent?.(); } catch (e) { toast.error(e.response?.data?.message || "Could not delete"); }
  };

  const toggleStudentsPost = async () => {
    try {
      const { data } = await axios.put(`${backend_url}/api/chat/settings`, { studentsCanPost: !settings?.studentsCanPost });
      onSettingsChange?.(data.data);
      toast.success(data.data.studentsCanPost ? "Students can now post in Community" : "Community is now read-only for students");
    } catch (e) { toast.error(e.response?.data?.message || "Could not change the setting"); }
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
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-slate-900/40">
      {/* header */}
      <div className="shrink-0 flex items-center gap-3 px-3 sm:px-5 py-2.5 bg-white/10 border-b border-white/10">
        {onBack && <button onClick={onBack} className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-white/10" aria-label="Back to chats"><ArrowLeft size={20} /></button>}
        {isCommunity
          ? <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shrink-0"><Users size={20} /></div>
          : <Avatar name={peer?.name} src={peer?.avatar} size={40} online={peer?.online} id={peer?._id} />}
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-white truncate">{isCommunity ? "Community" : peer?.name || "Chat"}</h2>
          <p className="text-xs text-gray-300 truncate">
            {typingNames.length ? `${typingNames.slice(0, 2).join(", ")} ${typingNames.length > 1 ? "are" : "is"} typing…`
              : isCommunity ? (settings?.studentsCanPost ? "Announcements & discussion" : "Announcements from your teachers")
              : peer?.role === "admin" ? `Teacher · ${peer?.online ? "online" : "offline"}` : `Student · ${peer?.online ? "online" : "offline"}`}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-300 shrink-0">
          {isCommunity && isAdmin && (
            <button onClick={toggleStudentsPost} className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${settings?.studentsCanPost ? "bg-emerald-500/25 text-emerald-200" : "bg-white/10 hover:bg-white/20"}`} title="Allow students to post in Community">
              <span className={`w-7 h-4 rounded-full relative transition ${settings?.studentsCanPost ? "bg-emerald-400" : "bg-gray-500"}`}><span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings?.studentsCanPost ? "left-3.5" : "left-0.5"}`} /></span>
              Students can post
            </button>
          )}
          {isCommunity && (
            <button onClick={() => setShowMembers((v) => !v)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${showMembers ? "bg-white/20 text-white" : "bg-white/10 hover:bg-white/20 text-gray-200"}`} aria-label="Show members" title="Members">
              <Users size={15} /><span className="hidden sm:inline">Members</span>
            </button>
          )}
          <span title={live ? "Real-time connection" : "Checking for new messages every few seconds"} className={`flex items-center gap-1 ${live ? "text-emerald-300" : "text-amber-300"}`}>
            {live ? <Wifi size={14} /> : <WifiOff size={14} />}<span className="hidden md:inline">{live ? "Live" : "Auto-refresh"}</span>
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex">
        <div className="flex-1 min-w-0 min-h-0 flex flex-col">
          {/* messages */}
          <div className="relative flex-1 min-h-0">
            <div ref={listRef} onScroll={onScroll} className="absolute inset-0 overflow-y-auto overscroll-contain scroll-smooth px-2.5 sm:px-5 py-4 space-y-1">
              {hasMore && (
                <div className="text-center pb-2">
                  <button onClick={olderClick} disabled={loadingOlder} className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-200 disabled:opacity-60">{loadingOlder ? "Loading…" : "Load older messages"}</button>
                </div>
              )}
              {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-300" /></div>}
              {!loading && error && <p className="text-center text-rose-300 text-sm py-6">{error}</p>}
              {!loading && !error && messages.length === 0 && (
                <div className="text-center py-16 text-gray-300">
                  {isCommunity ? <Users className="mx-auto mb-3 text-gray-500" size={40} /> : <Avatar name={peer?.name} src={peer?.avatar} size={64} className="mb-3" id={peer?._id} />}
                  <p className="font-medium text-white">{isCommunity ? "No announcements yet" : `Start a conversation with ${peer?.name || "them"}`}</p>
                  {!isCommunity && <p className="text-sm">Only you and {peer?.role === "admin" ? "this teacher" : "this student"} can see this chat.</p>}
                </div>
              )}
              {rows.map((row) => row.kind === "day" ? (
                <div key={row.key} className="flex justify-center py-2"><span className="text-[11px] px-3 py-1 rounded-full bg-white/10 text-gray-300">{row.label}</span></div>
              ) : (
                <Message key={row.key} m={row.m} compact={row.compact} mine={row.m.senderId === me} canDelete={isAdmin || row.m.senderId === me} onDelete={() => del(row.m)} onPdf={setPdf} onZoom={setZoom} showName={isCommunity} />
              ))}
              <div ref={endRef} />
            </div>
            {newBelow && (
              <button onClick={() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); setNewBelow(false); }} className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-sm font-semibold shadow-lg"><ArrowDown size={15} /> New messages</button>
            )}
          </div>

          {/* composer */}
          {canPost ? (
            <div className="shrink-0 border-t border-white/10 bg-white/5 p-2 sm:p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
                <textarea ref={taRef} value={text} onChange={onType} onKeyDown={onKeyDown} rows={1} disabled={sending}
                  onPaste={(e) => { const f = [...(e.clipboardData?.files || [])][0]; if (f) { e.preventDefault(); pick(f); } }}
                  placeholder="Type a message…" className="flex-1 min-w-0 resize-none rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-sm text-white placeholder-gray-400 outline-none focus:ring-2 ring-cyan-400 max-h-36 select-text" />
                <button onClick={submit} disabled={sending || (!text.trim() && !file)} className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 disabled:opacity-40 shrink-0" aria-label="Send">
                  {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>
          ) : (
            <div className="shrink-0 border-t border-white/10 bg-white/5 px-4 py-3 flex flex-wrap items-center gap-3 text-sm text-gray-200 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Lock size={16} className="text-amber-300 shrink-0" />
              <span className="flex-1 min-w-[180px]">Only teachers can post in Community. To ask a question, message your teacher privately.</span>
              {onOpenList && <button onClick={onOpenList} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold">Message a teacher</button>}
            </div>
          )}
        </div>
        {showMembers && isDesktop && isCommunity && (
          <aside className="w-72 shrink-0 border-l border-white/10 bg-slate-900/40 min-h-0">
            <MembersList members={members} me={me} isAdmin={isAdmin} backend_url={backend_url} onMigrated={() => loadMembers()} />
          </aside>
        )}
      </div>
      {showMembers && !isDesktop && isCommunity && (
        <Modal title="Members" onClose={() => setShowMembers(false)}>
          <div className="h-[60dvh] -m-4 sm:-m-5"><MembersList members={members} me={me} isAdmin={isAdmin} backend_url={backend_url} onMigrated={() => { loadMembers(); setShowMembers(false); }} /></div>
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

export function Message({ m, compact, mine, canDelete, onDelete, onPdf, onZoom, showName = true }) {
  // system cards (extra class etc.)
  if (m.type === "extra_class" && m.card?.kind === "extra_class") {
    return (
      <div className="group flex justify-center py-2"><div className="w-full max-w-sm"><p className="text-center text-[11px] text-gray-400 mb-1.5">📌 {m.senderName} · {time(m.createdAt)}</p><ExtraClassCard card={m.card} />
        {canDelete && <div className="flex justify-center mt-1.5"><button onClick={onDelete} className="flex items-center gap-1 text-xs text-gray-400 hover:text-rose-300 px-2 py-1 rounded-lg hover:bg-white/10" aria-label="Delete message"><Trash2 size={13} /> Delete</button></div>}
      </div></div>
    );
  }
  if (m.type === "system") {
    return (
      <div className="group flex flex-col items-center py-2">
        {m.card?.kind === "extra_class_cancelled" ? <CancelledCard card={m.card} /> : <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-gray-200">{m.text}</span>}
        {canDelete && <button onClick={onDelete} className="mt-1 flex items-center gap-1 text-[11px] text-gray-400 hover:text-rose-300 px-2 py-0.5 rounded-lg hover:bg-white/10" aria-label="Delete message"><Trash2 size={12} /> Delete</button>}
      </div>
    );
  }

  const staff = m.senderRole === "admin";
  return (
    <div className={`group flex gap-2 ${mine ? "flex-row-reverse" : ""} ${compact ? "mt-0.5" : "mt-3"}`}>
      <div className="w-8 shrink-0">
        {!compact && !mine && <Avatar name={m.senderName} src={m.senderAvatar} size={32} id={m.senderId} />}
      </div>
      <div className={`max-w-[84%] sm:max-w-[70%] min-w-0 flex flex-col ${mine ? "items-end" : "items-start"}`}>
        {!compact && !mine && showName && (
          <div className="flex items-center gap-2 mb-0.5 px-1">
            <span className="text-xs font-semibold text-gray-200">{m.senderName}</span>
            {staff && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-semibold">Teacher</span>}
          </div>
        )}
        <div className="relative flex items-center gap-1.5">
          {mine && canDelete && <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-70 p-1.5 rounded-lg text-gray-400 hover:text-rose-300 hover:bg-white/10 transition" aria-label="Delete message"><Trash2 size={14} /></button>}
          <div className={`rounded-2xl px-3.5 py-2 text-sm shadow ${mine ? "bg-gradient-to-br from-emerald-600 to-cyan-700 text-white rounded-tr-md" : "bg-white/10 text-gray-100 rounded-tl-md"}`}>
            {m.file?.kind === "image" && (
              <button onClick={() => onZoom(m.file)} className="block -mx-1 -mt-0.5 mb-1.5 overflow-hidden rounded-xl cursor-zoom-in">
                <img src={m.file.thumbUrl || m.file.url} alt={m.file.originalName || "Shared image"} loading="lazy" className="max-h-64 w-auto max-w-full object-cover bg-white/10" />
              </button>
            )}
            {m.file?.kind === "pdf" && (
              <div className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2.5 mb-1.5 min-w-[200px]">
                <FileText className="text-rose-300 shrink-0" size={30} />
                <div className="min-w-0 flex-1"><p className="font-medium truncate">{m.file.originalName || "document.pdf"}</p><p className="text-xs opacity-70">PDF · {formatBytes(m.file.bytes)}</p></div>
                <button onClick={() => onPdf({ title: m.file.originalName || "PDF", file: m.file })} className="p-2 rounded-lg bg-white/15 hover:bg-white/25" aria-label="View PDF"><Eye size={16} /></button>
                <a href={m.file.downloadUrl} className="p-2 rounded-lg bg-white/15 hover:bg-white/25" aria-label="Download PDF"><Download size={16} /></a>
              </div>
            )}
            {m.text && <p className="whitespace-pre-wrap break-words select-text">{m.text}</p>}
            <p className={`text-[10px] mt-1 text-right ${mine ? "text-white/70" : "text-gray-400"}`}>{time(m.createdAt)}</p>
          </div>
          {!mine && canDelete && <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-70 p-1.5 rounded-lg text-gray-400 hover:text-rose-300 hover:bg-white/10 transition" aria-label="Delete message"><Trash2 size={14} /></button>}
        </div>
      </div>
    </div>
  );
}
