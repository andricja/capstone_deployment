import { useEffect, useState } from 'react';
import api from '../../lib/api';
import DataTable from '../../components/DataTable';
import { TableSkeleton } from '../../components/Skeleton';
import { TrendingUp, DollarSign, ShoppingCart, Package, Activity, Calendar, Filter, Download, BarChart3, Tractor, FileText, Printer } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SalesManagement() {
  // Tab state
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'reports'
  
  // Analytics tab states
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [topEquipment, setTopEquipment] = useState([]);
  const [revenueByOwner, setRevenueByOwner] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [period, setPeriod] = useState('monthly');

  // Reports tab states
  const [reportData, setReportData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportFilter, setReportFilter] = useState('month');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Fetch analytics dashboard
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

  // Fetch revenue reports
  const fetchReports = () => {
    setReportLoading(true);
    const params = { all: 1 };
    if (reportFilter !== 'custom') params.filter = reportFilter;
    if (reportFilter === 'custom' && reportStartDate && reportEndDate) {
      params.start_date = reportStartDate;
      params.end_date = reportEndDate;
    }
    api.get('/admin/reports/revenue', { params })
      .then((r) => {
        setReportData(r.data);
        const txns = r.data?.transactions;
        setTransactions(Array.isArray(txns) ? txns : txns?.data ?? []);
      })
      .finally(() => setReportLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchDashboard();
    } else {
      fetchReports();
    }
  }, [activeTab]);

  const handleApplyFilter = () => {
    fetchDashboard();
  };

  const handleReportFilter = () => {
    fetchReports();
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams();
    if (reportFilter !== 'custom') params.set('filter', reportFilter);
    if (reportFilter === 'custom' && reportStartDate && reportEndDate) {
      params.set('start_date', reportStartDate);
      params.set('end_date', reportEndDate);
    }
    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://ferms.net/api';
    window.open(`${baseURL}/admin/reports/revenue/csv?${params.toString()}&token=${token}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
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

  const reportColumns = [
    {
      key: 'id',
      label: 'Receipt No.',
      render: (row) => <span className="font-mono text-xs text-gray-500 dark:text-gray-400">RCP-{String(row.id).padStart(5, '0')}</span>,
      sortValue: (row) => row.id,
    },
    {
      key: 'approved_at',
      label: 'Approved Date',
      render: (row) => <span className="text-gray-600 dark:text-gray-400 text-sm">{row.approved_at ? new Date(row.approved_at).toLocaleDateString() : '—'}</span>,
    },
    {
      key: 'owner.name',
      label: 'Owner',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{row.owner?.name ?? '—'}</p>
          <p className="text-xs text-gray-400">{row.owner?.email ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Equipment',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.image ? (
            <img src={`/storage/${row.image}`} alt={row.name} className="w-8 h-8 rounded object-cover" />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm text-gray-300">🚜</div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
            <p className="text-xs text-gray-400 capitalize">{row.category} • {row.location}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'pricing',
      label: 'Pricing',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className="text-gray-600 dark:text-gray-400 block">
            ₱{parseFloat(row.pricing_model === 'per_equipment' ? row.price_per_equipment : row.price_per_hectare).toLocaleString()}
          </span>
          <span className="text-xs text-gray-500">
            {row.pricing_model === 'per_equipment' ? '/equipment' : '/hectare'}
          </span>
        </div>
      ),
      sortValue: (row) => parseFloat(row.pricing_model === 'per_equipment' ? row.price_per_equipment : row.price_per_hectare),
    },
    {
      key: 'approval_fee',
      label: 'Approval Fee',
      align: 'right',
      render: (row) => <span className="text-green-700 font-semibold">₱{parseFloat(row.approval_fee).toLocaleString()}</span>,
      sortValue: (row) => parseFloat(row.approval_fee),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: () => (
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">Approved</span>
      ),
    },
  ];

  return (
    <div>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:hidden, .print\\:hidden * {
            visibility: hidden !important;
            display: none !important;
          }
          .print\\:p-8 {
            padding: 2rem;
          }
          @page {
            margin: 1cm;
          }
          /* Make sure the report container is visible */
          div[class*="print:p-8"], div[class*="print:p-8"] * {
            visibility: visible;
          }
          /* Position the print content at the top */
          div[class*="print:p-8"] {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          /* Ensure tables print properly */
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          /* Remove shadows and borders for cleaner print */
          .shadow-md {
            box-shadow: none !important;
          }
          .rounded-xl, .rounded-lg {
            border-radius: 0 !important;
          }
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-7 h-7 text-green-600 dark:text-green-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales & Revenue</h1>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Sales Analytics
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'reports'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Revenue Reports
          </button>
        </div>
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Total Admin Revenue */}
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 border-l-4 border-l-green-500 p-5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Admin Revenue</p>
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

                  {/* Approval Fee Revenue */}
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-indigo-200 dark:border-indigo-700 border-l-4 border-l-indigo-500 p-5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Approval Fees</p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(metrics.approval_fee_revenue || 0)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metrics.total_approvals || 0} equipment approved</p>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-100 to-purple-200 dark:from-indigo-900/30 dark:to-purple-900/40 p-3 rounded-lg">
                        <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                  </div>

                  {/* Service Charge Revenue */}
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-teal-200 dark:border-teal-700 border-l-4 border-l-teal-500 p-5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Service Charges</p>
                        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">{formatCurrency(metrics.service_charge_revenue || 0)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{metrics.total_bookings || 0} rentals</p>
                      </div>
                      <div className="bg-gradient-to-br from-teal-100 to-cyan-200 dark:from-teal-900/30 dark:to-cyan-900/40 p-3 rounded-lg">
                        <ShoppingCart className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                    </div>
                  </div>

                  {/* Avg Service Charge */}
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-amber-200 dark:border-amber-700 border-l-4 border-l-amber-500 p-5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Commission</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(metrics.avg_service_charge || 0)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Per rental</p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-900/30 dark:to-yellow-900/40 p-3 rounded-lg">
                        <Activity className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                    </div>
                  </div>

                  {/* Active Equipment */}
                  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-blue-200 dark:border-blue-700 border-l-4 border-l-blue-500 p-5 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active Equipment</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.active_equipment || 0}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available for rent</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/40 p-3 rounded-lg">
                        <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Trends Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Revenue Trends</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Approval Fees + Service Charges)</p>
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
                        formatter={(value) => [formatCurrency(value), '']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="total_revenue"
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Total Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="approval_revenue"
                        stroke="#6366F1"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Approval Fees"
                        strokeDasharray="5 5"
                      />
                      <Line
                        type="monotone"
                        dataKey="service_revenue"
                        stroke="#14B8A6"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        name="Service Charges"
                        strokeDasharray="5 5"
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
                              <span className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(item.admin_commission || item.total_revenue || 0)}</span>
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
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Admin Revenue by Owner</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Approval fees paid by each owner</p>
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
                      <Bar dataKey="total_admin_revenue" fill="#10B981" radius={[8, 8, 0, 0]} name="Admin Revenue" />
                      <Bar dataKey="total_approval_fees" fill="#6366F1" radius={[8, 8, 0, 0]} name="Approval Fees" />
                      <Bar dataKey="total_service_charges" fill="#14B8A6" radius={[8, 8, 0, 0]} name="Service Charges" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">No owner revenue data available</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="print:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
            <p className="text-sm text-gray-500 dark:text-gray-400">Equipment approval revenue reports and transactions</p>
            <div className="flex gap-2">
              <button onClick={handlePrint}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-cyan-600 flex items-center gap-1">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={handleExportCsv}
                className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-600 flex items-center gap-1">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          {/* Print Header - Only visible when printing */}
          <div className="hidden print:block mb-6 text-center border-b-2 border-gray-300 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">FERMS - Revenue Report</h1>
            <p className="text-sm text-gray-600 mt-1">Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            {reportFilter === 'custom' && reportStartDate && reportEndDate && (
              <p className="text-sm text-gray-600">Period: {new Date(reportStartDate).toLocaleDateString()} - {new Date(reportEndDate).toLocaleDateString()}</p>
            )}
            {reportFilter !== 'custom' && (
              <p className="text-sm text-gray-600">Period: {reportFilter === 'day' ? 'Today' : reportFilter === 'week' ? 'This Week' : reportFilter === 'month' ? 'This Month' : 'This Year'}</p>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 mb-6 flex flex-wrap items-end gap-3 transition-colors print:hidden">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Time Period</label>
              <select value={reportFilter} onChange={(e) => setReportFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200">
                <option value="day">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            {reportFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                  <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                  <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" />
                </div>
              </>
            )}
            <button onClick={handleReportFilter} className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-600">Apply</button>
          </div>

          {/* Summary */}
          {reportData?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 border-l-4 border-l-green-500 p-5 flex items-center gap-4 transition-colors">
                <div className="bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/40 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">₱{parseFloat(reportData.summary.total_revenue).toLocaleString()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 border-l-4 border-l-blue-500 p-5 flex items-center gap-4 transition-colors">
                <div className="bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/40 p-3 rounded-lg">
                  <Tractor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{reportData.summary.total_approvals}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Equipment Approved</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 border-l-4 border-l-amber-500 p-5 flex items-center gap-4 transition-colors">
                <div className="bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-900/30 dark:to-yellow-900/40 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">₱{parseFloat(reportData.summary.average_fee).toLocaleString()}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Average Fee</p>
                </div>
              </div>
            </div>
          )}

          {/* Transactions DataTable */}
          {reportLoading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : (
            <DataTable
              columns={reportColumns}
              data={transactions}
              searchKeys={['name', 'category', 'location', 'owner.name', 'owner.email']}
              defaultSort={{ key: 'approved_at', dir: 'desc' }}
              emptyMessage="No approved equipment in this period."
            />
          )}
        </div>
      )}
    </div>
  );
}
