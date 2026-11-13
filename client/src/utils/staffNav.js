import {
  BarChart3, BookOpen, Users, Calendar, Settings, FileText, UserCheck, Book, Check, Contact, Projector, Library, Code2,
  MessageSquare, CalendarPlus, ClipboardCheck, UserPlus, GraduationCap as StudentsIcon, DollarSign as IndianRupeeIcon,
} from "lucide-react";

export const ALL_TABS = ["dashboard", "students", "approvals", "manageClasses", "addCourse", "updateUser", "addClass", "classAttendence", "extraClasses", "projectApprove", "homeWorkAssign", "codeQuestions", "reviewQueue", "classNotes", "resourceLibrary", "chat", "paymentUpdate", "contactUs", "settings"];

// Admin, manager and teacher share this panel. What they see depends on the role:
//   admin   - everything (including account approvals and user roles)
//   manager - everything except approving accounts / changing roles
//   teacher - their own students, classes, homework, questions, notes, resources, chat and payments.
//             NOT: creating schedules or courses, roles, approvals, projects, contact messages.
export function navFor(role, extra) {
  const all = {
    dashboard: { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    students: { id: "students", label: role === "teacher" ? "My Students" : "Students", icon: StudentsIcon },
    approvals: { id: "approvals", label: "Account Approvals", icon: UserPlus, badge: extra.pending },
    manageClasses: { id: "manageClasses", label: role === "teacher" ? "My Classes" : "Manage Classes", icon: Users },
    addCourse: { id: "addCourse", label: "Add Course", icon: BookOpen },
    updateUser: { id: "updateUser", label: "User Roles", icon: UserCheck },
    addClass: { id: "addClass", label: "Schedule Class", icon: Calendar },
    classAttendence: { id: "classAttendence", label: "Class Attendence", icon: Check },
    extraClasses: { id: "extraClasses", label: "Extra Classes", icon: CalendarPlus },
    projectApprove: { id: "projectApprove", label: "Approve Project", icon: Projector },
    homeWorkAssign: { id: "homeWorkAssign", label: "Home Work", icon: Book },
    codeQuestions: { id: "codeQuestions", label: "Code Questions", icon: Code2 },
    reviewQueue: { id: "reviewQueue", label: "Submissions to Review", icon: ClipboardCheck, badge: extra.toReview },
    chat: { id: "chat", label: "Chat", icon: MessageSquare, badge: extra.chatUnread },
    classNotes: { id: "classNotes", label: "Class Notes", icon: FileText },
    resourceLibrary: { id: "resourceLibrary", label: "Resource Library", icon: Library },
    paymentUpdate: { id: "paymentUpdate", label: "Payments", icon: IndianRupeeIcon },
    contactUs: { id: "contactUs", label: "Contact Us Res", icon: Contact },
    settings: { id: "settings", label: "Settings", icon: Settings },
  };
  const order = {
    admin: ["dashboard", "students", "approvals", "manageClasses", "addCourse", "updateUser", "addClass", "classAttendence", "extraClasses", "projectApprove", "homeWorkAssign", "codeQuestions", "reviewQueue", "chat", "classNotes", "resourceLibrary", "paymentUpdate", "contactUs", "settings"],
    manager: ["dashboard", "students", "manageClasses", "addCourse", "addClass", "classAttendence", "extraClasses", "projectApprove", "homeWorkAssign", "codeQuestions", "reviewQueue", "chat", "classNotes", "resourceLibrary", "paymentUpdate", "contactUs", "settings"],
    teacher: ["dashboard", "students", "manageClasses", "classAttendence", "extraClasses", "homeWorkAssign", "codeQuestions", "reviewQueue", "chat", "classNotes", "resourceLibrary", "paymentUpdate"],
  }[role] || ["dashboard"];
  return order.map((id) => all[id]);
}

export const PANEL = {
  admin: { brand: "Admin Panel", gradient: "from-indigo-900 via-purple-800 to-pink-700" },
  manager: { brand: "Manager Panel", gradient: "from-slate-900 via-amber-900 to-orange-800" },
  teacher: { brand: "Teacher Panel", gradient: "from-emerald-950 via-teal-800 to-cyan-800" },
};

