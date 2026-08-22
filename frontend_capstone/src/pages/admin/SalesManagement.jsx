import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { TrendingUp, DollarSign, ShoppingCart, Package, Activity, Calendar, Filter } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SalesManagement() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [topEquipment, setTopEquipment] = useState([]);
  const [revenueByOwner, setRevenueByOwner] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [period, setPeriod] = useState('monthly');

  const fetchDashboard = () => {
    setLoading(true);
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    Promise.all([
      api.get('/admin/sales/dashboard', { params }),
      api.get('/admin/sales/revenue-trends', { params: { ...params, period } }),
    ])
      .then(([dashboardRes, trendsRes]) => {
        setMetrics(dashboardRes.data.metrics);
        setTopEquipment(dashboardRes.data.top_equipment || []);
        setRevenueByOwner(dashboardRes.data.revenue_by_owner || []);
        setRevenueTrends(trendsRes.data || []);
      })
      .catch((err) => {
        console.error('Error fetching sales data:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleApplyFilter = () => {
    fetchDashboard();
  };

  const formatCurrency = (value) => {
    return '₱' + parseFloat(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPeriodLabel = (periodStr) => {
    if (period === 'daily') return periodStr;
    if (period === 'weekly') {
      const [year, week] = periodStr.split('-');
      return `Week ${week}, ${year}`;
    }
    if (period === 'monthly') {
      const [year, month] = periodStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    if (period === 'yearly') return periodStr;
    return periodStr;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-green-600 dark:text-green-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">System-wide sales analytics and performance insights</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filters</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <button
            onClick={handleApplyFilter}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-600"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              setPeriod('monthly');
              setTimeout(fetchDashboard, 100);
            }}
            className="text-gray-600 dark:text-gray-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 border-l-4 border-l-green-500 p-5 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{formatCurrency(metrics.total_revenue)}</p>
                {metrics.revenue_growth !== 0 && (
                  <p className={`text-xs mt-1 ${metrics.revenue_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metrics.revenue_growth > 0 ? '↑' : '↓'} {Math.abs(metrics.revenue_growth).toFixed(1)}% from previous period
                  </p>
                )}
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Verified payments</p>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/40 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-amber-200 dark:border-amber-700 border-l-4 border-l-amber-500 p-5 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Transaction</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(metrics.avg_transaction_value)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per booking</p>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-900/30 dark:to-yellow-900/40 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-purple-200 dark:border-purple-700 border-l-4 border-l-purple-500 p-5 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Equipment</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metrics.active_equipment}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available for rent</p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/30 dark:to-pink-900/40 p-3 rounded-lg">
                <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Trends Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trends</h2>
        </div>
        {revenueTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis
                dataKey="period"
                tickFormatter={formatPeriodLabel}
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
                labelFormatter={formatPeriodLabel}
                formatter={(value) => [formatCurrency(value), 'Revenue']}
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
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No revenue data available for the selected period</p>
        )}
      </div>

      {/* Top Equipment Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Equipment</h2>
        {topEquipment.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Rank</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Equipment</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Owner</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Bookings</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topEquipment.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <span className="text-lg font-bold text-gray-400 dark:text-gray-500">#{index + 1}</span>
                    </td>
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
                    <td className="py-3 px-4">
                      <p className="text-sm text-gray-700 dark:text-gray-300">{item.owner?.name || '—'}</p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{item.rental_requests_count}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(item.total_revenue)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No equipment data available</p>
        )}
      </div>

      {/* Revenue by Owner */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Owner</h2>
        {revenueByOwner.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByOwner}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Bar dataKey="total_revenue" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No owner revenue data available</p>
        )}
      </div>
    </div>
  );
}
