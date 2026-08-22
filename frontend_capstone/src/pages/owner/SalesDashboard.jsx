import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { TrendingUp, DollarSign, ShoppingCart, Award, Package, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [equipmentPerformance, setEquipmentPerformance] = useState([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState([]);

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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = (value) => {
    return '₱' + parseFloat(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatMonthLabel = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
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
      <div className="flex items-center gap-3">
        <TrendingUp className="w-7 h-7 text-green-600 dark:text-green-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track your equipment performance and earnings</p>
        </div>
      </div>

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
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Daily Rate</th>
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.price_per_sqm)}/sqm</span>
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
    </div>
  );
}
