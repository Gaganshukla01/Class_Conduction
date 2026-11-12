import { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Loader2, Trash2 } from "lucide-react";
import { AppContent } from "../context/Context";
import { uploadImage } from "../utils/uploadPdf";
import ImageUploadField from "./ImageUploadField";
import Avatar from "./ui/Avatar";
import { Modal } from "./questions/questionKit";

// Upload / change / remove the logged-in user's profile photo (stored on Cloudinary).
export default function ProfilePhotoModal({ onClose }) {
  const { backend_url, userData, getUserData } = useContext(AppContent);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!file) return toast.error("Choose a photo first");
    setBusy(true);
    try {
      setProgress(0);
      const uploaded = await uploadImage({ file, purpose: "avatar", onProgress: setProgress });
      const { data } = await axios.put(`${backend_url}/api/user/avatar`, { file: uploaded });
      toast.success(data.message);
      await getUserData();
      onClose();
    } catch (e) { toast.error(e.response?.data?.message || e.message); } finally { setBusy(false); setProgress(null); }
  };

  const remove = async () => {
    if (!window.confirm("Remove your profile photo?")) return;
    setBusy(true);
    try { const { data } = await axios.delete(`${backend_url}/api/user/avatar`); toast.success(data.message); await getUserData(); onClose(); }
    catch (e) { toast.error(e.response?.data?.message || "Could not remove the photo"); } finally { setBusy(false); }
  };

  return (
    <Modal title="Profile photo" onClose={busy ? () => {} : onClose}>
      <div className="flex flex-col items-center gap-4">
        <Avatar name={userData?.name} src={userData?.avatarUrl} size={96} id={userData?.userId} />
        <p className="text-sm text-gray-300 text-center">Your photo appears next to your name in the chat, member lists and your profile. Square photos work best (PNG, JPG or WebP, max 5 MB).</p>
        <div className="w-full"><ImageUploadField file={file} onChange={setFile} progress={progress} disabled={busy} label="Choose a photo" /></div>
        <div className="w-full flex flex-wrap justify-between gap-3">
          {userData?.avatarUrl ? <button onClick={remove} disabled={busy} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-rose-300 hover:bg-rose-500/15 disabled:opacity-50"><Trash2 size={16} /> Remove photo</button> : <span />}
          <button onClick={save} disabled={busy || !file} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 font-semibold disabled:opacity-50">{busy && <Loader2 className="animate-spin" size={16} />} Save photo</button>
        </div>
      </div>
    </Modal>
  );
}
