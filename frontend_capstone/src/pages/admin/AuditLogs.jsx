import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { FileText, Users, Activity, Search, Filter } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function AuditLogs() {
  const [activeTab, setActiveTab] = useState('audit');
  const [logs, setLogs] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    date_from: '',
    date_to: '',
    search: '',
  });
  const toast = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else {
      fetchSessions();
    }
  }, [activeTab, filters]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/audit-logs/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchAuditLogs = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/audit-logs', {
        params: { ...filters, page },
      });
      setLogs(response.data);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/admin/audit-logs/sessions', {
        params: { page },
      });
      setSessions(response.data);
    } catch (error) {
      toast.error('Failed to load session logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadge = (action) => {
    const colors = {
      create: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      update: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      delete: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      login: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      logout: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      approve: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      reject: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      status_change: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    };
    return colors[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  const parseUserAgent = (userAgent) => {
    if (!userAgent) return 'Unknown Device';

    // Detect browser
    let browser = 'Unknown Browser';
    if (userAgent.includes('Edg/')) browser = 'Edge';
    else if (userAgent.includes('Chrome/')) browser = 'Chrome';
    else if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Firefox/')) browser = 'Firefox';
    else if (userAgent.includes('Opera/') || userAgent.includes('OPR/')) browser = 'Opera';

    // Detect OS/Device
    let device = 'Unknown OS';
    if (userAgent.includes('Windows NT 10.0')) device = 'Windows 10';
    else if (userAgent.includes('Windows NT 11.0')) device = 'Windows 11';
    else if (userAgent.includes('Windows NT 6.3')) device = 'Windows 8.1';
    else if (userAgent.includes('Windows NT 6.2')) device = 'Windows 8';
    else if (userAgent.includes('Windows NT 6.1')) device = 'Windows 7';
    else if (userAgent.includes('Mac OS X')) device = 'macOS';
    else if (userAgent.includes('iPhone')) device = 'iPhone';
    else if (userAgent.includes('iPad')) device = 'iPad';
    else if (userAgent.includes('Android')) device = 'Android';
    else if (userAgent.includes('Linux')) device = 'Linux';

    return `${browser} on ${device}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Audit Trail & Session Logs
        </h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_logs.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Today&apos;s Activity</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.today_logs}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active Sessions Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active_sessions}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'audit'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="inline w-4 h-4 mr-2 -mt-1" />
            Audit Trail
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'sessions'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Users className="inline w-4 h-4 mr-2 -mt-1" />
            Session Logs
          </button>
        </div>
      </div>

      {/* Filters */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
              <option value="status_change">Status Change</option>
            </select>
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search description..."
                className="pl-10 pr-3 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Loading...</p>
        </div>
      ) : activeTab === 'audit' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date/Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {logs?.data?.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No audit logs found.
                    </td>
                  </tr>
                ) : (
                  logs?.data?.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-gray-900 dark:text-white font-medium">{log.user?.name || 'System'}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{log.user?.email || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadge(log.action)}`}>
                          {log.action.toUpperCase().replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{log.description || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{log.ip_address || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {logs && logs.data && logs.data.length > 0 && <Pagination data={logs} onPageChange={fetchAuditLogs} />}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sessions?.data?.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No session logs found.
                    </td>
                  </tr>
                ) : (
                  sessions?.data?.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {formatDate(session.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-gray-900 dark:text-white font-medium">{session.user?.name || '—'}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{session.user?.email || '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white capitalize">{session.user?.role || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadge(session.action)}`}>
                          {session.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{session.ip_address || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {session.user_agent ? parseUserAgent(session.user_agent) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {sessions && sessions.data && sessions.data.length > 0 && <Pagination data={sessions} onPageChange={fetchSessions} />}
        </div>
      )}
    </div>
  );
}
