import axios from "axios";
import { toast } from "react-toastify";
const backend_url = import.meta.env.VITE_BACKEND_URI;

// Get all notes for a student
export const getAllNotes = async (studentId) => {
  axios.defaults.withCredentials = true;
  try {
    const { data } = await axios.get(`${backend_url}/api/notes/student/${studentId}`);
    return data.success ? data : toast.error(data.message);
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to fetch notes");
    throw error;
  }
};

// Create a new note
export const createNote = async (noteData) => {
  axios.defaults.withCredentials = true;
  try {
    const { data } = await axios.post(`${backend_url}/api/notes`, noteData);
    if (data.success) {
      toast.success("Note created successfully");
      return data;
    } else {
      toast.error(data.message);
      return data;
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to create note");
    throw error;
  }
};

// Update a note
export const updateNote = async (noteId, noteData) => {
  axios.defaults.withCredentials = true;
  try {
    const { data } = await axios.put(`${backend_url}/api/notes/${noteId}`, noteData);
    if (data.success) {
      toast.success("Note updated successfully");
      return data;
    } else {
      toast.error(data.message);
      return data;
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to update note");
    throw error;
  }
};

// Delete a note
export const deleteNote = async (noteId) => {
  axios.defaults.withCredentials = true;
  try {
    const { data } = await axios.delete(`${backend_url}/api/notes/${noteId}`);
    if (data.success) {
      toast.success("Note deleted successfully");
      return data;
    } else {
      toast.error(data.message);
      return data;
    }
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to delete note");
    throw error;
  }
};

// Search notes
export const searchNotes = async (studentId, query) => {
  axios.defaults.withCredentials = true;
  try {
    const { data } = await axios.get(`${backend_url}/api/notes/student/${studentId}/search`, {
      params: { q: query }
    });
    return data.success ? data : toast.error(data.message);
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to search notes");
    throw error;
  }
};

// Get a single note by ID
export const getNoteById = async (noteId) => {
  axios.defaults.withCredentials = true;
  try {
    const { data } = await axios.get(`${backend_url}/api/notes/${noteId}`);
    return data.success ? data : toast.error(data.message);
  } catch (error) {
    toast.error(error.response?.data?.message || "Failed to fetch note");
    throw error;
  }
};