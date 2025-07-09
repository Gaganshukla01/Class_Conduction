import React, { useState, useEffect, useContext } from "react";
import {
  User,
  BookOpen,
  Calendar,
  Clock,
  CheckCircle2,
  MessageSquare,
  X,
  Upload ,
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

import {
  getNoteById,
  searchNotes,
  deleteNote,
  updateNote,
  createNote,
  getAllNotes,
} from "../utils/noteServices";
import axios from "axios";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("notes");
  const [showClassInfo, setShowClassInfo] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classesData, setClassesData] = useState([]);

  const [studentInfo] = useState({
    id: "CS001",
    name: "Alice Johnson",
    rollNo: "CS001",
    class: "Computer Science - Year 3",
    email: "alice.johnson@university.edu",
  });

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

  const { userData, allSchedule } = useContext(AppContent);

  // for loading the data from the server
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const allclassSchedulesResponse = allSchedule;
        console.log("All Class Schedules:", allclassSchedulesResponse);

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
      return classStart > now; // Classes that haven't started yet today
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

  // Homework States
  const [homeworkData, setHomeworkData] = useState([
    {
      id: 1,
      title: "React Components Assignment",
      subject: "Web Development",
      description:
        "Create a React component library with at least 5 reusable components.",
      dueDate: "2024-07-15",
      assignedDate: "2024-07-01",
      status: "pending",
      maxMarks: 100,
      instructor: "Dr. Smith",
      attachments: ["assignment_brief.pdf"],
      submission: null,
    },
    // Add more homework items as needed
  ]);

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

  // Attendance State
  const [attendanceData] = useState([
    {
      id: 1,
      className: "Web Development",
      date: "2024-06-25",
      status: "present",
      classStartAt: "2024-06-25T09:00:00Z",
      classEndAt: "2024-06-25T11:00:00Z",
      topicCovered: "React Components and Props",
      additionalNotes: "Excellent participation in class discussion",
    },
    {
      id: 2,
      className: "Database Systems",
      date: "2024-06-24",
      status: "present",
      classStartAt: "2024-06-24T14:00:00Z",
      classEndAt: "2024-06-24T16:00:00Z",
      topicCovered: "SQL Joins and Subqueries",
      additionalNotes: "Completed all exercises successfully",
    },
    {
      id: 3,
      className: "Data Structures",
      date: "2024-06-23",
      status: "absent",
      classStartAt: "2024-06-23T10:00:00Z",
      classEndAt: "2024-06-23T12:00:00Z",
      topicCovered: "Binary Trees and Traversal",
      additionalNotes: "Medical leave",
    },
  ]);

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
        console.log("Deleting note with ID:", noteId); // Debug log
        const response = await deleteNote(noteId);
        console.log("Delete response:", response); // Debug log

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
                  {studentInfo.name}
                </h1>
                <p className="text-gray-300">
                  {studentInfo.rollNo} • {studentInfo.class}
                </p>
                <p className="text-sm text-gray-400">{studentInfo.email}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-emerald-300">
                {progressData.attendanceRate}%
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
            {/* Attendance Summary */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Classes</p>
                    <p className="text-2xl font-bold text-white">
                      {progressData.totalClasses}
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
                      {progressData.attended}
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
                      {progressData.attendanceRate}%
                    </p>
                  </div>
                  <TrendingUp className="text-cyan-400" size={32} />
                </div>
              </div>
            </div>

            {/* Attendance Records */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">
                Recent Attendance
              </h3>
              <div className="space-y-3">
                {attendanceData.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white/5 p-4 rounded-xl border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            record.status === "present"
                              ? "bg-green-400"
                              : "bg-red-400"
                          }`}
                        />
                        <span className="font-semibold text-white">
                          {record.className}
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          record.status === "present"
                            ? "bg-green-500/20 text-green-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {record.status === "present" ? "Present" : "Absent"}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                      <div>
                        <span className="text-gray-400">Time:</span>{" "}
                        {new Date(record.classStartAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(record.classEndAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div>
                        <span className="text-gray-400">Topic:</span>{" "}
                        {record.topicCovered}
                      </div>
                    </div>

                    {record.additionalNotes && (
                      <div className="mt-2 text-sm text-gray-300">
                        <span className="text-gray-400">Notes:</span>{" "}
                        {record.additionalNotes}
                      </div>
                    )}
                  </div>
                ))}
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
            {classesData.length === 0 ? (
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
                {classesData.map((classInfo) => (
                  <div
                    key={classInfo.id}
                    className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {classInfo.className}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              classInfo.status === "live"
                                ? "bg-green-500/20 text-green-300 animate-pulse"
                                : classInfo.status === "upcoming"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : "bg-gray-500/20 text-gray-300"
                            }`}
                          >
                            {classInfo.status === "live"
                              ? "🔴 LIVE"
                              : classInfo.status === "upcoming"
                                ? "⏰ Upcoming"
                                : "✅ Ended"}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300 mb-3">
                          <div className="flex items-center space-x-2">
                            <User size={16} className="text-gray-400" />
                            <span>{classInfo.instructor}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock size={16} className="text-gray-400" />
                            <span>{classInfo.time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar size={16} className="text-gray-400" />
                            <span>
                              {new Date(classInfo.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <BookOpen size={16} className="text-gray-400" />
                            <span>{classInfo.duration}</span>
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm mb-4">
                          {classInfo.description}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="ml-4 flex flex-col gap-3">
                        {/* Join Class Button */}
                        {classInfo.status === "live" ? (
                          <button
                            onClick={() =>
                              window.open(classInfo.meetingLink, "_blank")
                            }
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl hover:from-green-600 hover:to-emerald-700 transition font-semibold animate-pulse min-w-[140px]"
                          >
                            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                            <span>Join Now</span>
                          </button>
                        ) : classInfo.status === "upcoming" ? (
                          <button
                            onClick={() =>
                              window.open(classInfo.meetingLink, "_blank")
                            }
                            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl hover:from-blue-600 hover:to-cyan-700 transition font-semibold min-w-[140px]"
                          >
                            <Calendar size={18} />
                            <span>Join Class</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex items-center space-x-2 px-6 py-3 bg-gray-500/20 text-gray-400 rounded-xl cursor-not-allowed min-w-[140px]"
                          >
                            <X size={18} />
                            <span>Class Ended</span>
                          </button>
                        )}

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
                        <span>Class Code: {classInfo.classCode}</span>
                        {classInfo.status === "live" && (
                          <span className="text-green-300">● Live now</span>
                        )}
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
                            <span className="text-gray-400">Instructor:</span>
                            <span className="text-white font-medium">
                              {selectedClass.instructor}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Date:</span>
                            <span className="text-white">
                              {new Date(
                                selectedClass.date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Time:</span>
                            <span className="text-white">
                              {selectedClass.time}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Duration:</span>
                            <span className="text-white">
                              {selectedClass.duration}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Class Code:</span>
                            <span className="text-white font-mono">
                              {selectedClass.classCode}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Meeting Info
                        </h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Meeting ID:</span>
                            <span className="text-white font-mono">
                              {selectedClass.meetingId}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Passcode:</span>
                            <span className="text-white font-mono">
                              {selectedClass.passcode}
                            </span>
                          </div>
                          <div className="pt-2">
                            <span className="text-gray-400">Meeting Link:</span>
                            <div className="mt-1 p-2 bg-white/5 rounded text-white text-xs break-all">
                              {selectedClass.meetingLink}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Course Content */}
                    <div className="space-y-6">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Class Description
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {selectedClass.description}
                        </p>
                        <div className="mt-4">
                          <span className="text-gray-400 text-sm">
                            Next Topic:
                          </span>
                          <p className="text-white font-medium">
                            {selectedClass.nextTopic}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Prerequisites
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedClass.prerequisites.map((prereq, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs"
                            >
                              {prereq}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Class Materials
                        </h4>
                        <ul className="space-y-2">
                          {selectedClass.materials.map((material, index) => (
                            <li
                              key={index}
                              className="flex items-center space-x-2 text-sm text-gray-300"
                            >
                              <FileText size={14} className="text-gray-400" />
                              <span>{material}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Assignments
                        </h4>
                        <ul className="space-y-2">
                          {selectedClass.assignments.map(
                            (assignment, index) => (
                              <li
                                key={index}
                                className="flex items-center space-x-2 text-sm text-gray-300"
                              >
                                <Target size={14} className="text-gray-400" />
                                <span>{assignment}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          selectedClass.status === "live"
                            ? "bg-green-500/20 text-green-300"
                            : selectedClass.status === "upcoming"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-gray-500/20 text-gray-300"
                        }`}
                      >
                        Status:{" "}
                        {selectedClass.status.charAt(0).toUpperCase() +
                          selectedClass.status.slice(1)}
                      </span>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowClassInfo(false)}
                        className="px-6 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition border border-white/20"
                      >
                        Close
                      </button>
                      {selectedClass.status !== "ended" && (
                        <button
                          onClick={() => {
                            window.open(selectedClass.meetingLink, "_blank");
                            setShowClassInfo(false);
                          }}
                          className={`px-6 py-3 rounded-xl font-semibold transition ${
                            selectedClass.status === "live"
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                              : "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                          }`}
                        >
                          {selectedClass.status === "live"
                            ? "Join Live Class"
                            : "Join Class"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HomeWork Tab */}

        {/* Homework Tab */}
        {activeTab === "homework" && (
          <div className="space-y-6">
            {/* Homework Header */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20">
              <h2 className="text-xl font-bold text-white mb-2">
                Homework & Assignments
              </h2>
              <p className="text-gray-300">View and submit your assignments</p>
            </div>

            {/* Homework List */}
            <div className="grid gap-4">
              {homeworkData.map((homework) => (
                <div
                  key={homework.id}
                  className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {homework.title}
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
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300 mb-3">
                        <div className="flex items-center space-x-2">
                          <BookOpen size={16} className="text-gray-400" />
                          <span>{homework.subject}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User size={16} className="text-gray-400" />
                          <span>{homework.instructor}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span>
                            Due:{" "}
                            {new Date(homework.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target size={16} className="text-gray-400" />
                          <span>Max Marks: {homework.maxMarks}</span>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-4">
                        {homework.description}
                      </p>
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

            {/* Homework Modal */}
            {showHomeworkModal && selectedHomework && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-white">
                      {selectedHomework.title}
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
                            <span className="text-gray-400">Subject:</span>
                            <span className="text-white">
                              {selectedHomework.subject}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Instructor:</span>
                            <span className="text-white">
                              {selectedHomework.instructor}
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
                            <span className="text-gray-400">Due Date:</span>
                            <span className="text-white">
                              {new Date(
                                selectedHomework.dueDate
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Max Marks:</span>
                            <span className="text-white">
                              {selectedHomework.maxMarks}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          Description
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          {selectedHomework.description}
                        </p>
                      </div>
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
                                Notes
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
                              <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center">
                                <Upload
                                  size={32}
                                  className="text-gray-400 mx-auto mb-2"
                                />
                                <p className="text-gray-300 text-sm">
                                  Click to upload files or drag and drop
                                </p>
                                <input
                                  type="file"
                                  multiple
                                  className="hidden"
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
                          handleHomeworkSubmit(selectedHomework.id)
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

        {/* Progress Tab */}
        {activeTab === "progress" && (
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">
                Overall Progress
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
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
              </div>
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
                    <div className="w-20 text-sm text-gray-300">
                      {week.week}
                    </div>
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
