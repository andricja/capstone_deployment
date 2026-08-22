import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Eye, Filter, Search, X, FileText } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function PaymentTracker() {
  const [payments, setPayments] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verifyModal, setVerifyModal] = useState(null);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [filters, setFilters] = useState({
    payment_status: '',
    date_from: '',
    date_to: '',
    search: '',
  });
  const toast = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [filters]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/payments/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/payments', {
        params: { ...filters, page },
      });
      setPayments(response.data);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const openVerifyModal = (payment) => {
    setVerifyModal(payment);
    setPaymentNotes('');
  };

  const handleVerifyPayment = async () => {
    if (!verifyModal) return;
    try {
      await api.patch(`/admin/payments/${verifyModal.id}/verify`, {
        payment_notes: paymentNotes,
      });
      toast.success('Payment verified successfully');
      setVerifyModal(null);
      fetchPayments();
      fetchStats();
      if (selectedPayment?.id === verifyModal.id) {
        setSelectedPayment(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify payment');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/payments/${id}/status`, {
        payment_status: status,
      });
      toast.success(`Payment marked as ${status}`);
      fetchPayments();
      fetchStats();
      if (selectedPayment?.id === id) {
        setSelectedPayment(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
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
      paid: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Paid' },
      verified: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Verified' },
      overdue: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Overdue' },
      refunded: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Refunded' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const statCards = stats ? [
    { 
      label: 'Total Revenue', 
      value: formatCurrency(stats.total_revenue), 
      icon: <DollarSign className="w-6 h-6" />, 
      color: 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/40',
      textColor: 'text-green-600 dark:text-green-400',
    },
    { 
      label: 'Pending Verification', 
      value: formatCurrency(stats.pending_amount), 
      count: stats.paid_count,
      icon: <Clock className="w-6 h-6" />, 
      color: 'bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/40',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    { 
      label: 'Verified This Month', 
      value: formatCurrency(stats.verified_this_month), 
      icon: <CheckCircle className="w-6 h-6" />, 
      color: 'bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/30 dark:to-violet-900/40',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    { 
      label: 'Overdue Payments', 
      value: formatCurrency(stats.overdue_amount), 
      count: stats.overdue_count,
      icon: <AlertCircle className="w-6 h-6" />, 
      color: 'bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/30 dark:to-rose-900/40',
      textColor: 'text-red-600 dark:text-red-400',
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card, index) => (
            <div key={index} className={`${card.color} rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className={`${card.textColor}`}>
                  {card.icon}
                </div>
                {card.count !== undefined && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{card.count} items</span>
                )}
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
          { label: 'Verified', value: 'verified' },
          { label: 'Overdue', value: 'overdue' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilters({ ...filters, payment_status: tab.value })}
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

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="From Date"
          />
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="To Date"
          />
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search renter or equipment..."
              className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading payments...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Renter</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Equipment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Owner</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payments?.data?.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  payments?.data?.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setSelectedPayment(payment)}>
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
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {payment.equipment?.owner?.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right font-medium">
                        {formatCurrency(payment.total_cost)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(payment.payment_status)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {payment.payment_proof && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedPayment(payment); }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded border border-blue-200"
                              title="View Proof"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {payment.payment_status === 'paid' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); openVerifyModal(payment); }}
                              className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded border border-green-200 font-medium"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {payments && payments.data && payments.data.length > 0 && <Pagination data={payments} onPageChange={fetchPayments} />}
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
                  <p className="text-xs text-gray-500">Owner: {selectedPayment.equipment?.owner?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Total Cost</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(selectedPayment.total_cost)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Payment Status</p>
                  {getStatusBadge(selectedPayment.payment_status)}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Payment Method</p>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">{selectedPayment.payment_method || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Paid At</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedPayment.paid_at ? formatDate(selectedPayment.paid_at) : '—'}</p>
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
                  <p className="text-sm text-gray-700 dark:text-gray-300">{selectedPayment.payment_notes}</p>
                </div>
              )}

              {selectedPayment.payment_verified_at && (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <p className="text-xs font-semibold uppercase text-green-600 dark:text-green-400 mb-1">Verified</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Verified on {formatDate(selectedPayment.payment_verified_at)} by {selectedPayment.payment_verifier?.name}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t dark:border-gray-700">
                {selectedPayment.payment_status === 'paid' && (
                  <button
                    onClick={() => { setSelectedPayment(null); openVerifyModal(selectedPayment); }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                  >
                    Verify Payment
                  </button>
                )}
                {selectedPayment.payment_status !== 'verified' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedPayment.id, 'overdue')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    Mark as Overdue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Verify Payment Modal */}
      {verifyModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setVerifyModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verify Payment</h2>
              <button onClick={() => setVerifyModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verifying payment of <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(verifyModal.total_cost)}</span> from <span className="font-semibold">{verifyModal.renter?.name}</span>.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any notes about this payment..."
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setVerifyModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyPayment}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Verify Payment
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
