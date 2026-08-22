import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { Wallet, TrendingUp, Clock, DollarSign, Filter, Package, Calendar } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function OwnerEarnings() {
  const [payments, setPayments] = useState(null);
  const [stats, setStats] = useState(null);
  const [myEquipment, setMyEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    payment_status: '',
    date_from: '',
    date_to: '',
    equipment_id: '',
  });
  const toast = useToast();

  useEffect(() => {
    fetchStats();
    fetchMyEquipment();
  }, []);

  useEffect(() => {
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

  const fetchMyEquipment = async () => {
    try {
      const response = await api.get('/owner/equipments', { params: { all: true } });
      setMyEquipment(response.data);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    }
  };

  const fetchPayments = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/owner/payments', {
        params: { ...filters, page },
      });
      setPayments(response.data);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
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
      label: 'Total Earned', 
      value: formatCurrency(stats.total_earned), 
      icon: <DollarSign className="w-6 h-6" />, 
      color: 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/40',
      textColor: 'text-green-600 dark:text-green-400',
      description: 'All verified payments'
    },
    { 
      label: 'Pending Earnings', 
      value: formatCurrency(stats.pending_earnings), 
      icon: <Clock className="w-6 h-6" />, 
      color: 'bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/30 dark:to-amber-900/40',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      description: 'Awaiting verification'
    },
    { 
      label: 'This Month', 
      value: formatCurrency(stats.this_month_earnings), 
      icon: <TrendingUp className="w-6 h-6" />, 
      color: 'bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/30 dark:to-violet-900/40',
      textColor: 'text-purple-600 dark:text-purple-400',
      description: 'Verified this month'
    },
  ] : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Wallet className="w-7 h-7 text-green-600 dark:text-green-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Earnings</h1>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {statCards.map((card, index) => (
            <div key={index} className={`${card.color} rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`${card.textColor}`}>
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{card.value}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{card.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Earnings by Equipment */}
      {stats?.earnings_by_equipment && stats.earnings_by_equipment.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
            Earnings by Equipment
          </h2>
          <div className="space-y-3">
            {stats.earnings_by_equipment.map((item) => (
              <div key={item.equipment_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.equipment?.name || 'Unknown Equipment'}
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(item.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Earnings Chart */}
      {stats?.monthly_earnings && stats.monthly_earnings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            Monthly Earnings (Last 6 Months)
          </h2>
          <div className="space-y-2">
            {stats.monthly_earnings.map((item) => {
              const monthDate = new Date(item.month + '-01');
              const monthLabel = monthDate.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
              const maxTotal = Math.max(...stats.monthly_earnings.map(m => parseFloat(m.total)));
              const percentage = maxTotal > 0 ? (parseFloat(item.total) / maxTotal) * 100 : 0;
              
              return (
                <div key={item.month} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{monthLabel}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(item.total)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {[
          { label: 'All', value: '' },
          { label: 'Verified', value: 'verified' },
          { label: 'Paid', value: 'paid' },
          { label: 'Pending', value: 'pending' },
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <select
            value={filters.equipment_id}
            onChange={(e) => setFilters({ ...filters, equipment_id: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="">All Equipment</option>
            {myEquipment.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment History Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading payment history...</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Renter</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Equipment</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payments?.data?.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  payments?.data?.map((payment) => (
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
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right font-medium">
                        {formatCurrency(payment.total_cost)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(payment.payment_status)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {payment.payment_method || '—'}
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
    </div>
  );
}
