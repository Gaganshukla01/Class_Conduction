import React, { useState, useEffect, useContext, useRef } from "react";
import { AppContent } from "../context/Context";
import {
  MessageSquare,
  Edit2,
  Save,
  X,
  Clock,
  CheckCircle,
  Loader2,
  Sparkles,
  Calendar,
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
  Plus,
  Send,
  Heading,
  Search,
} from "lucide-react";

export default function StudentChatViewer() {
  const { userData, backend_url } = useContext(AppContent);

  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedHeading, setEditedHeading] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [chatHeading, setChatHeading] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const editorRef = useRef(null);
  const createEditorRef = useRef(null);

  useEffect(() => {
    if (userData?.userId) {
      fetchChats();
    }
  }, [userData]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(
        (chat) =>
          chat.heading?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chat.chat?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chat.studentName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats]);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${backend_url}/api/chateditor/chats/student/${userData.userId}`
      );
      const result = await response.json();

      if (result.success) {
        setChats(result.data);
        setFilteredChats(result.data);
        result.data.forEach((chat) => {
          if (!chat.isRead) {
            markAsRead(chat._id);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (chatId) => {
    try {
      await fetch(`${backend_url}/api/chateditor/chats/${chatId}/read`, {
        method: "PATCH",
      });
    } catch (error) {
      console.error("Error marking chat as read:", error);
    }
  };

  const startEditing = (chat) => {
    setEditingChatId(chat._id);
    setEditedContent(chat.chat);
    setEditedHeading(chat.heading || "");
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = chat.chat;
      }
    }, 0);
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setEditedContent("");
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
        setEditedContent("");
        setEditedHeading("");
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

  const createNewChat = async () => {
    if (
      !createEditorRef.current?.innerHTML ||
      createEditorRef.current.innerHTML.trim() === ""
    ) {
      alert("Chat content cannot be empty!");
      return;
    }

    const payload = {
      userId: userData.userId,
      studentName: userData.name,
      studentEmail: userData.email,
      chat: createEditorRef.current.innerHTML,
      heading: chatHeading,
    };

    try {
      setIsCreating(true);
      const response = await fetch(`${backend_url}/api/chateditor/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setChats([result.data, ...chats]);
        setShowCreateForm(false);
        createEditorRef.current.innerHTML = "";
        setChatHeading("");
      } else {
        alert(result.message || "Failed to create chat");
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("An error occurred while creating chat");
    } finally {
      setIsCreating(false);
    }
  };

  const cancelCreate = () => {
    setShowCreateForm(false);
    setChatHeading("");
    if (createEditorRef.current) {
      createEditorRef.current.innerHTML = "";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const execCommand = (command, value = null, isCreate = false) => {
    document.execCommand(command, false, value);
    if (isCreate) {
      createEditorRef.current?.focus();
    } else {
      editorRef.current?.focus();
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center bg-blue-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-400/30 mb-4">
            <Sparkles className="mr-2 text-yellow-400" size={16} />
            <span className="text-sm">Your Messages</span>
          </div>
          <h1 className="text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Your Chats
            </span>
          </h1>
          <p className="text-gray-400 text-lg">View and manage your messages</p>
        </div>

        {/* Search and Create Button */}
        <div className="mb-6 flex gap-4 items-center">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats by heading or content..."
              className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
            />
          </div>

          {/* Create Button */}
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:scale-105 cursor-pointer transition-all shadow-lg flex items-center whitespace-nowrap"
            >
              <Plus className="mr-2" size={20} />
              Create New
            </button>
          )}
        </div>

        {/* Create Chat Form */}
        {showCreateForm && (
          <div className="mb-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-xl">
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
              <h3 className="font-semibold text-lg flex items-center">
                <MessageSquare className="mr-2" size={20} />
                Create New Chat
              </h3>
            </div>

            <div className="p-6">
              {/* Heading Input */}
              <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center">
                  <Heading className="mr-2 text-blue-400" size={18} />
                  Chat Heading
                </label>
                <input
                  type="text"
                  value={chatHeading}
                  onChange={(e) => setChatHeading(e.target.value)}
                  placeholder="Enter a heading for this chat..."
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                />
              </div>

              {/* Create Toolbar */}
              <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex flex-wrap items-center gap-2">
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
                        onClick={() => execCommand(btn.command, null, true)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-all"
                        title={btn.tooltip}
                      >
                        <Icon size={16} />
                      </button>
                    );
                  })}
                  <div className="w-px h-6 bg-white/20"></div>
                  <div className="relative group">
                    <button className="p-2 hover:bg-white/20 rounded-lg transition-all flex items-center">
                      <Type size={16} className="mr-1" />
                      <div className="w-4 h-4 rounded border border-white/30 bg-gradient-to-r from-red-400 to-purple-400"></div>
                    </button>
                    <input
                      type="color"
                      onChange={(e) =>
                        execCommand("foreColor", e.target.value, true)
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Create Editor */}
              <div
                ref={createEditorRef}
                contentEditable
                className="p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-white min-h-[200px] mb-4"
                suppressContentEditableWarning={true}
                placeholder="Write your message here..."
              ></div>

              {/* Create Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={createNewChat}
                  disabled={isCreating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={18} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={18} />
                      Send Chat
                    </>
                  )}
                </button>
                <button
                  onClick={cancelCreate}
                  disabled={isCreating}
                  className="px-4 py-3 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-all flex items-center"
                >
                  <X className="mr-2" size={18} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-400" size={40} />
            <span className="ml-3 text-xl">Loading your chats...</span>
          </div>
        ) : filteredChats.length === 0 ? (
          /* Empty State */
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-12 text-center">
            <MessageSquare className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-2xl font-bold mb-2">
              {searchQuery ? "No chats found" : "No chats yet"}
            </h3>
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? "Try adjusting your search query"
                : "You haven't created any chats yet. Start a conversation!"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:scale-105 cursor-pointer transition-all shadow-lg inline-flex items-center"
              >
                <Plus className="mr-2" size={20} />
                Create Your First Chat
              </button>
            )}
          </div>
        ) : (
          /* Chat List */
          <div className="space-y-4">
            {filteredChats.map((chat) => (
              <div
                key={chat._id}
                className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden shadow-xl hover:shadow-2xl transition-all"
              >
                {/* Chat Header */}
                <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={20} />
                      </div>
                      <div className="flex-1">
                        {chat.heading && (
                          <h2 className="text-xl font-bold mb-1">
                            {chat.heading}
                          </h2>
                        )}
                        <h3 className="font-semibold text-sm text-gray-300">
                          {chat.createdBy
                            ? "Message from Instructor"
                            : "Your Message"}
                        </h3>
                        <div className="flex items-center text-sm text-gray-400 space-x-2 mt-1">
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
                    </div>
                    {editingChatId !== chat._id && (
                      <button
                        onClick={() => startEditing(chat)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all flex-shrink-0"
                        title="Edit chat"
                      >
                        <Edit2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Chat Content */}
                <div className="p-6">
                  {editingChatId === chat._id ? (
                    <>
                      {/* Edit Heading Input */}
                      <div className="mb-4">
                        <label className="text-sm font-semibold mb-2 flex items-center">
                          <Heading className="mr-2 text-blue-400" size={18} />
                          Chat Heading
                        </label>
                        <input
                          type="text"
                          value={editedHeading}
                          onChange={(e) => setEditedHeading(e.target.value)}
                          placeholder="Enter a heading for this chat..."
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                        />
                      </div>

                      {/* Editing Toolbar */}
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
                                className="p-2 hover:bg-white/20 rounded-lg transition-all"
                                title={btn.tooltip}
                              >
                                <Icon size={16} />
                              </button>
                            );
                          })}
                          <div className="w-px h-6 bg-white/20"></div>
                          <div className="relative group">
                            <button className="p-2 hover:bg-white/20 rounded-lg transition-all flex items-center">
                              <Type size={16} className="mr-1" />
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

                      {/* Editor */}
                      <div
                        ref={editorRef}
                        contentEditable
                        className="p-4 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-white min-h-[150px] mb-4"
                        suppressContentEditableWarning={true}
                      ></div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => saveEdit(chat._id)}
                          disabled={isSaving}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
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
                          className="px-4 py-2 bg-white/10 rounded-lg font-semibold hover:bg-white/20 transition-all flex items-center"
                        >
                          <X className="mr-2" size={18} />
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <div
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: chat.chat }}
                    ></div>
                  )}
                </div>

                {/* Chat Footer */}
                {editingChatId !== chat._id &&
                  chat.updatedAt !== chat.createdAt && (
                    <div className="px-6 py-3 bg-white/5 border-t border-white/10 flex items-center text-sm text-gray-400">
                      <Clock size={14} className="mr-2" />
                      Last updated: {formatDate(chat.updatedAt)}
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
