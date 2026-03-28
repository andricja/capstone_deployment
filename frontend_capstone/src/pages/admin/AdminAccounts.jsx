import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import DataTable from '../../components/DataTable';
import { TableSkeleton } from '../../components/Skeleton';
import StatusBadge from '../../components/StatusBadge';
import { UserCheck, UserX, Users, Clock, ShieldCheck, ShieldX, X, Mail, Trash2 } from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function AdminAccounts() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('email_verified');
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [selected, setSelected] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAccounts = (f = filter) => {
    setLoading(true);
    api.get('/admin/accounts', { params: { status: f, all: 1 } })
      .then((r) => setData(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    api.get('/admin/accounts/stats').then((r) => setStats(r.data));
  };

  useEffect(() => { fetchAccounts(filter); fetchStats(); }, [filter]);

  const handleApprove = async (id, e) => {
    e?.stopPropagation();
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/accounts/${id}/approve`);
      toast.success(res.data.message);
      fetchAccounts(filter);
      fetchStats();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve.');
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (user, e) => {
    e?.stopPropagation();
    setRejectModal(user);
    setRejectReason('');
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/accounts/${rejectModal.id}/reject`, { reason: rejectReason });
      toast.success(res.data.message);
      fetchAccounts(filter);
      fetchStats();
      setRejectModal(null);
      if (selected?.id === rejectModal.id) setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this account? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/admin/accounts/${id}`);
      toast.success(res.data.message);
      fetchAccounts(filter);
      fetchStats();
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setActionLoading(false);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'email_verified': return 'bg-blue-100 text-blue-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pending Verification';
      case 'email_verified': return 'Awaiting Approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const statCards = [
    { label: 'Pending Verification', value: stats?.pending ?? 0, icon: <Clock className="w-5 h-5" />, color: 'bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/30 dark:to-amber-900/40 text-yellow-600 dark:text-yellow-400 ring-yellow-200 dark:ring-yellow-800', border: 'border-l-yellow-500' },
    { label: 'Awaiting Approval', value: stats?.email_verified ?? 0, icon: <Mail className="w-5 h-5" />, color: 'bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/40 text-blue-600 dark:text-blue-400 ring-blue-200 dark:ring-blue-800', border: 'border-l-blue-500' },
    { label: 'Approved', value: stats?.approved ?? 0, icon: <ShieldCheck className="w-5 h-5" />, color: 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/40 text-green-600 dark:text-green-400 ring-green-200 dark:ring-green-800', border: 'border-l-green-500' },
    { label: 'Rejected', value: stats?.rejected ?? 0, icon: <ShieldX className="w-5 h-5" />, color: 'bg-gradient-to-br from-red-100 to-rose-200 dark:from-red-900/30 dark:to-rose-900/40 text-red-600 dark:text-red-400 ring-red-200 dark:ring-red-800', border: 'border-l-red-500' },
  ];

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
            {row.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      align: 'center',
      render: (row) => (
        <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
          {row.role}
        </span>
      ),
    },
    {
      key: 'account_status',
      label: 'Status',
      align: 'center',
      render: (row) => (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor(row.account_status)}`}>
          {statusLabel(row.account_status)}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Registered',
      render: (row) => (
        <span className="text-gray-500 dark:text-gray-400 text-xs">
          {new Date(row.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      ),
    },
    {
      key: '_action',
      label: 'Action',
      align: 'center',
      sortable: false,
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          {(row.account_status === 'email_verified' || row.account_status === 'rejected') && (
            <button
              onClick={(e) => handleApprove(row.id, e)}
              disabled={actionLoading}
              className="text-green-600 hover:bg-green-50 px-2 py-1 rounded text-xs font-medium border border-green-200 disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {(row.account_status === 'email_verified' || row.account_status === 'approved') && (
            <button
              onClick={(e) => openRejectModal(row, e)}
              disabled={actionLoading}
              className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs font-medium border border-red-200 disabled:opacity-50"
            >
              Reject
            </button>
          )}
          <button
            onClick={(e) => handleDelete(row.id, e)}
            disabled={actionLoading}
            className="text-gray-600 hover:bg-gray-50 p-1.5 rounded border border-gray-200 disabled:opacity-50"
            title="Delete Account"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-7 h-7 text-green-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Management</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 border-l-4 ${card.border} p-4 flex items-center gap-3 transition-colors`}>
            <div className={`${card.color} p-2.5 rounded-lg ring-1`}>
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[
          { label: 'Awaiting Approval', value: 'email_verified' },
          { label: 'Pending Verification', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'All', value: 'all' },
        ].map((btn) => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              filter === btn.value
                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border-green-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Feedback message */}
      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : (
        <DataTable
          columns={columns}
          data={data}
          onRowClick={(row) => setSelected(row)}
          searchKeys={['name', 'email', 'role', 'account_status']}
          defaultSort={{ key: 'created_at', dir: 'desc' }}
          emptyMessage="No accounts found."
        />
      )}

      {/* ── Detail Modal ── */}
      {selected && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl">
                  {selected.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selected.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selected.email}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor(selected.account_status)}`}>
                  {statusLabel(selected.account_status)}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(selected.created_at).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Role</p>
                  <p className="text-gray-700 dark:text-gray-300 capitalize">{selected.role}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Email Verified</p>
                  <p className="text-gray-700 dark:text-gray-300">{selected.email_verified_at ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {selected.admin_rejection_reason && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                  <p className="text-xs font-semibold uppercase text-red-400 mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700">{selected.admin_rejection_reason}</p>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap pt-2 border-t dark:border-gray-700">
                {(selected.account_status === 'email_verified' || selected.account_status === 'rejected') && (
                  <button
                    onClick={(e) => handleApprove(selected.id, e)}
                    disabled={actionLoading}
                    className="text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200 flex items-center gap-1 disabled:opacity-50"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                {(selected.account_status === 'email_verified' || selected.account_status === 'approved') && (
                  <button
                    onClick={(e) => openRejectModal(selected, e)}
                    disabled={actionLoading}
                    className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 flex items-center gap-1 disabled:opacity-50"
                  >
                    <UserX className="w-3.5 h-3.5" /> Reject
                  </button>
                )}
                <button
                  onClick={(e) => handleDelete(selected.id, e)}
                  disabled={actionLoading}
                  className="text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 flex items-center gap-1 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Reject Reason Modal ── */}
      {rejectModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setRejectModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reject Account</h2>
              <button onClick={() => setRejectModal(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rejecting <span className="font-semibold text-gray-900 dark:text-white">{rejectModal.name}</span> ({rejectModal.email}).
                The user will receive an email with the reason below.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (optional)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Enter the reason for rejection..."
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRejectModal(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex items-center gap-1"
                >
                  <UserX className="w-4 h-4" /> Reject Account
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
