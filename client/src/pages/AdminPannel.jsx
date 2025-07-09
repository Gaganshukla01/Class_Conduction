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
} from "lucide-react";

import { AppContent } from "../context/Context";
import AddScheduleClass from "../components/AddScheduleClass";
import AddCourse from "../components/CourseAdd";
import AddClassAttendance from "../components/AddClassAttendance";
import StudentHomeworkAssignment from "../components/HomeWorkAssign";
import axios from "axios";
import { toast } from "react-toastify";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "manageClasses", label: "Manage Classes", icon: Users },
    { id: "addCourse", label: "Add Course", icon: BookOpen },
    { id: "updateUser", label: "Update User", icon: UserCheck },
    { id: "addClass", label: "Schedule Class", icon: Calendar },
    { id: "classAttendence", label: "Class Attendence", icon: Check },
    { id: "homeWorkAssign", label: "Home Work", icon: Book },
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
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white/10 backdrop-blur-sm border-r border-white/10 p-6">
          <h1 className="text-2xl font-bold mb-8 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            Admin Panel
          </h1>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === item.id
                      ? "bg-white/20 text-white shadow-lg"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">{renderContent()}</div>
      </div>
    </div>
  );
}

// Dashboard Home Component
function DashboardHome() {
  const { allSchedule, allUserData, allCourse } = useContext(AppContent);
  const [hoveredStat, setHoveredStat] = useState(null);

  // Extract data arrays from backend response
  const classes = allSchedule?.data || [];
  const users = allUserData?.data || [];
  // Fix: Handle different possible data structures for courses
  const courses = allCourse?.data || allCourse || [];

  // Calculate statistics from real data
  const totalCourses = courses.length;
  
  // Separate instructors and students
  const instructors = users.filter(user => user.userType === 'admin');
  const students = users.filter(user => user.userType === 'student');
  const totalStudents = students.length;
  const totalInstructors = instructors.length;

  // Calculate total enrolled students across all classes
  const totalEnrollments = classes.reduce((total, classItem) => {
    return total + (classItem.studentsEnrolled?.length || 0);
  }, 0);

  // Get current date to filter active classes
  const currentDate = new Date();
  const activeClasses = classes.filter(classItem => {
    const classDate = new Date(classItem.classDate);
    return classDate >= currentDate;
  }).length;

  // Static payment data (to be replaced with API later)
  const paymentStats = {
    totalRevenue: 25750,
    pendingPayments: 3200,
    completedPayments: 22550,
    averageClassFee: 150
  };

  // Get detailed breakdowns for hover tooltips
  const getStudentDetails = () => {
    const verifiedStudents = students.filter(student => student.isAccountVerified).length;
    const unverifiedStudents = students.length - verifiedStudents;
    return {
      total: students.length,
      verified: verifiedStudents,
      unverified: unverifiedStudents,
      enrollments: totalEnrollments
    };
  };

  const getInstructorDetails = () => {
    const verifiedInstructors = instructors.filter(instructor => instructor.isAccountVerified).length;
    const unverifiedInstructors = instructors.length - verifiedInstructors;
    return {
      total: instructors.length,
      verified: verifiedInstructors,
      unverified: unverifiedInstructors,
      activeClasses: activeClasses
    };
  };

  const getCourseDetails = () => {
    // Assuming courses might have categories or status fields
    return {
      total: courses.length,
      activeClasses: classes.length,
      upcomingClasses: activeClasses,
      totalEnrollments: totalEnrollments
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const stats = [
    {
      id: 'courses',
      label: "Total Courses",
      value: totalCourses.toString(),
      icon: BookOpen,
      color: "from-blue-500 to-cyan-500",
      subtext: `${activeClasses} active`,
      hasHover: true,
      details: getCourseDetails()
    },
    {
      id: 'students',
      label: "Total Students",
      value: totalStudents.toString(),
      icon: Users,
      color: "from-green-500 to-emerald-500",
      subtext: `${totalEnrollments} enrollments`,
      hasHover: true,
      details: getStudentDetails()
    },
    {
      id: 'instructors',
      label: "Instructors",
      value: totalInstructors.toString(),
      icon: GraduationCap,
      color: "from-purple-500 to-violet-500",
      subtext: "Active instructors",
      hasHover: true,
      details: getInstructorDetails()
    },
    {
      id: 'revenue',
      label: "Total Revenue",
      value: formatCurrency(paymentStats.totalRevenue),
      icon: DollarSign,
      color: "from-orange-500 to-red-500",
      subtext: "This month",
      hasHover: false
    },
    {
      id: 'pending',
      label: "Pending Payments",
      value: formatCurrency(paymentStats.pendingPayments),
      icon: Clock,
      color: "from-yellow-500 to-amber-500",
      subtext: "Awaiting payment",
      hasHover: false
    },
    {
      id: 'completed',
      label: "Completed Payments",
      value: formatCurrency(paymentStats.completedPayments),
      icon: CheckCircle,
      color: "from-emerald-500 to-teal-500",
      subtext: "Successfully paid",
      hasHover: false
    },
    {
      id: 'average',
      label: "Average Class Fee",
      value: formatCurrency(paymentStats.averageClassFee),
      icon: TrendingUp,
      color: "from-indigo-500 to-blue-500",
      subtext: "Per class",
      hasHover: false
    },
    {
      id: 'active',
      label: "Active Classes",
      value: activeClasses.toString(),
      icon: Calendar,
      color: "from-pink-500 to-rose-500",
      subtext: "Upcoming classes",
      hasHover: false
    }
  ];

  // Get recent classes (next 3 upcoming)
  const upcomingClasses = classes
    .filter(classItem => new Date(classItem.classDate) >= currentDate)
    .sort((a, b) => new Date(a.classDate) - new Date(b.classDate))
    .slice(0, 3);

  // Get instructor name by ID
  const getInstructorName = (instructorId) => {
    const instructor = users.find(user => user._id === instructorId);
    return instructor ? instructor.name : 'Unknown Instructor';
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Show loading state if data is not available
  if (!allSchedule || !allUserData || !allCourse) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-400">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  // Debug: Add console log to check data
  console.log('Course data:', allCourse);
  console.log('Courses array:', courses);
  console.log('Total courses:', totalCourses);

  // Render hover tooltip
  const renderHoverTooltip = (stat) => {
    if (!stat.hasHover || hoveredStat !== stat.id) return null;

    let tooltipContent;
    
    if (stat.id === 'courses') {
      tooltipContent = (
        <div className="space-y-2">
          <div className="font-semibold text-blue-300 border-b border-blue-400/30 pb-1">
            Course Overview
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-300">Total Courses:</div>
              <div className="font-medium text-white">{stat.details.total}</div>
            </div>
            <div>
              <div className="text-gray-300">Active Classes:</div>
              <div className="font-medium text-white">{stat.details.activeClasses}</div>
            </div>
            <div>
              <div className="text-gray-300">Upcoming:</div>
              <div className="font-medium text-white">{stat.details.upcomingClasses}</div>
            </div>
            <div>
              <div className="text-gray-300">Total Enrollments:</div>
              <div className="font-medium text-white">{stat.details.totalEnrollments}</div>
            </div>
          </div>
        </div>
      );
    } else if (stat.id === 'students') {
      tooltipContent = (
        <div className="space-y-2">
          <div className="font-semibold text-green-300 border-b border-green-400/30 pb-1">
            Student Breakdown
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-300">Total Students:</div>
              <div className="font-medium text-white">{stat.details.total}</div>
            </div>
            <div>
              <div className="text-gray-300">Verified:</div>
              <div className="font-medium text-green-400">{stat.details.verified}</div>
            </div>
            <div>
              <div className="text-gray-300">Unverified:</div>
              <div className="font-medium text-yellow-400">{stat.details.unverified}</div>
            </div>
            <div>
              <div className="text-gray-300">Total Enrollments:</div>
              <div className="font-medium text-white">{stat.details.enrollments}</div>
            </div>
          </div>
        </div>
      );
    } else if (stat.id === 'instructors') {
      tooltipContent = (
        <div className="space-y-2">
          <div className="font-semibold text-purple-300 border-b border-purple-400/30 pb-1">
            Instructor Details
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-300">Total Instructors:</div>
              <div className="font-medium text-white">{stat.details.total}</div>
            </div>
            <div>
              <div className="text-gray-300">Verified:</div>
              <div className="font-medium text-green-400">{stat.details.verified}</div>
            </div>
            <div>
              <div className="text-gray-300">Unverified:</div>
              <div className="font-medium text-yellow-400">{stat.details.unverified}</div>
            </div>
            <div>
              <div className="text-gray-300">Active Classes:</div>
              <div className="font-medium text-white">{stat.details.activeClasses}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-[9999] bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-2xl min-w-[280px] animate-in fade-in duration-200">
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 border-l border-t border-gray-700 rotate-45"></div>
        {tooltipContent}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
        Dashboard Overview
      </h2>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`relative bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 transition-all duration-300 ${
                stat.hasHover 
                  ? 'hover:bg-white/15 hover:scale-105 hover:shadow-xl cursor-pointer' 
                  : 'hover:bg-white/15'
              }`}
              onMouseEnter={() => stat.hasHover && setHoveredStat(stat.id)}
              onMouseLeave={() => stat.hasHover && setHoveredStat(null)}
              style={{ zIndex: hoveredStat === stat.id ? 100 : 'auto' }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}
              >
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-gray-300 font-medium">{stat.label}</p>
              {stat.subtext && (
                <p className="text-sm text-gray-400 mt-1">{stat.subtext}</p>
              )}
              {stat.hasHover && (
                <div className="absolute top-2 right-2 opacity-50">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              )}
              {renderHoverTooltip(stat)}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Welcome Section */}
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
          <h3 className="text-2xl font-semibold mb-4">Welcome to Admin Panel</h3>
          <p className="text-gray-300 mb-6">
            Manage your courses, students, instructors, and payments from this centralized
            dashboard. Use the navigation to access different sections.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all duration-300">
              <BookOpen className="mb-2 text-blue-400" size={24} />
              <h4 className="font-semibold mb-1">Course Management</h4>
              <p className="text-sm text-gray-400">
                Create and manage course content
              </p>
              <div className="text-xs text-blue-400 mt-2">
                {totalCourses} courses available
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all duration-300">
              <Users className="mb-2 text-green-400" size={24} />
              <h4 className="font-semibold mb-1">Student Management</h4>
              <p className="text-sm text-gray-400">
                Add and track student progress
              </p>
              <div className="text-xs text-green-400 mt-2">
                {totalStudents} students registered
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all duration-300">
              <Calendar className="mb-2 text-purple-400" size={24} />
              <h4 className="font-semibold mb-1">Class Scheduling</h4>
              <p className="text-sm text-gray-400">
                Schedule and manage classes
              </p>
              <div className="text-xs text-purple-400 mt-2">
                {activeClasses} upcoming classes
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="mr-2 text-blue-400" size={20} />
            Upcoming Classes
          </h3>
          
          <div className="space-y-3">
            {upcomingClasses.length === 0 ? (
              <p className="text-gray-400 text-sm">No upcoming classes</p>
            ) : (
              upcomingClasses.map((classItem) => (
                <div
                  key={classItem._id}
                  className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  <div className="font-medium text-sm mb-1">
                    {classItem.className}
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    {getInstructorName(classItem.instructorId)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-400">
                      {formatDate(classItem.classDate)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {classItem.classTime}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {classItem.studentsEnrolled?.length || 0} students enrolled
                  </div>
                </div>
              ))
            )}
          </div>
          
          {upcomingClasses.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                View all classes →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-8 bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
        <h3 className="text-xl font-semibold mb-4">Quick Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-400">{totalCourses}</div>
            <div className="text-sm text-gray-400">Total Courses</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{totalStudents}</div>
            <div className="text-sm text-gray-400">Students</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{totalInstructors}</div>
            <div className="text-sm text-gray-400">Instructors</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-400">
              {formatCurrency(paymentStats.totalRevenue)}
            </div>
            <div className="text-sm text-gray-400">Revenue</div>
          </div>
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
