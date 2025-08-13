import React, { useState, useContext, useEffect } from "react";
import {
  Calendar,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Users,
  ExternalLink,
  Filter,
  Search,
  Wallet,
  TrendingUp,
  UserCheck,
  UserX,
} from "lucide-react";

import { AppContent } from "../context/Context";
import axios from "axios";
import { toast } from "react-toastify";

export default function ClassPaymentUpdate() {
  const { backend_url, allSchedule, allUserData } = useContext(AppContent);
  console.log(allUserData, "data");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClasses, setSelectedClasses] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Generate months for the dropdown
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Get available years from the schedule data
  const getAvailableYears = () => {
    if (!allSchedule || !Array.isArray(allSchedule))
      return [new Date().getFullYear()];

    const years = new Set();
    allSchedule.forEach((classItem) => {
      const year = new Date(classItem.classDate).getFullYear();
      years.add(year);
    });

    return Array.from(years).sort((a, b) => b - a);
  };

  const getStudentDetails = (studentId) => {
    if (!allUserData || !Array.isArray(allUserData.data)) return null;

    const student = allUserData.data.find((user) => user._id === studentId);
    return student ? { name: student.name, email: student.email } : null;
  };

  // Filter classes by selected month and year
  const getFilteredClasses = () => {
    if (!allSchedule || !Array.isArray(allSchedule)) return [];

    return allSchedule
      .filter((classItem) => {
        const classDate = new Date(classItem.classDate);
        const monthMatch = classDate.getMonth() === selectedMonth;
        const yearMatch = classDate.getFullYear() === selectedYear;

        // Payment filter
        let paymentMatch = true;
        if (paymentFilter === "paid") paymentMatch = classItem.paid === true;
        if (paymentFilter === "unpaid") paymentMatch = classItem.paid === false;

        // Search filter
        const searchMatch =
          searchTerm === "" ||
          classItem.className
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          classItem.attendance.toLowerCase().includes(searchTerm.toLowerCase());

        return monthMatch && yearMatch && paymentMatch && searchMatch;
      })
      .sort((a, b) => new Date(a.classDate) - new Date(b.classDate));
  };

  const filteredClasses = getFilteredClasses();

  // Calculate totals including attendance-based collections
  const getTotals = () => {
    const total = filteredClasses.length;
    const paid = filteredClasses.filter((c) => c.paid).length;
    const unpaid = total - paid;

    // Basic totals
    const totalAmount = filteredClasses.reduce(
      (sum, c) => sum + (c.classRate || 0),
      0
    );
    const paidAmount = filteredClasses
      .filter((c) => c.paid)
      .reduce((sum, c) => sum + (c.classRate || 0), 0);
    const unpaidAmount = totalAmount - paidAmount;

    // Attendance-based calculations
    const presentClasses = filteredClasses.filter(
      (c) => c.attendance !== "Absent"
    );
    const absentClasses = filteredClasses.filter(
      (c) => c.attendance === "Absent"
    );

    // Collectible amount (classes where attendance is not "Absent")
    const collectibleAmount = presentClasses.reduce(
      (sum, c) => sum + (c.classRate || 0),
      0
    );
    const collectiblePaid = presentClasses
      .filter((c) => c.paid)
      .reduce((sum, c) => sum + (c.classRate || 0), 0);
    const collectiblePending = collectibleAmount - collectiblePaid;

    // Non-collectible amount (absent classes)
    const nonCollectibleAmount = absentClasses.reduce(
      (sum, c) => sum + (c.classRate || 0),
      0
    );

    // Student-wise breakdown for present classes
    const studentAttendance = {};
    presentClasses.forEach((classItem) => {
      if (
        classItem.studentsEnrolled &&
        Array.isArray(classItem.studentsEnrolled)
      ) {
        classItem.studentsEnrolled.forEach((studentId) => {
          if (!studentAttendance[studentId]) {
            studentAttendance[studentId] = {
              totalClasses: 0,
              totalAmount: 0,
              paidAmount: 0,
              pendingAmount: 0,
            };
          }

          studentAttendance[studentId].totalClasses += 1;
          studentAttendance[studentId].totalAmount += classItem.classRate || 0;

          if (classItem.paid) {
            studentAttendance[studentId].paidAmount += classItem.classRate || 0;
          } else {
            studentAttendance[studentId].pendingAmount +=
              classItem.classRate || 0;
          }
        });
      }
    });

    return {
      total,
      paid,
      unpaid,
      totalAmount,
      paidAmount,
      unpaidAmount,
      presentClasses: presentClasses.length,
      absentClasses: absentClasses.length,
      collectibleAmount,
      collectiblePaid,
      collectiblePending,
      nonCollectibleAmount,
      studentAttendance,
    };
  };

  const totals = getTotals();

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Format time
  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  // Handle class selection
  const handleClassSelect = (classId) => {
    const newSelected = new Set(selectedClasses);
    if (newSelected.has(classId)) {
      newSelected.delete(classId);
    } else {
      newSelected.add(classId);
    }
    setSelectedClasses(newSelected);
  };

  // Select all classes
  const handleSelectAll = () => {
    if (selectedClasses.size === filteredClasses.length) {
      setSelectedClasses(new Set());
    } else {
      setSelectedClasses(new Set(filteredClasses.map((c) => c._id)));
    }
  };

  // Mark selected classes as paid
  const markAsPaid = async () => {
    if (selectedClasses.size === 0) {
      toast.error("Please select at least one class to mark as paid");
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      const promises = Array.from(selectedClasses).map(async (classId) => {
        try {
          const response = await axios.put(
            `${backend_url}/api/classschedule/updatePayment`,
            { id: classId, paid: true }
          );
          if (response.data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error updating class ${classId}:`, error);
          errorCount++;
        }
      });

      await Promise.all(promises);

      if (successCount > 0) {
        toast.success(`${successCount} class(es) marked as paid successfully!`);
        setSelectedClasses(new Set());
        // Refresh data here if you have a function to do so
      }

      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} class(es)`);
      }
    } catch (error) {
      console.error("Error in batch payment update:", error);
      toast.error("Error updating payment status");
    } finally {
      setLoading(false);
    }
  };

  // Navigate months
  const navigateMonth = (direction) => {
    if (direction === "prev") {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    } else {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
    setSelectedClasses(new Set());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 px-6 py-12 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
            Class Payment Manager
          </h1>
          <p className="text-gray-300">
            Manage and track class payments with attendance-based collections
          </p>
        </div>

        {/* Month Navigation */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20 shadow-2xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth("prev")}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center space-x-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white backdrop-blur-sm focus:ring-2 ring-emerald-400 outline-none"
              >
                {months.map((month, index) => (
                  <option
                    key={index}
                    value={index}
                    className="bg-gray-800 text-white"
                  >
                    {month}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white backdrop-blur-sm focus:ring-2 ring-emerald-400 outline-none"
              >
                {getAvailableYears().map((year) => (
                  <option
                    key={year}
                    value={year}
                    className="bg-gray-800 text-white"
                  >
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => navigateMonth("next")}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Basic Totals Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-4 rounded-2xl border border-blue-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm">Total Classes</p>
                  <p className="text-2xl font-bold text-white">
                    {totals.total}
                  </p>
                </div>
                <BookOpen className="text-blue-300" size={24} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 rounded-2xl border border-green-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Present Classes</p>
                  <p className="text-2xl font-bold text-white">
                    {totals.presentClasses}
                  </p>
                </div>
                <UserCheck className="text-green-300" size={24} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 p-4 rounded-2xl border border-red-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-200 text-sm">Absent Classes</p>
                  <p className="text-2xl font-bold text-white">
                    {totals.absentClasses}
                  </p>
                </div>
                <UserX className="text-red-300" size={24} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-4 rounded-2xl border border-yellow-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-200 text-sm">Paid Classes</p>
                  <p className="text-2xl font-bold text-white">{totals.paid}</p>
                </div>
                <CheckCircle2 className="text-yellow-300" size={24} />
              </div>
            </div>
          </div>

          {/* Collectible Amount Section */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-6 rounded-2xl border border-emerald-400/30 mb-6">
            <h3 className="text-xl font-bold text-emerald-300 mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Collectible Revenue (Non-Absent Classes)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 p-4 rounded-xl">
                <p className="text-emerald-200 text-sm">Total Collectible</p>
                <p className="text-2xl font-bold text-white">
                  ₹{totals.collectibleAmount}
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                <p className="text-green-200 text-sm">Collected</p>
                <p className="text-2xl font-bold text-white">
                  ₹{totals.collectiblePaid}
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl">
                <p className="text-orange-200 text-sm">Pending Collection</p>
                <p className="text-2xl font-bold text-white">
                  ₹{totals.collectiblePending}
                </p>
              </div>
            </div>
          </div>

          {/* All Amount Totals */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-purple-500/20 to-violet-500/20 p-4 rounded-2xl border border-purple-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-200 text-sm">Total Amount</p>
                  <p className="text-xl font-bold text-white">
                    ₹{totals.totalAmount}
                  </p>
                </div>
                <Wallet className="text-purple-300" size={24} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 rounded-2xl border border-green-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm">Paid Amount</p>
                  <p className="text-xl font-bold text-white">
                    ₹{totals.paidAmount}
                  </p>
                </div>
                <DollarSign className="text-green-300" size={24} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-2xl border border-orange-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm">Pending Amount</p>
                  <p className="text-xl font-bold text-white">
                    ₹{totals.unpaidAmount}
                  </p>
                </div>
                <CreditCard className="text-orange-300" size={24} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-gray-500/20 to-slate-500/20 p-4 rounded-2xl border border-gray-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-200 text-sm">Non-Collectible</p>
                  <p className="text-xl font-bold text-white">
                    ₹{totals.nonCollectibleAmount}
                  </p>
                </div>
                <XCircle className="text-gray-300" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Student-wise Breakdown */}
        {Object.keys(totals.studentAttendance).length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20 shadow-2xl mb-8">
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users size={24} className="text-cyan-300" />
              Student-wise Collections (Present Classes Only)
            </h3>
            <div className="grid gap-4">
              {Object.entries(totals.studentAttendance).map(
                ([studentId, data]) => {
                  const studentDetails = getStudentDetails(studentId);
                  return (
                    <div
                      key={studentId}
                      className="bg-white/5 p-4 rounded-2xl border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">
                            {studentDetails
                              ? studentDetails.name
                              : `Student ID: ${studentId}`}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {studentDetails
                              ? studentDetails.email
                              : "Email not found"}
                          </p>
                          <p className="text-gray-300 text-sm">
                            Classes Attended: {data.totalClasses}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-right">
                          <div>
                            <p className="text-xs text-gray-400">Total</p>
                            <p className="font-bold text-white">
                              ₹{data.totalAmount}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-green-400">Paid</p>
                            <p className="font-bold text-green-300">
                              ₹{data.paidAmount}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-orange-400">Pending</p>
                            <p className="font-bold text-orange-300">
                              ₹{data.pendingAmount}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20 shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white/5 rounded-xl px-3 py-2">
                <Search size={16} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search classes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent text-white outline-none placeholder:text-gray-400 text-sm"
                />
              </div>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white backdrop-blur-sm focus:ring-2 ring-emerald-400 outline-none"
              >
                <option value="all" className="bg-gray-800">
                  All Classes
                </option>
                <option value="paid" className="bg-gray-800">
                  Paid Only
                </option>
                <option value="unpaid" className="bg-gray-800">
                  Unpaid Only
                </option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 text-sm font-medium"
              >
                {selectedClasses.size === filteredClasses.length
                  ? "Deselect All"
                  : "Select All"}
              </button>

              {selectedClasses.size > 0 && (
                <button
                  onClick={markAsPaid}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 rounded-xl transition-all duration-300 font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CreditCard size={16} />
                  )}
                  Mark as Paid ({selectedClasses.size})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Classes List */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar size={24} className="text-emerald-300" />
            {months[selectedMonth]} {selectedYear} Classes
          </h2>

          {filteredClasses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen size={64} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">No Classes Found</h3>
              <p className="text-gray-400">
                No classes match your current filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredClasses.map((classItem) => (
                <div
                  key={classItem._id}
                  className={`bg-white/5 backdrop-blur-sm rounded-2xl border transition-all duration-300 hover:bg-white/10 ${
                    selectedClasses.has(classItem._id)
                      ? "border-emerald-400 ring-2 ring-emerald-400/50"
                      : "border-white/20"
                  } ${classItem.attendance === "Absent" ? "opacity-60" : ""}`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedClasses.has(classItem._id)}
                          onChange={() => handleClassSelect(classItem._id)}
                          className="w-5 h-5 text-emerald-600 bg-white/10 border-white/30 rounded focus:ring-emerald-500 focus:ring-2"
                        />

                        <div
                          className={`w-12 h-12 bg-gradient-to-r rounded-xl flex items-center justify-center ${
                            classItem.attendance === "Absent"
                              ? "from-gray-500 to-gray-600"
                              : "from-blue-500 to-purple-500"
                          }`}
                        >
                          <BookOpen size={20} className="text-white" />
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg text-white">
                            {classItem.className}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-300 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(classItem.classDate)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {formatTime(classItem.classTime)}
                            </span>
                            <span>{classItem.classDuration}h</span>
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {classItem.studentsEnrolled?.length || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">
                            ₹{classItem.classRate}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                classItem.paid
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                  : "bg-red-500/20 text-red-300 border border-red-500/30"
                              }`}
                            >
                              {classItem.paid ? (
                                <>
                                  <CheckCircle2 size={10} className="mr-1" />
                                  Paid
                                </>
                              ) : (
                                <>
                                  <XCircle size={10} className="mr-1" />
                                  Unpaid
                                </>
                              )}
                            </span>

                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                classItem.attendance === "Present"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : classItem.attendance === "Absent"
                                    ? "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                                    : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                              }`}
                            >
                              {classItem.attendance}
                            </span>

                            {classItem.attendance !== "Absent" && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <TrendingUp size={10} className="mr-1" />
                                Collectible
                              </span>
                            )}
                          </div>
                        </div>

                        {classItem.classLink && (
                          <a
                            href={classItem.classLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105"
                          >
                            <ExternalLink size={16} className="text-gray-300" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Additional Details */}
                    {(classItem.topicCovered || classItem.notes) && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        {classItem.topicCovered && (
                          <div className="mb-2">
                            <p className="text-sm text-gray-400">
                              Topics Covered:
                            </p>
                            <p className="text-white">
                              {classItem.topicCovered}
                            </p>
                          </div>
                        )}
                        {classItem.notes && (
                          <div>
                            <p className="text-sm text-gray-400">Notes:</p>
                            <p className="text-white">{classItem.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
