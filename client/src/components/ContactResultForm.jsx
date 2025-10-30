import React, { useState, useEffect, useContext } from 'react';
import { BookOpen, Mail, User, Phone, MessageSquare, Eye, Filter, Calendar, CheckCircle, Clock, XCircle, UserX, X } from 'lucide-react';
import { AppContent } from "../context/Context";
import axios from 'axios';
import ReactDOM from 'react-dom';

function ContactInquiriesAdmin() {

  const { backend_url } = useContext(AppContent);

  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backend_url}/api/contactus/contact`);
      let data = res.data;
      if (data.success) {
        setInquiries(data.data);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock className="text-yellow-500" size={20} />;
      case 'contacted': return <Eye className="text-blue-500" size={20} />;
      case 'enrolled': return <CheckCircle className="text-green-500" size={20} />;
      case 'rejected': return <XCircle className="text-red-500" size={20} />;
      default: return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300';
      case 'contacted': return 'bg-blue-500/20 text-blue-300';
      case 'enrolled': return 'bg-green-500/20 text-green-300';
      case 'rejected': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const filteredInquiries = filter === 'all' 
    ? inquiries 
    : inquiries.filter(inq => inq.status === filter);

  const stats = {
    total: inquiries.length,
    pending: inquiries.filter(i => i.status === 'pending').length,
    contacted: inquiries.filter(i => i.status === 'contacted').length,
    enrolled: inquiries.filter(i => i.status === 'enrolled').length,
    rejected: inquiries.filter(i => i.status === 'rejected').length,
  };

  // Modal Component using Portal
  const Modal = ({ inquiry, onClose }) => {
    if (!inquiry) return null;

    return ReactDOM.createPortal(
      <div 
        className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Inquiry Details</h2>
              <button 
                onClick={onClose} 
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-8 pb-8 space-y-5">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <User className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-white/70 mb-1">Name</p>
                <p className="text-xl font-semibold text-white">{inquiry.name}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Mail className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-white/70 mb-1">Email</p>
                <p className="text-xl font-semibold text-white">{inquiry.email}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Phone className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-white/70 mb-1">Phone</p>
                <p className="text-xl font-semibold text-white">{inquiry.phone}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <BookOpen className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-white/70 mb-1">Course</p>
                <p className="text-xl font-semibold text-white">{inquiry.courseName}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <MessageSquare className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/70 mb-1">Message</p>
                <p className="text-white leading-relaxed">{inquiry.message || 'No message provided'}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Calendar className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-white/70 mb-1">Submitted On</p>
                <p className="text-white font-medium">{new Date(inquiry.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/20">
              <p className="text-sm text-white/70 mb-3">Status</p>
              <span className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium ${getStatusColor(inquiry.status)}`}>
                {getStatusIcon(inquiry.status)}
                {inquiry.status}
              </span>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">Course Inquiries Dashboard</h1>
          <p className="text-gray-400">Manage and track all course contact inquiries</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <Mail className="text-gray-400" size={32} />
            </div>
          </div>
          <div className="bg-yellow-500/10 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-200">{stats.pending}</p>
              </div>
              <Clock className="text-yellow-400" size={32} />
            </div>
          </div>
          <div className="bg-blue-500/10 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">Contacted</p>
                <p className="text-3xl font-bold text-blue-200">{stats.contacted}</p>
              </div>
              <Eye className="text-blue-400" size={32} />
            </div>
          </div>
          <div className="bg-green-500/10 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Enrolled</p>
                <p className="text-3xl font-bold text-green-200">{stats.enrolled}</p>
              </div>
              <CheckCircle className="text-green-400" size={32} />
            </div>
          </div>
          <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Rejected</p>
                <p className="text-3xl font-bold text-red-200">{stats.rejected}</p>
              </div>
              <XCircle className="text-red-400" size={32} />
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-4 mb-6 border border-white/10">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={20} className="text-gray-400" />
            <span className="text-gray-200 font-semibold mr-2">Filter:</span>
            {['all', 'pending', 'contacted', 'enrolled', 'rejected'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === status 
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg' 
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Inquiries List */}
        {loading ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center border border-white/10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center border border-white/10">
            <UserX size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-300 text-lg">No inquiries found</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Course</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredInquiries.map((inquiry) => (
                    <tr key={inquiry._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User size={16} className="text-gray-400 mr-2" />
                          <span className="font-medium text-white">{inquiry.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{inquiry.email}</td>
                      <td className="px-6 py-4 text-gray-300">{inquiry.phone}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <BookOpen size={16} className="text-purple-400 mr-2" />
                          <span className="font-medium text-white">{inquiry.courseName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                          {getStatusIcon(inquiry.status)}
                          {inquiry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1 text-gray-400" />
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedInquiry(inquiry)}
                          className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-medium text-sm px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-xl"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal using Portal */}
        <Modal inquiry={selectedInquiry} onClose={() => setSelectedInquiry(null)} />
      </div>
    </div>
  );
}

export default ContactInquiriesAdmin;