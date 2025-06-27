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
} from "lucide-react";

import { AppContent } from "../context/Context";
import axios from "axios";
import { toast } from "react-toastify";

export default function StudentAttendanceForm() {
  const { getAllUserData, allUserData, backend_url } = useContext(AppContent);

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
      // Generate roll number from ID
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
        status: "present", // Assuming all fetched students are present
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

        // If data is already available, use it
        if (allUserData?.data && Array.isArray(allUserData.data)) {
          const students = generateStudentData(allUserData);
          setStudentsData(students);
        } else {
          // Try to fetch data if not available
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
    className: "",
    date: "",
    classStartTime: "",
    classEndTime: "",
    topicCovered: "",
    additionalNotes: "",
  });

  const [message, setMessage] = useState("");
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [currentTimeField, setCurrentTimeField] = useState("");
  const [tempTime, setTempTime] = useState({
    hours: "09",
    minutes: "00",
    period: "AM",
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

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
    }));
    setShowStudentDropdown(false);
    setStudentSearch("");
  };

  const filteredStudents = studentsData.filter(
    (student) =>
      student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const openTimeModal = (fieldName, currentValue = "") => {
    setCurrentTimeField(fieldName);
    if (currentValue) {
      const [time, period] =
        currentValue.includes("AM") || currentValue.includes("PM")
          ? currentValue.split(" ")
          : [currentValue, "AM"];
      const [hours, minutes] = time.split(":");
      setTempTime({
        hours: hours.padStart(2, "0"),
        minutes: minutes.padStart(2, "0"),
        period: period || "AM",
      });
    } else {
      setTempTime({ hours: "09", minutes: "00", period: "AM" });
    }
    setShowTimeModal(true);
  };

  const handleTimeChange = (type, increment) => {
    setTempTime((prev) => {
      let newValue = { ...prev };

      if (type === "hours") {
        let hours = parseInt(prev.hours);
        hours += increment;
        if (hours > 12) hours = 1;
        if (hours < 1) hours = 12;
        newValue.hours = hours.toString().padStart(2, "0");
      } else if (type === "minutes") {
        let minutes = parseInt(prev.minutes);
        minutes += increment * 5;
        if (minutes >= 60) minutes = 0;
        if (minutes < 0) minutes = 55;
        newValue.minutes = minutes.toString().padStart(2, "0");
      } else if (type === "period") {
        newValue.period = prev.period === "AM" ? "PM" : "AM";
      }

      return newValue;
    });
  };

  const confirmTime = () => {
    const timeString = `${tempTime.hours}:${tempTime.minutes} ${tempTime.period}`;
    setFormData((prev) => ({
      ...prev,
      [currentTimeField]: timeString,
    }));
    setShowTimeModal(false);
  };

  // Date picker functions
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(newDate);
    setFormData((prev) => ({
      ...prev,
      date: formatDate(newDate),
    }));
    setShowDateModal(false);
  };

  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const convertTimeToDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;

    const [time, period] = timeStr.split(" ");
    const [hours, minutes] = time.split(":");
    let hour24 = parseInt(hours);

    if (period === "PM" && hour24 !== 12) {
      hour24 += 12;
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0;
    }

    const dateTime = new Date(dateStr);
    dateTime.setHours(hour24, parseInt(minutes), 0, 0);
    return dateTime.toISOString();
  };

  const handleSubmit = async () => {
    const payload = {
      studentId: formData.studentId,
      studentName: formData.studentName,
      className: formData.className,
      classStartAt: convertTimeToDateTime(
        formData.date,
        formData.classStartTime
      ),
      classEndAt: convertTimeToDateTime(formData.date, formData.classEndTime),
      topicCovered: formData.topicCovered,
      additionalNotes: formData.additionalNotes,
    };

    try {
      const res= await axios.post(`${backend_url}/api/attendence/add`,payload)
      if(res.data.success){
        toast.success(res.data.message)
      }
   
      setTimeout(() => {
        setMessage("✅ Student attendance recorded successfully!");
        setFormData({
          studentId: "",
          studentName: "",
          className: "",
          date: "",
          classStartTime: "",
          classEndTime: "",
          topicCovered: "",
          additionalNotes: "",
        });

        setTimeout(() => {
          setMessage("");
        }, 3000);
      }, 1000);
    } catch (error) {
      console.error("Error recording attendance:", error);
      toast.error("Error recording attendance:");
      setMessage("❌ Error recording attendance");
      setTimeout(() => {
        setMessage("");
      }, 3000);
    }
  };

  const selectedStudent = studentsData.find((s) => s.id === formData.studentId);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const today = new Date();

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
      {/* Time Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl max-w-sm w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Select Time</h3>
              <button
                onClick={() => setShowTimeModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex items-center justify-center space-x-4 mb-8">
              {/* Hours */}
              <div className="text-center">
                <button
                  onClick={() => handleTimeChange("hours", 1)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition mb-2"
                >
                  <ChevronUp size={20} />
                </button>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/20">
                  {tempTime.hours}
                </div>
                <button
                  onClick={() => handleTimeChange("hours", -1)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition mt-2"
                >
                  <ChevronDown size={20} />
                </button>
              </div>

              <div className="text-3xl font-bold text-white/60">:</div>

              {/* Minutes */}
              <div className="text-center">
                <button
                  onClick={() => handleTimeChange("minutes", 1)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition mb-2"
                >
                  <ChevronUp size={20} />
                </button>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/20">
                  {tempTime.minutes}
                </div>
                <button
                  onClick={() => handleTimeChange("minutes", -1)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition mt-2"
                >
                  <ChevronDown size={20} />
                </button>
              </div>

              {/* AM/PM */}
              <div className="text-center">
                <button
                  onClick={() => handleTimeChange("period")}
                  className="w-16 h-20 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-2xl flex items-center justify-center text-lg font-bold border border-white/20 hover:from-emerald-500/40 hover:to-cyan-500/40 transition"
                >
                  {tempTime.period}
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowTimeModal(false)}
                className="flex-1 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition border border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={confirmTime}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl hover:from-emerald-600 hover:to-cyan-700 transition font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20 shadow-2xl max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Select Date</h3>
              <button
                onClick={() => setShowDateModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <h4 className="text-lg font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h4>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm text-white/60 py-2 font-medium"
                >
                  {day}
                </div>
              ))}

              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} className="h-10"></div>
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const isToday =
                  today.getDate() === day &&
                  today.getMonth() === currentDate.getMonth() &&
                  today.getFullYear() === currentDate.getFullYear();
                const isSelected =
                  selectedDate &&
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === currentDate.getMonth() &&
                  selectedDate.getFullYear() === currentDate.getFullYear();

                return (
                  <button
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-medium transition ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white"
                        : isToday
                          ? "bg-white/20 text-white ring-2 ring-emerald-400"
                          : "hover:bg-white/10 text-white/80"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDateModal(false)}
                className="flex-1 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition border border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedDate) {
                    setFormData((prev) => ({
                      ...prev,
                      date: formatDate(selectedDate),
                    }));
                  }
                  setShowDateModal(false);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl hover:from-emerald-600 hover:to-cyan-700 transition font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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

        <div className="space-y-6">
          {/* Enhanced Student Dropdown */}
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
                {/* Search */}
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

                {/* Student List */}
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

          {/* Class Name and Enhanced Date Picker */}
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Class Name"
              name="className"
              value={formData.className}
              onChange={handleChange}
              Icon={BookOpen}
              required
            />

            {/* Enhanced Date Input */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Date
              </label>
              <div
                onClick={() => setShowDateModal(true)}
                className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:ring-2 ring-emerald-400 transition backdrop-blur-sm cursor-pointer hover:bg-white/10"
              >
                <Calendar size={18} className="text-gray-300 mr-3" />
                <span className="text-white flex-1">
                  {formData.date
                    ? new Date(formData.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Select date..."}
                </span>
                <Calendar size={16} className="text-gray-400 ml-2" />
              </div>
            </div>
          </div>

          {/* Class Times */}
          <div className="grid md:grid-cols-2 gap-6">
            <TimeInput
              label="Class Start Time"
              name="classStartTime"
              value={formData.classStartTime}
              onClick={() =>
                openTimeModal("classStartTime", formData.classStartTime)
              }
              Icon={Clock}
              required
            />
            <TimeInput
              label="Class End Time"
              name="classEndTime"
              value={formData.classEndTime}
              onClick={() =>
                openTimeModal("classEndTime", formData.classEndTime)
              }
              Icon={Clock}
              required
            />
          </div>

          {/* Topics Covered */}
          <TextArea
            label="Topics Covered"
            name="topicCovered"
            value={formData.topicCovered}
            onChange={handleChange}
            Icon={BookOpen}
            placeholder="What topics were covered in this class..."
            rows={3}
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
              !formData.className ||
              !formData.date ||
              !formData.classStartTime ||
              !formData.classEndTime
            }
            className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-2xl text-lg font-semibold hover:from-emerald-600 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <CheckCircle2 size={20} />
            Record Attendance
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  Icon,
  required = false,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {label}
      </label>
      <div className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus-within:ring-2 ring-emerald-400 transition backdrop-blur-sm">
        {Icon && <Icon size={18} className="text-gray-300 mr-3" />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="bg-transparent text-white w-full outline-none placeholder:text-gray-400"
          placeholder={placeholder || label}
          required={required}
        />
      </div>
    </div>
  );
}

function TimeInput({ label, name, value, onClick, Icon, required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {label}
      </label>
      <div
        onClick={onClick}
        className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:ring-2 ring-emerald-400 transition backdrop-blur-sm cursor-pointer hover:bg-white/10"
      >
        {Icon && <Icon size={18} className="text-gray-300 mr-3" />}
        <input
          type="text"
          name={name}
          value={value}
          readOnly
          className="bg-transparent text-white w-full outline-none placeholder:text-gray-400 cursor-pointer"
          placeholder="Select time..."
          required={required}
        />
        <Clock size={16} className="text-gray-400 ml-2" />
      </div>
    </div>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  Icon,
  required = false,
  placeholder,
  rows = 3,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {label}
      </label>
      <div className="flex items-start bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus-within:ring-2 ring-emerald-400 transition backdrop-blur-sm">
        {Icon && <Icon size={18} className="text-gray-300 mr-3 mt-1" />}
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          className="bg-transparent text-white w-full outline-none placeholder:text-gray-400 resize-none"
          placeholder={placeholder || label}
          rows={rows}
          required={required}
        />
      </div>
    </div>
  );
}
