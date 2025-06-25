import React, { useState } from 'react';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Settings, 
  BarChart3, 
  FileText,
  Image,
  Video,
  Tag,
  DollarSign,
  Clock,
  User,
  ExternalLink,
  Mail,
  Phone,
  UserCheck
} from 'lucide-react';

// Import your existing components here
// import AddScheduleClass from './AddScheduleClass';
// import CourseAdd from './CourseAdd';
import AddScheduleClass from './AddScheduleClass';
import AddCourse from './CourseAdd';

// Placeholder components - replace these imports with your actual components



export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'addCourse', label: 'Add Course', icon: BookOpen },
    { id: 'addStudent', label: 'Add Student', icon: Users },
    { id: 'addClass', label: 'Add Class', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'addCourse':
        return <AddCourse />;
      case 'addStudent':
        return <AddStudentForm />;
      case 'addClass':
        return <AddScheduleClass />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      {/* Glows */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-40 right-20 w-48 h-48 bg-pink-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white/10 backdrop-blur-sm border-r border-white/10 p-6">
          <h1 className="text-2xl font-bold mb-8 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === item.id
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={20} className="mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// Dashboard Home Component
function DashboardHome() {
  const stats = [
    { label: 'Total Courses', value: '24', icon: BookOpen, color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Students', value: '156', icon: Users, color: 'from-green-500 to-emerald-500' },
    { label: 'Active Classes', value: '8', icon: Calendar, color: 'from-purple-500 to-violet-500' },
    { label: 'Revenue', value: '$12,450', icon: DollarSign, color: 'from-orange-500 to-red-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
        Dashboard Overview
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}>
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-gray-300">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
        <h3 className="text-2xl font-semibold mb-4">Welcome to Admin Panel</h3>
        <p className="text-gray-300 mb-4">
          Manage your courses, students, and classes from this centralized dashboard. 
          Use the navigation on the left to access different sections.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 p-4 rounded-xl">
            <BookOpen className="mb-2 text-blue-400" size={24} />
            <h4 className="font-semibold mb-1">Course Management</h4>
            <p className="text-sm text-gray-400">Create and manage course content</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl">
            <Users className="mb-2 text-green-400" size={24} />
            <h4 className="font-semibold mb-1">Student Management</h4>
            <p className="text-sm text-gray-400">Add and track student progress</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl">
            <Calendar className="mb-2 text-purple-400" size={24} />
            <h4 className="font-semibold mb-1">Class Scheduling</h4>
            <p className="text-sm text-gray-400">Schedule and manage classes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Student Form Component (keeping this one as you didn't mention having it)
function AddStudentForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    enrollmentDate: '',
    studentId: '',
    course: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = () => {
    setMessage('✅ Student added successfully!');
    setFormData({
      name: '',
      email: '',
      phone: '',
      enrollmentDate: '',
      studentId: '',
      course: '',
    });
    console.log('Student added:', formData);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
        Add New Student
      </h2>

      {message && (
        <div className="mb-6 text-center text-lg font-medium text-green-300">
          {message}
        </div>
      )}

      <div className="grid gap-6">
        <Input label="Student Name" name="name" value={formData.name} onChange={handleChange} Icon={User} />
        <Input label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" Icon={Mail} />
        <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} Icon={Phone} />
        
        <div className="grid grid-cols-2 gap-6">
          <Input label="Student ID" name="studentId" value={formData.studentId} onChange={handleChange} Icon={UserCheck} />
          <Input label="Enrollment Date" name="enrollmentDate" value={formData.enrollmentDate} onChange={handleChange} type="date" Icon={Calendar} />
        </div>
        
        <Input label="Course" name="course" value={formData.course} onChange={handleChange} Icon={BookOpen} />

        <button 
          onClick={handleSubmit}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-xl hover:scale-105"
        >
          Add Student
        </button>
      </div>
    </div>
  );
}

// Settings Panel Component
function SettingsPanel() {
  return (
    <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
        Settings
      </h2>
      
      <div className="space-y-6">
        <div className="bg-white/5 p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4">General Settings</h3>
          <div className="space-y-4">
            <Input label="Application Name" value="Learning Management System" />
            <Input label="Admin Email" value="admin@example.com" type="email" />
            <Input label="Contact Phone" value="+1 (555) 123-4567" />
          </div>
        </div>
        
        <div className="bg-white/5 p-6 rounded-xl">
          <h3 className="text-xl font-semibold mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Email notifications for new students</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded" defaultChecked />
              <span>Class reminders</span>
            </label>
            <label className="flex items-center space-x-3">
              <input type="checkbox" className="rounded" />
              <span>Weekly reports</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Input Component
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