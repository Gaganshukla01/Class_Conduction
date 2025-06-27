import React, { useState,useContext } from 'react';
import { 
  User, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckCircle2,
  MessageSquare,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContent } from '../context/Context';


export default function StudentAttendanceForm() {

     const { backend_url} = useContext(AppContent);
  // Mock present students data - will come from API
  const mockPresentStudents = [
    { id: 'CS001', name: 'Alice Johnson', rollNo: 'CS001', status: 'present' },
    { id: 'CS002', name: 'Bob Smith', rollNo: 'CS002', status: 'present' },
    { id: 'CS003', name: 'Charlie Brown', rollNo: 'CS003', status: 'present' },
    { id: 'CS004', name: 'Diana Prince', rollNo: 'CS004', status: 'present' },
    { id: 'CS005', name: 'Edward Wilson', rollNo: 'CS005', status: 'present' },
    { id: 'CS006', name: 'Fiona Davis', rollNo: 'CS006', status: 'present' }
  ];

  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    className: '',
    date: '',
    classStartTime: '',
    classEndTime: '',
    topicCovered: '',
    additionalNotes: ''
  });
  const [message, setMessage] = useState('');
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [currentTimeField, setCurrentTimeField] = useState('');
  const [tempTime, setTempTime] = useState({ hours: '09', minutes: '00', period: 'AM' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If studentId is selected, also update studentName
    if (name === 'studentId') {
      const selectedStudent = mockPresentStudents.find(s => s.id === value);
      setFormData(prev => ({
        ...prev,
        [name]: value,
        studentName: selectedStudent?.name || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const openTimeModal = (fieldName, currentValue = '') => {
    setCurrentTimeField(fieldName);
    if (currentValue) {
      const [time, period] = currentValue.includes('AM') || currentValue.includes('PM') 
        ? currentValue.split(' ') 
        : [currentValue, 'AM'];
      const [hours, minutes] = time.split(':');
      setTempTime({ 
        hours: hours.padStart(2, '0'), 
        minutes: minutes.padStart(2, '0'), 
        period: period || 'AM' 
      });
    } else {
      setTempTime({ hours: '09', minutes: '00', period: 'AM' });
    }
    setShowTimeModal(true);
  };

  const handleTimeChange = (type, increment) => {
    setTempTime(prev => {
      let newValue = { ...prev };
      
      if (type === 'hours') {
        let hours = parseInt(prev.hours);
        hours += increment;
        if (hours > 12) hours = 1;
        if (hours < 1) hours = 12;
        newValue.hours = hours.toString().padStart(2, '0');
      } else if (type === 'minutes') {
        let minutes = parseInt(prev.minutes);
        minutes += increment * 5; 
        if (minutes >= 60) minutes = 0;
        if (minutes < 0) minutes = 55;
        newValue.minutes = minutes.toString().padStart(2, '0');
      } else if (type === 'period') {
        newValue.period = prev.period === 'AM' ? 'PM' : 'AM';
      }
      
      return newValue;
    });
  };

  const confirmTime = () => {
    const timeString = `${tempTime.hours}:${tempTime.minutes} ${tempTime.period}`;
    setFormData(prev => ({
      ...prev,
      [currentTimeField]: timeString
    }));
    setShowTimeModal(false);
  };

  // Convert time format and create date objects for backend
  const convertTimeToDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    const dateTime = new Date(dateStr);
    dateTime.setHours(hour24, parseInt(minutes), 0, 0);
    return dateTime.toISOString();
  };

  const handleSubmit = async () => {
    // Create payload matching backend expected structure
    const payload = {
      studentId: formData.studentId,
      studentName: formData.studentName,
      className: formData.className,
      classStartAt: convertTimeToDateTime(formData.date, formData.classStartTime),
      classEndAt: convertTimeToDateTime(formData.date, formData.classEndTime),
      topicCovered: formData.topicCovered,
      additionalNotes: formData.additionalNotes
    };

    try {
      console.log('Submitting student attendance:', payload);
      
      // Here you would make the actual API call
      const res=axios.post(`${backend_url}/api/attendence/add`,payload)
     if(res){
        toast.success(' Student attendance recorded successfully!');
     }
      setTimeout(() => {
        setMessage('✅ Student attendance recorded successfully!');
        setFormData({
          studentId: '',
          studentName: '',
          className: '',
          date: '',
          classStartTime: '',
          classEndTime: '',
          topicCovered: '',
          additionalNotes: ''
        });
        
        // Clear message after 3 seconds
        setTimeout(() => {
          setMessage('');
        }, 3000);
      }, 1000);
    } catch (error) {
      console.error('Error recording attendance:', error);
      setMessage('❌ Error recording attendance');
      setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  };

  const selectedStudent = mockPresentStudents.find(s => s.id === formData.studentId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 px-6 py-12 text-white">
      {/* Time Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl max-w-sm w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Select Time</h3>
              <button 
                onClick={() => setShowTimeModal(false)}
                className="text-white/70 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex items-center justify-center space-x-4 mb-8">
              {/* Hours */}
              <div className="text-center">
                <button 
                  onClick={() => handleTimeChange('hours', 1)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition mb-2"
                >
                  <ChevronUp size={20} />
                </button>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/20">
                  {tempTime.hours}
                </div>
                <button 
                  onClick={() => handleTimeChange('hours', -1)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition mt-2"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
              
              <div className="text-3xl font-bold text-white/60">:</div>
              
              {/* Minutes */}
              <div className="text-center">
                <button 
                  onClick={() => handleTimeChange('minutes', 1)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition mb-2"
                >
                  <ChevronUp size={20} />
                </button>
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/20">
                  {tempTime.minutes}
                </div>
                <button 
                  onClick={() => handleTimeChange('minutes', -1)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition mt-2"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
              
              {/* AM/PM */}
              <div className="text-center">
                <button 
                  onClick={() => handleTimeChange('period')}
                  className="w-16 h-20 bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 rounded-2xl flex items-center justify-center text-lg font-bold border border-white/20 hover:from-emerald-500/40 hover:to-cyan-500/40 transition"
                >
                  {tempTime.period}
                </button>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowTimeModal(false)}
                className="flex-1 py-3 bg-white/10 rounded-xl hover:bg-white/20 transition border border-white/20"
              >
                Cancel
              </button>
              <button 
                onClick={confirmTime}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl hover:from-emerald-600 hover:to-cyan-700 transition font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
            Student Attendance
          </h2>
          <p className="text-gray-300">Record present student attendance</p>
        </div>

        {message && (
          <div className="mb-6 text-center text-lg font-medium text-green-300 bg-green-500/10 py-3 px-6 rounded-xl border border-green-500/20">
            {message}
          </div>
        )}

        {/* Selected Student Info */}
        {selectedStudent && (
          <div className="mb-6 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 p-4 rounded-2xl border border-emerald-400/30">
            <div className="flex items-center">
              <User className="mr-3 text-emerald-300" size={20} />
              <div>
                <div className="font-semibold text-emerald-200">{selectedStudent.name}</div>
                <div className="text-sm text-gray-300 flex items-center">
                  <span className="mr-2">Roll No: {selectedStudent.rollNo}</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                    <CheckCircle2 size={12} className="mr-1" />
                    Present
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Student Selection */}
          <SelectInput 
            label="Select Present Student" 
            name="studentId" 
            value={formData.studentId} 
            onChange={handleChange} 
            options={[
              { value: '', label: 'Choose a present student...' },
              ...mockPresentStudents.map(student => ({
                value: student.id,
                label: `${student.name} (${student.rollNo})`
              }))
            ]}
            Icon={User}
            required
          />

          {/* Class Name and Date */}
          <div className="grid md:grid-cols-2 gap-6">
            <Input 
              label="Class Name" 
              name="className" 
              value={formData.className} 
              onChange={handleChange} 
              Icon={BookOpen} 
              required
            />
            <Input 
              label="Date" 
              name="date" 
              value={formData.date} 
              onChange={handleChange} 
              type="date"
              Icon={Calendar} 
              required
            />
          </div>

          {/* Class Times */}
          <div className="grid md:grid-cols-2 gap-6">
            <TimeInput 
              label="Class Start Time" 
              name="classStartTime" 
              value={formData.classStartTime} 
              onClick={() => openTimeModal('classStartTime', formData.classStartTime)}
              Icon={Clock} 
              required
            />
            <TimeInput 
              label="Class End Time" 
              name="classEndTime" 
              value={formData.classEndTime} 
              onClick={() => openTimeModal('classEndTime', formData.classEndTime)}
              Icon={Clock} 
              required
            />
          </div>

          {/* Topics Covered */}
          <TextArea 
            label="Topics Covered" 
            name="topicCovered" 
            value={formData.topicCovered} 
            onChange={handleChange} 
            Icon={BookOpen}
            placeholder="What topics were covered in this class..."
            rows={3}
          />

          {/* Additional Notes */}
          <TextArea 
            label="Additional Notes" 
            name="additionalNotes" 
            value={formData.additionalNotes} 
            onChange={handleChange} 
            Icon={MessageSquare}
            placeholder="Any additional notes about the student's participation..."
            rows={3}
          />

          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={!formData.studentId || !formData.className || !formData.date || !formData.classStartTime || !formData.classEndTime}
            className="w-full mt-6 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-2xl text-lg font-semibold hover:from-emerald-600 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <CheckCircle2 size={20} />
            Record Attendance
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, name, value, onChange, type = "text", Icon, required = false, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">{label}</label>
      <div className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus-within:ring-2 ring-emerald-400 transition backdrop-blur-sm">
        {Icon && <Icon size={18} className="text-gray-300 mr-3" />}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="bg-transparent text-white w-full outline-none placeholder:text-gray-400"
          placeholder={placeholder || label}
          required={required}
        />
      </div>
    </div>
  );
}

function TimeInput({ label, name, value, onClick, Icon, required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">{label}</label>
      <div 
        onClick={onClick}
        className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 hover:ring-2 ring-emerald-400 transition backdrop-blur-sm cursor-pointer hover:bg-white/10"
      >
        {Icon && <Icon size={18} className="text-gray-300 mr-3" />}
        <input
          type="text"
          name={name}
          value={value}
          readOnly
          className="bg-transparent text-white w-full outline-none placeholder:text-gray-400 cursor-pointer"
          placeholder="Select time..."
          required={required}
        />
        <Clock size={16} className="text-gray-400 ml-2" />
      </div>
    </div>
  );
}

function TextArea({ label, name, value, onChange, Icon, required = false, placeholder, rows = 3 }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">{label}</label>
      <div className="flex items-start bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus-within:ring-2 ring-emerald-400 transition backdrop-blur-sm">
        {Icon && <Icon size={18} className="text-gray-300 mr-3 mt-1" />}
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          className="bg-transparent text-white w-full outline-none placeholder:text-gray-400 resize-none"
          placeholder={placeholder || label}
          rows={rows}
          required={required}
        />
      </div>
    </div>
  );
}

function SelectInput({ label, name, value, onChange, options, Icon, required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">{label}</label>
      <div className="flex items-center bg-white/5 rounded-xl px-4 py-3 border border-white/10 focus-within:ring-2 ring-emerald-400 transition backdrop-blur-sm">
        {Icon && <Icon size={18} className="text-gray-300 mr-3" />}
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="bg-transparent text-white w-full outline-none appearance-none cursor-pointer"
          required={required}
        >
          {options.map(option => (
            <option key={option.value} value={option.value} className="bg-gray-800 text-white">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}