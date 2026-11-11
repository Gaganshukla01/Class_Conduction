import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Modal, StatusBadge, when } from "./questionKit";
import ReviewPanel from "./ReviewPanel";

// Everyone one question is assigned to, with a review screen per student.
export default function SubmissionsModal({ backend_url, question, onClose, onChanged }) {
  const [list, setList] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = () =>
    axios.get(`${backend_url}/api/questions/${question._id}/assignments`)
      .then((r) => setList(r.data.data))
      .catch(() => { setList([]); toast.error("Could not load submissions"); });
  useEffect(() => { load(); }, [question._id]); // eslint-disable-line

  const open = list?.find((a) => a._id === openId);

  const unassign = async (a) => {
    if (!window.confirm(`Remove this question from ${a.student?.name}? Their submissions will be deleted.`)) return;
    try {
      await axios.delete(`${backend_url}/api/questions/assignments/${a._id}`);
      toast.success("Removed");
      setOpenId(null);
      await load();
      onChanged();
    } catch (error) { toast.error(error.response?.data?.message || "Could not remove"); }
  };

  return (
    <Modal wide title={open ? `${open.student?.name} · ${question.title}` : `Submissions · ${question.title}`} onClose={onClose}>
      {list === null ? <p className="text-gray-300">Loading…</p> : !open ? (
        list.length === 0 ? <p className="text-gray-300">This question has not been assigned to anyone yet.</p> : (
          <ul className="space-y-2">
            {list.map((a) => (
              <li key={a._id}>
                <button onClick={() => setOpenId(a._id)} className="w-full flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left">
                  <span className="min-w-0 flex-1"><span className="block text-white font-medium truncate">{a.student?.name}</span><span className="block text-xs text-gray-400 truncate">{a.student?.email}</span></span>
                  <span className="text-xs text-gray-400">{a.submissions.length} attempt{a.submissions.length === 1 ? "" : "s"}</span>
                  {a.submissions.length > 0 && <span className="text-xs text-gray-400">last {when(a.submissions[a.submissions.length - 1].submittedAt)}</span>}
                  <StatusBadge status={a.status} />
                </button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button onClick={() => setOpenId(null)} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white"><ArrowLeft size={16} /> All students</button>
            <button onClick={() => unassign(open)} className="flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200"><Trash2 size={14} /> Unassign</button>
          </div>
          <ReviewPanel backend_url={backend_url} assignment={open} question={question} onSaved={async () => { await load(); onChanged(); }} />
        </div>
      )}
    </Modal>
  );
}
