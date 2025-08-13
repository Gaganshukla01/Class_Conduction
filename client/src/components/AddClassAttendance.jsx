import React, { useState, useContext, useEffect } from "react";
import {
  User,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  MessageSquare,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  History,
} from "lucide-react";

import { AppContent } from "../context/Context";
import axios from "axios";
import { toast } from "react-toastify";

export default function StudentAttendanceForm() {
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
        status: "present",
        avatar: generateAvatar(student.name),
        color: colors[index % colors.length],
        isVerified: student.isAccountVerified,
      }));
  };

  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);

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
    topicCovered: "",
    additionalNotes: "",
  });

  const [message, setMessage] = useState("");
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [showPastClasses, setShowPastClasses] = useState(false);

  // Get available classes for selected student (including past classes)
  const getAvailableClasses = (studentId) => {
    if (!allSchedule || !Array.isArray(allSchedule) || !studentId) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrolledClasses = allSchedule
      .filter(
        (scheduleClass) =>
          scheduleClass.studentsEnrolled &&
          scheduleClass.studentsEnrolled.includes(studentId)
      )
      .map((scheduleClass) => ({
        ...scheduleClass,
        classDate: new Date(scheduleClass.classDate),
      }));

    // Separate past and upcoming classes
    const pastClasses = enrolledClasses
      .filter((scheduleClass) => {
        const classDate = new Date(scheduleClass.classDate);
        classDate.setHours(0, 0, 0, 0);
        return classDate < today;
      })
      .sort((a, b) => b.classDate - a.classDate) // Sort past classes in descending order
      .slice(0, 5); // Show last 5 past classes

    const upcomingClasses = enrolledClasses
      .filter((scheduleClass) => {
        const classDate = new Date(scheduleClass.classDate);
        classDate.setHours(0, 0, 0, 0);
        return classDate >= today;
      })
      .sort((a, b) => a.classDate - b.classDate) // Sort upcoming classes in ascending order
      .slice(0, 2); // Show next 2 upcoming classes

    return { pastClasses, upcomingClasses };
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

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const classDate = new Date(date);
    classDate.setHours(0, 0, 0, 0);
    return classDate < today;
  };

  const getRelativeDateText = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const classDate = new Date(date);
    classDate.setHours(0, 0, 0, 0);

    const diffTime = classDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  };

  const handleSubmit = async () => {
    if (!formData.selectedClass) {
      toast.error("Please select a class");
      return;
    }

    if (!formData.topicCovered.trim()) {
      toast.error("Topics covered is required");
      return;
    }

    const payload = {
      id: formData.selectedClass._id,
      attendance: "Present",
      notes: formData.additionalNotes,
      topicCovered: formData.topicCovered,
    };

    try {
      const res = await axios.put(
        `${backend_url}/api/classschedule/markattendence`,
        payload
      );
      if (res.data.success) {
        toast.success(res.data.message);

        setTimeout(() => {
          const isPast = isPastDate(formData.selectedClass.classDate);
          setMessage(
            `✅ ${isPast ? "Past class" : "Student"} attendance recorded successfully!`
          );
          setFormData({
            studentId: "",
            studentName: "",
            selectedClass: null,
            topicCovered: "",
            additionalNotes: "",
          });

          setTimeout(() => {
            setMessage("");
          }, 3000);
        }, 1000);
      }
    } catch (error) {
      console.error("Error recording attendance:", error);
      toast.error(
        error.response?.data?.message || "Error recording attendance"
      );
      setMessage("❌ Error recording attendance");
      setTimeout(() => {
        setMessage("");
      }, 3000);
    }
  };

  const selectedStudent = studentsData.find((s) => s.id === formData.studentId);
  const { pastClasses, upcomingClasses } = formData.studentId
    ? getAvailableClasses(formData.studentId)
    : { pastClasses: [], upcomingClasses: [] };

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
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
            Student Attendance
          </h2>
          <p className="text-gray-300">Record present student attendance</p>
          <p className="text-sm text-gray-400 mt-1">
            Total Students: {studentsData.length}
          </p>
        </div>

        {message && (
          <div className="mb-6 text-center text-lg font-medium text-green-300 bg-green-500/10 py-3 px-6 rounded-xl border border-green-500/20">
            {message}
          </div>
        )}

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
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                    <CheckCircle2 size={12} className="mr-1" />
                    Present
                  </span>
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
          <div
            className={`mb-6 bg-gradient-to-r ${
              isPastDate(formData.selectedClass.classDate)
                ? "from-orange-500/20 to-red-500/20 border-orange-400/30"
                : "from-blue-500/20 to-purple-500/20 border-blue-400/30"
            } p-4 rounded-2xl border`}
          >
            <div className="flex items-center">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${
                  isPastDate(formData.selectedClass.classDate)
                    ? "from-orange-500 to-red-500"
                    : "from-blue-500 to-purple-500"
                } flex items-center justify-center text-white font-bold text-sm mr-4`}
              >
                {isPastDate(formData.selectedClass.classDate) ? (
                  <History size={20} />
                ) : (
                  <BookOpen size={20} />
                )}
              </div>
              <div className="flex-1">
                <div
                  className={`font-semibold ${
                    isPastDate(formData.selectedClass.classDate)
                      ? "text-orange-200"
                      : "text-blue-200"
                  }`}
                >
                  {formData.selectedClass.className}
                </div>
                <div className="text-sm text-gray-300 flex items-center flex-wrap gap-2">
                  <span>{formatDate(formData.selectedClass.classDate)}</span>
                  <span>{formatTime(formData.selectedClass.classTime)}</span>
                  <span>Duration: {formData.selectedClass.classDuration}h</span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      isPastDate(formData.selectedClass.classDate)
                        ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                        : isToday(formData.selectedClass.classDate)
                          ? "bg-green-500/20 text-green-300 border border-green-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    }`}
                  >
                    {getRelativeDateText(formData.selectedClass.classDate)}
                  </span>
                  {isPastDate(formData.selectedClass.classDate) && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/30">
                      <AlertCircle size={10} className="mr-1" />
                      Past Class
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
              Select Present Student
            </label>
            <div
              onClick={() => setShowStudentDropdown(!showStudentDropdown)}
              className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:ring-2 ring-emerald-400 transition backdrop-blur-sm cursor-pointer"
            >
              <User size={18} className="text-gray-300 mr-3" />
              <span className="text-white flex-1">
                {selectedStudent
                  ? `${selectedStudent.name} (${selectedStudent.rollNo})`
                  : "Choose a present student..."}
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${showStudentDropdown ? "rotate-180" : ""}`}
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
                      className="flex items-center p-4 hover:bg-white/10 cursor-pointer transition group"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-r ${student.color} flex items-center justify-center text-white font-bold text-xs mr-3 group-hover:scale-110 transition-transform`}
                      >
                        {student.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-400">
                          <span className="mr-3">Roll: {student.rollNo}</span>
                          <span>{student.email}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                          <CheckCircle2 size={10} className="mr-1" />
                          Present
                        </span>
                        {student.isVerified && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {filteredStudents.length === 0 && (
                    <div className="p-4 text-center text-gray-400">
                      No students found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Class Dropdown */}
          {formData.studentId && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Select Class
              </label>
              <div
                onClick={() => setShowClassDropdown(!showClassDropdown)}
                className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:ring-2 ring-emerald-400 transition backdrop-blur-sm cursor-pointer"
              >
                <BookOpen size={18} className="text-gray-300 mr-3" />
                <span className="text-white flex-1">
                  {formData.selectedClass
                    ? `${formData.selectedClass.className} - ${formatDate(formData.selectedClass.classDate)}`
                    : "Choose a class..."}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform ${showClassDropdown ? "rotate-180" : ""}`}
                />
              </div>

              {showClassDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl z-40 overflow-hidden">
                  {/* Toggle for showing past classes */}
                  <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">
                        Show past classes
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowPastClasses(!showPastClasses);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          showPastClasses ? "bg-emerald-600" : "bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            showPastClasses ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {/* Upcoming Classes */}
                    {upcomingClasses.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-blue-500/10 border-b border-white/5">
                          <div className="text-xs font-semibold text-blue-300 flex items-center">
                            <BookOpen size={12} className="mr-1" />
                            Upcoming Classes
                          </div>
                        </div>
                        {upcomingClasses.map((classItem) => (
                          <div
                            key={classItem._id}
                            onClick={() => handleClassSelect(classItem)}
                            className="flex items-center p-4 hover:bg-white/10 cursor-pointer transition group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs mr-3 group-hover:scale-110 transition-transform">
                              <BookOpen size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-white">
                                {classItem.className}
                              </div>
                              <div className="text-sm text-gray-400 flex items-center gap-2">
                                <span>{formatDate(classItem.classDate)}</span>
                                <span>{formatTime(classItem.classTime)}</span>
                                <span>
                                  Duration: {classItem.classDuration}h
                                </span>
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                    isToday(classItem.classDate)
                                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  }`}
                                >
                                  {getRelativeDateText(classItem.classDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Past Classes */}
                    {showPastClasses && pastClasses.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-orange-500/10 border-b border-white/5">
                          <div className="text-xs font-semibold text-orange-300 flex items-center">
                            <History size={12} className="mr-1" />
                            Past Classes
                          </div>
                        </div>
                        {pastClasses.map((classItem) => (
                          <div
                            key={classItem._id}
                            onClick={() => handleClassSelect(classItem)}
                            className="flex items-center p-4 hover:bg-white/10 cursor-pointer transition group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xs mr-3 group-hover:scale-110 transition-transform">
                              <History size={16} />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-white">
                                {classItem.className}
                              </div>
                              <div className="text-sm text-gray-400 flex items-center gap-2">
                                <span>{formatDate(classItem.classDate)}</span>
                                <span>{formatTime(classItem.classTime)}</span>
                                <span>
                                  Duration: {classItem.classDuration}h
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                  {getRelativeDateText(classItem.classDate)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* No classes message */}
                    {upcomingClasses.length === 0 &&
                      (!showPastClasses || pastClasses.length === 0) && (
                        <div className="p-4 text-center text-gray-400">
                          {upcomingClasses.length === 0 &&
                          pastClasses.length === 0
                            ? "No classes found for this student"
                            : !showPastClasses
                              ? "No upcoming classes found. Enable 'Show past classes' to see previous classes."
                              : "No past classes found"}
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning for past classes */}
          {formData.selectedClass &&
            isPastDate(formData.selectedClass.classDate) && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <div className="flex items-center text-orange-300">
                  <AlertCircle size={16} className="mr-2" />
                  <span className="text-sm font-medium">
                    You are marking attendance for a past class. This will
                    record attendance retroactively.
                  </span>
                </div>
              </div>
            )}

          <TextArea
            label="Topics Covered *"
            name="topicCovered"
            value={formData.topicCovered}
            onChange={handleChange}
            Icon={BookOpen}
            placeholder="What topics were covered in this class..."
            rows={3}
            required={true}
          />

          {/* Additional Notes */}
          <TextArea
            label="Additional Notes"
            name="additionalNotes"
            value={formData.additionalNotes}
            onChange={handleChange}
            Icon={MessageSquare}
            placeholder="Any additional notes about the student's participation..."
            rows={3}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              !formData.studentId ||
              !formData.selectedClass ||
              !formData.topicCovered.trim()
            }
            className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-2xl text-lg font-semibold hover:from-emerald-600 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <CheckCircle2 size={20} />
            {formData.selectedClass &&
            isPastDate(formData.selectedClass.classDate)
              ? "Record Past Class Attendance"
              : "Record Present Attendance"}
          </button>
        </div>
      </div>
    </div>
  );
}

// TextArea Component
const TextArea = ({
  label,
  name,
  value,
  onChange,
  Icon,
  placeholder,
  rows = 3,
  required = false,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <div className="absolute top-3 left-3 text-gray-400">
          <Icon size={18} />
        </div>
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          required={required}
          className="w-full bg-white/5 rounded-xl px-4 py-3 pl-12 border border-white/10 text-white placeholder:text-gray-400 hover:ring-2 ring-emerald-400 focus:ring-2 focus:ring-emerald-400 transition backdrop-blur-sm resize-none outline-none"
        />
      </div>
    </div>
  );
};
