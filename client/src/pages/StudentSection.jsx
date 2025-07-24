import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  User,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  MessageSquare,
  X,
  Upload,
  Plus,
  Edit3,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  PieChart,
  Save,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";

import { AppContent } from "../context/Context";
import axios from "axios";
const ProgressTab = ({
  activeTab,
  allSchedule = [],
  homeWorkData = [],
  userData = {},
}) => {
  const progressData = useMemo(() => {
    const userSchedule = allSchedule.filter(
      (schedule) =>
        schedule.studentsEnrolled &&
        schedule.studentsEnrolled.includes(userData.userId)
    );

    // Filter homework data for current user
    const userHomework = homeWorkData.filter(
      (hw) => hw.studentId === userData.userId
    );

    // Calculate overall attendance
    const totalClasses = userSchedule.length;
    const attendedClasses = userSchedule.filter(
      (schedule) => schedule.attendance === "Present"
    ).length;
    const attendanceRate =
      totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;

    // Process homework statistics
    const homeworkStats = {
      completed: userHomework.filter((hw) => hw.status === "completed").length,
      pending: userHomework.filter((hw) => hw.status === "pending").length,
      overdue: userHomework.filter((hw) => hw.status === "overdue").length,
    };

    // Calculate subject-wise attendance
    const subjectStats = {};
    userSchedule.forEach((schedule) => {
      if (!subjectStats[schedule.className]) {
        subjectStats[schedule.className] = { total: 0, attended: 0 };
      }
      subjectStats[schedule.className].total++;
      if (schedule.attendance === "Present") {
        subjectStats[schedule.className].attended++;
      }
    });

    const subjects = Object.keys(subjectStats).map((className) => ({
      name: className,
      total: subjectStats[className].total,
      attended: subjectStats[className].attended,
      percentage:
        subjectStats[className].total > 0
          ? Math.round(
              (subjectStats[className].attended /
                subjectStats[className].total) *
                100
            )
          : 0,
    }));

    // Calculate weekly progress
    const weeklyStats = {};
    userSchedule.forEach((schedule) => {
      const date = new Date(schedule.classDate);
      const weekNumber = Math.ceil(date.getDate() / 7);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const weekKey = `${monthName} W${weekNumber}`;

      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = { total: 0, attended: 0 };
      }
      weeklyStats[weekKey].total++;
      if (schedule.attendance === "Present") {
        weeklyStats[weekKey].attended++;
      }
    });

    const weeklyProgress = Object.keys(weeklyStats).map((week) => ({
      week: week,
      attendance:
        weeklyStats[week].total > 0
          ? Math.round(
              (weeklyStats[week].attended / weeklyStats[week].total) * 100
            )
          : 0,
    }));

    // Monthly attendance data
    const monthlyStats = {};
    userSchedule.forEach((schedule) => {
      const date = new Date(schedule.classDate);
      const monthKey = date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { total: 0, attended: 0 };
      }
      monthlyStats[monthKey].total++;
      if (schedule.attendance === "Present") {
        monthlyStats[monthKey].attended++;
      }
    });

    const monthlyAttendance = Object.keys(monthlyStats).map((month) => ({
      month,
      attendance:
        monthlyStats[month].total > 0
          ? Math.round(
              (monthlyStats[month].attended / monthlyStats[month].total) * 100
            )
          : 0,
      attended: monthlyStats[month].attended,
      total: monthlyStats[month].total,
    }));

    return {
      attendanceRate,
      attended: attendedClasses,
      totalClasses,
      subjects,
      weeklyProgress,
      homeworkStats,
      monthlyAttendance,
      totalHomework: userHomework.length,
    };
  }, [allSchedule, homeWorkData, userData.userId]);

  // CSS Pie Chart Component
  const PieChart = ({ data, size = 120 }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 2}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
          />
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${percentage} ${100 - percentage}`;
            const strokeDashoffset = -cumulativePercentage;
            cumulativePercentage += percentage;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 2}
                fill="none"
                stroke={item.color}
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: "all 0.3s ease",
                  strokeLinecap: "round",
                }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{total}</div>
            <div className="text-xs text-gray-300">Total</div>
          </div>
        </div>
      </div>
    );
  };

  // CSS Bar Chart Component
  const BarChart = ({ data, title }) => {
    const maxValue = Math.max(
      ...data.map((item) => Math.max(item.attended, item.missed))
    );

    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white font-medium">{item.name}</span>
                <span className="text-gray-300">
                  {item.attended}/{item.total}
                </span>
              </div>
              <div className="flex space-x-1 h-6">
                <div
                  className="bg-emerald-500 rounded-l transition-all duration-500"
                  style={{ width: `${(item.attended / maxValue) * 100}%` }}
                />
                <div
                  className="bg-red-500 rounded-r transition-all duration-500"
                  style={{ width: `${(item.missed / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Line Chart Component
  const LineChart = ({ data, title }) => {
    const maxValue = Math.max(...data.map((item) => item.attendance));

    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <div className="relative h-40 bg-white/5 rounded-lg p-4">
          <svg className="w-full h-full">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={`${100 - y}%`}
                x2="100%"
                y2={`${100 - y}%`}
                stroke="rgba(255,255,255,0.1)"
                strokeDasharray="2,2"
              />
            ))}

            {/* Line path */}
            <polyline
              points={data
                .map(
                  (item, index) =>
                    `${(index / (data.length - 1)) * 100},${100 - item.attendance}`
                )
                .join(" ")}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              className="drop-shadow-lg"
            />

            {/* Data points */}
            {data.map((item, index) => (
              <circle
                key={index}
                cx={`${(index / (data.length - 1)) * 100}%`}
                cy={`${100 - item.attendance}%`}
                r="4"
                fill="#10b981"
                className="drop-shadow-lg hover:r-6 transition-all cursor-pointer"
              />
            ))}
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            {data.map((item, index) => (
              <span key={index}>{item.month}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {activeTab === "progress" && (
        <div className="space-y-6">
          {/* Overall Progress */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">
              Overall Progress
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Attendance Rate</span>
                  <span className="text-white font-semibold">
                    {progressData.attendanceRate}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-cyan-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressData.attendanceRate}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-400 mb-2">
                    {progressData.attended}/{progressData.totalClasses}
                  </div>
                  <div className="text-gray-300">Classes Attended</div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">
                    {progressData.homeworkStats.completed}/
                    {progressData.totalHomework}
                  </div>
                  <div className="text-gray-300">Homework Completed</div>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              {/* Attendance Pie Chart */}
              <div className="bg-white/5 p-4 rounded-xl text-center">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Attendance Overview
                </h4>
                <div className="flex justify-center">
                  <PieChart
                    data={[
                      {
                        name: "Present",
                        value: progressData.attended,
                        color: "#10b981",
                      },
                      {
                        name: "Absent",
                        value:
                          progressData.totalClasses - progressData.attended,
                        color: "#ef4444",
                      },
                    ]}
                  />
                </div>
                <div className="flex justify-center space-x-4 mt-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-300">Present</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-xs text-gray-300">Absent</span>
                  </div>
                </div>
              </div>

              {/* Homework Status Pie Chart */}
              <div className="bg-white/5 p-4 rounded-xl text-center">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Homework Status
                </h4>
                <div className="flex justify-center">
                  <PieChart
                    data={[
                      {
                        name: "Completed",
                        value: progressData.homeworkStats.completed,
                        color: "#10b981",
                      },
                      {
                        name: "Pending",
                        value: progressData.homeworkStats.pending,
                        color: "#f59e0b",
                      },
                      {
                        name: "Overdue",
                        value: progressData.homeworkStats.overdue,
                        color: "#ef4444",
                      },
                    ]}
                  />
                </div>
                <div className="flex justify-center space-x-2 mt-3 text-xs">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1"></div>
                    <span className="text-gray-300">Done</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mr-1"></div>
                    <span className="text-gray-300">Pending</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                    <span className="text-gray-300">Overdue</span>
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="bg-white/5 p-4 rounded-xl">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Performance Stats
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Best Subject</span>
                    <span className="text-emerald-400 font-medium">
                      {progressData.subjects.length > 0
                        ? progressData.subjects.reduce((best, current) =>
                            current.percentage > best.percentage
                              ? current
                              : best
                          ).name
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Subjects</span>
                    <span className="text-white font-medium">
                      {progressData.subjects.length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Avg. Attendance</span>
                    <span className="text-white font-medium">
                      {progressData.attendanceRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Homework Rate</span>
                    <span className="text-blue-400 font-medium">
                      {progressData.totalHomework > 0
                        ? Math.round(
                            (progressData.homeworkStats.completed /
                              progressData.totalHomework) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subject Performance Bar Chart */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <BarChart
              data={progressData.subjects.map((subject) => ({
                name: subject.name,
                attended: subject.attended,
                missed: subject.total - subject.attended,
                total: subject.total,
              }))}
              title="Subject Performance Analysis"
            />
          </div>

          {/* Monthly Trend Line Chart */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <LineChart
              data={progressData.monthlyAttendance}
              title="Monthly Attendance Trend"
            />
          </div>

          {/* Subject-wise Progress */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">
              Subject-wise Attendance
            </h3>
            <div className="space-y-4">
              {progressData.subjects.map((subject, index) => (
                <div key={index} className="bg-white/5 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">
                      {subject.name}
                    </span>
                    <span className="text-gray-300">
                      {subject.attended}/{subject.total} ({subject.percentage}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${subject.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Progress Chart */}
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">
              Weekly Attendance Trend
            </h3>
            <div className="space-y-3">
              {progressData.weeklyProgress.map((week, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-20 text-sm text-gray-300">{week.week}</div>
                  <div className="flex-1 bg-white/10 rounded-full h-6 relative">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-600 h-6 rounded-full transition-all duration-300 flex items-center justify-center"
                      style={{ width: `${week.attendance}%` }}
                    >
                      <span className="text-xs font-medium text-white">
                        {week.attendance}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("notes");
  const [showClassInfo, setShowClassInfo] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classesData, setClassesData] = useState([]);
  const [homeWorkData, setHomeworkData] = useState([]);

  const [notes, setNotes] = useState([
    {
      id: 1,
      title: "JavaScript Fundamentals",
      content:
        "Variables, functions, objects, and arrays. Key concepts for web development.",
      subject: "Web Development",
      date: "2024-06-25",
      lastModified: "2024-06-25T10:30:00Z",
      tags: ["JavaScript", "Programming", "Web Dev"],
    },
    {
      id: 2,
      title: "Database Design Principles",
      content:
        "Normalization, ACID properties, and relational database concepts.",
      subject: "Database Systems",
      date: "2024-06-24",
      lastModified: "2024-06-24T14:15:00Z",
      tags: ["Database", "SQL", "Design"],
    },
  ]);

  const { userData, allSchedule, backend_url } = useContext(AppContent);

  // for loading the data from the server
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const allclassSchedulesResponse = allSchedule;

        if (allclassSchedulesResponse && allclassSchedulesResponse.length > 0) {
          const processedClasses = processClassSchedules(
            allclassSchedulesResponse
          );
          setClassesData(processedClasses);
        }

        const response = await getAllNotes(userData.userId);
        if (response.success) {
          setNotes(response.data);
        }
        const HomeWorkData = await axios.get(
          `${backend_url}/api/homework/student/${userData.userId}`
        );
        setHomeworkData(HomeWorkData.data);
      } catch (error) {
        console.error("Error loading notes:", error);
      }
    };

    if (userData.userId) {
      loadNotes();
    }
  }, [userData.userId, allSchedule]);

  const processClassSchedules = (schedules) => {
    const now = new Date();
    const today = now.toDateString();

    console.log("Current time:", now);
    console.log("Today:", today);

    // Filter classes for today
    const todayClasses = schedules.filter(
      (cls) => new Date(cls.classDate).toDateString() === today
    );

    console.log("Today's classes:", todayClasses);

    // Filter upcoming classes (future dates)
    const upcomingClasses = schedules
      .filter((cls) => new Date(cls.classDate) > now)
      .sort((a, b) => new Date(a.classDate) - new Date(b.classDate));

    // Find live class (check if current time is within class time)
    const liveClass = todayClasses.find((cls) => {
      const classDate = new Date(cls.classDate);

      // Handle different time formats
      let classTime = cls.classTime;
      let hours, minutes;

      if (classTime.includes(":")) {
        [hours, minutes] = classTime.split(":");
      } else {
        // Handle 24-hour format like "14" or "1400"
        if (classTime.length === 2) {
          hours = classTime;
          minutes = "00";
        } else if (classTime.length === 4) {
          hours = classTime.substring(0, 2);
          minutes = classTime.substring(2, 4);
        } else {
          console.warn("Unexpected time format:", classTime);
          return false;
        }
      }

      // Create class start time
      const classStart = new Date(classDate);
      classStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Create class end time (adding duration)
      const classEnd = new Date(classStart);
      const duration = parseInt(cls.classDuration) || 1;
      classEnd.setHours(classStart.getHours() + duration);

      return now >= classStart && now <= classEnd;
    });

    // Get remaining classes for today that haven't started yet
    const remainingTodayClasses = todayClasses.filter((cls) => {
      const classDate = new Date(cls.classDate);
      let classTime = cls.classTime;
      let hours, minutes;

      if (classTime.includes(":")) {
        [hours, minutes] = classTime.split(":");
      } else {
        if (classTime.length === 2) {
          hours = classTime;
          minutes = "00";
        } else if (classTime.length === 4) {
          hours = classTime.substring(0, 2);
          minutes = classTime.substring(2, 4);
        } else {
          return false;
        }
      }

      const classStart = new Date(classDate);
      classStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return classStart > now;
    });

    // Sort remaining today classes by time
    remainingTodayClasses.sort((a, b) => {
      const timeA = a.classTime.includes(":")
        ? a.classTime
        : a.classTime.length === 2
          ? a.classTime + ":00"
          : a.classTime.substring(0, 2) + ":" + a.classTime.substring(2, 4);
      const timeB = b.classTime.includes(":")
        ? b.classTime
        : b.classTime.length === 2
          ? b.classTime + ":00"
          : b.classTime.substring(0, 2) + ":" + b.classTime.substring(2, 4);
      return timeA.localeCompare(timeB);
    });

    let result = [];

    // Helper function to format class data
    const formatClassData = (cls, status) => ({
      ...cls,
      id: cls._id,
      date: cls.classDate,
      time: cls.classTime,
      meetingLink: cls.classLink,
      instructor: cls.instructorName || "Instructor",
      duration: `${cls.classDuration || 1} hour${parseInt(cls.classDuration) > 1 ? "s" : ""}`,
      description: cls.classDescription,
      classCode: cls._id.slice(-6).toUpperCase(),
      meetingId: cls._id.slice(-10),
      passcode: cls.passcode || "123456",
      nextTopic: cls.classDescription,
      prerequisites: cls.prerequisites || ["Basic programming knowledge"],
      materials: cls.materials || [
        "Lecture slides",
        "Code examples",
        "Practice exercises",
      ],
      assignments: cls.assignments || [
        "Complete homework",
        "Read next chapter",
      ],
      status: status,
      className: cls.className || cls.subject || "Class",
      classStartAt: (() => {
        const classDateTime = new Date(cls.classDate);
        let classTime = cls.classTime;
        let hours, minutes;

        if (classTime.includes(":")) {
          [hours, minutes] = classTime.split(":");
        } else {
          if (classTime.length === 2) {
            hours = classTime;
            minutes = "00";
          } else if (classTime.length === 4) {
            hours = classTime.substring(0, 2);
            minutes = classTime.substring(2, 4);
          } else {
            hours = "00";
            minutes = "00";
          }
        }

        classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return classDateTime.toISOString();
      })(),
      classEndAt: (() => {
        const classDateTime = new Date(cls.classDate);
        let classTime = cls.classTime;
        let hours, minutes;

        if (classTime.includes(":")) {
          [hours, minutes] = classTime.split(":");
        } else {
          if (classTime.length === 2) {
            hours = classTime;
            minutes = "00";
          } else if (classTime.length === 4) {
            hours = classTime.substring(0, 2);
            minutes = classTime.substring(2, 4);
          } else {
            hours = "00";
            minutes = "00";
          }
        }

        classDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        classDateTime.setHours(
          classDateTime.getHours() + parseInt(cls.classDuration || 1)
        );
        return classDateTime.toISOString();
      })(),
    });

    if (liveClass) {
      // Add live class first
      result.push(formatClassData(liveClass, "live"));

      // Add remaining today classes
      result.push(
        ...remainingTodayClasses.map((cls) => formatClassData(cls, "upcoming"))
      );

      // Fill remaining slots with future classes
      const remainingSlots = 3 - result.length;
      if (remainingSlots > 0) {
        result.push(
          ...upcomingClasses
            .slice(0, remainingSlots)
            .map((cls) => formatClassData(cls, "upcoming"))
        );
      }
    } else {
      // No live class - show today's remaining classes first
      result.push(
        ...remainingTodayClasses.map((cls) => formatClassData(cls, "upcoming"))
      );

      // Fill remaining slots with future classes
      const remainingSlots = 3 - remainingTodayClasses.length;
      if (remainingSlots > 0) {
        result.push(
          ...upcomingClasses
            .slice(0, remainingSlots)
            .map((cls) => formatClassData(cls, "upcoming"))
        );
      }
    }

    console.log("Final result:", result);
    return result;
  };

  const [noteForm, setNoteForm] = useState({
    title: "",
    content: "",
    subject: "",
    tags: "",
  });
  const [editingNote, setEditingNote] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [searchNotesQuery, setSearchNotesQuery] = useState("");

  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({
    notes: "",
    attachments: [],
  });

  // Homework Functions
  const handleHomeworkSubmit = async (homeworkId) => {
    try {
      // API call to submit homework
      const response = await submitHomework(homeworkId, submissionForm);
      if (response.success) {
        setHomeworkData((prev) =>
          prev.map((hw) =>
            hw.id === homeworkId
              ? {
                  ...hw,
                  status: "submitted",
                  submission: { ...submissionForm, submittedAt: new Date() },
                }
              : hw
          )
        );
        setShowHomeworkModal(false);
        setSubmissionForm({ notes: "", attachments: [] });
      }
    } catch (error) {
      console.error("Error submitting homework:", error);
    }
  };

  const handleViewHomework = (homework) => {
    setSelectedHomework(homework);
    setShowHomeworkModal(true);
  };

  const handleShowClassInfo = (classInfo) => {
    setSelectedClass(classInfo);
    setShowClassInfo(true);
  };

  // Progress/Stats State
  const [progressData] = useState({
    totalClasses: 45,
    attended: 42,
    attendanceRate: 93.3,
    subjects: [
      { name: "Web Development", attended: 15, total: 16, percentage: 93.8 },
      { name: "Database Systems", attended: 14, total: 15, percentage: 93.3 },
      { name: "Data Structures", attended: 13, total: 14, percentage: 92.9 },
    ],
    weeklyProgress: [
      { week: "Week 1", attendance: 100 },
      { week: "Week 2", attendance: 95 },
      { week: "Week 3", attendance: 90 },
      { week: "Week 4", attendance: 93 },
    ],
  });

  // Notes Functions
  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    const noteData = {
      ...noteForm,
      tags: noteForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      studentId: userData.userId,
    };

    try {
      if (editingNote) {
        // Update existing note
        const response = await updateNote(editingNote._id, noteData);
        if (response.success) {
          setNotes(
            notes.map((note) =>
              note._id === editingNote._id ? response.data : note
            )
          );
        }
      } else {
        // Create new note
        const response = await createNote(noteData);
        if (response.success) {
          setNotes([response.data, ...notes]);
        }
      }

      // Reset form
      setNoteForm({ title: "", content: "", subject: "", tags: "" });
      setEditingNote(null);
      setShowNoteForm(false);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleEditNote = (note) => {
    setNoteForm({
      title: note.title,
      content: note.content,
      subject: note.subject,
      tags: note.tags.join(", "),
    });
    setEditingNote(note);
    setShowNoteForm(true);
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        if (response.success) {
          // Filter out the deleted note using both _id and id for compatibility
          setNotes(
            notes.filter((note) => note._id !== noteId && note.id !== noteId)
          );
          console.log("Note deleted successfully"); // Debug log
        } else {
          console.error("Delete failed:", response.message);
          alert(
            "Failed to delete note: " + (response.message || "Unknown error")
          );
        }
      } catch (error) {
        console.error("Error deleting note:", error);
        alert("Error deleting note: " + error.message);
      }
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchNotesQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchNotesQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchNotesQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 px-6 py-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20 shadow-2xl mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {userData.name}
                </h1>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-300">
                <p className="text-2xl font-bold text-cyan-400">
                  {(() => {
                    if (!classesData || !userData?.userId) return "0";
                    const enrolledClasses = classesData.filter(
                      (classItem) =>
                        classItem.studentsEnrolled &&
                        classItem.studentsEnrolled.includes(userData.userId)
                    );
                    const attendedClasses = enrolledClasses.filter(
                      (classItem) => classItem.attendance === "Present"
                    );
                    if (enrolledClasses.length === 0) return "0";
                    return Math.round(
                      (attendedClasses.length / enrolledClasses.length) * 100
                    );
                  })()}
                  %
                </p>
              </div>
              <div className="text-sm text-gray-300">Attendance Rate</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6">
          {[
            { id: "notes", label: "My Notes", icon: FileText },
            { id: "classes", label: "Live Classes", icon: BookOpen },
            { id: "attendance", label: "Attendance", icon: Calendar },
            { id: "homework", label: "Homework", icon: Target },
            { id: "progress", label: "Progress", icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-600 text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div className="space-y-6">
            {/* Notes Header */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">My Notes</h2>
                <button
                  onClick={() => setShowNoteForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl hover:from-emerald-600 hover:to-cyan-700 transition"
                >
                  <Plus size={18} />
                  <span>Add Note</span>
                </button>
              </div>

              {/* Search */}
              <div className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                <Search size={18} className="text-gray-300 mr-3" />
                <input
                  type="text"
                  placeholder="Search notes..."
                  value={searchNotesQuery}
                  onChange={(e) => setSearchNotesQuery(e.target.value)}
                  className="bg-transparent text-white w-full outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Note Form Modal */}
            {showNoteForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      {editingNote ? "Edit Note" : "Add New Note"}
                    </h3>
                    <button
                      onClick={() => {
                        setShowNoteForm(false);
                        setEditingNote(null);
                        setNoteForm({
                          title: "",
                          content: "",
                          subject: "",
                          tags: "",
                        });
                      }}
                      className="text-white/70 hover:text-white transition"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <form onSubmit={handleNoteSubmit} className="space-y-4">
                    <Input
                      label="Title"
                      name="title"
                      value={noteForm.title}
                      onChange={(e) =>
                        setNoteForm({ ...noteForm, title: e.target.value })
                      }
                      required
                    />
                    <Input
                      label="Subject"
                      name="subject"
                      value={noteForm.subject}
                      onChange={(e) =>
                        setNoteForm({ ...noteForm, subject: e.target.value })
                      }
                      required
                    />
                    <TextArea
                      label="Content"
                      name="content"
                      value={noteForm.content}
                      onChange={(e) =>
                        setNoteForm({ ...noteForm, content: e.target.value })
                      }
                      rows={6}
                      required
                    />
                    <Input
                      label="Tags (comma separated)"
                      name="tags"
                      value={noteForm.tags}
                      onChange={(e) =>
                        setNoteForm({ ...noteForm, tags: e.target.value })
                      }
                      placeholder="JavaScript, React, Web Development"
                    />

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNoteForm(false);
                          setEditingNote(null);
                          setNoteForm({
                            title: "",
                            content: "",
                            subject: "",
                            tags: "",
                          });
                        }}
                        className="flex-1 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition border border-white/20"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl hover:from-emerald-600 hover:to-cyan-700 transition font-semibold flex items-center justify-center space-x-2"
                      >
                        <Save size={18} />
                        <span>{editingNote ? "Update" : "Save"} Note</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {filteredNotes.map((note) => (
                <div
                  key={note._id || note.id}
                  className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {note.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-300">
                        <span>{note.subject}</span>
                        <span>•</span>
                        <span>
                          {new Date(
                            note.date || note.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note._id || note.id)} // Use _id first, fallback to id
                        className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-3 line-clamp-3">
                    {note.content}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {note.tags &&
                      note.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            {/* Enhanced Attendance Summary */}
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Classes</p>
                    <p className="text-2xl font-bold text-white">
                      {(() => {
                        if (!classesData || !userData?.userId) return 0;
                        return classesData.filter(
                          (classItem) =>
                            classItem.studentsEnrolled &&
                            classItem.studentsEnrolled.includes(userData.userId)
                        ).length;
                      })()}
                    </p>
                  </div>
                  <BookOpen className="text-blue-400" size={32} />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Classes Attended</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {(() => {
                        if (!classesData || !userData?.userId) return 0;
                        return classesData.filter(
                          (classItem) =>
                            classItem.studentsEnrolled &&
                            classItem.studentsEnrolled.includes(
                              userData.userId
                            ) &&
                            classItem.attendance === "Present"
                        ).length;
                      })()}
                    </p>
                  </div>
                  <CheckCircle2 className="text-emerald-400" size={32} />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Attendance Rate</p>
                    <p className="text-2xl font-bold text-cyan-400">
                      {(() => {
                        if (!classesData || !userData?.userId) return "0";
                        const enrolledClasses = classesData.filter(
                          (classItem) =>
                            classItem.studentsEnrolled &&
                            classItem.studentsEnrolled.includes(userData.userId)
                        );
                        const attendedClasses = enrolledClasses.filter(
                          (classItem) => classItem.attendance === "Present"
                        );
                        if (enrolledClasses.length === 0) return "0";
                        return Math.round(
                          (attendedClasses.length / enrolledClasses.length) *
                            100
                        );
                      })()}
                      %
                    </p>
                  </div>
                  <TrendingUp className="text-cyan-400" size={32} />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Classes Missed</p>
                    <p className="text-2xl font-bold text-red-400">
                      {(() => {
                        if (!classesData || !userData?.userId) return 0;
                        return classesData.filter(
                          (classItem) =>
                            classItem.studentsEnrolled &&
                            classItem.studentsEnrolled.includes(
                              userData.userId
                            ) &&
                            classItem.attendance === "Absent"
                        ).length;
                      })()}
                    </p>
                  </div>
                  <X className="text-red-400" size={32} />
                </div>
              </div>
            </div>

            {/* Attendance Insights */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Performance Insights */}
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <TrendingUp className="mr-2" size={20} />
                  Performance Insights
                </h3>
                <div className="space-y-4">
                  {(() => {
                    if (!classesData || !userData?.userId) {
                      return <p className="text-gray-400">No data available</p>;
                    }

                    const userClasses = classesData.filter(
                      (classItem) =>
                        classItem.studentsEnrolled &&
                        classItem.studentsEnrolled.includes(userData.userId)
                    );

                    const attendanceRate =
                      userClasses.length > 0
                        ? Math.round(
                            (userClasses.filter(
                              (c) => c.attendance === "Present"
                            ).length /
                              userClasses.length) *
                              100
                          )
                        : 0;

                    const recentClasses = userClasses
                      .sort(
                        (a, b) => new Date(b.classDate) - new Date(a.classDate)
                      )
                      .slice(0, 5);

                    const recentAttendanceRate =
                      recentClasses.length > 0
                        ? Math.round(
                            (recentClasses.filter(
                              (c) => c.attendance === "Present"
                            ).length /
                              recentClasses.length) *
                              100
                          )
                        : 0;

                    const trend = recentAttendanceRate - attendanceRate;

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">
                            Overall Performance
                          </span>
                          <span
                            className={`font-semibold ${
                              attendanceRate >= 80
                                ? "text-green-400"
                                : attendanceRate >= 60
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {attendanceRate >= 80
                              ? "Excellent"
                              : attendanceRate >= 60
                                ? "Good"
                                : "Needs Improvement"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">
                            Recent Trend (Last 5 classes)
                          </span>
                          <span
                            className={`font-semibold flex items-center ${
                              trend > 0
                                ? "text-green-400"
                                : trend < 0
                                  ? "text-red-400"
                                  : "text-gray-400"
                            }`}
                          >
                            {trend > 0
                              ? "↗️ Improving"
                              : trend < 0
                                ? "↘️ Declining"
                                : "→ Stable"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">
                            Study Hours (Attended)
                          </span>
                          <span className="font-semibold text-blue-400">
                            {userClasses
                              .filter((c) => c.attendance === "Present")
                              .reduce(
                                (total, c) =>
                                  total + parseInt(c.classDuration || 0),
                                0
                              )}
                            h
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">
                            Consistency Score
                          </span>
                          <span
                            className={`font-semibold ${
                              attendanceRate >= 90
                                ? "text-green-400"
                                : attendanceRate >= 70
                                  ? "text-yellow-400"
                                  : "text-red-400"
                            }`}
                          >
                            {attendanceRate >= 90
                              ? "Very High"
                              : attendanceRate >= 70
                                ? "Moderate"
                                : "Low"}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Subject-wise Breakdown */}
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <BookOpen className="mr-2" size={20} />
                  Subject-wise Attendance
                </h3>
                <div className="space-y-3">
                  {(() => {
                    if (!classesData || !userData?.userId) {
                      return <p className="text-gray-400">No data available</p>;
                    }

                    const userClasses = classesData.filter(
                      (classItem) =>
                        classItem.studentsEnrolled &&
                        classItem.studentsEnrolled.includes(userData.userId)
                    );

                    const subjectStats = userClasses.reduce(
                      (acc, classItem) => {
                        const subject = classItem.className;
                        if (!acc[subject]) {
                          acc[subject] = { total: 0, attended: 0 };
                        }
                        acc[subject].total++;
                        if (classItem.attendance === "Present") {
                          acc[subject].attended++;
                        }
                        return acc;
                      },
                      {}
                    );

                    return Object.entries(subjectStats).map(
                      ([subject, stats]) => {
                        const rate = Math.round(
                          (stats.attended / stats.total) * 100
                        );
                        return (
                          <div key={subject} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-white font-medium">
                                {subject}
                              </span>
                              <span className="text-sm text-gray-300">
                                {stats.attended}/{stats.total} ({rate}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  rate >= 80
                                    ? "bg-green-400"
                                    : rate >= 60
                                      ? "bg-yellow-400"
                                      : "bg-red-400"
                                }`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Monthly Attendance Chart */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <Calendar className="mr-2" size={20} />
                Monthly Attendance Pattern
              </h3>
              <div className="space-y-4">
                {(() => {
                  if (!classesData || !userData?.userId) {
                    return <p className="text-gray-400">No data available</p>;
                  }

                  const userClasses = classesData.filter(
                    (classItem) =>
                      classItem.studentsEnrolled &&
                      classItem.studentsEnrolled.includes(userData.userId)
                  );

                  const monthlyStats = userClasses.reduce((acc, classItem) => {
                    const date = new Date(classItem.classDate);
                    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    const monthName = date.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    });

                    if (!acc[monthKey]) {
                      acc[monthKey] = {
                        name: monthName,
                        total: 0,
                        attended: 0,
                      };
                    }
                    acc[monthKey].total++;
                    if (classItem.attendance === "Present") {
                      acc[monthKey].attended++;
                    }
                    return acc;
                  }, {});

                  const sortedMonths = Object.values(monthlyStats).sort(
                    (a, b) => new Date(a.name) - new Date(b.name)
                  );

                  return sortedMonths.map((month) => {
                    const rate = Math.round(
                      (month.attended / month.total) * 100
                    );
                    return (
                      <div key={month.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">
                            {month.name}
                          </span>
                          <span className="text-sm text-gray-300">
                            {month.attended}/{month.total} classes ({rate}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              rate >= 80
                                ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                : rate >= 60
                                  ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                                  : "bg-gradient-to-r from-red-400 to-pink-500"
                            }`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Recent Past Classes */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Clock className="mr-2" size={20} />
                  Recent Past Classes
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-400 mr-1"></div>
                    <span className="text-gray-300">Present</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-400 mr-1"></div>
                    <span className="text-gray-300">Absent</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {(() => {
                  if (!classesData || !userData?.userId) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-gray-400">
                          No attendance data available
                        </p>
                      </div>
                    );
                  }

                  const now = new Date();
                  const today = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate()
                  );

                  const userClasses = classesData
                    .filter(
                      (classItem) =>
                        classItem.studentsEnrolled &&
                        classItem.studentsEnrolled.includes(userData.userId)
                    )
                    .map((classItem) => {
                      // Auto-mark as absent only if class date has passed and not marked present
                      const classDate = new Date(classItem.classDate);
                      const classDateOnly = new Date(
                        classDate.getFullYear(),
                        classDate.getMonth(),
                        classDate.getDate()
                      );

                      if (
                        classDateOnly < today &&
                        classItem.attendance !== "Present"
                      ) {
                        return {
                          ...classItem,
                          attendance: "Absent",
                          isAutoAbsent: true,
                        };
                      }
                      return { ...classItem, isAutoAbsent: false };
                    });

                  // Get past 3 classes (before today) - sorted by most recent first
                  const pastClasses = userClasses
                    .filter((classItem) => {
                      const classDate = new Date(classItem.classDate);
                      const classDateOnly = new Date(
                        classDate.getFullYear(),
                        classDate.getMonth(),
                        classDate.getDate()
                      );
                      return classDateOnly < today;
                    })
                    .sort(
                      (a, b) => new Date(b.classDate) - new Date(a.classDate)
                    )
                    .slice(0, 3);

                  if (pastClasses.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-gray-400">
                          No recent past classes found
                        </p>
                      </div>
                    );
                  }

                  return pastClasses.map((classItem) => {
                    const classDate = new Date(classItem.classDate);
                    const [hours, minutes] = classItem.classTime.split(":");
                    const classStartTime = new Date(classDate);
                    classStartTime.setHours(
                      parseInt(hours),
                      parseInt(minutes),
                      0,
                      0
                    );

                    const classEndTime = new Date(classStartTime);
                    classEndTime.setHours(
                      classStartTime.getHours() +
                        parseInt(classItem.classDuration)
                    );

                    const isAbsent = classItem.attendance === "Absent";
                    const isPresent = classItem.attendance === "Present";
                    const daysAgo = Math.ceil(
                      (Date.now() - classDate.getTime()) / (24 * 60 * 60 * 1000)
                    );

                    // Determine status and styling
                    let statusInfo = {
                      dotColor: "bg-gray-400 shadow-gray-400/30",
                      badgeStyle:
                        "bg-gray-500/20 text-gray-300 border-gray-500/30",
                      statusText: "Not Marked",
                      statusIcon: "⏸️ Pending",
                    };

                    if (isPresent) {
                      statusInfo = {
                        dotColor: "bg-green-400 shadow-green-400/30",
                        badgeStyle:
                          "bg-green-500/20 text-green-300 border-green-500/30",
                        statusText: "Present",
                        statusIcon: "✓ Attended",
                      };
                    } else if (isAbsent) {
                      statusInfo = {
                        dotColor: "bg-red-400 shadow-red-400/30",
                        badgeStyle:
                          "bg-red-500/20 text-red-300 border-red-500/30",
                        statusText: "Absent",
                        statusIcon: classItem.isAutoAbsent
                          ? "✗ Auto-Marked Absent"
                          : "✗ Missed",
                      };
                    }

                    return (
                      <div
                        key={classItem._id}
                        className={`bg-white/5 p-4 rounded-xl border transition-all duration-200 hover:bg-white/10 ${
                          isPresent
                            ? "border-green-400/30 bg-green-500/5"
                            : isAbsent
                              ? "border-red-400/30 bg-red-500/5"
                              : "border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${statusInfo.dotColor} shadow-lg`}
                            />
                            <span className="font-semibold text-white">
                              {classItem.className}
                            </span>
                            <span className="text-sm text-gray-400">
                              {classDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                weekday: "short",
                              })}
                            </span>
                            {isAbsent && (
                              <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/30">
                                {classItem.isAutoAbsent
                                  ? "Auto-Absent"
                                  : "Missed"}
                              </span>
                            )}
                            {isPresent && (
                              <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                                Attended
                              </span>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.badgeStyle}`}
                          >
                            {statusInfo.statusText}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
                          <div>
                            <span className="text-gray-400">Time:</span>{" "}
                            {classStartTime.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {classEndTime.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div>
                            <span className="text-gray-400">Duration:</span>{" "}
                            {classItem.classDuration}h
                          </div>
                          <div>
                            <span className="text-gray-400">Status:</span>{" "}
                            <span
                              className={
                                isPresent
                                  ? "text-green-400"
                                  : isAbsent
                                    ? "text-red-400"
                                    : "text-gray-400"
                              }
                            >
                              {statusInfo.statusIcon}
                            </span>
                          </div>
                        </div>

                        {classItem.topicCovered && (
                          <div className="mt-3 p-2 bg-white/5 rounded-lg">
                            <span className="text-gray-400 text-sm">
                              Topics Covered:
                            </span>
                            <p className="text-white text-sm mt-1">
                              {classItem.topicCovered}
                            </p>
                          </div>
                        )}

                        {classItem.notes && (
                          <div className="mt-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <span className="text-yellow-400 text-sm">
                              Instructor Notes:
                            </span>
                            <p className="text-yellow-200 text-sm mt-1">
                              {classItem.notes}
                            </p>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between">
                          {classItem.classLink && (
                            <a
                              href={classItem.classLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-400 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Class Recording
                            </a>
                          )}
                          <span className="text-xs text-gray-500">
                            {daysAgo === 1
                              ? "1 day ago"
                              : `${daysAgo} days ago`}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Upcoming Classes */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Calendar className="mr-2" size={20} />
                  Upcoming Classes
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-400 mr-1"></div>
                    <span className="text-gray-300">Scheduled</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-400 mr-1"></div>
                    <span className="text-gray-300">Today</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {(() => {
                  if (!classesData || !userData?.userId) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-gray-400">
                          No attendance data available
                        </p>
                      </div>
                    );
                  }

                  const now = new Date();
                  const today = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    now.getDate()
                  );
                  const sevenDaysFromNow = new Date(today);
                  sevenDaysFromNow.setDate(today.getDate() + 7);

                  const userClasses = classesData.filter(
                    (classItem) =>
                      classItem.studentsEnrolled &&
                      classItem.studentsEnrolled.includes(userData.userId)
                  );

                  // Get upcoming classes (today and next 7 days) - sorted by date ascending
                  const upcomingClasses = userClasses
                    .filter((classItem) => {
                      const classDate = new Date(classItem.classDate);
                      const classDateOnly = new Date(
                        classDate.getFullYear(),
                        classDate.getMonth(),
                        classDate.getDate()
                      );
                      return (
                        classDateOnly >= today &&
                        classDateOnly <= sevenDaysFromNow
                      );
                    })
                    .sort((a, b) => {
                      const dateA = new Date(a.classDate);
                      const dateB = new Date(b.classDate);
                      // First sort by date, then by time
                      if (dateA.toDateString() === dateB.toDateString()) {
                        return a.classTime.localeCompare(b.classTime);
                      }
                      return dateA - dateB;
                    });

                  if (upcomingClasses.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-gray-400">
                          No upcoming classes in the next 7 days
                        </p>
                      </div>
                    );
                  }

                  return upcomingClasses.map((classItem) => {
                    const classDate = new Date(classItem.classDate);
                    const classDateOnly = new Date(
                      classDate.getFullYear(),
                      classDate.getMonth(),
                      classDate.getDate()
                    );
                    const [hours, minutes] = classItem.classTime.split(":");
                    const classStartTime = new Date(classDate);
                    classStartTime.setHours(
                      parseInt(hours),
                      parseInt(minutes),
                      0,
                      0
                    );

                    const classEndTime = new Date(classStartTime);
                    classEndTime.setHours(
                      classStartTime.getHours() +
                        parseInt(classItem.classDuration)
                    );

                    const isToday = classDateOnly.getTime() === today.getTime();
                    const isTomorrow =
                      classDateOnly.getTime() ===
                      today.getTime() + 24 * 60 * 60 * 1000;
                    const daysFromNow = Math.ceil(
                      (classDateOnly.getTime() - today.getTime()) /
                        (24 * 60 * 60 * 1000)
                    );

                    return (
                      <div
                        key={classItem._id}
                        className={`bg-white/5 p-4 rounded-xl border transition-all duration-200 hover:bg-white/10 ${
                          isToday
                            ? "border-orange-400/30 bg-orange-500/5"
                            : "border-blue-400/30 bg-blue-500/5"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                isToday
                                  ? "bg-orange-400 shadow-orange-400/30"
                                  : "bg-blue-400 shadow-blue-400/30"
                              } shadow-lg`}
                            />
                            <span className="font-semibold text-white">
                              {classItem.className}
                            </span>
                            <span className="text-sm text-gray-400">
                              {classDate.toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                weekday: "short",
                              })}
                            </span>
                            {isToday && (
                              <span className="px-2 py-1 rounded-full text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30">
                                Today
                              </span>
                            )}
                            {isTomorrow && (
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Tomorrow
                              </span>
                            )}
                            {daysFromNow > 1 && daysFromNow <= 7 && (
                              <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                In {daysFromNow} days
                              </span>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              isToday
                                ? "bg-orange-500/20 text-orange-300 border-orange-500/30"
                                : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                            }`}
                          >
                            Scheduled
                          </span>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
                          <div>
                            <span className="text-gray-400">Time:</span>{" "}
                            {classStartTime.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {classEndTime.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div>
                            <span className="text-gray-400">Duration:</span>{" "}
                            {classItem.classDuration}h
                          </div>
                          <div>
                            <span className="text-gray-400">Status:</span>
                            <span
                              className={
                                isToday ? "text-orange-400" : "text-blue-400"
                              }
                            >
                              📅 Upcoming
                            </span>
                          </div>
                        </div>

                        {classItem.topicCovered && (
                          <div className="mt-3 p-2 bg-white/5 rounded-lg">
                            <span className="text-gray-400 text-sm">
                              Planned Topics:
                            </span>
                            <p className="text-white text-sm mt-1">
                              {classItem.topicCovered}
                            </p>
                          </div>
                        )}

                        {classItem.notes && (
                          <div className="mt-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <span className="text-blue-400 text-sm">
                              Pre-class Notes:
                            </span>
                            <p className="text-blue-200 text-sm mt-1">
                              {classItem.notes}
                            </p>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between">
                          {classItem.classLink && (
                            <a
                              href={classItem.classLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Join Class
                            </a>
                          )}
                          <span className="text-xs text-gray-500">
                            {isToday
                              ? "Today"
                              : isTomorrow
                                ? "Tomorrow"
                                : daysFromNow === 1
                                  ? "1 day away"
                                  : `${daysFromNow} days away`}
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* class join tab  */}

        {activeTab === "classes" && (
          <div className="space-y-6">
            {/* Classes Header */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20">
              <h2 className="text-xl font-bold text-white mb-2">
                Live Classes
              </h2>
              <p className="text-gray-300">
                Join your scheduled classes or view detailed class information
              </p>
            </div>

            {/* Classes List */}
            {(() => {
              if (!classesData || !userData?.userId) return [];
              console.log("Classes Data:", classesData);
              return classesData.filter(
                (classItem) =>
                  classItem.studentsEnrolled &&
                  classItem.studentsEnrolled.includes(userData.userId)
              );
            })().length === 0 ? (
              <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 text-center">
                <BookOpen size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Classes Scheduled
                </h3>
                <p className="text-gray-300">
                  No upcoming classes found for today or in the near future.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {(() => {
                  if (!classesData || !userData?.userId) return [];
                  return classesData.filter(
                    (classItem) =>
                      classItem.studentsEnrolled &&
                      classItem.studentsEnrolled.includes(userData.userId)
                  );
                })().map((classInfo) => (
                  <div
                    key={classInfo._id}
                    className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {classInfo.className}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${(() => {
                              const now = new Date();
                              const classDate = new Date(classInfo.classDate);
                              const [hours, minutes] =
                                classInfo.classTime.split(":");
                              const classStartTime = new Date(classDate);
                              classStartTime.setHours(
                                parseInt(hours),
                                parseInt(minutes),
                                0,
                                0
                              );

                              const classEndTime = new Date(classStartTime);
                              classEndTime.setHours(
                                classStartTime.getHours() +
                                  parseInt(classInfo.classDuration)
                              );

                              if (
                                now >= classStartTime &&
                                now <= classEndTime
                              ) {
                                return "bg-green-500/20 text-green-300 animate-pulse";
                              } else if (now < classStartTime) {
                                return "bg-blue-500/20 text-blue-300";
                              } else {
                                return "bg-gray-500/20 text-gray-300";
                              }
                            })()}`}
                          >
                            {(() => {
                              const now = new Date();
                              const classDate = new Date(classInfo.classDate);
                              const [hours, minutes] =
                                classInfo.classTime.split(":");
                              const classStartTime = new Date(classDate);
                              classStartTime.setHours(
                                parseInt(hours),
                                parseInt(minutes),
                                0,
                                0
                              );

                              const classEndTime = new Date(classStartTime);
                              classEndTime.setHours(
                                classStartTime.getHours() +
                                  parseInt(classInfo.classDuration)
                              );

                              if (
                                now >= classStartTime &&
                                now <= classEndTime
                              ) {
                                return "🔴 LIVE";
                              } else if (now < classStartTime) {
                                return "⏰ Upcoming";
                              } else {
                                return "✅ Ended";
                              }
                            })()}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300 mb-3">
                          <div className="flex items-center space-x-2">
                            <User size={16} className="text-gray-400" />
                            <span>{classInfo.instructorId}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock size={16} className="text-gray-400" />
                            <span>{classInfo.classTime}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span>
                              {new Date(
                                classInfo.classDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <BookOpen size={16} className="text-gray-400" />
                            <span>{classInfo.classDuration}h</span>
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm mb-4">
                          {classInfo.topicCovered || "Topic will be announced"}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="ml-4 flex flex-col gap-3">
                        {/* Join Class Button */}
                        {(() => {
                          const now = new Date();
                          const classDate = new Date(classInfo.classDate);
                          const [hours, minutes] =
                            classInfo.classTime.split(":");
                          const classStartTime = new Date(classDate);
                          classStartTime.setHours(
                            parseInt(hours),
                            parseInt(minutes),
                            0,
                            0
                          );

                          const classEndTime = new Date(classStartTime);
                          classEndTime.setHours(
                            classStartTime.getHours() +
                              parseInt(classInfo.classDuration)
                          );

                          if (now >= classStartTime && now <= classEndTime) {
                            return (
                              <button
                                onClick={() =>
                                  window.open(classInfo.classLink, "_blank")
                                }
                                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 transition font-semibold animate-pulse min-w-[140px]"
                              >
                                <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                                <span>Join Now</span>
                              </button>
                            );
                          } else if (now < classStartTime) {
                            return (
                              <button
                                onClick={() =>
                                  window.open(classInfo.classLink, "_blank")
                                }
                                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition font-semibold min-w-[140px]"
                              >
                                <Calendar size={18} />
                                <span>Join Class</span>
                              </button>
                            );
                          } else {
                            return (
                              <button
                                disabled
                                className="flex items-center space-x-2 px-6 py-3 bg-gray-500/20 text-gray-400 rounded-xl cursor-not-allowed min-w-[140px]"
                              >
                                <X size={18} />
                                <span>Class Ended</span>
                              </button>
                            );
                          }
                        })()}

                        {/* Class Info Button */}
                        <button
                          onClick={() => handleShowClassInfo(classInfo)}
                          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl hover:from-purple-600 hover:to-pink-700 transition font-semibold min-w-[140px]"
                        >
                          <Eye size={18} />
                          <span>Class Info</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Info Bar */}
                    <div className="border-t border-white/10 pt-4">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Class ID: {classInfo._id.slice(-8)}</span>
                        {(() => {
                          const now = new Date();
                          const classDate = new Date(classInfo.classDate);
                          const [hours, minutes] =
                            classInfo.classTime.split(":");
                          const classStartTime = new Date(classDate);
                          classStartTime.setHours(
                            parseInt(hours),
                            parseInt(minutes),
                            0,
                            0
                          );

                          const classEndTime = new Date(classStartTime);
                          classEndTime.setHours(
                            classStartTime.getHours() +
                              parseInt(classInfo.classDuration)
                          );

                          if (now >= classStartTime && now <= classEndTime) {
                            return (
                              <span className="text-green-300">● Live now</span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Class Info Modal */}
            {showClassInfo && selectedClass && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">
                      {selectedClass.className} - Class Information
                    </h3>
                    <button
                      onClick={() => setShowClassInfo(false)}
                      className="text-white/70 hover:text-white transition"
                    >
                      <X size={28} />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-6">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Class Details
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              Instructor ID:
                            </span>
                            <span className="text-white font-medium">
                              {selectedClass.instructorId}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Date:</span>
                            <span className="text-white">
                              {new Date(
                                selectedClass.classDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Time:</span>
                            <span className="text-white">
                              {selectedClass.classTime}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Duration:</span>
                            <span className="text-white">
                              {selectedClass.classDuration}h
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Class ID:</span>
                            <span className="text-white font-mono">
                              {selectedClass._id}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Meeting Info
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="pt-2">
                            <span className="text-gray-400">Meeting Link:</span>
                            <div className="mt-1 p-2 bg-white/5 rounded text-white text-xs break-all">
                              {selectedClass.classLink}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Course Content */}
                    <div className="space-y-6">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Class Topic
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {selectedClass.topicCovered ||
                            "Topic will be announced during the class"}
                        </p>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Instructor Notes
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {selectedClass.notes || "No additional notes"}
                        </p>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Attendance Status
                        </h4>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            selectedClass.attendance === "Present"
                              ? "bg-green-500/20 text-green-300"
                              : selectedClass.attendance === "Absent"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {selectedClass.attendance || "Not marked"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium ${(() => {
                          const now = new Date();
                          const classDate = new Date(selectedClass.classDate);
                          const [hours, minutes] =
                            selectedClass.classTime.split(":");
                          const classStartTime = new Date(classDate);
                          classStartTime.setHours(
                            parseInt(hours),
                            parseInt(minutes),
                            0,
                            0
                          );

                          const classEndTime = new Date(classStartTime);
                          classEndTime.setHours(
                            classStartTime.getHours() +
                              parseInt(selectedClass.classDuration)
                          );

                          if (now >= classStartTime && now <= classEndTime) {
                            return "bg-green-500/20 text-green-300";
                          } else if (now < classStartTime) {
                            return "bg-blue-500/20 text-blue-300";
                          } else {
                            return "bg-gray-500/20 text-gray-300";
                          }
                        })()}`}
                      >
                        Status:{" "}
                        {(() => {
                          const now = new Date();
                          const classDate = new Date(selectedClass.classDate);
                          const [hours, minutes] =
                            selectedClass.classTime.split(":");
                          const classStartTime = new Date(classDate);
                          classStartTime.setHours(
                            parseInt(hours),
                            parseInt(minutes),
                            0,
                            0
                          );

                          const classEndTime = new Date(classStartTime);
                          classEndTime.setHours(
                            classStartTime.getHours() +
                              parseInt(selectedClass.classDuration)
                          );

                          if (now >= classStartTime && now <= classEndTime) {
                            return "Live";
                          } else if (now < classStartTime) {
                            return "Upcoming";
                          } else {
                            return "Ended";
                          }
                        })()}
                      </span>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowClassInfo(false)}
                        className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition border border-white/20"
                      >
                        Close
                      </button>
                      {(() => {
                        const now = new Date();
                        const classDate = new Date(selectedClass.classDate);
                        const [hours, minutes] =
                          selectedClass.classTime.split(":");
                        const classStartTime = new Date(classDate);
                        classStartTime.setHours(
                          parseInt(hours),
                          parseInt(minutes),
                          0,
                          0
                        );

                        const classEndTime = new Date(classStartTime);
                        classEndTime.setHours(
                          classStartTime.getHours() +
                            parseInt(selectedClass.classDuration)
                        );

                        if (now <= classEndTime) {
                          return (
                            <button
                              onClick={() => {
                                window.open(selectedClass.classLink, "_blank");
                                setShowClassInfo(false);
                              }}
                              className={`px-6 py-3 rounded-xl font-semibold transition ${
                                now >= classStartTime && now <= classEndTime
                                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                  : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                              }`}
                            >
                              {now >= classStartTime && now <= classEndTime
                                ? "Join Live Class"
                                : "Join Class"}
                            </button>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HomeWork Tab */}

        {activeTab === "homework" && (
          <div className="space-y-6">
            {/* Homework Header */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20">
              <h2 className="text-xl font-bold text-white mb-2">
                Homework & Assignments
              </h2>
              <p className="text-gray-300">View and submit your assignments</p>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-400">
                  Total: {homeWorkData.length} assignments
                </div>
                <div className="text-sm text-gray-400">
                  Pending:{" "}
                  {homeWorkData.filter((hw) => hw.status === "pending").length}
                </div>
              </div>
            </div>

            {/* Homework List */}
            <div className="grid gap-4">
              {homeWorkData
                .sort(
                  (a, b) => new Date(b.assignedDate) - new Date(a.assignedDate)
                )
                .map((homework) => (
                  <div
                    key={homework._id}
                    className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {homework.homeworkTitle}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              homework.status === "submitted"
                                ? "bg-green-500/20 text-green-300"
                                : homework.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-300"
                                  : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {homework.status.charAt(0).toUpperCase() +
                              homework.status.slice(1)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              homework.priority === "high"
                                ? "bg-red-500/20 text-red-300"
                                : homework.priority === "medium"
                                  ? "bg-orange-500/20 text-orange-300"
                                  : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {homework.priority.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300 mb-3">
                          <div className="flex items-center space-x-2">
                            <BookOpen size={16} className="text-gray-400" />
                            <span>{homework.homeworkType}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User size={16} className="text-gray-400" />
                            <span>{homework.studentName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span>
                              Assigned:{" "}
                              {new Date(
                                homework.assignedDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Target size={16} className="text-gray-400" />
                            <span>Priority: {homework.priority}</span>
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm mb-4">
                          {homework.homeworkDescription}
                        </p>

                        {homework.additionalNotes && (
                          <div className="bg-white/5 p-3 rounded-lg border border-white/10 mb-4">
                            <p className="text-xs text-gray-400 mb-1">
                              Additional Notes:
                            </p>
                            <p className="text-gray-300 text-sm">
                              {homework.additionalNotes}
                            </p>
                          </div>
                        )}

                        <div className="text-xs text-gray-400">
                          Last updated:{" "}
                          {new Date(homework.updatedAt).toLocaleDateString()} at{" "}
                          {new Date(homework.updatedAt).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col gap-3">
                        <button
                          onClick={() => handleViewHomework(homework)}
                          className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition font-semibold min-w-[140px]"
                        >
                          <Eye size={18} />
                          <span>View Details</span>
                        </button>

                        {homework.status === "pending" && (
                          <button
                            onClick={() => handleViewHomework(homework)}
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl hover:from-emerald-600 hover:to-green-700 transition font-semibold min-w-[140px]"
                          >
                            <Upload size={18} />
                            <span>Submit</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Empty State */}
            {homeWorkData.length === 0 && (
              <div className="bg-white/10 backdrop-blur-lg p-12 rounded-3xl border border-white/20 text-center">
                <BookOpen size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Homework Assigned
                </h3>
                <p className="text-gray-300">
                  You don't have any homework assignments at the moment.
                </p>
              </div>
            )}

            {/* Homework Modal */}
            {showHomeworkModal && selectedHomework && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">
                      {selectedHomework.homeworkTitle}
                    </h3>
                    <button
                      onClick={() => setShowHomeworkModal(false)}
                      className="text-white/70 hover:text-white transition"
                    >
                      <X size={28} />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Assignment Details */}
                    <div className="space-y-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Assignment Details
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Type:</span>
                            <span className="text-white">
                              {selectedHomework.homeworkType}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Student:</span>
                            <span className="text-white">
                              {selectedHomework.studentName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Assigned:</span>
                            <span className="text-white">
                              {new Date(
                                selectedHomework.assignedDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Priority:</span>
                            <span
                              className={`text-white font-medium ${
                                selectedHomework.priority === "high"
                                  ? "text-red-300"
                                  : selectedHomework.priority === "medium"
                                    ? "text-orange-300"
                                    : "text-blue-300"
                              }`}
                            >
                              {selectedHomework.priority.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span
                              className={`font-medium ${
                                selectedHomework.status === "submitted"
                                  ? "text-green-300"
                                  : selectedHomework.status === "pending"
                                    ? "text-yellow-300"
                                    : "text-red-300"
                              }`}
                            >
                              {selectedHomework.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              Class Schedule ID:
                            </span>
                            <span className="text-white text-xs">
                              {selectedHomework.classScheduleId}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Description
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {selectedHomework.homeworkDescription}
                        </p>
                      </div>

                      {selectedHomework.additionalNotes && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                          <h4 className="text-lg font-semibold text-white mb-4">
                            Additional Notes
                          </h4>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {selectedHomework.additionalNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submission Form */}
                    <div className="space-y-4">
                      {selectedHomework.status === "pending" ? (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                          <h4 className="text-lg font-semibold text-white mb-4">
                            Submit Assignment
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-200 mb-2">
                                Submission Notes
                              </label>
                              <textarea
                                value={submissionForm.notes}
                                onChange={(e) =>
                                  setSubmissionForm({
                                    ...submissionForm,
                                    notes: e.target.value,
                                  })
                                }
                                className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 text-white outline-none focus:ring-2 ring-emerald-400 transition placeholder:text-gray-400 resize-none"
                                rows={4}
                                placeholder="Add any notes about your submission..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-200 mb-2">
                                Attachments
                              </label>
                              <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-white/30 transition-colors">
                                <Upload
                                  size={32}
                                  className="text-gray-400 mx-auto mb-2"
                                />
                                <p className="text-gray-300 text-sm">
                                  Click to upload files or drag and drop
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                  Supported formats: PDF, DOC, DOCX, TXT, JPG,
                                  PNG
                                </p>
                                <input
                                  type="file"
                                  multiple
                                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                  className="hidden"
                                  onChange={(e) => {
                                    // Handle file upload
                                    console.log(
                                      "Files selected:",
                                      e.target.files
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                          <h4 className="text-lg font-semibold text-white mb-4">
                            Submission Status
                          </h4>
                          <div className="flex items-center space-x-2 text-green-300">
                            <CheckCircle size={20} />
                            <span>Assignment submitted successfully</span>
                          </div>
                          {selectedHomework.submission && (
                            <div className="mt-4 text-sm text-gray-300">
                              <p>
                                <strong>Submitted on:</strong>{" "}
                                {new Date(
                                  selectedHomework.submission.submittedAt
                                ).toLocaleDateString()}
                              </p>
                              <p>
                                <strong>Notes:</strong>{" "}
                                {selectedHomework.submission.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Assignment Timeline */}
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Timeline
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <div>
                              <span className="text-gray-400">Created:</span>
                              <span className="text-white ml-2">
                                {new Date(
                                  selectedHomework.createdAt
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <div>
                              <span className="text-gray-400">Assigned:</span>
                              <span className="text-white ml-2">
                                {new Date(
                                  selectedHomework.assignedDate
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                            <div>
                              <span className="text-gray-400">
                                Last Updated:
                              </span>
                              <span className="text-white ml-2">
                                {new Date(
                                  selectedHomework.updatedAt
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-white/10">
                    <button
                      onClick={() => setShowHomeworkModal(false)}
                      className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition border border-white/20"
                    >
                      Close
                    </button>
                    {selectedHomework.status === "pending" && (
                      <button
                        onClick={() =>
                          handleHomeworkSubmit(selectedHomework._id)
                        }
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl hover:from-emerald-600 hover:to-green-700 transition font-semibold"
                      >
                        Submit Assignment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Homework Tab */}

        {/* Progress Tab */}
        {activeTab === "progress" && (
          <ProgressTab
            activeTab={activeTab}
            allSchedule={allSchedule}
            homeWorkData={homeWorkData}
            userData={userData}
          />
        )}
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
  required = false,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 text-white outline-none focus:ring-2 ring-emerald-400 transition placeholder:text-gray-400"
        placeholder={placeholder || label}
        required={required}
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder,
  rows = 3,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 text-white outline-none focus:ring-2 ring-emerald-400 transition placeholder:text-gray-400 resize-none"
        placeholder={placeholder || label}
        rows={rows}
        required={required}
      />
    </div>
  );
}
