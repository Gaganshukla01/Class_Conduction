import React, { useState, useContext, useEffect } from "react";
import {
  Calendar,
  Clock,
  Users,
  User,
  Link,
  FileText,
  ChevronDown,
  Check,
  X,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Trash2,
} from "lucide-react";
import { AppContent } from "../context/Context";
import axios from "axios";
import { toast } from "react-toastify";

export default function AddClassSchedule() {
  const { getAllUserData, allUserData, backend_url, allCourse } =
    useContext(AppContent);
  console.log(allCourse);
  const [instructors, setInstructors] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (allUserData && allUserData.data) {
      // Filter instructors (userType: "admin")
      const instructorList = allUserData.data
        .filter((user) => user.userType === "admin")
        .map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          department: "Tech",
          avatar: "👨‍🏫",
          specialty: "Teaching",
        }));

      const getCurrentYear = () => {
        return new Date().getFullYear();
      };

      const currentYear = getCurrentYear();

      const studentList = allUserData.data
        .filter((user) => user.userType === "student")
        .map((user) => ({
          id: user._id,
          name: user.name,
          email: user.email,
          year: currentYear,
          avatar: "👨‍🎓",
          major: "Studies",
        }));

      setInstructors(instructorList);
      setStudents(studentList);
    }
  }, [allUserData]);

  const [formData, setFormData] = useState({
    className: "",
    instructorId: "",
    studentsEnrolled: [],
    classLink: "",
    classRate: "",
    classDuration: "",
    weeklySchedule: [],
  });

  const [message, setMessage] = useState("");
  const [instructorDropdownOpen, setInstructorDropdownOpen] = useState(false);
  const [studentDropdownOpen, setStudentDropdownOpen] = useState(false);
  const [classNameDropdownOpen, setClassNameDropdownOpen] = useState(false);

  // For adding new schedule
  const [newSchedule, setNewSchedule] = useState({
    date: "",
    time: "",
    datePickerOpen: false,
    timePickerOpen: false,
    selectedHour: "09",
    selectedMinute: "00",
    selectedPeriod: "AM",
  });

  // Date picker state
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleInstructorSelect = (instructorId) => {
    setFormData((prev) => ({ ...prev, instructorId }));
    setInstructorDropdownOpen(false);
  };

  const handleClassNameSelect = (className) => {
    setFormData((prev) => ({ ...prev, className }));
    setClassNameDropdownOpen(false);
  };

  const handleStudentToggle = (studentId) => {
    setFormData((prev) => ({
      ...prev,
      studentsEnrolled: prev.studentsEnrolled.includes(studentId)
        ? prev.studentsEnrolled.filter((id) => id !== studentId)
        : [...prev.studentsEnrolled, studentId],
    }));
  };

  const handleNewScheduleTimeChange = () => {
    let hour24;

    if (newSchedule.selectedPeriod === "AM") {
      // For AM: 12 AM = 00, 1-11 AM = 01-11
      if (newSchedule.selectedHour === "12") {
        hour24 = "00";
      } else {
        hour24 = newSchedule.selectedHour.padStart(2, "0");
      }
    } else {
      // For PM: 12 PM = 12, 1-11 PM = 13-23
      if (newSchedule.selectedHour === "12") {
        hour24 = "12";
      } else {
        hour24 = String(parseInt(newSchedule.selectedHour) + 12).padStart(
          2,
          "0"
        );
      }
    }

    const time24 = `${hour24}:${newSchedule.selectedMinute}`;

    setNewSchedule((prev) => ({
      ...prev,
      time: time24,
      timePickerOpen: false,
    }));
  };

  const addScheduleToWeek = () => {
    if (newSchedule.date && newSchedule.time) {
      // Check if this date already exists
      const existingSchedule = formData.weeklySchedule.find(
        (schedule) => schedule.date === newSchedule.date
      );

      if (existingSchedule) {
        toast.error("A class is already scheduled for this date");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        weeklySchedule: [
          ...prev.weeklySchedule,
          {
            date: newSchedule.date,
            time: newSchedule.time,
          },
        ],
      }));

      // Reset new schedule form
      setNewSchedule({
        date: "",
        time: "",
        datePickerOpen: false,
        timePickerOpen: false,
        selectedHour: "09",
        selectedMinute: "00",
        selectedPeriod: "AM",
      });

      toast.success("Schedule added successfully!");
    } else {
      toast.error("Please select both date and time");
    }
  };

  const removeScheduleFromWeek = (index) => {
    setFormData((prev) => ({
      ...prev,
      weeklySchedule: prev.weeklySchedule.filter((_, i) => i !== index),
    }));
    toast.success("Schedule removed successfully!");
  };

  const formatTime12Hour = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":");
    const hour12 =
      hours === "00" ? "12" : hours > "12" ? String(hours - 12) : hours;
    const period = hours >= "12" ? "PM" : "AM";
    return `${hour12.padStart(2, "0")}:${minutes} ${period}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.weeklySchedule.length === 0) {
      toast.error("Please add at least one schedule");
      return;
    }

    try {
      const classData = {
        className: formData.className,
        instructorId: formData.instructorId,
        studentsEnrolled: formData.studentsEnrolled,
        classLink: formData.classLink,
        classDuration: formData.classDuration,
        classRate: formData.classRate,
        weeklySchedule: formData.weeklySchedule,
      };

      await axios.post(`${backend_url}/api/classschedule/add`, classData);
      toast.success(
        `${formData.weeklySchedule.length * 30} classes created successfully! (30 weeks for each selected date)`
      );
      setFormData({
        className: "",
        instructorId: "",
        studentsEnrolled: [],
        classLink: "",
        classDuration: "",
        classRate: "",
        weeklySchedule: [],
      });
    } catch (error) {
      toast.error("Error occurred", error);
    }
  };

  const selectedInstructor = instructors.find(
    (inst) => inst.id === formData.instructorId
  );
  const selectedStudents = students.filter((student) =>
    formData.studentsEnrolled.includes(student.id)
  );

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(currentYear, currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate >= today) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const dayStr = String(selectedDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${dayStr}`;

      setNewSchedule((prev) => ({
        ...prev,
        date: dateString,
        datePickerOpen: false,
      }));
    }
  };

  const navigateMonth = (direction) => {
    if (direction === "prev") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];
    const today = new Date();
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
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today.setHours(0, 0, 0, 0);
      const isSelected = newSchedule.date === date.toISOString().split("T")[0];
      const isAlreadyScheduled = formData.weeklySchedule.some(
        (schedule) => schedule.date === date.toISOString().split("T")[0]
      );

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(day)}
          disabled={isPast || isAlreadyScheduled}
          className={`h-10 w-10 rounded-lg text-sm font-medium transition-all duration-200 relative ${
            isPast
              ? "text-gray-600 cursor-not-allowed"
              : isAlreadyScheduled
                ? "text-green-400 cursor-not-allowed border border-green-400/50 bg-green-500/20"
                : isSelected
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : isToday
                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/50"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          {day}
          {isAlreadyScheduled && (
            <div className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full transform translate-x-1 -translate-y-1"></div>
          )}
        </button>
      );
    }

    return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigateMonth("prev")}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <h3 className="text-lg font-semibold text-white">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button
            type="button"
            onClick={() => navigateMonth("next")}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((dayName) => (
            <div
              key={dayName}
              className="h-8 flex items-center justify-center text-xs font-medium text-gray-400"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">{days}</div>

        {/* Today button */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              const today = new Date();
              setCurrentMonth(today.getMonth());
              setCurrentYear(today.getFullYear());
              handleDateSelect(today.getDate());
            }}
            className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Select Today
          </button>
        </div>
      </div>
    );
  };

  const CustomDropdown = ({
    isOpen,
    setIsOpen,
    placeholder,
    icon: Icon,
    children,
    selectedContent,
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
            {selectedContent || (
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
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 px-6 py-16 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Glows */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-40 right-20 w-48 h-48 bg-pink-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>

      <div className="relative z-10 max-w-4xl mx-auto bg-white/10 backdrop-blur-sm p-10 rounded-3xl border border-white/10 shadow-2xl">
        <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
          Schedule Multiple Classes
        </h2>

        {message && (
          <div
            className={`mb-8 text-center p-4 rounded-xl backdrop-blur-sm border ${
              message.includes("❌")
                ? "bg-red-500/10 border-red-500/20 text-red-300"
                : "bg-green-500/10 border-green-500/20 text-green-300"
            } animate-in fade-in slide-in-from-top-4`}
          >
            <div className="text-lg font-medium flex items-center justify-center gap-2">
              {message.includes("❌") ? <X size={20} /> : <Check size={20} />}
              {message}
            </div>
          </div>
        )}

        <div onSubmit={handleSubmit} className="space-y-8">
          {/* Class Name Dropdown */}
          <div>
            <label className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <FileText size={16} />
              Class Name
            </label>
            <CustomDropdown
              isOpen={classNameDropdownOpen}
              setIsOpen={setClassNameDropdownOpen}
              placeholder="Select class subject..."
              icon={FileText}
              selectedContent={
                formData.className && (
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📚</span>
                    <span className="text-white font-medium">
                      {formData.className}
                    </span>
                  </div>
                )
              }
            >
              <div className="max-h-64 overflow-y-auto">
                {allCourse && allCourse.length > 0 ? (
                  allCourse.map((course) => (
                    <div
                      key={course._id}
                      onClick={() => handleClassNameSelect(course.nameCourse)}
                      className={`px-4 py-3 cursor-pointer border-b border-white/5 last:border-b-0 group ${
                        formData.className === course.nameCourse
                          ? "bg-blue-500/20 hover:bg-blue-500/30"
                          : "hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📚</span>
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            {course.nameCourse}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {course.description ||
                              course.courseCategory ||
                              "Course"}
                          </div>
                        </div>
                        {formData.className === course.nameCourse && (
                          <Check size={16} className="text-blue-400" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <FileText size={24} className="mx-auto mb-2 opacity-50" />
                    <div>No courses available</div>
                    <div className="text-sm">Please add courses first</div>
                  </div>
                )}
              </div>
            </CustomDropdown>
          </div>

          {/* Weekly Schedule Section */}
          <div>
            <label className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Calendar size={16} />
              Weekly Schedule ({formData.weeklySchedule.length} classes
              scheduled)
            </label>

            {/* Add New Schedule */}
            <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-4">
              <h4 className="text-lg font-medium text-white mb-4">
                Add New Class Schedule
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Picker */}
                <CustomDropdown
                  isOpen={newSchedule.datePickerOpen}
                  setIsOpen={(open) =>
                    setNewSchedule((prev) => ({
                      ...prev,
                      datePickerOpen: open,
                    }))
                  }
                  placeholder="Select date..."
                  icon={Calendar}
                  selectedContent={
                    newSchedule.date && (
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-blue-400" />
                        <span className="text-white font-medium">
                          {new Date(newSchedule.date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    )
                  }
                >
                  {renderCalendar()}
                </CustomDropdown>

                {/* Time Picker */}
                <CustomDropdown
                  isOpen={newSchedule.timePickerOpen}
                  setIsOpen={(open) =>
                    setNewSchedule((prev) => ({
                      ...prev,
                      timePickerOpen: open,
                    }))
                  }
                  placeholder="Select time..."
                  icon={Clock}
                  selectedContent={
                    newSchedule.time && (
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-purple-400" />
                        <span className="text-white font-medium">
                          {formatTime12Hour(newSchedule.time)}
                        </span>
                      </div>
                    )
                  }
                >
                  <div className="p-6">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      {/* Hour Selector */}
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-2">Hour</div>
                        <div className="bg-gray-800/50 rounded-lg p-2">
                          <button
                            type="button"
                            onClick={() =>
                              setNewSchedule((prev) => ({
                                ...prev,
                                selectedHour: String(
                                  prev.selectedHour === "12"
                                    ? 1
                                    : parseInt(prev.selectedHour) + 1
                                ).padStart(2, "0"),
                              }))
                            }
                            className="w-full text-gray-300 hover:text-white text-sm"
                          >
                            <Plus size={16} className="mx-auto" />
                          </button>
                          <div className="text-2xl font-mono text-white py-2">
                            {newSchedule.selectedHour}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setNewSchedule((prev) => ({
                                ...prev,
                                selectedHour: String(
                                  prev.selectedHour === "01"
                                    ? 12
                                    : parseInt(prev.selectedHour) - 1
                                ).padStart(2, "0"),
                              }))
                            }
                            className="w-full text-gray-300 hover:text-white text-sm"
                          >
                            <Minus size={16} className="mx-auto" />
                          </button>
                        </div>
                      </div>

                      <div className="text-2xl text-white font-mono">:</div>

                      {/* Minute Selector */}
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-2">Min</div>
                        <div className="bg-gray-800/50 rounded-lg p-2">
                          <button
                            type="button"
                            onClick={() =>
                              setNewSchedule((prev) => ({
                                ...prev,
                                selectedMinute: String(
                                  prev.selectedMinute === "00"
                                    ? 45
                                    : parseInt(prev.selectedMinute) - 15
                                ).padStart(2, "0"),
                              }))
                            }
                            className="w-full text-gray-300 hover:text-white text-sm"
                          >
                            <Plus size={16} className="mx-auto" />
                          </button>
                          <div className="text-2xl font-mono text-white py-2">
                            {newSchedule.selectedMinute}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setNewSchedule((prev) => ({
                                ...prev,
                                selectedMinute: String(
                                  prev.selectedMinute === "45"
                                    ? 0
                                    : parseInt(prev.selectedMinute) + 15
                                ).padStart(2, "0"),
                              }))
                            }
                            className="w-full text-gray-300 hover:text-white text-sm"
                          >
                            <Minus size={16} className="mx-auto" />
                          </button>
                        </div>
                      </div>

                      {/* AM/PM Selector */}
                      <div className="text-center">
                        <div className="text-gray-400 text-sm mb-2">Period</div>
                        <div className="bg-gray-800/50 rounded-lg p-2">
                          <button
                            type="button"
                            onClick={() =>
                              setNewSchedule((prev) => ({
                                ...prev,
                                selectedPeriod:
                                  prev.selectedPeriod === "AM" ? "PM" : "AM",
                              }))
                            }
                            className="w-full text-gray-300 hover:text-white text-sm"
                          >
                            <Plus size={16} className="mx-auto" />
                          </button>
                          <div className="text-xl font-mono text-white py-2">
                            {newSchedule.selectedPeriod}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setNewSchedule((prev) => ({
                                ...prev,
                                selectedPeriod:
                                  prev.selectedPeriod === "AM" ? "PM" : "AM",
                              }))
                            }
                            className="w-full text-gray-300 hover:text-white text-sm"
                          >
                            <Minus size={16} className="mx-auto" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleNewScheduleTimeChange}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
                    >
                      Set Time
                    </button>
                  </div>
                </CustomDropdown>
              </div>

              <button
                type="button"
                onClick={addScheduleToWeek}
                className="mt-4 w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add to Weekly Schedule
              </button>
            </div>

            {/* Display Current Schedule */}
            {formData.weeklySchedule.length > 0 && (
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h4 className="text-lg font-medium text-white mb-4">
                  Scheduled Classes
                </h4>
                <div className="space-y-3">
                  {formData.weeklySchedule.map((schedule, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white/5 rounded-lg p-3 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar size={16} className="text-blue-400" />
                        <span className="text-white font-medium">
                          {new Date(schedule.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <Clock size={16} className="text-purple-400 ml-2" />
                        <span className="text-white">
                          {formatTime12Hour(schedule.time)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeScheduleFromWeek(index)}
                        className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instructor Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <User size={16} />
              Select Instructor ({instructors.length} available)
            </label>
            <CustomDropdown
              isOpen={instructorDropdownOpen}
              setIsOpen={setInstructorDropdownOpen}
              placeholder="Choose an instructor..."
              icon={User}
              selectedContent={
                selectedInstructor && (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {selectedInstructor.avatar}
                    </span>
                    <div>
                      <div className="text-white font-medium">
                        {selectedInstructor.name}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {selectedInstructor.email}
                      </div>
                    </div>
                  </div>
                )
              }
            >
              <div className="max-h-64 overflow-y-auto">
                {instructors.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <User size={24} className="mx-auto mb-2 opacity-50" />
                    <div>No instructors available</div>
                    <div className="text-sm">Please add admin users first</div>
                  </div>
                ) : (
                  instructors.map((instructor) => (
                    <div
                      key={instructor.id}
                      onClick={() => handleInstructorSelect(instructor.id)}
                      className="px-4 py-3 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 cursor-pointer border-b border-white/5 last:border-b-0 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{instructor.avatar}</span>
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            {instructor.name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {instructor.email}
                          </div>
                          <div className="text-blue-300 text-xs">
                            {instructor.department} • {instructor.specialty}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CustomDropdown>
          </div>

          {/* Student Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
              <Users size={16} />
              Select Students ({formData.studentsEnrolled.length} selected of{" "}
              {students.length})
            </label>
            <CustomDropdown
              isOpen={studentDropdownOpen}
              setIsOpen={setStudentDropdownOpen}
              placeholder="Choose students..."
              icon={Users}
              selectedContent={
                selectedStudents.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-green-400" />
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {selectedStudents.slice(0, 3).map((student) => (
                          <span key={student.id} className="text-xl">
                            {student.avatar}
                          </span>
                        ))}
                      </div>
                      <span className="text-white font-medium">
                        {selectedStudents.length} student
                        {selectedStudents.length !== 1 ? "s" : ""} selected
                      </span>
                      {selectedStudents.length > 3 && (
                        <span className="text-sm text-gray-300">
                          ({selectedStudents.length - 3} more)
                        </span>
                      )}
                    </div>
                  </div>
                )
              }
            >
              <div className="max-h-64 overflow-y-auto">
                {students.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400">
                    <Users size={24} className="mx-auto mb-2 opacity-50" />
                    <div>No students available</div>
                    <div className="text-sm">
                      Please add student users first
                    </div>
                  </div>
                ) : (
                  students.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => handleStudentToggle(student.id)}
                      className={`px-4 py-3 cursor-pointer border-b border-white/5 last:border-b-0 group ${
                        formData.studentsEnrolled.includes(student.id)
                          ? "bg-green-500/20 hover:bg-green-500/30"
                          : "hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{student.avatar}</span>
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            {student.name}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {student.email}
                          </div>
                          <div className="text-blue-300 text-xs">
                            {student.year} • {student.major}
                          </div>
                        </div>
                        {formData.studentsEnrolled.includes(student.id) && (
                          <Check size={16} className="text-green-400" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CustomDropdown>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Class Link"
              name="classLink"
              value={formData.classLink}
              onChange={handleChange}
              Icon={Link}
            />
            <Input
              label="Class Duration (e.g. 2 hours)"
              name="classDuration"
              value={formData.classDuration}
              onChange={handleChange}
              Icon={Clock}
            />

            <Input
              label="Class Rate (per session)"
              name="classRate"
              value={formData.classRate}
              onChange={handleChange}
              type="number"
              Icon={IndianRupee}
            />
          </div>

          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full mt-8 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl text-lg font-bold hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-xl hover:scale-105 text-white"
          >
            <span className="flex items-center justify-center gap-2">
              <Check size={20} />
              Create Class Schedule
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text", Icon }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
        {Icon && <Icon size={16} />}
        {label}
      </label>
      <div className="flex items-center bg-gradient-to-r from-white/10 to-white/5 rounded-xl px-4 py-4 border border-white/20 focus-within:ring-2 ring-blue-400 transition-all duration-300 hover:border-white/40">
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
