import React, { useState, useContext } from "react";
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
  TrendingUp ,
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "manageClasses", label: "Manage Classes", icon: Users },
    { id: "addCourse", label: "Add Course", icon: BookOpen },
    { id: "updateUser", label: "Update User", icon: UserCheck },
    { id: "addClass", label: "Schedule Class", icon: Calendar },
    { id: "classAttendence", label: "Class Attendence", icon: Check },
    { id: "homeWorkAssign", label: "Home Work", icon: Book },
    { id: "paymentUpdate", label: "Payment Update", icon: IndianRupeeIcon },
    { id: "contactUs", label: "Contact Us Res", icon: Contact },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false); 
  };

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
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Glows */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-40 right-20 w-48 h-48 bg-pink-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>

      <div className="relative z-10 flex min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-white/10 backdrop-blur-sm border-r border-white/10 p-6 transform transition-transform duration-300 ease-in-out lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <h1 className="text-2xl font-bold mb-8 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent hidden lg:block">
            Admin Panel
          </h1>

          <nav className="space-y-2 mt-16 lg:mt-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={20} className="mr-3 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 pt-20 lg:p-8 lg:pt-8 lg:ml-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}



// Update user type
function UpdateUserType() {
  const { getAllUserData, getUserData, allUserData, backend_url } =
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
        toast.success(res.message, err);
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
  console.log(allSchedule, "test1");
  console.log(allUserData, "test2");

  const classes = allSchedule|| [];
  const users = allUserData?.data || [];

  const handleJoinClass = (classLink) => {
    if (classLink) {
      // Open the class link in a new tab
      window.open(classLink, "_blank", "noopener,noreferrer");
    } else {
      console.log("No class link available");
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
    const today = new Date().toISOString().split('T')[0];
    
    // Get all classes where this student is enrolled, sorted by date
    const studentClasses = classes
      .filter(classItem => 
        classItem.studentsEnrolled && 
        classItem.studentsEnrolled.includes(studentId)
      )
      .sort((a, b) => new Date(a.classDate) - new Date(b.classDate));

    // Separate classes into today's, past, and future
    const todayClasses = studentClasses.filter(c => c.classDate === today);
    const futureClasses = studentClasses.filter(c => c.classDate > today);
    
    let selectedClasses = [];
    
    if (todayClasses.length > 0) {
      // If there's a class today, include it + 2 upcoming
      selectedClasses = [
        ...todayClasses.slice(0, 1), // Only first class of today
        ...futureClasses.slice(0, 2)  // Next 2 upcoming classes
      ];
    } else {
      // If no class today, show next 3 upcoming classes
      selectedClasses = futureClasses.slice(0, 3);
    }

    // Add labels to classes
    return selectedClasses.map(classItem => ({
      ...classItem,
      label: classItem.classDate === today ? 'Today' : 'Upcoming'
    }));
  };


  const getAllEnrolledStudents = () => {
    const studentSet = new Set();
    classes.forEach(classItem => {
      if (classItem.studentsEnrolled && Array.isArray(classItem.studentsEnrolled)) {
        classItem.studentsEnrolled.forEach(studentId => {
          studentSet.add(studentId);
        });
      }
    });
    return Array.from(studentSet);
  };


  const getStudentDetails = (studentId) => {
    const student = users.find(user => user._id === studentId || user.name === studentId);
    return student ? {
      id: student._id,
      name: student.name,
      email: student.email
    } : {
      id: studentId,
      name: studentId,
      email: 'N/A'
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
                    <h3 className="text-2xl font-bold">{studentDetails.name}</h3>
                    <p className="text-gray-300">{studentDetails.email}</p>
                    <p className="text-sm text-gray-400">
                      Showing {studentClasses.length} of {studentClasses.length} upcoming classes
                    </p>
                  </div>
                </div>

                {/* Student's Classes */}
                <div className="space-y-4">
                  {studentClasses.length === 0 ? (
                    <div className="bg-white/5 rounded-xl p-4 text-center">
                      <p className="text-gray-400">No upcoming classes for this student</p>
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
                              <h4 className="text-xl font-bold">{classItem.className}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                classItem.label === 'Today' 
                                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }`}>
                                {classItem.label}
                              </span>
                            </div>
                            <p className="text-gray-300 mb-3">{classItem.classDescription}</p>
                            <div className="flex items-center space-x-4 text-gray-300 text-sm">
                              <span className="flex items-center">
                                <User size={14} className="mr-1" />
                                {getInstructorName(classItem.instructorId)}
                              </span>
                              <span className="flex items-center">
                                <Clock size={14} className="mr-1" />
                                {classItem.classTime} ({classItem.classDuration})
                              </span>
                              <span className="flex items-center">
                                <Calendar size={14} className="mr-1" />
                                {formatDate(classItem.classDate)}
                              </span>
                            </div>

                          </div>
                          <div className="ml-4">
                            <button
                              onClick={() => handleJoinClass(classItem.classLink)}
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
