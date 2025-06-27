import React, { useState, useContext } from "react";
import {
  BookOpen,
  FileText,
  Image,
  Video,
  Tag,
  DollarSign,
} from "lucide-react";
import axios from "axios";
import { AppContent } from "../context/Context";
import { toast } from "react-toastify";

export default function AddCourse() {
  const { backend_url } = useContext(AppContent);
  const [formData, setFormData] = useState({
    nameCourse: "",
    description: "",
    courseImage: "",
    courseVideo: "",
    courseCategory: "",
    coursePrice: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      coursePrice: parseFloat(formData.coursePrice) || 0,
    };

    try {
      const res = await axios.post(`${backend_url}/api/course/add`, payload);
      if (res) {
        toast.success("Course Added");
        setFormData({
          nameCourse: "",
          description: "",
          courseImage: "",
          courseVideo: "",
          courseCategory: "",
          coursePrice: "",
        });
      }
    } catch (error) {
      toast.error(" Error:");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 px-6 py-16 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Glows */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-40 right-20 w-48 h-48 bg-pink-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>

      <div className="relative z-10 max-w-3xl mx-auto bg-white/10 backdrop-blur-sm p-10 rounded-3xl border border-white/10 shadow-2xl">
        <h2 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
          Create a New Course
        </h2>

        {message && (
          <div className="mb-6 text-center text-lg font-medium text-green-300">
            {message}
          </div>
        )}

        <div onSubmit={handleSubmit} className="grid gap-6">
          <Input
            label="Course Name"
            name="nameCourse"
            value={formData.nameCourse}
            onChange={handleChange}
            Icon={BookOpen}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Course Description
            </label>
            <div className="flex items-start bg-white/10 rounded-xl px-4 py-3 border border-white/20 focus-within:ring-2 ring-blue-400 transition">
              <FileText size={20} className="text-gray-300 mr-3 mt-1" />
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="bg-transparent text-white w-full outline-none placeholder:text-gray-400 resize-none"
                placeholder="Course Description"
                rows={4}
                required
              />
            </div>
          </div>

          <Input
            label="Course Image URL"
            name="courseImage"
            value={formData.courseImage}
            onChange={handleChange}
            Icon={Image}
          />

          <Input
            label="Course Video URL"
            name="courseVideo"
            value={formData.courseVideo}
            onChange={handleChange}
            Icon={Video}
          />

          <div className="grid grid-cols-2 gap-6">
            <Input
              label="Course Category"
              name="courseCategory"
              value={formData.courseCategory}
              onChange={handleChange}
              Icon={Tag}
              required
            />
            <Input
              label="Course Price"
              name="coursePrice"
              value={formData.coursePrice}
              onChange={handleChange}
              type="number"
              Icon={DollarSign}
              step="0.01"
              min="0"
              required
            />
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl hover:scale-105"
          >
            Create Course
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
  step,
  min,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-1">
        {label}
      </label>
      <div className="flex items-center bg-white/10 rounded-xl px-4 py-3 border border-white/20 focus-within:ring-2 ring-blue-400 transition">
        {Icon && <Icon size={20} className="text-gray-300 mr-3" />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="bg-transparent text-white w-full outline-none placeholder:text-gray-400"
          placeholder={label}
          required={required}
          step={step}
          min={min}
        />
      </div>
    </div>
  );
}
