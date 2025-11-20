import React, { useState, useContext, useEffect } from "react";
import {
  User,
  BookOpen,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  Circle,
  Edit,
  Save,
  RotateCcw,
} from "lucide-react";

import { AppContent } from "../context/Context";
import axios from "axios";
import { toast } from "react-toastify";

export default function StudentHomeworkAssignment() {
  const { getAllUserData, allUserData, backend_url, allSchedule } =
    useContext(AppContent);

  const generateStudentData = (userData) => {
    if (!userData?.data || !Array.isArray(userData.data)) return [];

    const colors = [
      "from-pink-500 to-rose-500",
      "from-blue-500 to-cyan-500",
      "from-purple-500 to-indigo-500",
      "from-emerald-500 to-teal-500",
      "from-orange-500 to-red-500",
      "from-yellow-500 to-orange-500",
      "from-green-500 to-emerald-500",
      "from-violet-500 to-purple-500",
    ];

    const generateAvatar = (name) => {
      if (!name) return "ST";
      const words = name.trim().split(" ");
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    const generateRollNo = (id, index) => {
      const shortId = id.substring(id.length - 4);
      return `ST${shortId.toUpperCase()}`;
    };

    return userData.data
      .filter((user) => user.userType === "student")
      .map((student, index) => ({
        id: student._id,
        name: student.name,
        rollNo: generateRollNo(student._id, index),
        email: student.email,
        avatar: generateAvatar(student.name),
        color: colors[index % colors.length],
        isVerified: student.isAccountVerified,
      }));
  };

  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMode, setCurrentMode] = useState("assign");
  const [homeworkList, setHomeworkList] = useState([]);
  const [loadingHomework, setLoadingHomework] = useState(false);

  // Load student data on component mount
  useEffect(() => {
    const loadStudentData = async () => {
      try {
        setLoading(true);
        if (allUserData?.data && Array.isArray(allUserData.data)) {
          const students = generateStudentData(allUserData);
          setStudentsData(students);
        } else {
          if (typeof getAllUserData === "function") {
            await getAllUserData();
          }
        }
      } catch (error) {
        console.error("Error loading student data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, []);

  // Update students data when allUserData changes
  useEffect(() => {
    if (allUserData?.data && Array.isArray(allUserData.data)) {
      const students = generateStudentData(allUserData);
      setStudentsData(students);
      setLoading(false);
    }
  }, [allUserData]);

  const [formData, setFormData] = useState({
    studentId: "",
    studentName: "",
    selectedClass: null,
    homeworkTitle: "",
    homeworkDescription: "",
    homeworkType: "assignment",
    priority: "medium",
    additionalNotes: "",
  });

  const [message, setMessage] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  const homeworkTypes = [
    {
      id: "assignment",
      name: "Assignment",
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "reading",
      name: "Reading",
      icon: BookOpen,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "practice",
      name: "Practice",
      icon: PlusCircle,
      color: "from-purple-500 to-indigo-500",
    },
    {
      id: "project",
      name: "Project",
      icon: AlertCircle,
      color: "from-orange-500 to-red-500",
    },
  ];

  const priorityLevels = [
    {
      id: "low",
      name: "Low Priority",
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-500/20",
      textColor: "text-gray-300",
      borderColor: "border-gray-500/30",
    },
    {
      id: "medium",
      name: "Medium Priority",
      color: "from-yellow-500 to-orange-500",
      bgColor: "bg-yellow-500/20",
      textColor: "text-yellow-300",
      borderColor: "border-yellow-500/30",
    },
    {
      id: "high",
      name: "High Priority",
      color: "from-red-500 to-pink-500",
      bgColor: "bg-red-500/20",
      textColor: "text-red-300",
      borderColor: "border-red-500/30",
    },
  ];

  const fetchHomeworkAssignments = async () => {
    try {
      setLoadingHomework(true);
      const res = await axios.get(`${backend_url}/api/homework/`);
      if (res.data) {
        setHomeworkList(res.data);
      }
    } catch (error) {
      console.error("Error fetching homework:", error);
      toast.error("Error fetching homework assignments");
    } finally {
      setLoadingHomework(false);
    }
  };

  const toggleHomeworkCompletion = async (homeworkId, currentStatus) => {
    try {
      const newStatus = currentStatus === "completed" ? "pending" : "completed";

      const res = await axios.put(`${backend_url}/api/homework/${homeworkId}`, {
        status: newStatus,
        completedDate: newStatus === "completed" ? new Date() : null,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        // Update local state
        setHomeworkList((prev) =>
          prev.map((hw) =>
            hw._id === homeworkId
              ? {
                  ...hw,
                  status: newStatus,
                  completedDate: newStatus === "completed" ? new Date() : null,
                }
              : hw
          )
        );
      }
    } catch (error) {
      console.error("Error updating homework status:", error);
      toast.error("Error updating homework status");
    }
  };

  // Get available classes for selected student
  const getAvailableClasses = (studentId) => {
    if (!allSchedule || !Array.isArray(allSchedule) || !studentId) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return allSchedule
      .filter(
        (scheduleClass) =>
          scheduleClass.studentsEnrolled &&
          scheduleClass.studentsEnrolled.includes(studentId)
      )
      .map((scheduleClass) => ({
        ...scheduleClass,
        classDate: new Date(scheduleClass.classDate),
      }))
      .filter((scheduleClass) => {
        const classDate = new Date(scheduleClass.classDate);
        classDate.setHours(0, 0, 0, 0);
        return classDate >= today;
      })
      .sort((a, b) => a.classDate - b.classDate)
      .slice(0, 2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStudentSelect = (student) => {
    setFormData((prev) => ({
      ...prev,
      studentId: student.id,
      studentName: student.name,
      selectedClass: null,
    }));
    setShowStudentDropdown(false);
    setStudentSearch("");
  };

  const handleClassSelect = (selectedClass) => {
    setFormData((prev) => ({
      ...prev,
      selectedClass: selectedClass,
    }));
    setShowClassDropdown(false);
  };

  const handleTypeSelect = (type) => {
    setFormData((prev) => ({
      ...prev,
      homeworkType: type.id,
    }));
    setShowTypeDropdown(false);
  };

  const handlePrioritySelect = (priority) => {
    setFormData((prev) => ({
      ...prev,
      priority: priority.id,
    }));
    setShowPriorityDropdown(false);
  };

  const filteredStudents = studentsData.filter(
    (student) =>
      student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleSubmit = async () => {
    if (!formData.selectedClass) {
      toast.error("Please select a class");
      return;
    }

    if (!formData.homeworkTitle.trim()) {
      toast.error("Please enter homework title");
      return;
    }

    if (!formData.homeworkDescription.trim()) {
      toast.error("Please enter homework description");
      return;
    }

    const payload = {
      studentId: formData.studentId,
      studentName: formData.studentName,
      classScheduleId: formData.selectedClass._id,
      homeworkTitle: formData.homeworkTitle,
      homeworkDescription: formData.homeworkDescription,
      homeworkType: formData.homeworkType,
      priority: formData.priority,
      additionalNotes: formData.additionalNotes,
    };

    try {
      const res = await axios.post(`${backend_url}/api/homework/add`, payload);
      if (res.data.success) {
        toast.success(res.data.message);
      }

      setTimeout(() => {
        setMessage("✅ Homework assigned successfully!");
        setFormData({
          studentId: "",
          studentName: "",
          selectedClass: null,
          homeworkTitle: "",
          homeworkDescription: "",
          homeworkType: "assignment",
          priority: "medium",
          additionalNotes: "",
        });

        setTimeout(() => {
          setMessage("");
        }, 3000);
      }, 1000);
    } catch (error) {
      console.error("Error assigning homework:", error);
      toast.error("Error assigning homework");
      setMessage("❌ Error assigning homework");
      setTimeout(() => {
        setMessage("");
      }, 3000);
    }
  };

  const selectedStudent = studentsData.find((s) => s.id === formData.studentId);
  const availableClasses = getAvailableClasses(formData.studentId);
  const selectedType = homeworkTypes.find(
    (t) => t.id === formData.homeworkType
  );
  const selectedPriority = priorityLevels.find(
    (p) => p.id === formData.priority
  );

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 px-6 py-12 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading students...</p>
        </div>
      </div>
    );
  }

  // Show error state if no students found
  if (!studentsData.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 px-6 py-12 text-white flex items-center justify-center">
        <div className="text-center">
          <User size={64} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">No Students Found</h2>
          <p className="text-gray-300 mb-4">
            No student data is available at the moment.
          </p>
          <button
            onClick={() => getAllUserData && getAllUserData()}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl hover:from-emerald-600 hover:to-cyan-700 transition font-semibold"
          >
            Refresh Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 px-6 py-12 text-white">
      <div className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          {/* Mode Toggle */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-1 border border-white/20">
              <button
                onClick={() => setCurrentMode("assign")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentMode === "assign"
                    ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-lg"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <PlusCircle size={18} className="inline mr-2" />
                Assign Homework
              </button>
              <button
                onClick={() => {
                  setCurrentMode("update");
                  fetchHomeworkAssignments();
                }}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentMode === "update"
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <Edit size={18} className="inline mr-2" />
                Update Status
              </button>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
            {currentMode === "assign"
              ? "Assign Homework"
              : "Update Homework Status"}
          </h2>
          <p className="text-gray-300">
            {currentMode === "assign"
              ? "Assign homework to individual students"
              : "Update completion status of homework assignments"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Total Students: {studentsData.length}
          </p>
        </div>

        {/* Student Selection Cards for Update Mode */}
        {currentMode === "update" && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              Select Student
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentsData.map((student) => {
                const studentHomework = homeworkList.filter(
                  (hw) => hw.studentId === student.id
                );
                const completedCount = studentHomework.filter(
                  (hw) => hw.status === "completed"
                ).length;
                const totalCount = studentHomework.length;

                return (
                  <div
                    key={student.id}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        studentId: student.id,
                        studentName: student.name,
                      }))
                    }
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 ${
                      formData.studentId === student.id
                        ? "border-emerald-400 bg-emerald-500/10"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${student.color} flex items-center justify-center text-white font-bold text-sm mr-3`}
                      >
                        {student.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-300">
                          {student.rollNo}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-300">
                        Homework: {completedCount}/{totalCount}
                      </div>
                      <div className="flex items-center gap-2">
                        {student.isVerified && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Verified
                          </span>
                        )}
                        {totalCount > 0 && (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                              completedCount === totalCount
                                ? "bg-green-500/20 text-green-300 border-green-500/30"
                                : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            } border`}
                          >
                            {completedCount === totalCount
                              ? "Complete"
                              : "Pending"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Homework List for Selected Student */}
        {currentMode === "update" && formData.studentId && (
          <div className="mb-8 bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-bold mb-4 text-white">
              Homework for {formData.studentName}
            </h3>

            {loadingHomework ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-gray-300">Loading homework...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {homeworkList
                  .filter((hw) => hw.studentId === formData.studentId)
                  .map((homework) => (
                    <div
                      key={homework._id}
                      className={`p-4 rounded-xl border transition-all ${
                        homework.status === "completed"
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4
                              className={`font-semibold ${
                                homework.status === "completed"
                                  ? "text-green-300"
                                  : "text-white"
                              }`}
                            >
                              {homework.homeworkTitle}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                priorityLevels.find(
                                  (p) => p.id === homework.priority
                                )?.bgColor
                              } ${
                                priorityLevels.find(
                                  (p) => p.id === homework.priority
                                )?.textColor
                              } ${
                                priorityLevels.find(
                                  (p) => p.id === homework.priority
                                )?.borderColor
                              } border`}
                            >
                              {
                                priorityLevels
                                  .find((p) => p.id === homework.priority)
                                  ?.name.split(" ")[0]
                              }
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/10 text-white border border-white/20`}
                            >
                              {
                                homeworkTypes.find(
                                  (t) => t.id === homework.homeworkType
                                )?.name
                              }
                            </span>
                          </div>

                          <p className="text-gray-300 text-sm mb-2">
                            {homework.homeworkDescription}
                          </p>

                          {homework.additionalNotes && (
                            <p className="text-gray-400 text-xs mb-2">
                              Notes: {homework.additionalNotes}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>
                              Assigned:{" "}
                              {new Date(
                                homework.createdAt
                              ).toLocaleDateString()}
                            </span>
                            {homework.status === "completed" &&
                              homework.completedDate && (
                                <span>
                                  Completed:{" "}
                                  {new Date(
                                    homework.completedDate
                                  ).toLocaleDateString()}
                                </span>
                              )}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            toggleHomeworkCompletion(
                              homework._id,
                              homework.status
                            )
                          }
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            homework.status === "completed"
                              ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                              : "bg-gray-500/20 text-gray-300 hover:bg-gray-500/30"
                          }`}
                        >
                          {homework.status === "completed" ? (
                            <>
                              <CheckCircle size={16} />
                              <span>Completed</span>
                            </>
                          ) : (
                            <>
                              <Circle size={16} />
                              <span>Mark Complete</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}

                {homeworkList.filter(
                  (hw) => hw.studentId === formData.studentId
                ).length === 0 && (
                  <p className="text-gray-300 text-center py-8">
                    No homework assignments found for this student
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {message && (
          <div className="mb-6 text-center text-lg font-medium text-green-300 bg-green-500/10 py-3 px-6 rounded-xl border border-green-500/20">
            {message}
          </div>
        )}

        {/* Assignment Form - Only show in assign mode */}
        {currentMode === "assign" && (
          <>
            {/* Selected Student Info */}
            {selectedStudent && (
              <div className="mb-6 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 p-4 rounded-2xl border border-emerald-400/30">
                <div className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${selectedStudent.color} flex items-center justify-center text-white font-bold text-sm mr-4`}
                  >
                    {selectedStudent.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-emerald-200">
                      {selectedStudent.name}
                    </div>
                    <div className="text-sm text-gray-300 flex items-center flex-wrap gap-2">
                      <span>Roll No: {selectedStudent.rollNo}</span>
                      <span>Email: {selectedStudent.email}</span>
                      {selectedStudent.isVerified && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Class Info */}
            {formData.selectedClass && (
              <div className="mb-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-2xl border border-blue-400/30">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm mr-4">
                    <BookOpen size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-blue-200">
                      {formData.selectedClass.className}
                    </div>
                    <div className="text-sm text-gray-300 flex items-center flex-wrap gap-2">
                      <span>
                        {formatDate(formData.selectedClass.classDate)}
                      </span>
                      <span>
                        {formatTime(formData.selectedClass.classTime)}
                      </span>
                      <span>
                        Duration: {formData.selectedClass.classDuration}h
                      </span>
                      {isToday(formData.selectedClass.classDate) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">
                          Today
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Student Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Select Student
                </label>
                <div
                  onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                  className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:ring-2 ring-emerald-400 transition backdrop-blur-sm cursor-pointer"
                >
                  <User size={18} className="text-gray-300 mr-3" />
                  <span className="text-white flex-1">
                    {selectedStudent
                      ? `${selectedStudent.name} (${selectedStudent.rollNo})`
                      : "Choose a student..."}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${
                      showStudentDropdown ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {showStudentDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl z-40 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <div className="flex items-center bg-white/5 rounded-xl px-3 py-2">
                        <Search size={16} className="text-gray-400 mr-2" />
                        <input
                          type="text"
                          placeholder="Search students..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="bg-transparent text-white w-full outline-none placeholder:text-gray-400 text-sm"
                        />
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          onClick={() => handleStudentSelect(student)}
                          className="flex items-center p-4 hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg bg-gradient-to-r ${student.color} flex items-center justify-center text-white font-bold text-sm mr-3`}
                          >
                            {student.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-white">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-300 flex items-center gap-2">
                              <span>{student.rollNo}</span>
                              <span>{student.email}</span>
                              {student.isVerified && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {filteredStudents.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                          No students found matching your search
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Class Selection */}
              {formData.studentId && (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Select Class
                  </label>
                  <div
                    onClick={() => setShowClassDropdown(!showClassDropdown)}
                    className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:ring-2 ring-blue-400 transition backdrop-blur-sm cursor-pointer"
                  >
                    <Calendar size={18} className="text-gray-300 mr-3" />
                    <span className="text-white flex-1">
                      {formData.selectedClass
                        ? `${formData.selectedClass.className} - ${formatDate(
                            formData.selectedClass.classDate
                          )}`
                        : "Choose a class..."}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-400 transition-transform ${
                        showClassDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {showClassDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl z-40 overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        {availableClasses.map((classItem) => (
                          <div
                            key={classItem._id}
                            onClick={() => handleClassSelect(classItem)}
                            className="flex items-center p-4 hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm mr-3">
                              <BookOpen size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-white">
                                {classItem.className}
                              </div>
                              <div className="text-sm text-gray-300 flex items-center gap-2">
                                <span>{formatDate(classItem.classDate)}</span>
                                <span>{formatTime(classItem.classTime)}</span>
                                <span>
                                  Duration: {classItem.classDuration}h
                                </span>
                                {isToday(classItem.classDate) && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                    Today
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {availableClasses.length === 0 && (
                          <div className="p-8 text-center text-gray-400">
                            No upcoming classes found for this student
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Homework Details */}
              {formData.selectedClass && (
                <>
                  {/* Homework Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Homework Title
                    </label>
                    <div className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:ring-2 ring-emerald-400 transition backdrop-blur-sm">
                      <FileText size={18} className="text-gray-300 mr-3" />
                      <input
                        type="text"
                        name="homeworkTitle"
                        value={formData.homeworkTitle}
                        onChange={handleChange}
                        placeholder="Enter homework title..."
                        className="bg-transparent text-white w-full outline-none placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Homework Type */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Homework Type
                    </label>
                    <div
                      onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                      className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:ring-2 ring-purple-400 transition backdrop-blur-sm cursor-pointer"
                    >
                      {selectedType && (
                        <selectedType.icon
                          size={18}
                          className="text-gray-300 mr-3"
                        />
                      )}
                      <span className="text-white flex-1">
                        {selectedType ? selectedType.name : "Select type..."}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform ${
                          showTypeDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {showTypeDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl z-40 overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                          {homeworkTypes.map((type) => (
                            <div
                              key={type.id}
                              onClick={() => handleTypeSelect(type)}
                              className="flex items-center p-4 hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              <div
                                className={`w-10 h-10 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center text-white font-bold text-sm mr-3`}
                              >
                                <type.icon size={16} />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-white">
                                  {type.name}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Priority Level
                    </label>
                    <div
                      onClick={() =>
                        setShowPriorityDropdown(!showPriorityDropdown)
                      }
                      className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:ring-2 ring-orange-400 transition backdrop-blur-sm cursor-pointer"
                    >
                      <AlertCircle size={18} className="text-gray-300 mr-3" />
                      <span className="text-white flex-1">
                        {selectedPriority
                          ? selectedPriority.name
                          : "Select priority..."}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform ${
                          showPriorityDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {showPriorityDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl z-40 overflow-hidden">
                        <div className="max-h-64 overflow-y-auto">
                          {priorityLevels.map((priority) => (
                            <div
                              key={priority.id}
                              onClick={() => handlePrioritySelect(priority)}
                              className="flex items-center p-4 hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              <div
                                className={`w-10 h-10 rounded-lg bg-gradient-to-r ${priority.color} flex items-center justify-center text-white font-bold text-sm mr-3`}
                              >
                                <AlertCircle size={16} />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-white">
                                  {priority.name}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Homework Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Homework Description
                    </label>
                    <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:ring-2 ring-emerald-400 transition backdrop-blur-sm">
                      <div className="flex items-start">
                        <MessageSquare
                          size={18}
                          className="text-gray-300 mr-3 mt-1"
                        />
                        <textarea
                          name="homeworkDescription"
                          value={formData.homeworkDescription}
                          onChange={handleChange}
                          placeholder="Enter detailed description of the homework..."
                          rows={4}
                          className="bg-transparent text-white w-full outline-none placeholder:text-gray-400 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:ring-2 ring-emerald-400 transition backdrop-blur-sm">
                      <div className="flex items-start">
                        <FileText
                          size={18}
                          className="text-gray-300 mr-3 mt-1"
                        />
                        <textarea
                          name="additionalNotes"
                          value={formData.additionalNotes}
                          onChange={handleChange}
                          placeholder="Any additional notes or instructions..."
                          rows={3}
                          className="bg-transparent text-white w-full outline-none placeholder:text-gray-400 resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center pt-6">
                    <button
                      onClick={handleSubmit}
                      className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      <Save size={20} />
                      Assign Homework
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
