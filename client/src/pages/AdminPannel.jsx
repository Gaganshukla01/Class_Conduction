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
} from "lucide-react";

import { AppContent } from "../context/Context";
import AddScheduleClass from "../components/AddScheduleClass";
import AddCourse from "../components/CourseAdd";
import AddClassAttendance from "../components/AddClassAttendance";
import StudentHomeworkAssignment from "../components/HomeWorkAssign";
import ClassPaymentUpdate from "../components/PaymentStatusUpdate";
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

const ADMIN_TABS = ["dashboard", "manageClasses", "addCourse", "updateUser", "addClass", "classAttendence", "extraClasses", "projectApprove", "homeWorkAssign", "codeQuestions", "reviewQueue", "classNotes", "resourceLibrary", "chat", "paymentUpdate", "contactUs", "settings"];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    return ADMIN_TABS.includes(t) ? t : "dashboard";
  });
  const { backend_url } = useContext(AppContent);
  const chatUnread = useChatUnread(activeTab === "chat");
  const [profileOpen, setProfileOpen] = useState(false);

  // number of coding-question submissions waiting for review (sidebar badge)
  const [toReview, setToReview] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () =>
      document.visibilityState === "visible" &&
      axios.get(`${backend_url}/api/questions/review-queue`, { params: { status: "submitted" } })
        .then(({ data }) => alive && setToReview(data.counts?.submitted || 0)).catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => { alive = false; clearInterval(id); };
  }, [backend_url, activeTab]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "manageClasses", label: "Manage Classes", icon: Users },
    { id: "addCourse", label: "Add Course", icon: BookOpen },
    { id: "updateUser", label: "Update User", icon: UserCheck },
    { id: "addClass", label: "Schedule Class", icon: Calendar },
    { id: "classAttendence", label: "Class Attendence", icon: Check },
    { id: "extraClasses", label: "Extra Classes", icon: CalendarPlus },
    { id: "projectApprove", label: "Approve Project", icon: Projector },
    { id: "homeWorkAssign", label: "Home Work", icon: Book },
    { id: "codeQuestions", label: "Code Questions", icon: Code2 },
    { id: "reviewQueue", label: "Submissions to Review", icon: ClipboardCheck, badge: toReview },
    { id: "chat", label: "Community Chat", icon: MessageSquare, badge: chatUnread },
    { id: "classNotes", label: "Class Notes", icon: FileText },
    { id: "resourceLibrary", label: "Resource Library", icon: Library },
    { id: "paymentUpdate", label: "Payment Update", icon: IndianRupeeIcon },
    { id: "contactUs", label: "Contact Us Res", icon: Contact },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "addCourse":
        return <AddCourse />;
      case "updateUser":
        return <UpdateUserType />;
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
        return <ClassPaymentUpdate />;
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
  const { userData } = useContext(AppContent);
  return (
    <SidebarShell
      items={navItems}
      active={activeTab}
      onSelect={setActiveTab}
      brand="Admin Panel"
      gradient="from-indigo-900 via-purple-800 to-pink-700"
      footer={({ rail }) => (
        <ProfileFooter rail={rail} name={userData?.name || "Admin"} userId={userData?.userId} avatarUrl={userData?.avatarUrl} subtitle="Teacher / Admin" onEdit={() => setProfileOpen(true)} />
      )}
    >
      {activeTab === "chat" ? (
        <div className="h-full p-2 sm:p-4"><ChatPage /></div>
      ) : (
        <div className="p-4 sm:p-6 lg:p-8">{renderContent()}</div>
      )}
      {profileOpen && <ProfilePhotoModal onClose={() => setProfileOpen(false)} />}
    </SidebarShell>
  );
}

// Update user type
function UpdateUserType() {
  const { getAllUserData, getUserData, allUserData, backend_url, refreshData } =
    useContext(AppContent);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [message, setMessage] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const users = allUserData?.data || [];

  const roles = [
    {
      value: "admin",
      label: "Administrator",
      icon: "🛡️",
      color: "from-red-500 to-pink-500",
    },
    {
      value: "student",
      label: "Student",
      icon: "🎓",
      color: "from-blue-500 to-cyan-500",
    },
  ];

  const getUserAvatar = (user) => {
    const avatars = ["👩‍💼", "👨‍🎓", "👩‍💻", "👨‍🔬", "👩‍🎨", "👨‍💼", "👩‍🎓", "👨‍💻"];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  const selectedUserData = users.find((u) => u._id === selectedUser);
  const selectedRoleData = roles.find((r) => r.value === selectedRole);

  const handleSubmit = async () => {
    if (!selectedUser || !selectedRole) {
      setMessage("❌ Please select both user and role");
      return;
    } else {
      try {
        let payload = {
          userId: selectedUser,
          userType: selectedRole,
        };
        const res = await axios.put(
          `${backend_url}/api/user/usertypeupdate`,
          payload
        );
        if (res.data.success) {
          toast.success(res.data.message);
          getAllUserData();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Could not update the role");
      }
    }

    setSelectedUser("");
    setSelectedRole("");
  };

  const CustomDropdown = ({
    isOpen,
    setIsOpen,
    value,
    onChange,
    placeholder,
    icon: Icon,
    options,
    renderOption,
    renderSelected,
  }) => (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between bg-gradient-to-r from-white/10 to-white/5 rounded-xl px-4 py-4 border border-white/20 cursor-pointer transition-all duration-300 hover:border-white/40 hover:shadow-lg hover:shadow-blue-500/10 ${
          isOpen ? "ring-2 ring-blue-400/50 border-blue-400/50" : ""
        }`}
      >
        <div className="flex items-center flex-1">
          <Icon size={20} className="text-gray-300 mr-3" />
          <div className="flex-1">
            {value ? (
              renderSelected()
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`text-gray-300 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-gray-900/95 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
          <div className="max-h-64 overflow-y-auto">
            {options.map((option, index) => (
              <div
                key={option._id || option.value}
                onClick={() => {
                  onChange(option._id || option.value);
                  setIsOpen(false);
                }}
                className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 cursor-pointer transition-all duration-200 border-b border-white/5 last:border-b-0 group"
              >
                {renderOption(option)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white/10 backdrop-blur-sm p-8 rounded-3xl border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            Update User Role
          </h2>
          <p className="text-gray-400">Manage user permissions with style</p>
        </div>

        <div className="space-y-8">
          {/* User Selection Dropdown */}
          <div>
            <label className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <User size={16} />
              Select User
            </label>
            <CustomDropdown
              isOpen={userDropdownOpen}
              setIsOpen={setUserDropdownOpen}
              value={selectedUser}
              onChange={setSelectedUser}
              placeholder="Choose a user to update..."
              icon={User}
              options={users}
              renderSelected={() =>
                selectedUserData && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {getUserAvatar(selectedUserData)}
                    </span>
                    <div>
                      <div className="text-white font-medium">
                        {selectedUserData.name}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {selectedUserData.email}
                      </div>
                    </div>
                  </div>
                )
              }
              renderOption={(user) => (
                <div className="flex items-center gap-3 ">
                  <span className="text-2xl">{getUserAvatar(user)}</span>
                  <div className="flex-1">
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-gray-400 text-sm">{user.email}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.userType === "admin"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-blue-500/20 text-blue-300"
                      }`}
                    >
                      {user.userType}
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isAccountVerified
                          ? "bg-green-500/20 text-green-300"
                          : "bg-yellow-500/20 text-yellow-300"
                      }`}
                    >
                      {user.isAccountVerified ? "Verified" : "Pending"}
                    </div>
                  </div>
                </div>
              )}
            />
          </div>

          {/* Role Selection Dropdown */}
          <div>
            <label className=" text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <UserCheck size={16} />
              Select New Role
            </label>
            <CustomDropdown
              isOpen={roleDropdownOpen}
              setIsOpen={setRoleDropdownOpen}
              value={selectedRole}
              onChange={setSelectedRole}
              placeholder="Choose a role to assign..."
              icon={UserCheck}
              options={roles}
              renderSelected={() =>
                selectedRoleData && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedRoleData.icon}</span>
                    <div>
                      <div className="text-white font-medium">
                        {selectedRoleData.label}
                      </div>
                      <div className="text-gray-400 text-sm">
                        Role Assignment
                      </div>
                    </div>
                  </div>
                )
              }
              renderOption={(role) => (
                <div className="flex items-center gap-3 ">
                  <span className="text-2xl">{role.icon}</span>
                  <div className="flex-1">
                    <div className="text-white font-medium">{role.label}</div>
                    <div className="text-gray-400 text-sm">
                      {role.value === "admin"
                        ? "Full system access"
                        : "Limited access"}
                    </div>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full bg-gradient-to-r ${role.color}`}
                  ></div>
                </div>
              )}
            />
          </div>

          {/* Current User Info Display */}
          {selectedUser && (
            <div className="bg-gradient-to-r from-white/5 to-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-300">
                <User size={20} />
                Selected User Information
              </h4>
              {(() => {
                const user = users.find((u) => u._id === selectedUser);
                const currentRoleData = roles.find(
                  (r) => r.value === user.userType
                );
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{getUserAvatar(user)}</span>
                        <div>
                          <p className="text-white font-medium text-lg">
                            {user.name}
                          </p>
                          <p className="text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-gray-300">Current Role:</span>
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${currentRoleData?.color} text-white text-sm font-medium`}
                        >
                          <span>{currentRoleData?.icon}</span>
                          {user.userType}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <span className="text-gray-300">Status:</span>
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            user.isAccountVerified
                              ? "bg-green-500/20 text-green-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {user.isAccountVerified
                            ? "✅ Verified"
                            : "⏳ Pending"}
                        </div>
                      </div>
                      {selectedRole && selectedRole !== user.userType && (
                        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                          <span className="text-gray-300">New Role:</span>
                          <div
                            className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${selectedRoleData?.color} text-white text-sm font-medium`}
                          >
                            <span>{selectedRoleData?.icon}</span>
                            {selectedRole}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!selectedUser || !selectedRole}
            className={`w-full mt-8 px-8 py-4 rounded-2xl text-lg font-bold transition-all duration-300 ${
              selectedUser && selectedRole
                ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 hover:shadow-purple-500/25"
                : "bg-gray-700/50 text-gray-400 cursor-not-allowed"
            }`}
          >
            {selectedUser && selectedRole ? (
              <span className="flex items-center justify-center gap-2">
                <Check size={20} />
                Update User Role
              </span>
            ) : (
              "Select User and Role to Continue"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Settings Panel Component
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
