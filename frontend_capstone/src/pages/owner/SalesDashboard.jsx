import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { TrendingUp, DollarSign, ShoppingCart, Award, Package, Calendar, Wallet, Clock, Filter, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Pagination from '../../components/Pagination';

export default function SalesDashboard() {
  const toast = useToast();
  
  // Tab state
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'earnings'

  // Sales Dashboard state
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [equipmentPerformance, setEquipmentPerformance] = useState([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState([]);

  // Earnings tab state
  const [payments, setPayments] = useState(null);
  const [stats, setStats] = useState(null);
  const [myEquipment, setMyEquipment] = useState([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [filters, setFilters] = useState({
    payment_status: '',
    date_from: '',
    date_to: '',
    equipment_id: '',
  });

  // Fetch sales dashboard data
  const fetchDashboard = () => {
    setLoading(true);
    api
      .get('/owner/sales/dashboard')
      .then((res) => {
        setMetrics(res.data.metrics);
        setEquipmentPerformance(res.data.equipment_performance || []);
        setMonthlyEarnings(res.data.monthly_earnings || []);
      })
      .catch((err) => {
        console.error('Error fetching sales dashboard:', err);
      })
      .finally(() => setLoading(false));
  };

  // Fetch earnings stats
  const fetchStats = async () => {
    try {
      const response = await api.get('/owner/payments/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Fetch equipment list for earnings filter
  const fetchMyEquipment = async () => {
    try {
      const response = await api.get('/owner/equipments', { params: { all: true } });
      setMyEquipment(response.data);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    }
  };

  // Fetch payment history
  const fetchPayments = async (page = 1) => {
    setEarningsLoading(true);
    try {
      const response = await api.get('/owner/payments', {
        params: { ...filters, page },
      });
      setPayments(response.data);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setEarningsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
    } else if (activeTab === 'earnings') {
      fetchStats();
      fetchMyEquipment();
      fetchPayments();
    }
  }, [activeTab]);

  // Reload payments when filters change
  useEffect(() => {
    if (activeTab === 'earnings' && payments !== null) {
      fetchPayments();
    }
  }, [filters]);

  const formatCurrency = (value) => {
    return '₱' + parseFloat(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatMonthLabel = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-7 h-7 text-green-600 dark:text-green-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales & Earnings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track your performance, revenue, and payment history</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Sales Dashboard
          </button>
          <button
            onClick={() => setActiveTab('earnings')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'earnings'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Wallet className="w-4 h-4" />
            My Earnings
          </button>
        </div>
      </div>

      {/* Sales Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <>
              {/* Performance Cards */}
              {metrics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 border-l-4 border-l-green-500 p-5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Earnings</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(metrics.total_earnings)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/40 p-3 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 border-l-4 border-l-blue-500 p-5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Bookings</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.total_bookings}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Approved rentals</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/40 p-3 rounded-lg">
                        <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-amber-200 dark:border-amber-700 border-l-4 border-l-amber-500 p-5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Booking Value</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(metrics.avg_booking_value)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per rental</p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-900/30 dark:to-yellow-900/40 p-3 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-purple-200 dark:border-purple-700 border-l-4 border-l-purple-500 p-5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Best Equipment</p>
                        {metrics.best_equipment ? (
                          <>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 truncate" title={metrics.best_equipment.name}>
                              {metrics.best_equipment.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatCurrency(metrics.best_equipment.revenue)} • {metrics.best_equipment.bookings} bookings
                            </p>
                          </>
                        ) : (
                          <p className="text-lg text-gray-400 dark:text-gray-500">No data yet</p>
                        )}
                      </div>
                      <div className="bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/30 dark:to-pink-900/40 p-3 rounded-lg">
                        <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Earnings Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Earnings Trend (Last 6 Months)</h2>
                </div>
                {monthlyEarnings.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyEarnings}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis
                        dataKey="month"
                        tickFormatter={formatMonthLabel}
                        stroke="#6B7280"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                        labelFormatter={formatMonthLabel}
                        formatter={(value, name) => {
                          if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                          return [value, 'Bookings'];
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="bookings"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Bookings"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">No earnings data available yet</p>
                )}
              </div>

              {/* Equipment Performance Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Equipment Performance Comparison</h2>
                {equipmentPerformance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Equipment</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Status</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Bookings</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Revenue</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Rate/Hectare</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipmentPerformance.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {item.image_path ? (
                                  <img src={`/storage/${item.image_path}`} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{item.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                  item.status === 'available'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : item.status === 'maintenance'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{item.rental_requests_count || 0}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                {formatCurrency(item.total_revenue || 0)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.price_per_hectare)}/ha</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">No equipment added yet</p>
                )}
              </div>

              {/* Insights Section */}
              {metrics && equipmentPerformance.length > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-6 transition-colors">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">💡 Quick Insights</h2>
                  <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    {metrics.best_equipment && (
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                        <span>
                          Your <strong>{metrics.best_equipment.name}</strong> is your top performer with {formatCurrency(metrics.best_equipment.revenue)} in revenue
                        </span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 dark:text-green-400 mt-0.5">•</span>
                      <span>
                        You've completed <strong>{metrics.total_bookings}</strong> bookings with an average value of <strong>{formatCurrency(metrics.avg_booking_value)}</strong>
                      </span>
                    </li>
                    {equipmentPerformance.filter((e) => e.rental_requests_count === 0).length > 0 && (
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                        <span>
                          Consider promoting equipment with zero bookings or adjusting their pricing to attract more renters
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <>
          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/40 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-green-600 dark:text-green-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{formatCurrency(stats.total_earned)}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Earned</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">All verified payments</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/30 dark:to-amber-900/40 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-yellow-600 dark:text-yellow-400">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{formatCurrency(stats.pending_earnings)}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pending Earnings</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Awaiting verification</p>
              </div>

              <div className="bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/30 dark:to-violet-900/40 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-purple-600 dark:text-purple-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{formatCurrency(stats.this_month_earnings)}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">This Month</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Verified this month</p>
              </div>
            </div>
          )}

          {/* Earnings by Equipment */}
          {stats?.earnings_by_equipment && stats.earnings_by_equipment.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-5">
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
          <div className="flex items-center gap-2 flex-wrap">
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
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
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
          {earningsLoading ? (
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
        </>
      )}
    </div>
  );
}
