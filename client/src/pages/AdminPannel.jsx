import React, { useState, useContext, useEffect } from "react";
import {
  BookOpen,
  Users,
  Calendar,
  Settings,
  BarChart3,
  FileText,
  UserCheck,
  ChevronDown,
  X,
  Image,
  Video,
  Tag,
  Book,
  DollarSign,
  CheckCircle,
  TrendingUp,
  GraduationCap,
  Clock,
  User,
  ExternalLink,
  Mail,
  Phone,
  Check,
  DollarSign as IndianRupeeIcon,
  Menu,
  Contact,
  Projector,
  Library,
  Code2,
  MessageSquare,
  CalendarPlus,
  ClipboardCheck,
  UserPlus,
  GraduationCap as StudentsIcon,
} from "lucide-react";

import { AppContent } from "../context/Context";
import AddScheduleClass from "../components/AddScheduleClass";
import AddCourse from "../components/CourseAdd";
import AddClassAttendance from "../components/AddClassAttendance";
import StudentHomeworkAssignment from "../components/HomeWorkAssign";
import PaymentsAdmin from "../components/payments/PaymentsAdmin";
import AccountApprovals from "../components/AccountApprovals";
import StudentsDirectory from "../components/StudentsDirectory";
import UserRoles from "../components/UserRoles";
import { ROLE_LABEL, canApproveAccounts } from "../utils/roles";
import { ALL_TABS, PANEL, navFor } from "../utils/staffNav";
import DashboardHome from "../components/DasboardHomeAdmin";
import axios from "axios";
import { toast } from "react-toastify";
import ContactInquiriesAdmin from "../components/ContactResultForm";
import AdminProjectApproval from "./ProjectApproveSection";
import ClassNotesAdmin from "../components/ClassNotesAdmin";
import ResourceLibraryAdmin from "../components/ResourceLibraryAdmin";
import QuestionBankAdmin from "../components/questions/QuestionBankAdmin";
import ReviewQueueAdmin from "../components/questions/ReviewQueueAdmin";
import ExtraClassesAdmin from "../components/ExtraClassesAdmin";
import ChatPage from "../components/chat/ChatPage";
import ProfileFooter from "../components/layout/ProfileFooter";
import ProfilePhotoModal from "../components/ProfilePhotoModal";
import useChatUnread from "../hooks/useChatUnread";
import SidebarShell from "../components/layout/SidebarShell";

export default function AdminDashboard() {
  const { backend_url, userData } = useContext(AppContent);
  const role = userData?.userType || "teacher";
  const [pending, setPending] = useState(0); // sign-ups waiting for approval (admin only)
  const [profileOpen, setProfileOpen] = useState(false);

  // number of coding-question submissions waiting for review (sidebar badge)
  const [toReview, setToReview] = useState(0);
  const allowed = navFor(role, {}).map((i) => i.id);
  const [activeTab, setActiveTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    return ALL_TABS.includes(t) ? t : "dashboard";
  });
  // a role can never land on a tab it does not have (e.g. a teacher typing ?tab=addClass)
  const tab = allowed.includes(activeTab) ? activeTab : "dashboard";
  const chatUnread = useChatUnread(tab === "chat");
  const navItems = navFor(role, { pending, toReview, chatUnread });

  useEffect(() => {
    let alive = true;
    const load = () => {
      if (document.visibilityState !== "visible") return;
      axios.get(`${backend_url}/api/questions/review-queue`, { params: { status: "submitted" } })
        .then(({ data }) => alive && setToReview(data.counts?.submitted || 0)).catch(() => {});
      if (canApproveAccounts(role)) {
        axios.get(`${backend_url}/api/user/accounts`, { params: { status: "pending" } })
          .then(({ data }) => alive && setPending(data.counts?.pending || 0)).catch(() => {});
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, [backend_url, tab, role]);

  // from a student's card: open the private chat with them
  const goChat = (student) => {
    const room = `dm:${student._id}:${userData.userId}`;
    window.history.replaceState(null, "", `${window.location.pathname}?tab=chat&room=${encodeURIComponent(room)}`);
    setActiveTab("chat");
  };

  const renderContent = () => {
    switch (tab) {
      case "students":
        return <StudentsDirectory title={role === "teacher" ? "My students" : "Students"} onMessage={goChat} onExtraClass={() => setActiveTab("extraClasses")} onPayments={() => setActiveTab("paymentUpdate")} />;
      case "approvals":
        return <AccountApprovals onChanged={setPending} />;
      case "addCourse":
        return <AddCourse />;
      case "updateUser":
        return <UserRoles />;
      case "classAttendence":
        return <AddClassAttendance />;
      case "addClass":
        return <AddScheduleClass />;
      case "settings":
        return <SettingsPanel />;
      case "manageClasses":
        return <ManageClasses />;
      case "homeWorkAssign":
        return <StudentHomeworkAssignment />;
      case "paymentUpdate":
        return <PaymentsAdmin />;
      case "contactUs":
        return <ContactInquiriesAdmin />;
      case "codeQuestions":
        return <QuestionBankAdmin />;
      case "reviewQueue":
        return <ReviewQueueAdmin />;
      case "extraClasses":
        return <ExtraClassesAdmin />;
      case "classNotes":
        return <ClassNotesAdmin />;
      case "resourceLibrary":
        return <ResourceLibraryAdmin />;
      case "projectApprove":
        return <AdminProjectApproval />;
      default:
        return <DashboardHome />;
    }
  };

  // Same collapsible icon sidebar as the student portal. The shell is (viewport - site navbar)
  // tall and only the content area scrolls, so the sidebar and the page scroll independently.
  const panel = PANEL[role] || PANEL.teacher;
  return (
    <SidebarShell
      items={navItems}
      active={tab}
      onSelect={setActiveTab}
      brand={panel.brand}
      gradient={panel.gradient}
      footer={({ rail }) => (
        <ProfileFooter rail={rail} name={userData?.name || "Staff"} userId={userData?.userId} avatarUrl={userData?.avatarUrl} subtitle={ROLE_LABEL[role] || "Staff"} onEdit={() => setProfileOpen(true)} />
      )}
    >
      {tab === "chat" ? (
        <div className="h-full p-2 sm:p-4"><ChatPage /></div>
      ) : (
        <div className="p-4 sm:p-6 lg:p-8">{renderContent()}</div>
      )}
      {profileOpen && <ProfilePhotoModal onClose={() => setProfileOpen(false)} />}
    </SidebarShell>
  );
}

function SettingsPanel() {
  return (
    <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
        Settings
      </h2>

      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4">General Settings</h3>
          <div className="space-y-4">
            <Input
              label="Application Name"
              value="Learning Management System"
            />
            <Input label="Admin Email" value="admin@example.com" type="email" />
            <Input label="Contact Phone" value="+1 (555) 123-4567" />
          </div>
        </div>

        <div className="bg-white/5 p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Email notifications for new students</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Class reminders</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded" />
              <span>Weekly reports</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Input Component
function Input({ label, name, value, onChange, type = "text", Icon }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-1">
        {label}
      </label>
      <div className="flex items-center bg-white/10 rounded-xl px-4 py-3 border border-white/20 focus-within:ring-2 ring-blue-400 transition">
        {Icon && <Icon size={20} className="text-gray-300 mr-3" />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="bg-transparent text-white w-full outline-none placeholder:text-gray-400"
          placeholder={label}
        />
      </div>
    </div>
  );
}

// Manage Classes Component
function ManageClasses() {
  const { allSchedule, allUserData } = useContext(AppContent);
  const classes = allSchedule || [];
  const users = allUserData?.data || [];

  const handleJoinClass = (classLink) => {
    if (classLink) {
      window.open(classLink, "_blank", "noopener,noreferrer");
    } else {
      alert("Class link is not available");
    }
  };

  const getInstructorName = (instructorId) => {
    const instructor = users.find((user) => user._id === instructorId);
    return instructor ? instructor.name : instructorId; // Fallback to ID if not found
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getEnrolledStudents = (studentsEnrolled) => {
    if (!studentsEnrolled || !Array.isArray(studentsEnrolled)) return [];

    return studentsEnrolled.map((studentId) => {
      const student = users.find(
        (user) => user._id === studentId || user.name === studentId
      );
      return student
        ? {
            id: student._id,
            name: student.name,
            email: student.email,
            status: "enrolled",
          }
        : {
            id: studentId,
            name: studentId,
            email: "N/A",
            status: "enrolled",
          };
    });
  };

  // Get filtered classes for each student (3 classes max)
  const getFilteredClassesForStudent = (studentId) => {
    const today = new Date().toISOString().split("T")[0];

    // Get all classes where this student is enrolled, sorted by date
    const studentClasses = classes
      .filter(
        (classItem) =>
          classItem.studentsEnrolled &&
          classItem.studentsEnrolled.includes(studentId)
      )
      .sort((a, b) => new Date(a.classDate) - new Date(b.classDate));

    // Separate classes into today's, past, and future
    const todayClasses = studentClasses.filter((c) => c.classDate === today);
    const futureClasses = studentClasses.filter((c) => c.classDate > today);

    let selectedClasses = [];

    if (todayClasses.length > 0) {
      // If there's a class today, include it + 2 upcoming
      selectedClasses = [
        ...todayClasses.slice(0, 1), // Only first class of today
        ...futureClasses.slice(0, 2), // Next 2 upcoming classes
      ];
    } else {
      // If no class today, show next 3 upcoming classes
      selectedClasses = futureClasses.slice(0, 3);
    }

    // Add labels to classes
    return selectedClasses.map((classItem) => ({
      ...classItem,
      label: classItem.classDate === today ? "Today" : "Upcoming",
    }));
  };

  const getAllEnrolledStudents = () => {
    const studentSet = new Set();
    classes.forEach((classItem) => {
      if (
        classItem.studentsEnrolled &&
        Array.isArray(classItem.studentsEnrolled)
      ) {
        classItem.studentsEnrolled.forEach((studentId) => {
          studentSet.add(studentId);
        });
      }
    });
    return Array.from(studentSet);
  };

  const getStudentDetails = (studentId) => {
    const student = users.find(
      (user) => user._id === studentId || user.name === studentId
    );
    return student
      ? {
          id: student._id,
          name: student.name,
          email: student.email,
        }
      : {
          id: studentId,
          name: studentId,
          email: "N/A",
        };
  };

  if (!allSchedule || !allUserData) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-400">Loading classes...</div>
        </div>
      </div>
    );
  }

  const enrolledStudents = getAllEnrolledStudents();

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
        Manage Classes
      </h2>

      <div className="space-y-8">
        {enrolledStudents.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-center">
            <p className="text-gray-400">No enrolled students found</p>
          </div>
        ) : (
          enrolledStudents.map((studentId) => {
            const studentDetails = getStudentDetails(studentId);
            const studentClasses = getFilteredClassesForStudent(studentId);

            return (
              <div
                key={studentId}
                className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10"
              >
                {/* Student Header */}
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {studentDetails.name}
                    </h3>
                    <p className="text-gray-300">{studentDetails.email}</p>
                    <p className="text-sm text-gray-400">
                      Showing {studentClasses.length} of {studentClasses.length}{" "}
                      upcoming classes
                    </p>
                  </div>
                </div>

                {/* Student's Classes */}
                <div className="space-y-4">
                  {studentClasses.length === 0 ? (
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <p className="text-gray-400">
                        No upcoming classes for this student
                      </p>
                    </div>
                  ) : (
                    studentClasses.map((classItem) => (
                      <div
                        key={classItem._id}
                        className="bg-white/5 rounded-xl p-4 border border-white/5"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-xl font-bold">
                                {classItem.className}
                              </h4>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  classItem.label === "Today"
                                    ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                }`}
                              >
                                {classItem.label}
                              </span>
                            </div>
                            <p className="text-gray-300 mb-3">
                              {classItem.classDescription}
                            </p>
                            <div className="flex items-center space-x-4 text-gray-300 text-sm">
                              <span className="flex items-center">
                                <User size={14} className="mr-1" />
                                {getInstructorName(classItem.instructorId)}
                              </span>
                              <span className="flex items-center">
                                <Clock size={14} className="mr-1" />
                                {classItem.classTime} ({classItem.classDuration}
                                )
                              </span>
                              <span className="flex items-center">
                                <Calendar size={14} className="mr-1" />
                                {formatDate(classItem.classDate)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() =>
                                handleJoinClass(classItem.classLink)
                              }
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 hover:scale-105"
                            >
                              Join Class
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
