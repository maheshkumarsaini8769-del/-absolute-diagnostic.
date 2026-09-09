'use client';

import { useState, useEffect } from 'react';

interface PrescriptionLead {
  _id: string;
  patientName: string;
  patientPhone: string;
  patientAddress?: string;
  notes?: string;
  fileData?: string;
  fileName?: string;
  mimeType?: string;
  status: 'pending' | 'contacted' | 'converted' | 'cancelled';
  adminNotes?: string;
  createdAt: string;
}

export default function AdminPrescriptionsPage() {
  const [leads, setLeads] = useState<PrescriptionLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState<PrescriptionLead | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/prescriptions/upload');
      const data = await res.json();
      if (res.ok) {
        setLeads(data.leads || []);
      } else {
        setError(data.error || 'Failed to load prescriptions');
      }
    } catch {
      setError('Network error loading prescriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/prescriptions/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l._id === id ? { ...l, status: newStatus as any } : l))
        );
        if (selectedLead && selectedLead._id === id) {
          setSelectedLead((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        }
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleUpdateNotes = async (id: string, adminNotes: string) => {
    try {
      const res = await fetch('/api/prescriptions/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, adminNotes }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l._id === id ? { ...l, adminNotes } : l))
        );
      }
    } catch (err) {
      console.error('Update notes error:', err);
    }
  };

  const filteredLeads = leads.filter((l) => {
    if (statusFilter === 'all') return true;
    return l.status === statusFilter;
  });

  const pendingCount = leads.filter((l) => l.status === 'pending').length;
  const convertedCount = leads.filter((l) => l.status === 'converted').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Prescription Leads & Doctor Slips
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review prescriptions uploaded by patients, call back, and convert into bookings
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2">
          {['all', 'pending', 'contacted', 'converted'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {st === 'all' ? 'All Slips' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Uploads</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{leads.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-sm">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Pending Callback</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Converted Bookings</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{convertedCount}</p>
        </div>
      </div>

      {/* Prescription Leads Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading prescriptions...</div>
        ) : error ? (
          <div className="p-12 text-center text-sm text-red-500">{error}</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center">
            <span className="text-4xl block mb-2">📋</span>
            <p className="text-base font-semibold text-gray-800">No prescription uploads found</p>
            <p className="text-xs text-gray-500 mt-1">Prescriptions submitted by patients will appear here in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Uploaded</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Address</th>
                  <th className="px-5 py-3.5">Slip Photo</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Quick Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-gray-900">{lead.patientName}</p>
                      <p className="text-xs text-gray-600 font-mono mt-0.5">+91 {lead.patientPhone}</p>
                      {lead.notes && (
                        <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-0.5 mt-1 inline-block">
                          Note: {lead.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600 max-w-xs truncate">
                      {lead.patientAddress || 'Not specified'}
                    </td>
                    <td className="px-5 py-4">
                      {lead.fileData ? (
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="group relative block w-14 h-14 rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:border-blue-500 transition"
                        >
                          <img
                            src={lead.fileData}
                            alt="Prescription preview"
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-200"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[9px] text-white font-bold">
                            View
                          </div>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleUpdateStatus(lead._id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none ${
                          lead.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : lead.status === 'contacted'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : lead.status === 'converted'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted to Booking</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`tel:+91${lead.patientPhone}`}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition"
                        >
                          📞 Call
                        </a>
                        <a
                          href={`https://wa.me/91${lead.patientPhone}?text=${encodeURIComponent(`Hello ${lead.patientName}, we received your prescription upload at Absolute Diagnostic. How can we assist you with test booking?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition"
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slip Preview Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Prescription: {selectedLead.patientName}
                </h3>
                <p className="text-xs text-gray-500 font-mono">+91 {selectedLead.patientPhone}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center">
              {selectedLead.fileData ? (
                <img
                  src={selectedLead.fileData}
                  alt="Doctor Prescription"
                  className="max-h-[60vh] max-w-full rounded-lg shadow object-contain"
                />
              ) : (
                <p className="text-gray-400 text-sm">No photo available</p>
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-600">Status:</span>
                <select
                  value={selectedLead.status}
                  onChange={(e) => handleUpdateStatus(selectedLead._id, e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-gray-300"
                >
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted to Booking</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:+91${selectedLead.patientPhone}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                >
                  Call Now
                </a>
                <a
                  href={`https://wa.me/91${selectedLead.patientPhone}?text=${encodeURIComponent(`Hello ${selectedLead.patientName}, we reviewed your prescription at Absolute Diagnostic. Let us know when you would like your sample collected.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  Chat on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
