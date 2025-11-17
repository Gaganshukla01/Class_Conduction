import React, { useState, useRef, useEffect, useContext } from "react";
import { AppContent } from "../context/Context";
import {
  Save,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Type,
  ChevronDown,
  Check,
  User,
  FileText,
  Sparkles,
  Loader2,
  Heading,
} from "lucide-react";

export default function CommonAreaEditor() {
  const { allUserData, backend_url } = useContext(AppContent);
  const [chatHeading, setChatHeading] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [content, setContent] = useState("");
  const [savedNotification, setSavedNotification] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const editorRef = useRef(null);

  // Filter students from allUserData
  useEffect(() => {
    if (allUserData.data && allUserData.data.length > 0) {
      const studentUsers = allUserData.data.filter(
        (user) => user.userType === "student"
      );
      setStudents(studentUsers);
    }
  }, [allUserData]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSave = async () => {
    if (!selectedStudent) {
      alert("Please select a student first!");
      return;
    }

    if (
      !editorRef.current?.innerHTML ||
      editorRef.current.innerHTML.trim() === ""
    ) {
      alert("Please write a chat before saving!");
      return;
    }

    const payload = {
      userId: selectedStudent._id,
      studentName: selectedStudent.name,
      studentEmail: selectedStudent.email,
      chat: editorRef.current.innerHTML,
      heading: chatHeading,
    };

    try {
      setIsSaving(true);

      const response = await fetch(`${backend_url}/api/chateditor/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        // Clear editor and reset
        editorRef.current.innerHTML = "";
        setSelectedStudent(null);
        setChatHeading("");
        // Show success notification
        setSavedNotification(true);
        setTimeout(() => setSavedNotification(false), 3000);
      } else {
        alert(result.message || "Failed to save chat. Please try again.");
      }
    } catch (error) {
      console.error("Error saving chat:", error);
      alert("An error occurred while saving. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toolbarButtons = [
    { icon: Bold, command: "bold", tooltip: "Bold (Ctrl+B)" },
    { icon: Italic, command: "italic", tooltip: "Italic (Ctrl+I)" },
    { icon: Underline, command: "underline", tooltip: "Underline (Ctrl+U)" },
    { divider: true },
    { icon: AlignLeft, command: "justifyLeft", tooltip: "Align Left" },
    { icon: AlignCenter, command: "justifyCenter", tooltip: "Align Center" },
    { icon: AlignRight, command: "justifyRight", tooltip: "Align Right" },
    { divider: true },
    { icon: List, command: "insertUnorderedList", tooltip: "Bullet List" },
    {
      icon: ListOrdered,
      command: "insertOrderedList",
      tooltip: "Numbered List",
    },
    { divider: true },
    { icon: Undo, command: "undo", tooltip: "Undo (Ctrl+Z)" },
    { icon: Redo, command: "redo", tooltip: "Redo (Ctrl+Y)" },
  ];

  const fontSizes = [
    "12px",
    "14px",
    "16px",
    "18px",
    "20px",
    "24px",
    "28px",
    "32px",
  ];
  const [selectedFontSize, setSelectedFontSize] = useState("16px");

  const applyFontSize = (size) => {
    execCommand("fontSize", "7");
    const fontElements = document.getElementsByTagName("font");
    for (let i = 0; i < fontElements.length; i++) {
      if (fontElements[i].size === "7") {
        fontElements[i].removeAttribute("size");
        fontElements[i].style.fontSize = size;
      }
    }
    setSelectedFontSize(size);
  };

  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center bg-blue-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-400/30 mb-4">
            <Sparkles className="mr-2 text-yellow-400" size={16} />
            <span className="text-sm">Student Conversation System</span>
          </div>
          <h1 className="text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Write Student Conversation
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Select a student and compose note for them
          </p>
        </div>

        {/* Main Editor Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
          {/* Student Selector */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <label className="text-sm font-semibold mb-3 flex items-center">
              <User className="mr-2 text-blue-400" size={18} />
              Select Student
            </label>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={students.length === 0}
                className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-left flex items-center justify-between hover:bg-white/15 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedStudent ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center font-bold text-sm">
                      {getInitials(selectedStudent.name)}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {selectedStudent.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {selectedStudent.email}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-400">
                    {students.length === 0
                      ? "No students found"
                      : "Choose a student..."}
                  </span>
                )}
                <ChevronDown
                  className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  size={20}
                />
              </button>

              {isDropdownOpen && students.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden z-20 max-h-80 overflow-y-auto">
                  {students.map((student) => (
                    <button
                      key={student._id}
                      onClick={() => {
                        setSelectedStudent(student);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-white/10 transition-all border-b border-white/5 last:border-b-0"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center font-bold text-sm">
                        {getInitials(student.name)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold flex items-center">
                          {student.name}
                          {selectedStudent?._id === student._id && (
                            <Check className="ml-2 text-green-400" size={16} />
                          )}
                        </div>
                        <div className="text-sm text-gray-400">
                          {student.email}
                        </div>
                        {student.isAccountVerified && (
                          <div className="text-xs text-green-400 mt-1">
                            ✓ Verified
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-b border-white/10 bg-white/5">
            <label className="text-sm font-semibold mb-3 flex items-center">
              <Heading className="mr-2 text-blue-400" size={18} />
               Heading
            </label>
            <input
              type="text"
              value={chatHeading}
              onChange={(e) => setChatHeading(e.target.value)}
              placeholder="Enter a heading for this chat..."
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
            />
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b border-white/10 bg-white/5">
            <div className="flex flex-wrap items-center gap-2">
              {/* Font Size Selector */}
              <select
                value={selectedFontSize}
                onChange={(e) => applyFontSize(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm hover:bg-white/15 transition-all cursor-pointer"
              >
                {fontSizes.map((size) => (
                  <option key={size} value={size} className="bg-slate-800">
                    {size}
                  </option>
                ))}
              </select>

              <div className="w-px h-6 bg-white/20"></div>

              {/* Toolbar Buttons */}
              {toolbarButtons.map((btn, index) => {
                if (btn.divider) {
                  return (
                    <div key={index} className="w-px h-6 bg-white/20"></div>
                  );
                }
                const Icon = btn.icon;
                return (
                  <button
                    key={index}
                    onClick={() => execCommand(btn.command)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all group relative"
                    title={btn.tooltip}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}

              <div className="w-px h-6 bg-white/20"></div>

              {/* Color Picker */}
              <div className="relative group">
                <button className="p-2 hover:bg-white/20 rounded-lg transition-all flex items-center">
                  <Type size={18} className="mr-1" />
                  <div className="w-4 h-4 rounded border border-white/30 bg-gradient-to-r from-red-400 to-purple-400"></div>
                </button>
                <input
                  type="color"
                  onChange={(e) => execCommand("foreColor", e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Editor Area */}
          <div className="p-6">
            <div
              ref={editorRef}
              contentEditable
              className="min-h-[400px] p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-white"
              style={{ fontSize: "16px" }}
              placeholder="Start writing your comment here..."
              onInput={(e) => setContent(e.currentTarget.innerHTML)}
              suppressContentEditableWarning={true}
            ></div>
            <div className="text-sm text-gray-400 mt-2">
              Start typing your feedback for the selected student...
            </div>
          </div>

          {/* Save Button */}
          <div className="p-6 border-t border-white/10 bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selectedStudent ? (
                <span className="flex items-center">
                  <FileText size={16} className="mr-2 text-blue-400" />
                  Writing for:{" "}
                  <strong className="ml-1 text-white">
                    {selectedStudent.name}
                  </strong>
                </span>
              ) : (
                "No student selected"
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={!selectedStudent || isSaving}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center shadow-lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={18} />
                  Save Conversation
                </>
              )}
            </button>
          </div>
        </div>

        {/* Save Notification */}
        {savedNotification && (
          <div className="fixed bottom-8 right-8 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center z-50">
            <Check className="mr-2" size={20} />
            Conversation saved successfully!
          </div>
        )}
      </div>
    </div>
  );
}
