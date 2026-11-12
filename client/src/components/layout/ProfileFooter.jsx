import { Camera } from "lucide-react";
import Avatar from "../ui/Avatar";

// Bottom of the sidebar: avatar (click to change the photo) + name.
export default function ProfileFooter({ rail, name, subtitle, avatarUrl, userId, onEdit }) {
  return (
    <button onClick={onEdit} className="w-full flex items-center gap-3 px-[3px] text-left rounded-xl hover:bg-white/10 transition py-1" title="Change profile photo">
      <span className="relative shrink-0">
        <Avatar name={name} src={avatarUrl} size={40} id={userId} />
        <span className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full bg-slate-900 border border-white/20 flex items-center justify-center"><Camera size={10} /></span>
      </span>
      <span className={`min-w-0 ${rail ? "opacity-0 group-hover:opacity-100 transition-opacity duration-200" : ""}`}>
        <span className="block text-sm font-semibold truncate">{name}</span>
        <span className="block text-xs text-gray-400 whitespace-nowrap">{subtitle}</span>
      </span>
    </button>
  );
}
