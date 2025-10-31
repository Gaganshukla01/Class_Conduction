import React, { useState, useEffect } from 'react';
import { Clock, Search, Globe, ChevronDown, Calendar, ArrowRight } from 'lucide-react';

const TimezoneConverter = () => {
  const [istTime, setIstTime] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [convertedTime, setConvertedTime] = useState('');
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeInput, setTimeInput] = useState({ hours: '', minutes: '', period: 'AM' });

  // Comprehensive timezone list with regions
  const timezones = [
    // North America
    { value: 'America/New_York', label: 'New York', region: 'North America', offset: 'UTC-5/-4', flag: '🇺🇸' },
    { value: 'America/Los_Angeles', label: 'Los Angeles', region: 'North America', offset: 'UTC-8/-7', flag: '🇺🇸' },
    { value: 'America/Chicago', label: 'Chicago', region: 'North America', offset: 'UTC-6/-5', flag: '🇺🇸' },
    { value: 'America/Denver', label: 'Denver', region: 'North America', offset: 'UTC-7/-6', flag: '🇺🇸' },
    { value: 'America/Phoenix', label: 'Phoenix', region: 'North America', offset: 'UTC-7', flag: '🇺🇸' },
    { value: 'America/Anchorage', label: 'Anchorage', region: 'North America', offset: 'UTC-9/-8', flag: '🇺🇸' },
    { value: 'America/Toronto', label: 'Toronto', region: 'North America', offset: 'UTC-5/-4', flag: '🇨🇦' },
    { value: 'America/Vancouver', label: 'Vancouver', region: 'North America', offset: 'UTC-8/-7', flag: '🇨🇦' },
    { value: 'America/Mexico_City', label: 'Mexico City', region: 'North America', offset: 'UTC-6/-5', flag: '🇲🇽' },
    
    // South America
    { value: 'America/Sao_Paulo', label: 'São Paulo', region: 'South America', offset: 'UTC-3', flag: '🇧🇷' },
    { value: 'America/Buenos_Aires', label: 'Buenos Aires', region: 'South America', offset: 'UTC-3', flag: '🇦🇷' },
    { value: 'America/Bogota', label: 'Bogotá', region: 'South America', offset: 'UTC-5', flag: '🇨🇴' },
    { value: 'America/Lima', label: 'Lima', region: 'South America', offset: 'UTC-5', flag: '🇵🇪' },
    { value: 'America/Santiago', label: 'Santiago', region: 'South America', offset: 'UTC-4/-3', flag: '🇨🇱' },
    
    // Europe
    { value: 'Europe/London', label: 'London', region: 'Europe', offset: 'UTC+0/+1', flag: '🇬🇧' },
    { value: 'Europe/Paris', label: 'Paris', region: 'Europe', offset: 'UTC+1/+2', flag: '🇫🇷' },
    { value: 'Europe/Berlin', label: 'Berlin', region: 'Europe', offset: 'UTC+1/+2', flag: '🇩🇪' },
    { value: 'Europe/Rome', label: 'Rome', region: 'Europe', offset: 'UTC+1/+2', flag: '🇮🇹' },
    { value: 'Europe/Madrid', label: 'Madrid', region: 'Europe', offset: 'UTC+1/+2', flag: '🇪🇸' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam', region: 'Europe', offset: 'UTC+1/+2', flag: '🇳🇱' },
    { value: 'Europe/Brussels', label: 'Brussels', region: 'Europe', offset: 'UTC+1/+2', flag: '🇧🇪' },
    { value: 'Europe/Vienna', label: 'Vienna', region: 'Europe', offset: 'UTC+1/+2', flag: '🇦🇹' },
    { value: 'Europe/Stockholm', label: 'Stockholm', region: 'Europe', offset: 'UTC+1/+2', flag: '🇸🇪' },
    { value: 'Europe/Copenhagen', label: 'Copenhagen', region: 'Europe', offset: 'UTC+1/+2', flag: '🇩🇰' },
    { value: 'Europe/Oslo', label: 'Oslo', region: 'Europe', offset: 'UTC+1/+2', flag: '🇳🇴' },
    { value: 'Europe/Helsinki', label: 'Helsinki', region: 'Europe', offset: 'UTC+2/+3', flag: '🇫🇮' },
    { value: 'Europe/Warsaw', label: 'Warsaw', region: 'Europe', offset: 'UTC+1/+2', flag: '🇵🇱' },
    { value: 'Europe/Prague', label: 'Prague', region: 'Europe', offset: 'UTC+1/+2', flag: '🇨🇿' },
    { value: 'Europe/Budapest', label: 'Budapest', region: 'Europe', offset: 'UTC+1/+2', flag: '🇭🇺' },
    { value: 'Europe/Athens', label: 'Athens', region: 'Europe', offset: 'UTC+2/+3', flag: '🇬🇷' },
    { value: 'Europe/Lisbon', label: 'Lisbon', region: 'Europe', offset: 'UTC+0/+1', flag: '🇵🇹' },
    { value: 'Europe/Dublin', label: 'Dublin', region: 'Europe', offset: 'UTC+0/+1', flag: '🇮🇪' },
    { value: 'Europe/Moscow', label: 'Moscow', region: 'Europe', offset: 'UTC+3', flag: '🇷🇺' },
    { value: 'Europe/Istanbul', label: 'Istanbul', region: 'Europe', offset: 'UTC+3', flag: '🇹🇷' },
    
    // Asia Pacific
    { value: 'Asia/Kolkata', label: 'Kolkata', region: 'Asia Pacific', offset: 'UTC+5:30', flag: '🇮🇳' },
    { value: 'Asia/Dubai', label: 'Dubai', region: 'Asia Pacific', offset: 'UTC+4', flag: '🇦🇪' },
    { value: 'Asia/Tokyo', label: 'Tokyo', region: 'Asia Pacific', offset: 'UTC+9', flag: '🇯🇵' },
    { value: 'Asia/Shanghai', label: 'Shanghai', region: 'Asia Pacific', offset: 'UTC+8', flag: '🇨🇳' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'Asia Pacific', offset: 'UTC+8', flag: '🇭🇰' },
    { value: 'Asia/Singapore', label: 'Singapore', region: 'Asia Pacific', offset: 'UTC+8', flag: '🇸🇬' },
    { value: 'Asia/Seoul', label: 'Seoul', region: 'Asia Pacific', offset: 'UTC+9', flag: '🇰🇷' },
    { value: 'Asia/Bangkok', label: 'Bangkok', region: 'Asia Pacific', offset: 'UTC+7', flag: '🇹🇭' },
    { value: 'Asia/Jakarta', label: 'Jakarta', region: 'Asia Pacific', offset: 'UTC+7', flag: '🇮🇩' },
    { value: 'Asia/Manila', label: 'Manila', region: 'Asia Pacific', offset: 'UTC+8', flag: '🇵🇭' },
    { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur', region: 'Asia Pacific', offset: 'UTC+8', flag: '🇲🇾' },
    { value: 'Asia/Taipei', label: 'Taipei', region: 'Asia Pacific', offset: 'UTC+8', flag: '🇹🇼' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Ho Chi Minh', region: 'Asia Pacific', offset: 'UTC+7', flag: '🇻🇳' },
    { value: 'Asia/Karachi', label: 'Karachi', region: 'Asia Pacific', offset: 'UTC+5', flag: '🇵🇰' },
    { value: 'Asia/Dhaka', label: 'Dhaka', region: 'Asia Pacific', offset: 'UTC+6', flag: '🇧🇩' },
    { value: 'Asia/Colombo', label: 'Colombo', region: 'Asia Pacific', offset: 'UTC+5:30', flag: '🇱🇰' },
    { value: 'Asia/Kathmandu', label: 'Kathmandu', region: 'Asia Pacific', offset: 'UTC+5:45', flag: '🇳🇵' },
    
    // Australia & Oceania
    { value: 'Australia/Sydney', label: 'Sydney', region: 'Australia & Oceania', offset: 'UTC+10/+11', flag: '🇦🇺' },
    { value: 'Australia/Melbourne', label: 'Melbourne', region: 'Australia & Oceania', offset: 'UTC+10/+11', flag: '🇦🇺' },
    { value: 'Australia/Brisbane', label: 'Brisbane', region: 'Australia & Oceania', offset: 'UTC+10', flag: '🇦🇺' },
    { value: 'Australia/Perth', label: 'Perth', region: 'Australia & Oceania', offset: 'UTC+8', flag: '🇦🇺' },
    { value: 'Pacific/Auckland', label: 'Auckland', region: 'Australia & Oceania', offset: 'UTC+12/+13', flag: '🇳🇿' },
    { value: 'Pacific/Fiji', label: 'Fiji', region: 'Australia & Oceania', offset: 'UTC+12', flag: '🇫🇯' },
    
    // Middle East
    { value: 'Asia/Riyadh', label: 'Riyadh', region: 'Middle East', offset: 'UTC+3', flag: '🇸🇦' },
    { value: 'Asia/Kuwait', label: 'Kuwait', region: 'Middle East', offset: 'UTC+3', flag: '🇰🇼' },
    { value: 'Asia/Doha', label: 'Doha', region: 'Middle East', offset: 'UTC+3', flag: '🇶🇦' },
    { value: 'Asia/Bahrain', label: 'Bahrain', region: 'Middle East', offset: 'UTC+3', flag: '🇧🇭' },
    { value: 'Asia/Muscat', label: 'Muscat', region: 'Middle East', offset: 'UTC+4', flag: '🇴🇲' },
    { value: 'Asia/Tehran', label: 'Tehran', region: 'Middle East', offset: 'UTC+3:30/+4:30', flag: '🇮🇷' },
    { value: 'Asia/Jerusalem', label: 'Jerusalem', region: 'Middle East', offset: 'UTC+2/+3', flag: '🇮🇱' },
    { value: 'Asia/Beirut', label: 'Beirut', region: 'Middle East', offset: 'UTC+2/+3', flag: '🇱🇧' },
    { value: 'Asia/Amman', label: 'Amman', region: 'Middle East', offset: 'UTC+2/+3', flag: '🇯🇴' },
    
    // Africa
    { value: 'Africa/Cairo', label: 'Cairo', region: 'Africa', offset: 'UTC+2', flag: '🇪🇬' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg', region: 'Africa', offset: 'UTC+2', flag: '🇿🇦' },
    { value: 'Africa/Lagos', label: 'Lagos', region: 'Africa', offset: 'UTC+1', flag: '🇳🇬' },
    { value: 'Africa/Nairobi', label: 'Nairobi', region: 'Africa', offset: 'UTC+3', flag: '🇰🇪' },
    { value: 'Africa/Casablanca', label: 'Casablanca', region: 'Africa', offset: 'UTC+0/+1', flag: '🇲🇦' },
    { value: 'Africa/Algiers', label: 'Algiers', region: 'Africa', offset: 'UTC+1', flag: '🇩🇿' },
    { value: 'Africa/Tunis', label: 'Tunis', region: 'Africa', offset: 'UTC+1', flag: '🇹🇳' },
    { value: 'Africa/Accra', label: 'Accra', region: 'Africa', offset: 'UTC+0', flag: '🇬🇭' },
    
    // Others
    { value: 'UTC', label: 'UTC', region: 'Universal', offset: 'UTC+0', flag: '🌍' },
    { value: 'Atlantic/Reykjavik', label: 'Reykjavik', region: 'Atlantic', offset: 'UTC+0', flag: '🇮🇸' },
  ];

  const filteredTimezones = timezones.filter(tz =>
    tz.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tz.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedTimezones = filteredTimezones.reduce((acc, tz) => {
    if (!acc[tz.region]) acc[tz.region] = [];
    acc[tz.region].push(tz);
    return acc;
  }, {});

  const handleTimeInputChange = (field, value) => {
    const newTimeInput = { ...timeInput, [field]: value };
    setTimeInput(newTimeInput);
    
    if (newTimeInput.hours && newTimeInput.minutes) {
      let hours = parseInt(newTimeInput.hours);
      if (newTimeInput.period === 'PM' && hours !== 12) hours += 12;
      if (newTimeInput.period === 'AM' && hours === 12) hours = 0;
      
      const timeString = `${hours.toString().padStart(2, '0')}:${newTimeInput.minutes}`;
      setIstTime(timeString);
    }
  };

  const convertTime = () => {
    if (!istTime) {
      setConvertedTime('');
      setError('');
      return;
    }

    try {
      const [hours, minutes] = istTime.split(':');
      
      if (!hours || !minutes || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        setError('Please enter a valid time');
        setConvertedTime('');
        return;
      }

      const istDate = new Date();
      istDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const utcTime = new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
      
      const timeOptions = {
        timeZone: selectedTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      const dateOptions = {
        timeZone: selectedTimezone,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      };
      
      const timeStr = utcTime.toLocaleString('en-US', timeOptions);
      const dateStr = utcTime.toLocaleString('en-US', dateOptions);
      
      setConvertedTime(`${dateStr}, ${timeStr}`);
      setError('');
    } catch (err) {
      setError('Invalid time format');
      setConvertedTime('');
    }
  };

  useEffect(() => {
    convertTime();
  }, [istTime, selectedTimezone]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const getCurrentISTTime = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setIstTime(timeString);
    
    const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
    const period = hours >= 12 ? 'PM' : 'AM';
    setTimeInput({
      hours: displayHours.toString(),
      minutes: minutes.toString().padStart(2, '0'),
      period: period
    });
  };

  const selectedTz = timezones.find(tz => tz.value === selectedTimezone);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mb-4 shadow-2xl">
            <Globe className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent mb-2">
            IST Timezone Converter
          </h1>
          <p className="text-gray-400 text-lg">Convert Indian Standard Time to any timezone worldwide</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 relative">
          {/* IST Input Section */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full -translate-y-8 translate-x-8"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl">🇮🇳</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Indian Standard Time</h2>
                <p className="text-sm text-purple-300 font-medium">UTC +05:30</p>
              </div>
            </div>

            {/* Analog Clock */}
            {istTime && (
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-2xl flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      <div className="relative w-24 h-24">
                        <div className="absolute inset-0 rounded-full border-2 border-purple-400/30"></div>
                        {Array.from({length: 12}).map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-0.5 h-3 bg-purple-400"
                            style={{
                              top: '2px',
                              left: '50%',
                              transformOrigin: '0 46px',
                              transform: `translateX(-50%) rotate(${i * 30}deg)`
                            }}
                          />
                        ))}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="absolute w-0.5 h-6 bg-purple-400 rounded-full origin-bottom"
                            style={{
                              transform: `rotate(${((parseInt(istTime.split(':')[0]) % 12) * 30) + (parseInt(istTime.split(':')[1]) * 0.5) - 90}deg)`
                            }}
                          />
                          <div
                            className="absolute w-0.5 h-8 bg-blue-400 rounded-full origin-bottom"
                            style={{
                              transform: `rotate(${(parseInt(istTime.split(':')[1]) * 6) - 90}deg)`
                            }}
                          />
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Time Input */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Hours</label>
                  <select
                    value={timeInput.hours}
                    onChange={(e) => handleTimeInputChange('hours', e.target.value)}
                    className="w-full px-3 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/5 text-white transition-all"
                  >
                    <option value="" className="bg-slate-800 text-white">HH</option>
                    {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                      <option key={hour} value={hour} className="bg-slate-800 text-white">{hour.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Minutes</label>
                  <select
                    value={timeInput.minutes}
                    onChange={(e) => handleTimeInputChange('minutes', e.target.value)}
                    className="w-full px-3 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/5 text-white transition-all"
                  >
                    <option value="" className="bg-slate-800 text-white">MM</option>
                    {Array.from({length: 60}, (_, i) => i).map(minute => (
                      <option key={minute} value={minute.toString().padStart(2, '0')} className="bg-slate-800 text-white">
                        {minute.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">AM/PM</label>
                  <select
                    value={timeInput.period}
                    onChange={(e) => handleTimeInputChange('period', e.target.value)}
                    className="w-full px-3 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/5 text-white transition-all"
                  >
                    <option value="AM" className="bg-slate-800 text-white">AM</option>
                    <option value="PM" className="bg-slate-800 text-white">PM</option>
                  </select>
                </div>
              </div>

              <button
                onClick={getCurrentISTTime}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all font-medium flex items-center justify-center gap-2 shadow-lg transform hover:scale-105"
              >
                <Clock size={18} />
                Use Current IST Time
              </button>

              {istTime && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-300">Selected Time:</span>
                    <span className="font-mono text-lg font-semibold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">{istTime}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timezone Selection */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl shadow-2xl p-6 border border-white/10 relative overflow-visible dropdown-container">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full -translate-y-8 -translate-x-8"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl">{selectedTz?.flag}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Convert To</h2>
                <p className="text-sm text-purple-300 font-medium">{selectedTz?.offset}</p>
              </div>
            </div>

            {/* Custom Dropdown */}
            <div className="relative z-40">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 text-left bg-white/5 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 flex items-center justify-between transition-all hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{selectedTz?.flag}</span>
                  <div>
                    <div className="font-medium text-white">{selectedTz?.label}</div>
                    <div className="text-sm text-purple-300">{selectedTz?.region}</div>
                  </div>
                </div>
                <ChevronDown className={`text-purple-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} size={20} />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl max-h-80 overflow-hidden">
                  <div className="p-3 border-b border-white/10 bg-slate-900/50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search timezones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white/5 backdrop-blur-sm placeholder-purple-400 text-white"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {Object.entries(groupedTimezones).map(([region, tzList]) => (
                      <div key={region}>
                        <div className="px-3 py-2 text-xs font-bold text-purple-300 uppercase tracking-wide bg-slate-900/50 border-b border-white/10">
                          {region}
                        </div>
                        {tzList.map((tz) => (
                          <button
                            key={tz.value}
                            onClick={() => {
                              setSelectedTimezone(tz.value);
                              setIsDropdownOpen(false);
                              setSearchTerm('');
                            }}
                            className="w-full px-3 py-3 text-left hover:bg-white/10 flex items-center gap-3 transition-all border-b border-white/5 last:border-b-0"
                          >
                            <span className="text-lg">{tz.flag}</span>
                            <div className="flex-1">
                              <div className="font-medium text-white">{tz.label}</div>
                              <div className="text-xs text-purple-300">{tz.offset}</div>
                            </div>
                            {selectedTimezone === tz.value && (
                              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Converted Time Display */}
            {convertedTime && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-center">
                  <ArrowRight className="text-purple-400" size={24} />
                </div>
                <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-400/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="text-purple-400" size={16} />
                    <span className="text-sm font-medium text-purple-300">Converted Time</span>
                  </div>
                  <p className="text-lg font-semibold bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                    {convertedTime}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimezoneConverter;
                          