import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import DataTable from '../../components/DataTable';
import { TableSkeleton } from '../../components/Skeleton';
import { Archive, RefreshCw, Trash2, ClipboardList, Mail, CheckSquare, Square, AlertTriangle, User, Settings } from 'lucide-react';
import { useToast } from '../../components/Toast';
import Tooltip from '../../components/Tooltip';

export default function RenterArchive() {
  const toast = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rentals'); // 'rentals' | 'messages'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchArchived = (tab = activeTab) => {
    setLoading(true);
    setSelectedIds([]);
    const endpoint = tab === 'rentals' ? '/renter/archived/rentals' : '/renter/archived/messages';

    api.get(endpoint, { params: { all: 1 } })
      .then((r) => setData(Array.isArray(r.data) ? r.data : r.data?.data ?? []))
      .catch((err) => {
        console.error('Failed to fetch archived items:', err);
        toast.error('Failed to load archived items.');
        setData([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchArchived(activeTab);
  }, [activeTab]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(item => item.id));
    }
  };

  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select items to restore.');
      return;
    }

    if (!confirm(`Restore ${selectedIds.length} selected item(s)?`)) return;

    setActionLoading(true);
    try {
      const endpoint = activeTab === 'rentals'
        ? '/renter/archived/rentals/bulk-restore'
        : '/renter/archived/messages/bulk-restore';

      await api.post(endpoint, { ids: selectedIds });
      toast.success(`Successfully restored ${selectedIds.length} item(s).`);
      fetchArchived();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore items.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select items to delete.');
      return;
    }

    if (!confirm(`⚠️ PERMANENTLY DELETE ${selectedIds.length} selected item(s)? This action CANNOT be undone!`)) return;

    setActionLoading(true);
    try {
      const endpoint = activeTab === 'rentals'
        ? '/renter/archived/rentals/bulk-delete'
        : '/renter/archived/messages/bulk-delete';

      await api.post(endpoint, { ids: selectedIds });
      toast.success(`Successfully deleted ${selectedIds.length} item(s) permanently.`);
      fetchArchived();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete items.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('Restore this item?')) return;

    setActionLoading(true);
    try {
      const endpoint = activeTab === 'rentals'
        ? `/renter/archived/rentals/${id}`
        : `/renter/archived/messages/${id}`;

      await api.patch(endpoint);
      toast.success('Item restored successfully.');
      fetchArchived();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore item.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('⚠️ PERMANENTLY DELETE this item? This action CANNOT be undone!')) return;

    setActionLoading(true);
    try {
      const endpoint = activeTab === 'rentals'
        ? `/renter/archived/rentals/${id}`
        : `/renter/archived/messages/${id}`;

      await api.delete(endpoint);
      toast.success('Item deleted permanently.');
      fetchArchived();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete item.');
    } finally {
      setActionLoading(false);
    }
  };

  const getColumns = () => {
    const baseCheckboxColumn = {
      key: '_select',
      label: (
        <button onClick={selectAll} className="flex items-center justify-center">
          {selectedIds.length === data.length && data.length > 0 ? (
            <CheckSquare className="w-4 h-4 text-green-600" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </button>
      ),
      align: 'center',
      sortable: false,
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelect(row.id);
          }}
          className="flex items-center justify-center"
        >
          {selectedIds.includes(row.id) ? (
            <CheckSquare className="w-4 h-4 text-green-600" />
          ) : (
            <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          )}
        </button>
      ),
    };

    const baseActionColumn = {
      key: '_action',
      label: 'Action',
      align: 'center',
      sortable: false,
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          <Tooltip text="Restore">
            <button
              onClick={(e) => handleRestore(row.id, e)}
              disabled={actionLoading}
              className="p-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip text="Delete Permanently">
            <button
              onClick={(e) => handleDelete(row.id, e)}
              disabled={actionLoading}
              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      ),
    };

    if (activeTab === 'rentals') {
      return [
        baseCheckboxColumn,
        {
          key: 'id',
          label: 'ID',
          render: (row) => <span className="font-mono text-gray-400">#{row.id}</span>,
        },
        {
          key: 'equipment',
          label: 'Equipment',
          render: (row) => (
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{row.equipment?.name ?? '—'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{row.equipment?.category ?? ''}</p>
            </div>
          ),
        },
        {
          key: 'status',
          label: 'Status',
          align: 'center',
          render: (row) => (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
              row.status === 'approved' ? 'bg-green-100 text-green-700' :
              row.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              row.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {row.status}
            </span>
          ),
        },
        {
          key: 'total_cost',
          label: 'Amount',
          align: 'right',
          render: (row) => (
            <span className="font-bold text-green-700">
              ₱{parseFloat(row.total_cost ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          ),
        },
        {
          key: 'archived_at',
          label: 'Archived On',
          render: (row) => (
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {row.archived_at ? new Date(row.archived_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
            </span>
          ),
        },
        baseActionColumn,
      ];
    } else {
      return [
        baseCheckboxColumn,
        {
          key: 'id',
          label: 'ID',
          render: (row) => <span className="font-mono text-gray-400">#{row.id}</span>,
        },
        {
          key: 'subject',
          label: 'Subject',
          render: (row) => (
            <p className="font-medium text-gray-900 dark:text-white">{row.subject ?? '—'}</p>
          ),
        },
        {
          key: 'message',
          label: 'Message',
          render: (row) => (
            <p className="text-gray-700 dark:text-gray-300 truncate max-w-md">{row.message ?? ''}</p>
          ),
        },
        {
          key: 'status',
          label: 'Status',
          align: 'center',
          render: (row) => (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
              row.status === 'resolved' ? 'bg-green-100 text-green-700' :
              row.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {row.status}
            </span>
          ),
        },
        {
          key: 'archived_at',
          label: 'Archived On',
          render: (row) => (
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {row.archived_at ? new Date(row.archived_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
            </span>
          ),
        },
        baseActionColumn,
      ];
    }
  };

  const tabs = [
    { id: 'rentals', label: 'Rental Requests', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'messages', label: 'Messages', icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7 text-green-600 dark:text-green-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your profile and archived items
            </p>
          </div>
        </div>
      </div>

      {/* Profile/Archive Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        <button
          onClick={() => navigate('/renter/settings')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm"
        >
          <Archive className="w-4 h-4" />
          Archive
        </button>
      </div>

      {/* Archive Page Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors p-6">
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {data.length > 0 && activeTab === tab.id && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-700">
                    {data.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-amber-900 dark:text-amber-100">
              {selectedIds.length} item(s) selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkRestore}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Restore Selected
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete Permanently
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800 dark:text-yellow-200">
          <p className="font-medium mb-1">Important Notice</p>
          <p>
            Items in the archive can be <span className="font-semibold">restored</span> to their original state or{' '}
            <span className="font-semibold text-red-600">permanently deleted</span>. Permanent deletion cannot be undone!
          </p>
        </div>
      </div>

        {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No archived {activeTab} found.</p>
        </div>
      ) : (
        <DataTable
          columns={getColumns()}
          data={data}
          searchKeys={activeTab === 'rentals' ? ['equipment.name', 'status'] : ['subject', 'message']}
          defaultSort={{ key: 'archived_at', dir: 'desc' }}
          emptyMessage={`No archived ${activeTab} found.`}
        />
      )}
      </div>
    </div>
  );
}
