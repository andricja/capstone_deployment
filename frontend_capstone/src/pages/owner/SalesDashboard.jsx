import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { TrendingUp, DollarSign, ShoppingCart, Award, Package, Calendar, Clock, Filter, BarChart3, Wallet, Printer, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Pagination from '../../components/Pagination';
import OwnerPaymentTracker from './OwnerPaymentTracker';

export default function SalesDashboard() {
  const toast = useToast();
  
  // Tab state - 'dashboard' or 'payments'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Sales Dashboard state
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [equipmentPerformance, setEquipmentPerformance] = useState([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Earnings Trend Filters
  const [earningsFilter, setEarningsFilter] = useState('month'); // Default to 'month' instead of 'all'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Fetch sales dashboard data
  const fetchDashboard = () => {
    setLoading(true);
    
    // Build query params based on filter
    let params = {};
    const now = new Date();
    
    if (earningsFilter === 'today') {
      const today = now.toISOString().split('T')[0];
      params.start_date = today;
      params.end_date = today;
    } else if (earningsFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      params.start_date = weekAgo.toISOString().split('T')[0];
      params.end_date = now.toISOString().split('T')[0];
    } else if (earningsFilter === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      params.start_date = monthAgo.toISOString().split('T')[0];
      params.end_date = now.toISOString().split('T')[0];
    } else if (earningsFilter === 'year') {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      params.start_date = yearAgo.toISOString().split('T')[0];
      params.end_date = now.toISOString().split('T')[0];
    } else if (earningsFilter === 'custom' && customStartDate && customEndDate) {
      params.start_date = customStartDate;
      params.end_date = customEndDate;
    }
    
    api
      .get('/owner/sales/dashboard', { params })
      .then((res) => {
        setMetrics(res.data.metrics);
        setEquipmentPerformance(res.data.equipment_performance || []);
        setMonthlyEarnings(res.data.monthly_earnings || []);
      })
      .catch((err) => {
        console.error('Error fetching sales dashboard:', err);
        toast.error('Failed to load dashboard data');
      })
      .finally(() => setLoading(false));
  };

  // Initial load
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
    }
  }, [activeTab, earningsFilter, customStartDate, customEndDate]);

  const formatCurrency = (value) => {
    return '₱' + parseFloat(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatMonthLabel = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Print functionality
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV functionality
  const handleExportCSV = () => {
    if (!monthlyEarnings.length && !equipmentPerformance.length) {
      toast.error('No data available to export');
      return;
    }

    let csvContent = 'FERMS - Owner Revenue Report\n';
    csvContent += `Generated on: ${new Date().toLocaleString()}\n`;
    csvContent += `Filter: ${earningsFilter === 'today' ? 'Today' : 
                            earningsFilter === 'week' ? 'This Week' :
                            earningsFilter === 'month' ? 'This Month' :
                            earningsFilter === 'year' ? 'This Year' :
                            earningsFilter === 'custom' ? `${customStartDate} to ${customEndDate}` :
                            'All Time'}\n\n`;

    // Summary Metrics
    if (metrics) {
      csvContent += 'SUMMARY METRICS\n';
      csvContent += `Total Earnings,₱${parseFloat(metrics.total_earnings || 0).toFixed(2)}\n`;
      csvContent += `Total Bookings,${metrics.total_bookings || 0}\n`;
      csvContent += `Average Booking Value,₱${parseFloat(metrics.avg_booking_value || 0).toFixed(2)}\n`;
      if (metrics.best_equipment) {
        csvContent += `Best Equipment,"${metrics.best_equipment.name}"\n`;
        csvContent += `Best Equipment Revenue,₱${parseFloat(metrics.best_equipment.revenue || 0).toFixed(2)}\n`;
      }
      csvContent += '\n';
    }

    // Monthly Earnings
    if (monthlyEarnings.length > 0) {
      csvContent += 'MONTHLY EARNINGS\n';
      csvContent += 'Month,Revenue,Bookings\n';
      monthlyEarnings.forEach((item) => {
        csvContent += `"${formatMonthLabel(item.month)}",₱${parseFloat(item.revenue || 0).toFixed(2)},${item.bookings || 0}\n`;
      });
      csvContent += '\n';
    }

    // Equipment Performance
    if (equipmentPerformance.length > 0) {
      csvContent += 'EQUIPMENT PERFORMANCE\n';
      csvContent += 'Equipment Name,Category,Status,Bookings,Revenue,Rate per Hectare\n';
      equipmentPerformance.forEach((item) => {
        csvContent += `"${item.name}","${item.category}","${item.status}",${item.rental_requests_count || 0},₱${parseFloat(item.total_revenue || 0).toFixed(2)},₱${parseFloat(item.price_per_hectare || 0).toFixed(2)}\n`;
      });
    }

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `FERMS_Owner_Revenue_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Revenue report exported successfully!');
  };

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          /* Hide navigation, filters, and action buttons when printing */
          button, .no-print, nav, [role="navigation"] {
            display: none !important;
          }
          
          /* Ensure content is visible and formatted properly */
          body {
            background: white !important;
          }
          
          /* Remove shadows and borders for cleaner print */
          * {
            box-shadow: none !important;
          }
          
          /* Ensure tables fit on page */
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          /* Add header to printed pages */
          @page {
            margin: 1cm;
          }
          
          /* Ensure colors are preserved */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-green-600 dark:text-green-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales & Earnings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your equipment performance, revenue, and payments</p>
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
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Payment Tracker
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

              {/* Monthly Earnings Chart with Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Earnings Trend</h2>
                  </div>
                  
                  {/* Filter Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {['today', 'week', 'month', 'year', 'custom'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setEarningsFilter(filter);
                          if (filter !== 'custom') {
                            setCustomStartDate('');
                            setCustomEndDate('');
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                          earningsFilter === filter
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {filter === 'today' ? 'Today' :
                         filter === 'week' ? 'This Week' :
                         filter === 'month' ? 'This Month' :
                         filter === 'year' ? 'This Year' :
                         'Custom'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Range Inputs */}
                {earningsFilter === 'custom' && (
                  <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">From:</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        max={customEndDate || new Date().toISOString().split('T')[0]}
                        className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">To:</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        min={customStartDate}
                        max={new Date().toISOString().split('T')[0]}
                        className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
                      />
                    </div>
                    <button
                      onClick={fetchDashboard}
                      disabled={!customStartDate || !customEndDate}
                      className="px-4 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* Chart */}
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
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {earningsFilter === 'today' ? 'No earnings today yet' :
                     earningsFilter === 'week' ? 'No earnings this week yet' :
                     earningsFilter === 'month' ? 'No earnings this month yet' :
                     earningsFilter === 'year' ? 'No earnings this year yet' :
                     earningsFilter === 'custom' ? 'No earnings in selected date range' :
                     'No earnings data available yet'}
                  </p>
                )}
              </div>

              {/* Equipment Performance Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-colors overflow-hidden">
                <div className="px-6 py-4 border-b dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Equipment Performance Comparison</h2>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Export Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePrint}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                          title="Print Report"
                        >
                          <Printer className="w-4 h-4" />
                          <span className="hidden sm:inline">Print</span>
                        </button>
                        <button
                          onClick={handleExportCSV}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                          title="Export to CSV"
                        >
                          <Download className="w-4 h-4" />
                          <span className="hidden sm:inline">Export CSV</span>
                        </button>
                      </div>

                      {/* Pagination Control */}
                      <div className="flex items-center gap-2 border-l border-gray-300 dark:border-gray-600 pl-3">
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
                        <span className="text-sm text-gray-600 dark:text-gray-400">entries</span>
                      </div>
                    </div>
                  </div>
                </div>
                {equipmentPerformance.length > 0 ? (
                  <>
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
                          {equipmentPerformance
                            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                            .map((item) => (
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

                    {/* Pagination */}
                    {Math.ceil(equipmentPerformance.length / itemsPerPage) > 1 && (
                      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, equipmentPerformance.length)} of {equipmentPerformance.length}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          
                          {Array.from({ length: Math.min(Math.ceil(equipmentPerformance.length / itemsPerPage), 5) }, (_, i) => {
                            const totalPages = Math.ceil(equipmentPerformance.length / itemsPerPage);
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
                          
                          <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === Math.ceil(equipmentPerformance.length / itemsPerPage)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8 px-6">No equipment added yet</p>
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

      {/* Payment Tracker Tab */}
      {activeTab === 'payments' && (
        <OwnerPaymentTracker />
      )}
      </div>
    </>
  );
}
