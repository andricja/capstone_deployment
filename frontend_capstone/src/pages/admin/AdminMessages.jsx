import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { TableSkeleton } from '../../components/Skeleton';
import DataTable from '../../components/DataTable';
import { Trash2, MessageSquare, Eye, X, Archive, CheckCircle, Send } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmModal from '../../components/ConfirmModal';
import Tooltip from '../../components/Tooltip';

export default function AdminMessages() {
  const [data, setData] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { confirm, isOpen, config, handleConfirm, handleClose } = useConfirm();
  const [selected, setSelected] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchMessages = (f = filter) => {
    setLoading(true);
    const params = { all: 1 };
    if (f) params.status = f;
    api.get('/admin/messages', { params })
      .then((r) => setData(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(filter); }, [filter]);

  const updateStatus = async (id, status, e) => {
    e?.stopPropagation();
    try {
      await api.patch(`/admin/messages/${id}/status`, { status });
      toast.success('Status updated.');
      fetchMessages(filter);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    const confirmed = await confirm({
      title: 'Delete Message',
      message: 'Delete this message?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/admin/messages/${id}`);
      toast.success('Message deleted.');
      fetchMessages(filter);
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleArchive = async (id, e) => {
    e?.stopPropagation();
    const confirmed = await confirm({
      title: 'Archive Message',
      message: 'Archive this message?',
      confirmText: 'Archive',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;
    
    try {
      await api.patch(`/admin/archived/messages/${id}`);
      toast.success('Message archived.');
      fetchMessages(filter);
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
      const res = await api.post(`/admin/messages/${selected.id}/reply`, {
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
      fetchMessages(filter);
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

  const columns = [
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => <span className="text-gray-500 dark:text-gray-400 text-xs">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => <span className="font-medium text-gray-900 dark:text-white">{row.name}</span>,
    },
    {
      key: 'renter.email',
      label: 'Email',
      render: (row) => <span className="text-gray-500 dark:text-gray-400">{row.renter?.email}</span>,
    },
    {
      key: 'contact_number',
      label: 'Contact',
      render: (row) => <span className="text-gray-500 dark:text-gray-400">{row.contact_number}</span>,
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => <span className="text-gray-500 dark:text-gray-400 text-xs">{row.location}</span>,
    },
    {
      key: 'message',
      label: 'Message',
      render: (row) => <p className="text-gray-600 dark:text-gray-400 text-xs truncate max-w-[200px]">{row.message}</p>,
      sortable: false,
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: '_action',
      label: 'Action',
      align: 'center',
      sortable: false,
      render: (row) => (
        <div className="inline-grid grid-cols-3 gap-1.5 mx-auto">
          <div className="flex items-center justify-center">
            {row.status === 'pending' && (
              <Tooltip text="Mark Reviewed">
                <button onClick={(e) => updateStatus(row.id, 'reviewed', e)}
                  className="p-1.5 text-purple-600 hover:bg-purple-50 rounded border border-purple-200">
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
            {row.status === 'reviewed' && (
              <Tooltip text="Mark Responded">
                <button onClick={(e) => updateStatus(row.id, 'responded', e)}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded border border-green-200">
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
          </div>
          <div className="flex items-center justify-center">
            <Tooltip text="Delete">
              <button onClick={(e) => handleDelete(row.id, e)}
                className="text-red-500 hover:bg-red-50 p-1.5 rounded border border-red-200">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
          <div className="flex items-center justify-center">
            <Tooltip text="Archive">
              <button onClick={(e) => handleArchive(row.id, e)}
                className="text-amber-600 hover:bg-amber-50 p-1.5 rounded border border-amber-200">
                <Archive className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Message Requests</h1>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { label: 'All', value: '' },
          { label: 'Pending', value: 'pending' },
          { label: 'Reviewed', value: 'reviewed' },
          { label: 'Responded', value: 'responded' },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              filter === btn.value
                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border-green-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          onRowClick={(row) => setSelected(row)}
          searchKeys={['name', 'renter.email', 'contact_number', 'location', 'message', 'status']}
          defaultSort={{ key: 'created_at', dir: 'desc' }}
          emptyMessage="No messages found."
        />
      )}

      {/* ── Detail Modal with Conversation ── */}
      {selected && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selected.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selected.renter?.email} • {selected.contact_number}</p>
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
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{selected.name}</span>
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
                      const isAdmin = reply.sender_type === 'admin';
                      return (
                        <div key={reply.id} className={`flex items-start gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${
                            isAdmin ? 'bg-green-600' : 'bg-blue-500'
                          }`}>
                            {reply.user?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className={`flex items-center gap-2 mb-1 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {reply.user?.name}{isAdmin && ' (Admin)'}
                              </span>
                              <span className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleString()}</span>
                            </div>
                            <div className={`${
                              isAdmin 
                                ? 'bg-green-50 dark:bg-green-900/20 rounded-lg rounded-tr-none' 
                                : 'bg-blue-50 dark:bg-blue-900/20 rounded-lg rounded-tl-none'
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
                    <p className="text-sm text-gray-400">No replies yet. Start the conversation!</p>
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
                  <div className="flex items-center gap-1.5">
                    {selected.status === 'pending' && (
                      <Tooltip text="Mark Reviewed">
                        <button 
                          type="button"
                          onClick={(e) => { updateStatus(selected.id, 'reviewed', e); setSelected((s) => ({ ...s, status: 'reviewed' })); }}
                          className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    )}
                    {selected.status === 'reviewed' && (
                      <Tooltip text="Mark Responded">
                        <button 
                          type="button"
                          onClick={(e) => { updateStatus(selected.id, 'responded', e); setSelected((s) => ({ ...s, status: 'responded' })); }}
                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    )}
                    <Tooltip text="Delete">
                      <button 
                        type="button"
                        onClick={(e) => handleDelete(selected.id, e)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Tooltip>
                    <Tooltip text="Archive">
                      <button 
                        type="button"
                        onClick={(e) => handleArchive(selected.id, e)}
                        className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                        <Archive className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  </div>
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
