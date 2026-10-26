import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  IndianRupeeIcon,
  Timer,
  Projector,
  Library,
  Code2,
} from "lucide-react";
import {
  getNoteById,
  searchNotes,
  deleteNote,
  updateNote,
  createNote,
  getAllNotes,
} from "../utils/noteServices";
import { AppContent } from "../context/Context";
import axios from "axios";
import PaymentTab from "../components/PaymentBoard";
import TimezoneConverter from "../components/TimeZone";
import ProjectShowcase from "./StudentProject";
import { toast } from "react-toastify";
import StudyMaterials from "../components/student/StudyMaterials";
import StudentQuestions from "../components/student/StudentQuestions";
import AttendanceDashboard from "../components/student/AttendanceDashboard";
import ProgressDashboard from "../components/student/ProgressDashboard";
import PdfUploadField from "../components/PdfUploadField";
import { computeStudentStats } from "../utils/studentStats";
import { uploadPdf } from "../utils/uploadPdf";

const STATUS_TONE = {
  completed: "bg-green-500/20 text-green-300",
  submitted: "bg-cyan-500/20 text-cyan-300",
  pending: "bg-yellow-500/20 text-yellow-300",
  overdue: "bg-red-500/20 text-red-300",
};
const statusTone = (status) => STATUS_TONE[status] || "bg-gray-500/20 text-gray-300";
const statusText = (status) => ({ completed: "text-green-300", submitted: "text-cyan-300", pending: "text-yellow-300", overdue: "text-red-300" })[status] || "text-gray-300";
const EMPTY_SUBMISSION = { notes: "", link: "", file: null, progress: null, busy: false };
const VALID_TABS = ["notes","resources","questions","classes","attendance","homework","progress","payment","upload","timezone"];

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    return VALID_TABS.includes(t) ? t : "notes";
  });
  const [showClassInfo, setShowClassInfo] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classesData, setClassesData] = useState([]);
  const [homeWorkData, setHomeworkData] = useState([]);
  const navigate = useNavigate();

  const goToUpload = () => {
    navigate("/projectview");
  };

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

  // One source of truth for attendance numbers (header, attendance, progress)
  const stats = useMemo(
    () => computeStudentStats(allSchedule, userData.userId, homeWorkData),
    [allSchedule, userData.userId, homeWorkData]
  );

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

    // Filter classes for today
    const todayClasses = schedules.filter(
      (cls) => new Date(cls.classDate).toDateString() === today
    );

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
  const [submissionForm, setSubmissionForm] = useState(EMPTY_SUBMISSION);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showNoteForm || showHomeworkModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showHomeworkModal, showNoteForm]);

  // Homework Functions
  const handleHomeworkSubmit = async (homeworkId) => {
    const f = submissionForm;
    if (!f.notes.trim() && !f.link.trim() && !f.file) {
      toast.error("Add a note, a link or a PDF before submitting");
      return;
    }
    setSubmissionForm((p) => ({ ...p, busy: true, progress: f.file ? 0 : null }));
    try {
      let file;
      if (f.file) {
        file = await uploadPdf({
          file: f.file,
          purpose: "homework",
          onProgress: (progress) => setSubmissionForm((p) => ({ ...p, progress })),
        });
      }
      const { data } = await axios.put(
        `${backend_url}/api/homework/${homeworkId}/submit`,
        { note: f.notes, link: f.link, file }
      );
      setHomeworkData((prev) => prev.map((hw) => (hw._id === homeworkId ? data.data : hw)));
      toast.success("Homework submitted! Your instructor has been notified.");
      setShowHomeworkModal(false);
      setSubmissionForm(EMPTY_SUBMISSION);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not submit");
      setSubmissionForm((p) => ({ ...p, busy: false, progress: null }));
    }
  };

  const handleViewHomework = (homework) => {
    setSubmissionForm(EMPTY_SUBMISSION);
    setSelectedHomework(homework);
    setShowHomeworkModal(true);
  };

  const handleShowClassInfo = (classInfo) => {
    setSelectedClass(classInfo);
    setShowClassInfo(true);
  };

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
        const response = await deleteNote(noteId);
        if (response.success) {
          // Filter out the deleted note using both _id and id for compatibility
          setNotes(
            notes.filter((note) => note._id !== noteId && note.id !== noteId)
          );
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
                  {stats.hasData ? `${stats.rate}%` : "—"}
                </p>
              </div>
              <div className="text-sm text-gray-300">Attendance Rate</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "notes", label: "My Notes", icon: FileText },
            { id: "resources", label: "Study Materials", icon: Library },
            { id: "questions", label: "Code Questions", icon: Code2 },
            { id: "classes", label: "Live Classes", icon: BookOpen },
            { id: "attendance", label: "Attendance", icon: Calendar },
            { id: "homework", label: "Homework", icon: Target },
            { id: "progress", label: "Progress", icon: TrendingUp },
            { id: "payment", label: "Payments", icon: IndianRupeeIcon },
            { id: "upload", label: "Project Upload", icon: Projector },
            { id: "timezone", label: "TimeZone", icon: Timer },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 whitespace-nowrap items-center hover:cursor-pointer space-x-2 px-5 py-3 rounded-xl font-medium transition ${
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
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl hover:from-emerald-600 hover:to-cyan-700 cursor-pointer transition"
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
        {activeTab === "attendance" && <AttendanceDashboard stats={stats} />}

        {/* Study materials (class notes + resource library) */}
        {activeTab === "resources" && <StudyMaterials />}
        {activeTab === "questions" && <StudentQuestions />}

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
              {[...homeWorkData]
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
                              statusTone(homework.status)
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
                          {homework.dueDate && (
                            <div className="flex items-center space-x-2">
                              <Clock size={16} className="text-gray-400" />
                              <span className={homework.status === "overdue" ? "text-red-300" : ""}>
                                Due: {new Date(homework.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
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

                        {["pending", "overdue"].includes(homework.status) && (
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
                                statusText(selectedHomework.status)
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
                      {["pending", "overdue"].includes(selectedHomework.status) ? (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                          <h4 className="text-lg font-semibold text-white mb-1">
                            Submit Assignment
                          </h4>
                          {selectedHomework.dueDate && (
                            <p className={`text-xs mb-4 ${selectedHomework.status === "overdue" ? "text-red-300" : "text-gray-400"}`}>
                              Due {new Date(selectedHomework.dueDate).toLocaleDateString()}
                              {selectedHomework.status === "overdue" ? " · overdue, but you can still submit" : ""}
                            </p>
                          )}
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-200 mb-2">Notes</label>
                              <textarea
                                value={submissionForm.notes}
                                onChange={(e) => setSubmissionForm({ ...submissionForm, notes: e.target.value })}
                                disabled={submissionForm.busy}
                                className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 text-white outline-none focus:ring-2 ring-emerald-400 transition placeholder:text-gray-400 resize-none"
                                rows={3}
                                maxLength={2000}
                                placeholder="Add any notes about your submission..."
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-200 mb-2">Link (GitHub, Drive, CodePen…)</label>
                              <input
                                type="url"
                                value={submissionForm.link}
                                onChange={(e) => setSubmissionForm({ ...submissionForm, link: e.target.value })}
                                disabled={submissionForm.busy}
                                className="w-full bg-white/5 rounded-xl px-4 py-3 border border-white/10 text-white outline-none focus:ring-2 ring-emerald-400 transition placeholder:text-gray-400"
                                placeholder="https://"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-200 mb-2">PDF (optional)</label>
                              <PdfUploadField
                                file={submissionForm.file}
                                onChange={(file) => setSubmissionForm((p) => ({ ...p, file }))}
                                progress={submissionForm.progress}
                                disabled={submissionForm.busy}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                          <h4 className="text-lg font-semibold text-white mb-4">Submission Status</h4>
                          <div className={`flex items-center space-x-2 ${selectedHomework.status === "completed" ? "text-green-300" : "text-cyan-300"}`}>
                            <CheckCircle2 size={20} />
                            <span>
                              {selectedHomework.status === "completed"
                                ? "Reviewed and marked completed"
                                : "Submitted — waiting for your instructor's review"}
                            </span>
                          </div>
                          <div className="mt-4 text-sm text-gray-300 space-y-1.5">
                            {selectedHomework.submittedAt && (
                              <p><strong>Submitted on:</strong> {new Date(selectedHomework.submittedAt).toLocaleString()}</p>
                            )}
                            {selectedHomework.submissionNote && (
                              <p><strong>Notes:</strong> {selectedHomework.submissionNote}</p>
                            )}
                            {selectedHomework.submissionLink && (
                              <p><strong>Link:</strong> <a className="text-cyan-300 underline break-all" href={selectedHomework.submissionLink} target="_blank" rel="noreferrer">{selectedHomework.submissionLink}</a></p>
                            )}
                            {selectedHomework.submissionFile?.url && (
                              <p><strong>PDF:</strong> <a className="text-cyan-300 underline" href={selectedHomework.submissionFile.url} target="_blank" rel="noreferrer">{selectedHomework.submissionFile.originalName || "Open file"}</a></p>
                            )}
                          </div>
                          {selectedHomework.feedback && (
                            <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
                              <p className="text-xs text-emerald-200 mb-1">Instructor feedback</p>
                              <p className="text-sm text-white whitespace-pre-line">{selectedHomework.feedback}</p>
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
                    {["pending", "overdue"].includes(selectedHomework.status) && (
                      <button
                        onClick={() => handleHomeworkSubmit(selectedHomework._id)}
                        disabled={submissionForm.busy}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl hover:from-emerald-600 hover:to-green-700 transition font-semibold disabled:opacity-60"
                      >
                        {submissionForm.busy ? "Submitting…" : "Submit Assignment"}
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
          <ProgressDashboard stats={stats} homeworkData={homeWorkData} />
        )}
        {activeTab === "payment" && <PaymentTab />}
        {activeTab === "timezone" && <TimezoneConverter />}
        {activeTab === "upload" && goToUpload()}
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
