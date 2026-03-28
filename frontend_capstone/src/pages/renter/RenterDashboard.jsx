import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { DashboardSkeleton } from '../../components/Skeleton';
import StatusBadge from '../../components/StatusBadge';
import AdCarousel from '../../components/AdCarousel';
import { ClipboardList, Truck, Coins, CheckCircle, Clock } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PIE_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4'];

export default function RenterDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('yearly');

  const periodLabels = { today: "Today's", weekly: "This Week's", monthly: "This Month's", yearly: 'Monthly' };

  useEffect(() => {
    setLoading(true);
    api.get(`/dashboard?period=${period}`).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <DashboardSkeleton statCount={5} />;

  const charts = data?.charts || {};
  const rentalChart = charts.rental_requests || [];
  const spendingChart = charts.spending || [];
  const topEquipment = charts.top_equipment || [];
  const categoryDistribution = charts.category_distribution || [];
  const paymentMethods = charts.payment_methods || [];

  // Rental status pie data
  const rentalStatusData = [
    { name: 'Pending', value: data?.rental_requests?.forwarded || 0 },
    { name: 'Approved', value: data?.rental_requests?.approved || 0 },
    { name: 'Rejected', value: data?.rental_requests?.rejected || 0 },
  ].filter((d) => d.value > 0);

  // Payment method pie data
  const paymentData = paymentMethods.map((p) => ({
    name: p.payment_method === 'downpayment' ? 'GCash Down Payment' : 
          p.payment_method === 'fullpayment' ? 'GCash Full Payment' : 
          p.payment_method === 'gcash' ? 'GCash' : 'COD',
    value: p.count,
  }));

  const fmt = (v) => '₱' + parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  return (
    <div>
      {/* Ad Carousel */}
      <AdCarousel />

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Renter Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={<ClipboardList />} label="Total Rentals" value={data?.rental_requests?.total || 0} color="blue" />
        <StatCard icon={<CheckCircle />} label="Approved" value={data?.rental_requests?.approved || 0} color="green" />
        <StatCard icon={<Clock />} label="Pending" value={data?.rental_requests?.forwarded || 0} color="purple" />
        <StatCard icon={<Truck />} label="Rejected" value={data?.rental_requests?.rejected || 0} color="yellow" />
        <StatCard icon={<Coins />} label="Total Spent" value={fmt(data?.total_spending || 0)} color="green" />
      </div>

      {/* ═══════════ CHARTS ═══════════ */}

      {/* Period Filter */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2">Period:</span>
        {['today', 'weekly', 'monthly', 'yearly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              period === p
                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Row 1: Rental Requests (bar) + Spending (line) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{periodLabels[period]} Rental Requests</h2>
          {rentalChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rentalChart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="forwarded" name="Pending" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Approved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No rental data yet.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{periodLabels[period]} Spending</h2>
          {spendingChart.some((m) => m.spending > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={spendingChart} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Line type="monotone" dataKey="spending" name="Spending" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No spending data yet.</p>
          )}
        </div>
      </div>

      {/* Row 2: Top Equipment (horizontal bar) + Rental Status (pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Top Equipment by Spending</h2>
          {topEquipment.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topEquipment} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v, n) => n === 'spending' ? fmt(v) : v} />
                <Legend />
                <Bar dataKey="spending" name="Spending" fill="#22c55e" radius={[0, 4, 4, 0]} />
                <Bar dataKey="rentals" name="Rentals" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No spending data yet.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Rental Request Status</h2>
          {rentalStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={rentalStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3}
                  dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {rentalStatusData.map((_, i) => <Cell key={i} fill={['#3b82f6', '#22c55e', '#ef4444'][i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No rental requests yet.</p>
          )}
        </div>
      </div>

      {/* Row 3: Category Distribution (pie) + Payment Methods (pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Equipment Categories Rented</h2>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3}
                  dataKey="count" nameKey="category" label={({ category, count }) => `${category}: ${count}`}>
                  {categoryDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No rental data yet.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{periodLabels[period]} Payment Methods</h2>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} paddingAngle={3}
                  dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                  {paymentData.map((_, i) => <Cell key={i} fill={['#f59e0b', '#3b82f6'][i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12">No payment data yet.</p>
          )}
        </div>
      </div>

      {/* Recent rentals */}
      {data?.recent_rentals?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors">
          <div className="px-6 py-4 border-b dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Rentals</h2>
          </div>
          <div className="divide-y dark:divide-gray-700">
            {data.recent_rentals.map((r) => (
              <div key={r.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{r.equipment?.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{fmtDate(r.start_date)}{r.rental_days > 1 ? ` — ${fmtDate(r.end_date)}` : ''}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = {
    yellow: { bg: 'bg-gradient-to-br from-yellow-100 to-amber-200 text-yellow-600 dark:from-yellow-900/30 dark:to-amber-900/40 dark:text-yellow-400', border: 'border-l-yellow-500' },
    blue:   { bg: 'bg-gradient-to-br from-blue-100 to-cyan-200 text-blue-600 dark:from-blue-900/30 dark:to-cyan-900/40 dark:text-blue-400',     border: 'border-l-blue-500' },
    green:  { bg: 'bg-gradient-to-br from-green-100 to-emerald-200 text-green-600 dark:from-green-900/30 dark:to-emerald-900/40 dark:text-green-400',   border: 'border-l-green-500' },
    purple: { bg: 'bg-gradient-to-br from-purple-100 to-fuchsia-200 text-purple-600 dark:from-purple-900/30 dark:to-fuchsia-900/40 dark:text-purple-400', border: 'border-l-purple-500' },
  };
  const c = colors[color] || colors.green;
  return (
    <div className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 border-l-4 ${c.border} p-5 transition-colors`}>
      <div className={`inline-flex p-2 rounded-lg text-xl ${c.bg}`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
