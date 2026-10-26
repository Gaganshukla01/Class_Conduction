import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import ImageUploadField from "../ImageUploadField";
import { uploadImage } from "../../utils/uploadPdf";
import { LANGUAGES, Modal } from "./questionKit";

const field = "w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400";
const mono = `${field} font-mono text-sm`;
const label = "block text-sm text-gray-300 mb-1.5";

const STARTERS = {
  python: "# Write your solution here\n",
  javascript: "// Write your solution here\n",
  java: "public class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
  html: "<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    /* your CSS */\n  </style>\n</head>\n<body>\n  <!-- your HTML -->\n</body>\n</html>\n",
};

// mode: "create" | "edit" | "duplicate".  `question` pre-fills the form.
export default function QuestionForm({ backend_url, mode = "create", question, onClose, onSaved }) {
  const [f, setF] = useState({
    title: question ? (mode === "duplicate" ? `${question.title} (copy)` : question.title) : "",
    description: question?.description || "",
    language: question?.language || "python",
    difficulty: question?.difficulty || "easy",
    starterCode: question?.starterCode ?? "",
    sampleInput: question?.sampleInput || "",
    expectedOutputText: question?.expectedOutputText || "",
    tags: (question?.tags || []).join(", "),
  });
  const [image, setImage] = useState(null);
  const [existing, setExisting] = useState(mode === "edit" ? question?.expectedImage : null);
  const [removeImage, setRemoveImage] = useState(false);
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const changeLanguage = (e) => {
    const language = e.target.value;
    // offer a starter template, but never overwrite code the admin typed
    const untouched = !f.starterCode.trim() || Object.values(STARTERS).includes(f.starterCode);
    setF((p) => ({ ...p, language, starterCode: untouched ? STARTERS[language] : p.starterCode }));
  };

  const save = async (another) => {
    if (!f.title.trim()) return toast.error("Enter a title");
    if (!f.description.trim()) return toast.error("Describe the question for the student");
    setBusy(true);
    try {
      const body = { ...f };
      if (image) {
        setProgress(0);
        body.expectedImage = await uploadImage({ file: image, purpose: "question-image", onProgress: setProgress });
      } else if (removeImage) body.removeImage = true;

      const { data } = mode === "edit"
        ? await axios.put(`${backend_url}/api/questions/${question._id}`, body)
        : await axios.post(`${backend_url}/api/questions`, body);
      toast.success(data.message);
      onSaved(data.data, { another });
      if (another) {
        // stay open for the next question, keep language/difficulty
        setF((p) => ({ ...p, title: "", description: "", sampleInput: "", expectedOutputText: "", tags: "", starterCode: STARTERS[p.language] || "" }));
        setImage(null);
        document.getElementById("qf-title")?.focus();
      } else onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <Modal wide title={mode === "edit" ? "Edit question" : mode === "duplicate" ? "Duplicate question" : "New question"} onClose={busy ? () => {} : onClose}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={label}>Title</label>
          <input id="qf-title" autoFocus className={field} value={f.title} onChange={set("title")} maxLength={140} placeholder="e.g. Sum of two numbers" disabled={busy} />
        </div>
        <div>
          <label className={label}>Language</label>
          <select className={field} value={f.language} onChange={changeLanguage} disabled={busy}>
            {Object.entries(LANGUAGES).map(([k, v]) => <option key={k} value={k} className="text-black">{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Difficulty</label>
          <select className={field} value={f.difficulty} onChange={set("difficulty")} disabled={busy}>
            {["easy", "medium", "hard"].map((d) => <option key={d} value={d} className="text-black">{d[0].toUpperCase() + d.slice(1)}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className={label}>Question (what the student must do)</label>
          <textarea className={field} rows={6} value={f.description} onChange={set("description")} maxLength={8000} disabled={busy}
            placeholder={"Read two numbers from input and print their sum.\n\nConstraints: ..."} />
        </div>
        <div>
          <label className={label}>Starter code (optional)</label>
          <textarea className={mono} rows={8} value={f.starterCode} onChange={set("starterCode")} disabled={busy} spellCheck={false} />
        </div>
        <div className="space-y-4">
          <div>
            <label className={label}>Sample input (optional, one value per line)</label>
            <textarea className={mono} rows={3} value={f.sampleInput} onChange={set("sampleInput")} disabled={busy} spellCheck={false} placeholder={"2\n3"} />
          </div>
          <div>
            <label className={label}>Tags (comma separated)</label>
            <input className={field} value={f.tags} onChange={set("tags")} disabled={busy} placeholder="loops, arrays" />
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-white/15 bg-white/5 p-4 space-y-4">
          <div>
            <p className="text-white font-medium">Desired result</p>
            <p className="text-xs text-gray-400">Add text, an image, or both. Students see this next to the question{f.language === "html" ? " (an image is ideal for HTML/CSS: show how the page should look)" : ""}.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={label}>Expected output (text)</label>
              <textarea className={mono} rows={5} value={f.expectedOutputText} onChange={set("expectedOutputText")} disabled={busy} spellCheck={false} placeholder="5" />
              <p className="text-xs text-gray-400 mt-1">When filled, each submission is auto-compared with it (spaces at line ends are ignored).</p>
            </div>
            <div>
              <label className={label}>Expected result (image)</label>
              <ImageUploadField file={image} onChange={setImage} progress={progress} disabled={busy}
                existingUrl={!removeImage ? (existing?.thumbUrl || existing?.url) : null}
                onRemoveExisting={() => { setRemoveImage(true); setExisting(null); }} label="Upload the expected result" />
              {mode === "duplicate" && question?.expectedImage && !image && <p className="text-xs text-amber-300 mt-1">The image is not copied - upload it again if needed.</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 mt-6">
        <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50">Cancel</button>
        {mode !== "edit" && (
          <button onClick={() => save(true)} disabled={busy} className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-50">Save &amp; add another</button>
        )}
        <button onClick={() => save(false)} disabled={busy} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-60">
          {busy && <Loader2 className="animate-spin" size={16} />} {mode === "edit" ? "Save changes" : "Save question"}
        </button>
      </div>
    </Modal>
  );
}
