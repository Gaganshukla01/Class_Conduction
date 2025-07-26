import React, { useState, useContext } from 'react';
import { 
  BookOpen, 
  Users, 
  GraduationCap, 
  IndianRupee, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  Calendar,
  Eye,
  UserCheck,
  UserX,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

import { AppContent } from '../context/Context';

function DashboardHome() {
  const { allSchedule, allUserData, allCourse } = useContext(AppContent);
  const [hoveredStat, setHoveredStat] = useState(null);
 console.log("All Schedule Data:", allSchedule);
  // Extract data arrays from backend response
  const classes = allSchedule || [];
  const users = allUserData?.data || [];
  const courses = allCourse?.data || allCourse || [];
  console.log("Classes Data1:", classes);
  // Calculate statistics from real data
  const totalCourses = courses.length;
  
  // Separate instructors and students
  const instructors = users.filter(user => user.userType === 'admin');
  const students = users.filter(user => user.userType === 'student');
  const totalStudents = students.length;
  const totalInstructors = instructors.length;

  // Calculate total enrolled students across all classes
  const totalEnrollments = classes.reduce((total, classItem) => {
    return total + (classItem.studentsEnrolled?.length || 0);
  }, 0);

  // Get current date to filter active classes
  const currentDate = new Date();
  const activeClasses = classes.filter(classItem => {
    const classDate = new Date(classItem.classDate);
    return classDate >= currentDate;
  }).length;

  // Calculate revenue from PAID classes only
  console.log("Classes Data:", classes);
  const totalRevenue = classes.reduce((total, classItem) => {
    return total + (classItem.paid ? (classItem.classRate || 0) : 0);
  }, 0);

  const paidClasses = classes.filter(classItem => classItem.paid === true);
  const unpaidClasses = classes.filter(classItem => classItem.paid === false);
  const completedPayments = paidClasses.reduce((total, classItem) => {
    return total + (classItem.classRate || 0);
  }, 0);
  const pendingPayments = unpaidClasses.reduce((total, classItem) => {
    return total + (classItem.classRate || 0);
  }, 0);

  const averageClassFee = classes.length > 0 ? classes.reduce((total, classItem) => {
    return total + (classItem.classRate || 0);
  }, 0) / classes.length : 0;

  // Get detailed breakdowns for hover tooltips
  const getStudentDetails = () => {
    const verifiedStudents = students.filter(student => student.isAccountVerified).length;
    const unverifiedStudents = students.length - verifiedStudents;
    return {
      total: students.length,
      verified: verifiedStudents,
      unverified: unverifiedStudents,
      enrollments: totalEnrollments
    };
  };

  const getInstructorDetails = () => {
    const verifiedInstructors = instructors.filter(instructor => instructor.isAccountVerified).length;
    const unverifiedInstructors = instructors.length - verifiedInstructors;
    return {
      total: instructors.length,
      verified: verifiedInstructors,
      unverified: unverifiedInstructors,
      activeClasses: activeClasses
    };
  };

  const getCourseDetails = () => {
    const courseRevenue = courses.map(course => {
      const courseClasses = classes.filter(classItem => classItem.className === course.nameCourse);
      const paidRevenue = courseClasses.reduce((total, classItem) => {
        return total + (classItem.paid ? (classItem.classRate || 0) : 0);
      }, 0);
      return {
        courseName: course.nameCourse,
        revenue: paidRevenue,
        totalClasses: courseClasses.length,
        paidClasses: courseClasses.filter(c => c.paid).length
      };
    });
    
    return {
      total: courses.length,
      activeClasses: classes.length,
      upcomingClasses: activeClasses,
      totalEnrollments: totalEnrollments,
      courseRevenue: courseRevenue
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Revenue stats breakdown
  const revenueStats = {
    totalRevenue: totalRevenue,
    completedPayments: completedPayments,
    pendingPayments: pendingPayments,
    averageClassFee: averageClassFee,
    paidClassesCount: paidClasses.length,
    unpaidClassesCount: unpaidClasses.length,
    revenueGrowth: 0 // You can calculate this if you have historical data
  };

  // Chart data preparations
  const courseEnrollmentData = courses.map(course => {
    const courseClasses = classes.filter(classItem => classItem.className === course.nameCourse);
    const enrollments = courseClasses.reduce((total, classItem) => {
      return total + (classItem.studentsEnrolled?.length || 0);
    }, 0);
    return {
      name: course.nameCourse,
      enrollments: enrollments,
      price: course.coursePrice
    };
  });

  const revenueData = courses.map(course => {
    const courseClasses = classes.filter(classItem => classItem.className === course.nameCourse);
    const revenue = courseClasses.reduce((total, classItem) => {
      return total + (classItem.paid ? (classItem.classRate || 0) : 0);
    }, 0);
    const paidClasses = courseClasses.filter(classItem => classItem.paid).length;
    return {
      name: course.nameCourse,
      revenue: revenue,
      classes: courseClasses.length,
      paidClasses: paidClasses
    };
  });

  const userTypeData = [
    { name: 'Students', value: totalStudents, color: '#10B981' },
    { name: 'Instructors', value: totalInstructors, color: '#8B5CF6' }
  ];

  const paymentStatusData = [
    { name: 'Paid', value: paidClasses.length, color: '#10B981' },
    { name: 'Unpaid', value: unpaidClasses.length, color: '#F59E0B' }
  ];

  const verificationData = [
    { 
      name: 'Students', 
      verified: students.filter(s => s.isAccountVerified).length,
      unverified: students.filter(s => !s.isAccountVerified).length
    },
    { 
      name: 'Instructors', 
      verified: instructors.filter(i => i.isAccountVerified).length,
      unverified: instructors.filter(i => !i.isAccountVerified).length
    }
  ];

  const stats = [
    {
      id: 'courses',
      label: "Total Courses",
      value: totalCourses.toString(),
      icon: BookOpen,
      color: "from-blue-500 to-cyan-500",
      subtext: `${activeClasses} active classes`,
      hasHover: true,
      details: getCourseDetails()
    },
    {
      id: 'students',
      label: "Total Students",
      value: totalStudents.toString(),
      icon: Users,
      color: "from-green-500 to-emerald-500",
      subtext: `${totalEnrollments} enrollments`,
      hasHover: true,
      details: getStudentDetails()
    },
    {
      id: 'instructors',
      label: "Instructors",
      value: totalInstructors.toString(),
      icon: GraduationCap,
      color: "from-purple-500 to-violet-500",
      subtext: "Active instructors",
      hasHover: true,
      details: getInstructorDetails()
    },
    {
      id: 'revenue',
      label: "Total Revenue (Paid)",
      value: formatCurrency(totalRevenue),
      icon: IndianRupee,
      color: "from-orange-500 to-red-500",
      subtext: `${paidClasses.length} paid classes`,
      hasHover: false
    },
    {
      id: 'pending',
      label: "Pending Payments",
      value: formatCurrency(pendingPayments),
      icon: Clock,
      color: "from-yellow-500 to-amber-500",
      subtext: `${unpaidClasses.length} classes`,
      hasHover: false
    },
    {
      id: 'completed',
      label: "Completed Payments",
      value: formatCurrency(completedPayments),
      icon: CheckCircle,
      color: "from-emerald-500 to-teal-500",
      subtext: `${paidClasses.length} classes`,
      hasHover: false
    },
    {
      id: 'average',
      label: "Average Class Fee",
      value: formatCurrency(averageClassFee),
      icon: TrendingUp,
      color: "from-indigo-500 to-blue-500",
      subtext: "Per class",
      hasHover: false
    },
    {
      id: 'active',
      label: "Active Classes",
      value: activeClasses.toString(),
      icon: Calendar,
      color: "from-pink-500 to-rose-500",
      subtext: "Upcoming classes",
      hasHover: false
    }
  ];

  // Get recent classes (next 3 upcoming)
  const upcomingClasses = classes
    .filter(classItem => new Date(classItem.classDate) >= currentDate)
    .sort((a, b) => new Date(a.classDate) - new Date(b.classDate))
    .slice(0, 3);

  // Get instructor name by ID
  const getInstructorName = (instructorId) => {
    const instructor = users.find(user => user._id === instructorId);
    return instructor ? instructor.name : 'Unknown Instructor';
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Show loading state if data is not available
  if (!allSchedule || !allUserData || !allCourse) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-xl text-gray-400">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  // Render hover tooltip
  const renderHoverTooltip = (stat) => {
    if (!stat.hasHover || hoveredStat !== stat.id) return null;

    let tooltipContent;
    
    if (stat.id === 'courses') {
      tooltipContent = (
        <div className="space-y-2">
          <div className="font-semibold text-blue-300 border-b border-blue-400/30 pb-1">
            Course Overview
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-300">Total Courses:</div>
              <div className="font-medium text-white">{stat.details.total}</div>
            </div>
            <div>
              <div className="text-gray-300">Active Classes:</div>
              <div className="font-medium text-white">{stat.details.activeClasses}</div>
            </div>
            <div>
              <div className="text-gray-300">Upcoming:</div>
              <div className="font-medium text-white">{stat.details.upcomingClasses}</div>
            </div>
            <div>
              <div className="text-gray-300">Total Enrollments:</div>
              <div className="font-medium text-white">{stat.details.totalEnrollments}</div>
            </div>
          </div>
        </div>
      );
    } else if (stat.id === 'students') {
      tooltipContent = (
        <div className="space-y-2">
          <div className="font-semibold text-green-300 border-b border-green-400/30 pb-1">
            Student Breakdown
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-300">Total Students:</div>
              <div className="font-medium text-white">{stat.details.total}</div>
            </div>
            <div>
              <div className="text-gray-300">Verified:</div>
              <div className="font-medium text-green-400">{stat.details.verified}</div>
            </div>
            <div>
              <div className="text-gray-300">Unverified:</div>
              <div className="font-medium text-yellow-400">{stat.details.unverified}</div>
            </div>
            <div>
              <div className="text-gray-300">Total Enrollments:</div>
              <div className="font-medium text-white">{stat.details.enrollments}</div>
            </div>
          </div>
        </div>
      );
    } else if (stat.id === 'instructors') {
      tooltipContent = (
        <div className="space-y-2">
          <div className="font-semibold text-purple-300 border-b border-purple-400/30 pb-1">
            Instructor Details
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-300">Total Instructors:</div>
              <div className="font-medium text-white">{stat.details.total}</div>
            </div>
            <div>
              <div className="text-gray-300">Verified:</div>
              <div className="font-medium text-green-400">{stat.details.verified}</div>
            </div>
            <div>
              <div className="text-gray-300">Unverified:</div>
              <div className="font-medium text-yellow-400">{stat.details.unverified}</div>
            </div>
            <div>
              <div className="text-gray-300">Active Classes:</div>
              <div className="font-medium text-white">{stat.details.activeClasses}</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-[9999] bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl p-4 shadow-2xl min-w-[280px] animate-in fade-in duration-200">
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 border-l border-t border-gray-700 rotate-45"></div>
        {tooltipContent}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
        Dashboard Overview
      </h2>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`relative bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10 transition-all duration-300 ${
                stat.hasHover 
                  ? 'hover:bg-white/15 hover:scale-105 hover:shadow-xl cursor-pointer' 
                  : 'hover:bg-white/15'
              }`}
              onMouseEnter={() => stat.hasHover && setHoveredStat(stat.id)}
              onMouseLeave={() => stat.hasHover && setHoveredStat(null)}
              style={{ zIndex: hoveredStat === stat.id ? 100 : 'auto' }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}
              >
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-gray-300 font-medium">{stat.label}</p>
              {stat.subtext && (
                <p className="text-sm text-gray-400 mt-1">{stat.subtext}</p>
              )}
              {stat.hasHover && (
                <div className="absolute top-2 right-2 opacity-50">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                </div>
              )}
              {renderHoverTooltip(stat)}
            </div>
          );
        })}
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <IndianRupee className="mr-2 text-green-400" size={20} />
          Revenue Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 p-4 rounded-xl">
            <div className="text-2xl font-bold text-green-400">
              {formatCurrency(completedPayments)}
            </div>
            <div className="text-sm text-gray-400">Completed Payments</div>
            <div className="text-xs text-green-300 mt-1">
              {paidClasses.length} paid classes
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl">
            <div className="text-2xl font-bold text-yellow-400">
              {formatCurrency(pendingPayments)}
            </div>
            <div className="text-sm text-gray-400">Pending Payments</div>
            <div className="text-xs text-yellow-300 mt-1">
              {unpaidClasses.length} unpaid classes
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-xl">
            <div className="text-2xl font-bold text-blue-400">
              {formatCurrency(averageClassFee)}
            </div>
            <div className="text-sm text-gray-400">Average Class Fee</div>
            <div className="text-xs text-blue-300 mt-1">
              Per class across all courses
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course Enrollments Chart */}
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart3 className="mr-2 text-blue-400" size={20} />
            Course Enrollments
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={courseEnrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Bar dataKey="enrollments" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Course */}
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <IndianRupee className="mr-2 text-green-400" size={20} />
            Revenue by Course (Paid Only)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
                formatter={(value, name) => [
                  formatCurrency(value), 
                  'Revenue (Paid Only)'
                ]}
                labelFormatter={(label) => `Course: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                fill="url(#colorRevenue)" 
              />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User Types Distribution */}
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <PieChartIcon className="mr-2 text-purple-400" size={20} />
            User Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({name, value}) => `${name}: ${value}`}
              >
                {userTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Status */}
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <CheckCircle className="mr-2 text-green-400" size={20} />
            Payment Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={paymentStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({name, value}) => `${name}: ${value}`}
              >
                {paymentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Verification Status Chart */}
      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <UserCheck className="mr-2 text-blue-400" size={20} />
          Account Verification Status
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={verificationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }} 
            />
            <Bar dataKey="verified" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="unverified" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Welcome Section */}
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
          <h3 className="text-2xl font-semibold mb-4">Welcome to Admin Panel</h3>
          <p className="text-gray-300 mb-6">
            Manage your courses, students, instructors, and payments from this centralized
            dashboard. Use the navigation to access different sections.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all duration-300">
              <BookOpen className="mb-2 text-blue-400" size={24} />
              <h4 className="font-semibold mb-1">Course Management</h4>
              <p className="text-sm text-gray-400">
                Create and manage course content
              </p>
              <div className="text-xs text-blue-400 mt-2">
                {totalCourses} courses available
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all duration-300">
              <Users className="mb-2 text-green-400" size={24} />
              <h4 className="font-semibold mb-1">Student Management</h4>
              <p className="text-sm text-gray-400">
                Add and track student progress
              </p>
              <div className="text-xs text-green-400 mt-2">
                {totalStudents} students registered
              </div>
            </div>
            
            <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all duration-300">
              <Calendar className="mb-2 text-purple-400" size={24} />
              <h4 className="font-semibold mb-1">Class Scheduling</h4>
              <p className="text-sm text-gray-400">
                Schedule and manage classes
              </p>
              <div className="text-xs text-purple-400 mt-2">
                {activeClasses} upcoming classes
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Classes */}
        <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="mr-2 text-blue-400" size={20} />
            Upcoming Classes
          </h3>
          
          <div className="space-y-3">
            {upcomingClasses.length === 0 ? (
              <p className="text-gray-400 text-sm">No upcoming classes</p>
            ) : (
              upcomingClasses.map((classItem) => (
                <div
                  key={classItem._id}
                  className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-all duration-300"
                >
                  <div className="font-medium text-sm mb-1">
                    {classItem.className}
                  </div>
                  <div className="text-xs text-gray-400 mb-1">
                    {getInstructorName(classItem.instructorId)}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-blue-400">
                      {formatDate(classItem.classDate)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {classItem.classTime}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {classItem.studentsEnrolled?.length || 0} students enrolled
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        classItem.paid 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {classItem.paid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {upcomingClasses.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/10">
              <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200">
                View All Classes →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity or Quick Actions */}
      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Activity className="mr-2 text-indigo-400" size={20} />
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-all duration-300 text-left group">
            <BookOpen className="mb-2 text-blue-400 group-hover:scale-110 transition-transform duration-200" size={20} />
            <div className="font-medium text-sm">Add Course</div>
            <div className="text-xs text-gray-400">Create new course</div>
          </button>
          
          <button className="bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-all duration-300 text-left group">
            <Users className="mb-2 text-green-400 group-hover:scale-110 transition-transform duration-200" size={20} />
            <div className="font-medium text-sm">Add Student</div>
            <div className="text-xs text-gray-400">Register new student</div>
          </button>
          
          <button className="bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-all duration-300 text-left group">
            <Calendar className="mb-2 text-purple-400 group-hover:scale-110 transition-transform duration-200" size={20} />
            <div className="font-medium text-sm">Schedule Class</div>
            <div className="text-xs text-gray-400">Create new class</div>
          </button>
          
          <button className="bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-all duration-300 text-left group">
            <IndianRupee className="mb-2 text-yellow-400 group-hover:scale-110 transition-transform duration-200" size={20} />
            <div className="font-medium text-sm">Payment Report</div>
            <div className="text-xs text-gray-400">View financial report</div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;