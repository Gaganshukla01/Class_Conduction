import React, { useState,useContext } from 'react';
import axios from 'axios';
import { Calendar, Clock, Users, User, Link as LinkIcon, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { AppContent } from '../context/Context';

export default function AddClassSchedule() {

  const { backend_url} = useContext(AppContent);
  const [formData, setFormData] = useState({
    className: '',
    classDescription: '',
    classImage: '',
    classDate: '',
    classTime: '',
    instructorId: '',
    studentsEnrolled: '',
    classLink: '',
    classDuration: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      studentsEnrolled: formData.studentsEnrolled
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0)
    };

    try {
      await axios.post(`${backend_url}/api/student/add`, payload);
      setMessage('✅ Class created successfully!');
      setFormData({
        className: '',
        classDescription: '',
        classImage: '',
        classDate: '',
        classTime: '',
        instructorId: '',
        studentsEnrolled: '',
        classLink: '',
        classDuration: '',
      });
      toast.success("✅ Class created successfully!");
    } catch (error) {
      setMessage('❌ Error: ' + (error.response?.data?.message || error.message));
      toast.error("❌ Error:" );
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
          Schedule a New Class
        </h2>

        {message && (
          <div className="mb-6 text-center text-lg font-medium text-green-300">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6">
          <Input label="Class Name" name="className" value={formData.className} onChange={handleChange} Icon={FileText} />
          <Input label="Class Description" name="classDescription" value={formData.classDescription} onChange={handleChange} Icon={FileText} />
          <Input label="Class Image URL" name="classImage" value={formData.classImage} onChange={handleChange} Icon={FileText} />
          <div className="grid grid-cols-2 gap-6">
            <Input label="Class Date" name="classDate" value={formData.classDate} onChange={handleChange} type="date" Icon={Calendar} />
            <Input label="Class Time" name="classTime" value={formData.classTime} onChange={handleChange} type="time" Icon={Clock} />
          </div>
          <Input label="Instructor ID" name="instructorId" value={formData.instructorId} onChange={handleChange} Icon={User} />
          <Input label="Student IDs (comma-separated)" name="studentsEnrolled" value={formData.studentsEnrolled} onChange={handleChange} Icon={Users} />
          <Input label="Class Link" name="classLink" value={formData.classLink} onChange={handleChange} Icon={LinkIcon} />
          <Input label="Class Duration (e.g. 2 hours)" name="classDuration" value={formData.classDuration} onChange={handleChange} Icon={Clock} />

          <button type="submit" className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-xl hover:scale-105">
            Create Class
          </button>
        </form>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text", Icon }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-1">{label}</label>
      <div className="flex items-center bg-white/10 rounded-xl px-4 py-3 border border-white/20 focus-within:ring-2 ring-blue-400 transition">
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
