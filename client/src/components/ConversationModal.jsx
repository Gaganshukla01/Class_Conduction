import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Search,
  X,
  Filter,
  MessageSquare,
  Calendar,
  ChevronDown,
  Loader2,
  Trash2,
  Clock,
  Edit2,
  Save,
  Heading,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  CheckCircle,
} from "lucide-react";
import { AppContent } from "../context/Context";

const ConversationChatModal = ({ isOpen, onClose, userId }) => {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editedHeading, setEditedHeading] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { backend_url, refreshData } = useContext(AppContent);
  const editorRef = useRef(null);

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "updatedAt", label: "Last Modified" },
    { value: "heading", label: "Heading" },
  ];

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backend_url}/api/chateditor/chats`);
      const data = await response.json();
      console.log(data, "datachat");
      if (data.success) {
        setChats(data.data);
        setFilteredChats(data.data);
      } else {
        console.error("Failed to fetch chats:", data.message);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterChats = () => {
    let filtered = [...chats];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (chat) =>
          chat.heading?.toLowerCase().includes(searchLower) ||
          chat.chat?.toLowerCase().includes(searchLower) ||
          chat.studentName?.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "updatedAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (typeof aValue === "string") {
        aValue = aValue?.toLowerCase() || "";
        bValue = bValue?.toLowerCase() || "";
      }

      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    setFilteredChats(filtered);
  };

  useEffect(() => {
    if (isOpen) {
      fetchChats();
    }
  }, [isOpen]);

  useEffect(() => {
    filterChats();
  }, [chats, searchTerm, sortBy, sortOrder]);

  const startEditing = (chat) => {
    setEditingChatId(chat._id);
    setEditedHeading(chat.heading || "");
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = chat.chat;
      }
    }, 0);
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditedHeading("");
  };

  const saveEdit = async (chatId) => {
    if (
      !editorRef.current?.innerHTML ||
      editorRef.current.innerHTML.trim() === ""
    ) {
      alert("Chat content cannot be empty!");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(
        `${backend_url}/api/chateditor/chats/${chatId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat: editorRef.current.innerHTML,
            heading: editedHeading,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setChats(
          chats.map((chat) =>
            chat._id === chatId
              ? {
                  ...chat,
                  chat: editorRef.current.innerHTML,
                  heading: editedHeading,
                }
              : chat
          )
        );
        setEditingChatId(null);
        setEditedHeading("");
        refreshData();
      } else {
        alert(result.message || "Failed to update chat");
      }
    } catch (error) {
      console.error("Error updating chat:", error);
      alert("An error occurred while updating");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteChat = async (chatId) => {
    if (!confirm("Are you sure you want to delete this chat?")) return;

    try {
      setDeletingId(chatId);
      const response = await fetch(
        `${backend_url}/api/chateditor/chats/${chatId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        setChats(chats.filter((chat) => chat._id !== chatId));
        refreshData(); // Refresh context data
      } else {
        alert(result.message || "Failed to delete chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("An error occurred while deleting");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const toolbarButtons = [
    { icon: Bold, command: "bold", tooltip: "Bold" },
    { icon: Italic, command: "italic", tooltip: "Italic" },
    { icon: Underline, command: "underline", tooltip: "Underline" },
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
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border border-white/20 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <MessageSquare className="text-blue-400" size={24} />
            <h2 className="text-2xl font-bold text-white">Manage Chats</h2>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm">
              {filteredChats.length} chats
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-white/20 space-y-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search chats by heading, content, or student name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <Filter size={16} />
            <span>Filters</span>
            <ChevronDown
              className={`transform transition-transform ${showFilters ? "rotate-180" : ""}`}
              size={16}
            />
          </button>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/20">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {sortOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-slate-800"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="desc" className="bg-slate-800">
                    Newest First
                  </option>
                  <option value="asc" className="bg-slate-800">
                    Oldest First
                  </option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-blue-400" size={32} />
              <span className="ml-3 text-gray-400">Loading chats...</span>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <MessageSquare size={48} className="mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No chats found</h3>
              <p className="text-sm">
                {searchTerm
                  ? "Try adjusting your search"
                  : "No chats available"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredChats.map((chat) => (
                <div
                  key={chat._id}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden hover:border-blue-400/50 transition-all"
                >
                  {editingChatId === chat._id ? (
                    // Edit Mode
                    <div className="p-6">
                      <div className="mb-4">
                        <label className="text-sm font-semibold mb-2 flex items-center text-white">
                          <Heading className="mr-2 text-blue-400" size={18} />
                          Chat Heading
                        </label>
                        <input
                          type="text"
                          value={editedHeading}
                          onChange={(e) => setEditedHeading(e.target.value)}
                          placeholder="Enter a heading..."
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                        />
                      </div>

                      <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex flex-wrap items-center gap-2">
                          {toolbarButtons.map((btn, index) => {
                            if (btn.divider) {
                              return (
                                <div
                                  key={index}
                                  className="w-px h-6 bg-white/20"
                                ></div>
                              );
                            }
                            const Icon = btn.icon;
                            return (
                              <button
                                key={index}
                                onClick={() => execCommand(btn.command)}
                                className="p-2 hover:bg-white/20 rounded-lg transition-all text-white"
                                title={btn.tooltip}
                              >
                                <Icon size={16} />
                              </button>
                            );
                          })}
                          <div className="w-px h-6 bg-white/20"></div>
                          <div className="relative group">
                            <button className="p-2 hover:bg-white/20 rounded-lg transition-all flex items-center">
                              <Type size={16} className="mr-1 text-white" />
                              <div className="w-4 h-4 rounded border border-white/30 bg-gradient-to-r from-red-400 to-purple-400"></div>
                            </button>
                            <input
                              type="color"
                              onChange={(e) =>
                                execCommand("foreColor", e.target.value)
                              }
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div
                        ref={editorRef}
                        contentEditable
                        className="p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-white min-h-[150px] mb-4"
                        suppressContentEditableWarning={true}
                      ></div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => saveEdit(chat._id)}
                          disabled={isSaving}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center text-white"
                        >
                          {isSaving ? (
                            <>
                              <Loader2
                                className="mr-2 animate-spin"
                                size={18}
                              />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2" size={18} />
                              Save Changes
                            </>
                          )}
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={isSaving}
                          className="px-4 py-2 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-all flex items-center text-white"
                        >
                          <X className="mr-2" size={18} />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {chat.studentName && (
                              <h2 className="text-xl font-bold mb-1 text-white">
                                <span className="text-black">
                                  Student Name:
                                </span>{" "}
                                {chat.studentName}
                              </h2>
                            )}
                            {chat.heading && (
                              <h2 className="text-xl font-bold mb-1 text-white">
                                {chat.heading}
                              </h2>
                            )}
                            <div className="flex items-center text-sm text-gray-400 space-x-2">
                              <Calendar size={14} />
                              <span>{formatDate(chat.createdAt)}</span>
                              {chat.isRead && (
                                <>
                                  <span>•</span>
                                  <CheckCircle
                                    size={14}
                                    className="text-green-400"
                                  />
                                  <span className="text-green-400">Read</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(chat)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-all text-blue-400"
                              title="Edit chat"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => deleteChat(chat._id)}
                              disabled={deletingId === chat._id}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-all text-red-400 disabled:opacity-50"
                              title="Delete chat"
                            >
                              {deletingId === chat._id ? (
                                <Loader2 className="animate-spin" size={18} />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div
                          className="prose prose-invert max-w-none text-gray-300"
                          dangerouslySetInnerHTML={{ __html: chat.chat }}
                        ></div>
                      </div>

                      {chat.updatedAt !== chat.createdAt && (
                        <div className="px-6 py-3 bg-white/5 border-t border-white/10 flex items-center text-sm text-gray-400">
                          <Clock size={14} className="mr-2" />
                          Last updated: {formatDate(chat.updatedAt)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/20 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Edit or delete chats from this panel
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationChatModal;
