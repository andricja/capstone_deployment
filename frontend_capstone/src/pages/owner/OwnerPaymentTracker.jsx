import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { DollarSign, TrendingUp, Clock, CheckCircle, Eye, X, Edit2, Save, Banknote, ChevronLeft, ChevronRight } from 'lucide-react';

export default function OwnerPaymentTracker() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    payment_status: '',
    equipment_id: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const toast = useToast();

  useEffect(() => {
    fetchStats();
    fetchPayments();
  }, [filters]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/owner/payments/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/owner/payments', {
        params: { ...filters, all: 1 },
      });
      setPayments(Array.isArray(response.data) ? response.data : response.data?.data || []);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (payment) => {
    setEditModal(payment);
    setEditAmount(payment.paid_amount || 0);
    setEditNotes('');
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    if (!editModal) return;
    setSubmitting(true);
    try {
      await api.patch(`/owner/payments/${editModal.id}`, {
        paid_amount: parseFloat(editAmount),
        notes: editNotes,
      });
      toast.success('Payment amount updated successfully');
      setEditModal(null);
      fetchPayments();
      fetchStats();
      if (selectedPayment?.id === editModal.id) {
        setSelectedPayment(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update payment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pending' },
      paid: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Paid' },
      overdue: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Overdue' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getDownPayment = (payment) => {
    if (payment.payment_method === 'downpayment') {
      return payment.total_cost * 0.5; // 50% down payment
    }
    return payment.total_cost; // Full payment
  };

  // Pagination
  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayments = payments.slice(startIndex, endIndex);

  const statCards = stats ? [
    {
      label: 'Total Earned',
      value: formatCurrency(stats.total_earned),
      icon: <DollarSign className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/40',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Pending Payments',
      value: formatCurrency(stats.pending_earnings),
      icon: <Clock className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/40',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Paid This Month',
      value: formatCurrency(stats.this_month_earnings),
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/30 dark:to-violet-900/40',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-7 h-7 text-green-600 dark:text-green-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Tracker</h1>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {statCards.map((card, index) => (
            <div key={index} className={`${card.color} rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`${card.textColor}`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{card.value}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { label: 'All', value: '' },
          { label: 'Pending', value: 'pending' },
          { label: 'Paid', value: 'paid' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setFilters({ ...filters, payment_status: tab.value });
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              filters.payment_status === tab.value
                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border-green-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading payments...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
              </select>
              <span className="text-sm text-gray-600 dark:text-gray-400">entries per page</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {payments.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, payments.length)} of {payments.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Renter</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Equipment</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Cost</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount Paid</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Method</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-gray-900 dark:text-white font-medium">{payment.renter?.name}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{payment.renter?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {payment.equipment?.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right font-semibold">
                        {formatCurrency(payment.total_cost)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className="font-bold text-green-700 dark:text-green-400">
                          {formatCurrency(payment.paid_amount || 0)}
                        </span>
                        {payment.paid_amount && payment.total_cost && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ({((payment.paid_amount / payment.total_cost) * 100).toFixed(0)}%)
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.payment_method === 'downpayment'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {payment.payment_method === 'downpayment' ? 'Down Payment' : 'Full Payment'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(payment.payment_status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedPayment(payment)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded border border-blue-200"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(payment)}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded border border-green-200"
                            title="Edit Amount"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-green-600 text-white'
                          : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedPayment(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payment Details</h2>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Renter</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedPayment.renter?.name}</p>
                  <p className="text-xs text-gray-500">{selectedPayment.renter?.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Equipment</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedPayment.equipment?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Total Cost (Actual Price)</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(selectedPayment.total_cost)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Amount Paid by Renter</p>
                  <p className="text-lg font-bold text-green-700 dark:text-green-400">
                    {formatCurrency(selectedPayment.paid_amount || 0)}
                  </p>
                  {selectedPayment.paid_amount && selectedPayment.total_cost && (
                    <p className="text-xs text-gray-500">
                      {((selectedPayment.paid_amount / selectedPayment.total_cost) * 100).toFixed(0)}% of total
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Payment Method</p>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">
                    {selectedPayment.payment_method === 'downpayment' ? 'GCash Down Payment' : 'GCash Full Payment'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Payment Status</p>
                  {getStatusBadge(selectedPayment.payment_status)}
                </div>
              </div>

              {selectedPayment.payment_proof && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Payment Proof</p>
                  <img
                    src={`/storage/${selectedPayment.payment_proof}`}
                    alt="Payment Proof"
                    className="w-full max-h-96 object-contain rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                </div>
              )}

              {selectedPayment.payment_notes && (
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedPayment.payment_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Payment Modal */}
      {editModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setEditModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Payment Amount</h2>
              <button onClick={() => setEditModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdatePayment} className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                <p className="text-blue-900 dark:text-blue-200 font-medium mb-1">Current Payment Info:</p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  Equipment: <span className="font-semibold">{editModal.equipment?.name}</span>
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  Renter: <span className="font-semibold">{editModal.renter?.name}</span>
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  Total Cost: <span className="font-semibold">{formatCurrency(editModal.total_cost)}</span>
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  Current Paid: <span className="font-semibold">{formatCurrency(editModal.paid_amount || 0)}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Banknote className="inline w-4 h-4 mr-1 -mt-0.5" />
                  Amount Paid by Renter
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Enter amount paid"
                />
                {editAmount && editModal.total_cost && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {parseFloat(editAmount) >= parseFloat(editModal.total_cost) ? (
                      <span className="text-green-600 font-semibold">✓ Fully paid - will move to "Paid" tab</span>
                    ) : (
                      <>
                        Remaining: <span className="font-semibold">{formatCurrency(parseFloat(editModal.total_cost) - parseFloat(editAmount))}</span>
                        {' '}({((parseFloat(editAmount) / parseFloat(editModal.total_cost)) * 100).toFixed(0)}% paid)
                      </>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Change (optional)
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g., Additional service charge, discount applied..."
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
