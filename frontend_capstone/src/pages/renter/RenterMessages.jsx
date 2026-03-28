import { useEffect, useState } from 'react';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { TableSkeleton } from '../../components/Skeleton';
import Pagination from '../../components/Pagination';
import { Archive } from 'lucide-react';
import { useToast } from '../../components/Toast';
import Tooltip from '../../components/Tooltip';

export default function RenterMessages() {
  const [messages, setMessages] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ name: '', contact_number: '', location: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const toast = useToast();

  const fetchMessages = (p = 1) => {
    setLoading(true);
    api.get('/renter/messages', { params: { page: p } })
      .then((r) => setMessages(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(page); }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback('');
    try {
      await api.post('/renter/messages', form);
      setFeedback('Your inquiry has been submitted.');
      setForm({ name: '', contact_number: '', location: '', message: '' });
      fetchMessages(1);
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Archive this message?')) return;
    try {
      await api.patch(`/renter/archived/messages/${id}`);
      toast.success('Message archived.');
      fetchMessages(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Us</h1>

      {feedback && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${feedback.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-6 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Send an Inquiry</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
              <input type="text" required value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input type="text" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
              <textarea rows="4" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200 resize-none" />
            </div>
            <button type="submit" disabled={submitting}
              className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium hover:from-green-700 hover:to-emerald-600 disabled:opacity-50">
              {submitting ? 'Sending...' : 'Send Inquiry'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors">
          <div className="px-6 py-4 border-b dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">My Inquiries</h2>
          </div>
          {loading ? (
            <TableSkeleton rows={4} cols={3} />
          ) : messages?.data?.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No inquiries yet.</div>
          ) : (
            <div className="divide-y dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {messages.data.map((m) => (
                <div key={m.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(m.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={m.status} />
                      <Tooltip text="Archive">
                        <button
                          onClick={() => handleArchive(m.id)}
                          className="p-1.5 text-amber-600 bg-amber-50 rounded hover:bg-amber-100 transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200">{m.message}</p>
                </div>
              ))}
            </div>
          )}
          <Pagination data={messages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
