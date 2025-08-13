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
    { value: 'America/Toronto', label: 'Toronto', region: 'North America', offset: 'UTC-5/-4', flag: '🇨🇦' },
    { value: 'America/Vancouver', label: 'Vancouver', region: 'North America', offset: 'UTC-8/-7', flag: '🇨🇦' },
    
    // Europe
    { value: 'Europe/London', label: 'London', region: 'Europe', offset: 'UTC+0/+1', flag: '🇬🇧' },
    { value: 'Europe/Paris', label: 'Paris', region: 'Europe', offset: 'UTC+1/+2', flag: '🇫🇷' },
    { value: 'Europe/Berlin', label: 'Berlin', region: 'Europe', offset: 'UTC+1/+2', flag: '🇩🇪' },
    { value: 'Europe/Rome', label: 'Rome', region: 'Europe', offset: 'UTC+1/+2', flag: '🇮🇹' },
    { value: 'Europe/Madrid', label: 'Madrid', region: 'Europe', offset: 'UTC+1/+2', flag: '🇪🇸' },
    { value: 'Europe/Amsterdam', label: 'Amsterdam', region: 'Europe', offset: 'UTC+1/+2', flag: '🇳🇱' },
    
    // Asia Pacific
    { value: 'Asia/Tokyo', label: 'Tokyo', region: 'Asia Pacific', offset: 'UTC+9', flag: '🇯🇵' },
    { value: 'Asia/Shanghai', label: 'Shanghai', region: 'Asia Pacific', offset: 'UTC+8', flag: '🇨🇳' },
    { value: 'Asia/Singapore', label: 'Singapore', region: 'Asia Pacific', offset: 'UTC+8', flag: '🇸🇬' },
    { value: 'Asia/Hong_Kong', label: 'Hong Kong', region: 'Asia Pacific', offset: 'UTC+8', flag: '🇭🇰' },
    { value: 'Asia/Seoul', label: 'Seoul', region: 'Asia Pacific', offset: 'UTC+9', flag: '🇰🇷' },
    { value: 'Australia/Sydney', label: 'Sydney', region: 'Asia Pacific', offset: 'UTC+10/+11', flag: '🇦🇺' },
    { value: 'Australia/Melbourne', label: 'Melbourne', region: 'Asia Pacific', offset: 'UTC+10/+11', flag: '🇦🇺' },
    
    // Middle East & Africa
    { value: 'Asia/Dubai', label: 'Dubai', region: 'Middle East', offset: 'UTC+4', flag: '🇦🇪' },
    { value: 'Africa/Cairo', label: 'Cairo', region: 'Africa', offset: 'UTC+2', flag: '🇪🇬' },
    { value: 'Africa/Johannesburg', label: 'Johannesburg', region: 'Africa', offset: 'UTC+2', flag: '🇿🇦' },
    
    // Others
    { value: 'UTC', label: 'UTC', region: 'Universal', offset: 'UTC+0', flag: '🌍' },
    { value: 'Pacific/Auckland', label: 'Auckland', region: 'Pacific', offset: 'UTC+12/+13', flag: '🇳🇿' },
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
      
      const options = {
        timeZone: selectedTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      };
      
      const converted = utcTime.toLocaleString('en-US', options);
      
      // Split the formatted string to separate time and date
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

  const getCurrentISTTime = () => {
    const now = new Date();
    const istTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setIstTime(timeString);
    
    // Update UI inputs
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4 shadow-lg">
            <Globe className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            IST Timezone Converter
          </h1>
          <p className="text-gray-600 text-lg">Convert Indian Standard Time to any timezone worldwide</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 relative">
          {/* IST Input Section with Clock */}
          <div className="bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-200 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full -translate-y-8 translate-x-8 opacity-50"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl">🇮🇳</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Indian Standard Time</h2>
                <p className="text-sm text-purple-600 font-medium">UTC +05:30</p>
              </div>
            </div>

            {/* Analog Clock Display */}
            {istTime && (
              <div className="flex justify-center mb-6">
                <div className="relative w-32 h-32">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 shadow-xl flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-white to-purple-50 flex items-center justify-center">
                      <div className="relative w-24 h-24">
                        {/* Clock face */}
                        <div className="absolute inset-0 rounded-full border-2 border-purple-200"></div>
                        
                        {/* Hour markers */}
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
                        
                        {/* Clock hands */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          {/* Hour hand */}
                          <div
                            className="absolute w-0.5 h-6 bg-purple-600 rounded-full origin-bottom"
                            style={{
                              transform: `rotate(${((parseInt(istTime.split(':')[0]) % 12) * 30) + (parseInt(istTime.split(':')[1]) * 0.5) - 90}deg)`
                            }}
                          />
                          {/* Minute hand */}
                          <div
                            className="absolute w-0.5 h-8 bg-blue-600 rounded-full origin-bottom"
                            style={{
                              transform: `rotate(${(parseInt(istTime.split(':')[1]) * 6) - 90}deg)`
                            }}
                          />
                          {/* Center dot */}
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Time Input */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hours</label>
                  <select
                    value={timeInput.hours}
                    onChange={(e) => handleTimeInputChange('hours', e.target.value)}
                    className="w-full text-gray-700 px-3 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 transition-all duration-200"
                  >
                    <option value="" className="bg-gradient-to-r from-white to-purple-100 text-gray-700">HH</option>
                    {Array.from({length: 12}, (_, i) => i + 1).map(hour => (
                      <option key={hour} value={hour} className="bg-gradient-to-r from-white  to-purple-100 text-gray-700">{hour.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minutes</label>
                  <select
                    value={timeInput.minutes}
                    onChange={(e) => handleTimeInputChange('minutes', e.target.value)}
                    className="w-full px-3 text-gray-700 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 transition-all duration-200"
                  >
                    <option value="" className="bg-gradient-to-r from-white to-purple-100 text-gray-700">MM</option>
                    {Array.from({length: 60}, (_, i) => i).map(minute => (
                      <option key={minute} value={minute.toString().padStart(2, '0')} className="bg-gradient-to-r from-white to-purple-100 text-gray-700">
                        {minute.toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AM/PM</label>
                  <select
                    value={timeInput.period}
                    onChange={(e) => handleTimeInputChange('period', e.target.value)}
                    className="w-full px-3 text-gray-700 py-3 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 transition-all duration-200"
                  >
                    <option value="AM" className="bg-gradient-to-r from-white to-purple-100 text-gray-700">AM</option>
                    <option value="PM" className="bg-gradient-to-r from-white to-purple-100 text-gray-700">PM</option>
                  </select>
                </div>
              </div>

              <button
                onClick={getCurrentISTTime}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg transform hover:scale-105"
              >
                <Clock size={18} />
                Use Current IST Time
              </button>

              {istTime && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">Selected Time:</span>
                    <span className="font-mono text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{istTime}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timezone Selection with Enhanced UI */}
          <div className="bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-200 relative overflow-visible">
            {/* Background Gradient */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-8 -translate-x-8 opacity-50"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl">{selectedTz?.flag}</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Convert To</h2>
                <p className="text-sm text-purple-600 font-medium">{selectedTz?.offset}</p>
              </div>
            </div>

            {/* Custom Dropdown */}
            <div className="relative z-40">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 text-left bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 flex items-center justify-between transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{selectedTz?.flag}</span>
                  <div>
                    <div className="font-medium text-gray-800">{selectedTz?.label}</div>
                    <div className="text-sm text-purple-600">{selectedTz?.region}</div>
                  </div>
                </div>
                <ChevronDown className={`text-purple-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} size={20} />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-gradient-to-r from-white to-purple-50 border border-purple-200 rounded-lg shadow-2xl max-h-80 overflow-hidden backdrop-blur-sm">
                  <div className="p-3 border-b border-purple-200 bg-gradient-to-r from-white to-purple-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500" size={16} />
                      <input
                        type="text"
                        placeholder="Search timezones..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/90 backdrop-blur-sm placeholder-purple-400 text-black"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto bg-gradient-to-b from-white/95 to-purple-50/95 backdrop-blur-sm">
                    {Object.entries(groupedTimezones).map(([region, tzList]) => (
                      <div key={region}>
                        <div className="px-3 py-2 text-xs font-bold text-black uppercase tracking-wide bg-gradient-to-r from-white to-purple-100 border-b border-purple-200/50">
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
                            className="w-full px-3 py-3 text-left bg-gradient-to-r from-white to-purple-50 hover:from-white hover:to-purple-100 flex items-center gap-3 transition-all duration-200 border-b border-purple-100/50 last:border-b-0"
                          >
                            <span className="text-lg">{tz.flag}</span>
                            <div className="flex-1">
                              <div className="font-medium text-black">{tz.label}</div>
                              <div className="text-sm text-gray-700">{tz.offset}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Result Section */}
        <div className="mt-8">
          <div className="bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-purple-200 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full -translate-y-32 translate-x-32 opacity-30"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full translate-y-24 -translate-x-24 opacity-30"></div>
            
            <div className="text-center relative z-10">
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-100 to-orange-200 px-4 py-2 rounded-full border border-orange-200">
                  <div className="text-2xl">🇮🇳</div>
                  <span className="text-sm font-medium text-orange-800">IST</span>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-full">
                  <ArrowRight className="text-white" size={24} />
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-200 px-4 py-2 rounded-full border border-green-200">
                  <div className="text-2xl">{selectedTz?.flag}</div>
                  <span className="text-sm font-medium text-green-800">{selectedTz?.region}</span>
                </div>
              </div>
              
              {error ? (
                <div className="text-red-600 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border border-red-200">
                  <p className="font-medium text-lg">{error}</p>
                </div>
              ) : convertedTime ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent text-4xl font-bold mb-4">
                    {convertedTime.split(', ').slice(-1)[0]}
                  </div>
                  <div className="text-xl text-purple-700 mb-4">
                    {convertedTime.split(', ').slice(0, -1).join(', ')}
                  </div>
                  <div className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 px-6 py-3 rounded-full border border-purple-200">
                    <Calendar size={18} />
                    <span className="font-medium">{selectedTz?.label} • {selectedTz?.offset}</span>
                  </div>
                </div>
              ) : (
                <div className="text-purple-600 py-12">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                    <Clock size={32} className="text-white" />
                  </div>
                  <p className="text-xl">Select a time in IST to see the conversion</p>
                  <p className="text-sm mt-2 text-purple-400">Choose hours, minutes, and AM/PM above</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-purple-600">
          <p>Automatically accounts for daylight saving time changes</p>
        </div>
      </div>
    </div>
  );
};

export default TimezoneConverter;