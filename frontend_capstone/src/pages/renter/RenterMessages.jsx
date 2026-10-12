import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { TableSkeleton } from '../../components/Skeleton';
import Pagination from '../../components/Pagination';
import { Archive, MessageSquare, Send, X } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmModal from '../../components/ConfirmModal';
import Tooltip from '../../components/Tooltip';

export default function RenterMessages() {
  const [messages, setMessages] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef(null);

  const [form, setForm] = useState({ name: '', contact_number: '', location: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const toast = useToast();
  const { confirm, isOpen, config, handleConfirm, handleClose } = useConfirm();

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
    const confirmed = await confirm({
      title: 'Archive Message',
      message: 'Archive this message?',
      confirmText: 'Archive',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;
    
    try {
      await api.patch(`/renter/archived/messages/${id}`);
      toast.success('Message archived.');
      fetchMessages(page);
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive.');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error('Please enter a message.');
      return;
    }

    setSendingReply(true);
    try {
      const res = await api.post(`/renter/messages/${selected.id}/reply`, {
        message: replyMessage,
      });
      
      toast.success('Reply sent successfully.');
      
      // Add the new reply to the selected message
      setSelected(prev => ({
        ...prev,
        replies: [...(prev.replies || []), res.data.reply]
      }));
      
      // Clear the input
      setReplyMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      // Refresh the messages list
      fetchMessages(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  // Scroll to bottom when conversation opens or new message arrives
  useEffect(() => {
    if (selected && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selected?.replies?.length]);

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
                <div key={m.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer" onClick={() => setSelected(m)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(m.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={m.status} />
                      {m.replies && m.replies.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                          {m.replies.length} {m.replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                      )}
                      <Tooltip text="Archive">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleArchive(m.id); }}
                          className="p-1.5 text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{m.message}</p>
                  {m.status === 'responded' && (
                    <button 
                      onClick={() => setSelected(m)}
                      className="mt-2 text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      View conversation
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <Pagination data={messages} onPageChange={setPage} />
        </div>
      </div>

      {/* ── Conversation Modal ── */}
      {selected && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Inquiry</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sent on {new Date(selected.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Area - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Original Message */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <StatusBadge status={selected.status} />
                  <span className="text-xs text-gray-400">{new Date(selected.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Location</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selected.location}</p>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4">
                <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Conversation</p>
                
                {/* Initial Message from Renter */}
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {selected.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{selected.name} (You)</span>
                        <span className="text-xs text-gray-400">{new Date(selected.created_at).toLocaleString()}</span>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 text-gray-800 dark:text-gray-200 rounded-lg rounded-tl-none px-4 py-2">
                        <p className="text-sm whitespace-pre-wrap">{selected.message}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {selected.replies && selected.replies.length > 0 && (
                  <div className="space-y-4">
                    {selected.replies.map((reply) => {
                      const isRenter = reply.sender_type === 'renter';
                      return (
                        <div key={reply.id} className={`flex items-start gap-3 ${isRenter ? '' : 'flex-row-reverse'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
                            isRenter ? 'bg-blue-500' : 'bg-green-600'
                          }`}>
                            {reply.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className={`flex items-center gap-2 mb-1 ${isRenter ? '' : 'flex-row-reverse'}`}>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {isRenter ? `${reply.user?.name} (You)` : `${reply.user?.name} (Admin)`}
                              </span>
                              <span className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleString()}</span>
                            </div>
                            <div className={`${
                              isRenter 
                                ? 'bg-blue-50 dark:bg-blue-900/20 rounded-lg rounded-tl-none' 
                                : 'bg-green-50 dark:bg-green-900/20 rounded-lg rounded-tr-none'
                            } text-gray-800 dark:text-gray-200 px-4 py-2`}>
                              <p className="text-sm whitespace-pre-wrap">{reply.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty state for no replies */}
                {(!selected.replies || selected.replies.length === 0) && (
                  <div className="text-center py-6">
                    <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No replies yet. The admin will respond soon!</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Reply Input Area - Fixed at bottom */}
            <div className="border-t dark:border-gray-700 p-4 flex-shrink-0">
              <form onSubmit={handleSendReply} className="space-y-3">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-gray-200"
                  rows="3"
                  disabled={sendingReply}
                />
                <div className="flex items-center justify-between gap-2">
                  <Tooltip text="Archive">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleArchive(selected.id); }}
                      className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                      <Archive className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <button
                    type="submit"
                    disabled={sendingReply || !replyMessage.trim()}
                    className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {sendingReply ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        danger={config.danger}
      />
    </div>
  );
}
