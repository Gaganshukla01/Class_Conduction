import React, { useState, useEffect, useMemo, useContext } from "react";
import {
  Calendar,
  DollarSign,
  Filter,
  CreditCard,
  CheckCircle,
  XCircle,
  TrendingUp,
  Eye,
  User,
  Clock,
  BookOpen,
  X,
  IndianRupee,
  UserCheck,
} from "lucide-react";
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
  AreaChart,
} from "recharts";
import { AppContent } from "../context/Context";

const PaymentTab = () => {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedPaymentMonth, setSelectedPaymentMonth] = useState(null);
  const [data, setData] = useState([]);
  const { allSchedule, userData } = useContext(AppContent);

  useEffect(() => {
    if (allSchedule && userData?.userId) {
      // Filter classes for current user and only "Present" attendance for payable classes
      const userClasses = allSchedule.filter(classItem => 
        classItem.studentsEnrolled && 
        classItem.studentsEnrolled.includes(userData.userId) &&
        classItem.attendance === "Present" // Only present classes are payable
      );
      setData(userClasses);
    }
  }, [allSchedule, userData]);

  // Process data by month
  const monthlyData = useMemo(() => {
    const grouped = {};

    data.forEach((classItem) => {
      if (classItem.classRate && classItem.attendance === "Present") {
        const date = new Date(classItem.classDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthName = date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

        if (!grouped[monthKey]) {
          grouped[monthKey] = {
            monthKey,
            monthName,
            classes: [],
            totalAmount: 0,
            paidAmount: 0,
            unpaidAmount: 0,
            totalClasses: 0,
            paidClasses: 0,
            unpaidClasses: 0,
          };
        }

        grouped[monthKey].classes.push(classItem);
        grouped[monthKey].totalAmount += classItem.classRate;
        grouped[monthKey].totalClasses += 1;

        if (classItem.paid) {
          grouped[monthKey].paidAmount += classItem.classRate;
          grouped[monthKey].paidClasses += 1;
        } else {
          grouped[monthKey].unpaidAmount += classItem.classRate;
          grouped[monthKey].unpaidClasses += 1;
        }
      }
    });

    return Object.values(grouped).sort((a, b) =>
      b.monthKey.localeCompare(a.monthKey)
    );
  }, [data]);

  // Filter data based on selected filters
  const filteredData = useMemo(() => {
    let filtered = monthlyData;

    if (selectedMonth) {
      filtered = filtered.filter((month) => month.monthKey === selectedMonth);
    }

    if (selectedYear) {
      filtered = filtered.filter((month) =>
        month.monthKey.startsWith(selectedYear.toString())
      );
    }

    if (paymentFilter === "paid") {
      filtered = filtered.filter(
        (month) => month.unpaidClasses === 0 && month.paidClasses > 0
      );
    } else if (paymentFilter === "unpaid") {
      filtered = filtered.filter((month) => month.unpaidClasses > 0);
    }

    return filtered;
  }, [monthlyData, selectedMonth, selectedYear, paymentFilter]);

  // Chart data
  const chartData = monthlyData.map((month) => ({
    month: month.monthName.split(" ")[0],
    paid: month.paidAmount,
    unpaid: month.unpaidAmount,
    total: month.totalAmount,
    classes: month.totalClasses,
  }));

  const pieData = [
    {
      name: "Paid",
      value: monthlyData.reduce((sum, month) => sum + month.paidAmount, 0),
      color: "#10b981",
    },
    {
      name: "Unpaid",
      value: monthlyData.reduce((sum, month) => sum + month.unpaidAmount, 0),
      color: "#ef4444",
    },
  ];

  const totalStats = {
    totalAmount: monthlyData.reduce((sum, month) => sum + month.totalAmount, 0),
    paidAmount: monthlyData.reduce((sum, month) => sum + month.paidAmount, 0),
    unpaidAmount: monthlyData.reduce(
      (sum, month) => sum + month.unpaidAmount,
      0
    ),
    totalClasses: monthlyData.reduce(
      (sum, month) => sum + month.totalClasses,
      0
    ),
    paidClasses: monthlyData.reduce((sum, month) => sum + month.paidClasses, 0),
  };

  const availableMonths = [
    ...new Set(monthlyData.map((month) => month.monthKey)),
  ];
  const availableYears = [
    ...new Set(
      monthlyData.map((month) => parseInt(month.monthKey.split("-")[0]))
    ),
  ];

  const handleShowPaymentDetails = (monthData) => {
    setSelectedPaymentMonth(monthData);
    setShowPaymentDetails(true);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/10 backdrop-blur-lg p-4 rounded-xl border border-white/20 shadow-lg">
          <p className="text-white font-semibold mb-2">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.dataKey}: ₹${entry.value.toLocaleString()}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-3xl border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                My Payment Dashboard
              </h1>
              <p className="text-gray-300">
                Track your class payments for attended sessions only
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-xl">
              <UserCheck className="w-5 h-5" />
              <span className="text-sm font-medium">Present Classes Only</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Total Due Amount</p>
                <p className="text-2xl font-bold text-white">
                  ₹{totalStats.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {totalStats.totalClasses} attended classes
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Amount Paid</p>
                <p className="text-2xl font-bold text-green-400">
                  ₹{totalStats.paidAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {totalStats.paidClasses} classes paid
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Outstanding Amount</p>
                <p className="text-2xl font-bold text-red-400">
                  ₹{totalStats.unpaidAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {totalStats.totalClasses - totalStats.paidClasses} pending
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-300">Payment Progress</p>
                <p className="text-2xl font-bold text-white">
                  {totalStats.totalClasses > 0
                    ? Math.round(
                        (totalStats.paidClasses / totalStats.totalClasses) * 100
                      )
                    : 0}
                  %
                </p>
                <p className="text-xs text-gray-400 mt-1">Completion rate</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-300" />
              <span className="text-sm font-medium text-gray-300">
                Filters:
              </span>
            </div>

            <select
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(e.target.value ? parseInt(e.target.value) : "")
              }
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 backdrop-blur-lg"
            >
              <option value="" className="bg-gray-800">
                All Years
              </option>
              {availableYears.map((year) => (
                <option key={year} value={year} className="bg-gray-800">
                  {year}
                </option>
              ))}
            </select>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 backdrop-blur-lg"
            >
              <option value="" className="bg-gray-800">
                All Months
              </option>
              {availableMonths.map((month) => {
                const date = new Date(month + "-01");
                const monthName = date.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                });
                return (
                  <option key={month} value={month} className="bg-gray-800">
                    {monthName}
                  </option>
                );
              })}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500 backdrop-blur-lg"
            >
              <option value="all" className="bg-gray-800">
                All Payments
              </option>
              <option value="paid" className="bg-gray-800">
                Paid Only
              </option>
              <option value="unpaid" className="bg-gray-800">
                Outstanding Only
              </option>
            </select>

            <button
              onClick={() => {
                setSelectedMonth("");
                setSelectedYear(new Date().getFullYear());
                setPaymentFilter("all");
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white text-sm hover:from-purple-600 hover:to-pink-700 transition-all font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Payment Overview
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient
                    id="unpaidGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="paid"
                  stackId="1"
                  stroke="#10b981"
                  fill="url(#paidGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="unpaid"
                  stackId="1"
                  stroke="#ef4444"
                  fill="url(#unpaidGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Distribution
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-sm text-gray-300">
                    {entry.name}: ₹{entry.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((month) => {
            const isFullyPaid =
              month.unpaidClasses === 0 && month.paidClasses > 0;
            const paymentPercentage =
              month.totalClasses > 0
                ? (month.paidClasses / month.totalClasses) * 100
                : 0;

            return (
              <div
                key={month.monthKey}
                className={`bg-white/10 backdrop-blur-lg rounded-2xl border transition-all hover:bg-white/20 hover:scale-105 p-6 ${
                  isFullyPaid
                    ? "border-green-400/50 shadow-green-400/20 shadow-lg"
                    : "border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    {month.monthName}
                  </h3>
                  {isFullyPaid && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Fully Paid
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">
                      Attended Classes:
                    </span>
                    <span className="font-medium text-white">
                      {month.totalClasses}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Paid Classes:</span>
                    <span className="font-medium text-green-400">
                      {month.paidClasses}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">
                      Unpaid Classes:
                    </span>
                    <span className="font-medium text-red-400">
                      {month.unpaidClasses}
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">Total Amount:</span>
                    <span className="font-bold text-white">
                      ₹{month.totalAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">Amount Paid:</span>
                    <span className="font-medium text-green-400">
                      ₹{month.paidAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Amount Due:</span>
                    <span className="font-medium text-red-400">
                      ₹{month.unpaidAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Payment Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">
                      Payment Progress
                    </span>
                    <span className="text-xs text-gray-400">
                      {Math.round(paymentPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${paymentPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleShowPaymentDetails(month)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all font-medium text-white"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            );
          })}
        </div>

        {filteredData.length === 0 && (
          <div className="bg-white/10 backdrop-blur-lg p-12 rounded-2xl border border-white/20 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              No payment data found
            </h3>
            <p className="text-gray-300">
              No attended classes found with the current filters. Try adjusting your filters to see more results.
            </p>
          </div>
        )}

        {/* Payment Details Modal */}
        {showPaymentDetails && selectedPaymentMonth && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">
                  {selectedPaymentMonth.monthName} - Payment Details
                </h3>
                <button
                  onClick={() => setShowPaymentDetails(false)}
                  className="text-white/70 hover:text-white transition"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mb-6">
                {/* Payment Summary */}
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    Payment Summary
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Attended Classes:</span>
                      <span className="text-white font-medium">
                        {selectedPaymentMonth.totalClasses}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Paid Classes:</span>
                      <span className="text-green-400 font-medium">
                        {selectedPaymentMonth.paidClasses}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Unpaid Classes:</span>
                      <span className="text-red-400 font-medium">
                        {selectedPaymentMonth.unpaidClasses}
                      </span>
                    </div>
                    <div className="border-t border-white/10 pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total Amount:</span>
                        <span className="text-white font-bold">
                          ₹{selectedPaymentMonth.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Amount Paid:</span>
                        <span className="text-green-400 font-medium">
                          ₹{selectedPaymentMonth.paidAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Amount Due:</span>
                        <span className="text-red-400 font-medium">
                          ₹{selectedPaymentMonth.unpaidAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Progress */}
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-4">
                    Progress Overview
                  </h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {Math.round(
                        (selectedPaymentMonth.paidClasses /
                          selectedPaymentMonth.totalClasses) *
                          100
                      )}
                      %
                    </div>
                    <p className="text-gray-300 text-sm mb-4">
                      Payment Complete
                    </p>
                    <div className="w-full bg-white/10 rounded-full h-3 mb-4">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${(selectedPaymentMonth.paidClasses / selectedPaymentMonth.totalClasses) * 100}%`,
                        }}
                      ></div>
                    </div>
                    {selectedPaymentMonth.unpaidClasses === 0 ? (
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">
                          All payments completed!
                        </span>
                      </div>
                    ) : (
                      <div className="text-orange-400">
                        <span className="font-medium">
                          {selectedPaymentMonth.unpaidClasses} classes pending
                          payment
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Individual Class Details */}
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-4">
                  Attended Class Details
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedPaymentMonth.classes
                    .filter(classItem => classItem.attendance === "Present")
                    .map((classItem) => (
                    <div
                      key={classItem._id}
                      className={`p-4 rounded-xl border transition-all ${
                        classItem.paid
                          ? "bg-green-500/10 border-green-500/30"
                          : "bg-red-500/10 border-red-500/30"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-white mb-1">
                            {classItem.className}
                          </h5>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(classItem.classDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{classItem.startTime} - {classItem.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              <span>{classItem.subject}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white mb-1">
                            ₹{classItem.classRate?.toLocaleString()}
                          </div>
                          <div
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                              classItem.paid
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {classItem.paid ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                <span>Paid</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                <span>Unpaid</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {classItem.instructor && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                          <User className="w-3 h-3" />
                          <span>Instructor: {classItem.instructor}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowPaymentDetails(false)}
                  className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all font-medium"
                >
                  Close
                </button>
                {selectedPaymentMonth.unpaidClasses > 0 && (
                  <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white hover:from-green-600 hover:to-emerald-700 transition-all font-medium flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Pay Outstanding (₹{selectedPaymentMonth.unpaidAmount.toLocaleString()})
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentTab;