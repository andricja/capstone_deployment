import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import DataTable from '../../components/DataTable';
import { TableSkeleton } from '../../components/Skeleton';
import { Archive, RefreshCw, Trash2, Users, Tractor, ClipboardList, Banknote, CheckSquare, Square, AlertTriangle, User, FileText, Server, Database, Settings } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmModal from '../../components/ConfirmModal';
import Tooltip from '../../components/Tooltip';

export default function ArchiveManagement() {
  const toast = useToast();
  const navigate = useNavigate();
  const { confirm, isOpen, config, handleConfirm, handleClose } = useConfirm();
  const [activeTab, setActiveTab] = useState('owners'); // 'owners' | 'equipment' | 'rentals' | 'payments'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchArchived = (tab = activeTab) => {
    setLoading(true);
    setSelectedIds([]);
    let endpoint = '';
    switch (tab) {
      case 'owners':
        endpoint = '/admin/archived/owners';
        break;
      case 'equipment':
        endpoint = '/admin/archived/equipment';
        break;
      case 'rentals':
        endpoint = '/admin/archived/rentals';
        break;
      case 'payments':
        endpoint = '/admin/archived/payments';
        break;
      default:
        endpoint = '/admin/archived/owners';
    }

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

  // Toggle selection for a single item
  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  // Select all items
  const selectAll = () => {
    if (selectedIds.length === data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.map(item => item.id));
    }
  };

  // Bulk restore
  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select items to restore.');
      return;
    }

    const confirmed = await confirm({
      title: 'Restore Items',
      message: `Restore ${selectedIds.length} selected item(s)?`,
      confirmText: 'Restore',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;

    setActionLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'owners':
          endpoint = '/admin/archived/owners/bulk-restore';
          break;
        case 'equipment':
          endpoint = '/admin/archived/equipment/bulk-restore';
          break;
        case 'rentals':
          endpoint = '/admin/archived/rentals/bulk-restore';
          break;
        case 'payments':
          endpoint = '/admin/archived/payments/bulk-restore';
          break;
      }

      await api.post(endpoint, { ids: selectedIds });
      toast.success(`Successfully restored ${selectedIds.length} item(s).`);
      fetchArchived();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore items.');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk delete permanently
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select items to delete.');
      return;
    }

    const confirmed = await confirm({
      title: 'Permanently Delete Items',
      message: `⚠️ PERMANENTLY DELETE ${selectedIds.length} selected item(s)? This action CANNOT be undone!`,
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      danger: true
    });
    
    if (!confirmed) return;

    setActionLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'owners':
          endpoint = '/admin/archived/owners/bulk-delete';
          break;
        case 'equipment':
          endpoint = '/admin/archived/equipment/bulk-delete';
          break;
        case 'rentals':
          endpoint = '/admin/archived/rentals/bulk-delete';
          break;
        case 'payments':
          endpoint = '/admin/archived/payments/bulk-delete';
          break;
      }

      await api.post(endpoint, { ids: selectedIds });
      toast.success(`Successfully deleted ${selectedIds.length} item(s) permanently.`);
      fetchArchived();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete items.');
    } finally {
      setActionLoading(false);
    }
  };

  // Single restore
  const handleRestore = async (id, e) => {
    e?.stopPropagation();
    const confirmed = await confirm({
      title: 'Restore Item',
      message: 'Restore this item?',
      confirmText: 'Restore',
      cancelText: 'Cancel'
    });
    
    if (!confirmed) return;

    setActionLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'owners':
          endpoint = `/admin/owners/${id}/restore`;
          break;
        case 'equipment':
          endpoint = `/admin/equipment/${id}/restore`;
          break;
        case 'rentals':
          endpoint = `/admin/rentals/${id}/restore`;
          break;
        case 'payments':
          endpoint = `/admin/payments/${id}/restore`;
          break;
      }

      await api.patch(endpoint);
      toast.success('Item restored successfully.');
      fetchArchived();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore item.');
    } finally {
      setActionLoading(false);
    }
  };

  // Single delete permanently
  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    const confirmed = await confirm({
      title: 'Permanently Delete Item',
      message: '⚠️ PERMANENTLY DELETE this item? This action CANNOT be undone!',
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      danger: true
    });
    
    if (!confirmed) return;

    setActionLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'owners':
          endpoint = `/admin/archived/owners/${id}`;
          break;
        case 'equipment':
          endpoint = `/admin/archived/equipment/${id}`;
          break;
        case 'rentals':
          endpoint = `/admin/archived/rentals/${id}`;
          break;
        case 'payments':
          endpoint = `/admin/archived/payments/${id}`;
          break;
      }

      await api.delete(endpoint);
      toast.success('Item deleted permanently.');
      fetchArchived();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete item.');
    } finally {
      setActionLoading(false);
    }
  };

  // Define columns based on active tab
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

    switch (activeTab) {
      case 'owners':
        return [
          baseCheckboxColumn,
          {
            key: 'name',
            label: 'Owner',
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
            key: 'equipment_count',
            label: 'Equipment',
            align: 'center',
            render: (row) => <span className="text-gray-700 dark:text-gray-300">{row.equipment_count ?? 0}</span>,
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

      case 'equipment':
        return [
          baseCheckboxColumn,
          {
            key: 'name',
            label: 'Equipment',
            render: (row) => (
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{row.category}</p>
              </div>
            ),
          },
          {
            key: 'owner',
            label: 'Owner',
            render: (row) => (
              <div>
                <p className="text-gray-700 dark:text-gray-300">{row.owner?.name ?? '—'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{row.owner?.email ?? ''}</p>
              </div>
            ),
          },
          {
            key: 'price_per_hectare',
            label: 'Price',
            align: 'right',
            render: (row) => (
              <span className="font-medium text-green-700">
                ₱{parseFloat(row.price_per_hectare ?? 0).toLocaleString()}/ha
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

      case 'rentals':
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
            key: 'renter',
            label: 'Renter',
            render: (row) => (
              <div>
                <p className="text-gray-700 dark:text-gray-300">{row.renter?.name ?? '—'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{row.contact_number ?? ''}</p>
              </div>
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

      case 'payments':
        return [
          baseCheckboxColumn,
          {
            key: 'id',
            label: 'ID',
            render: (row) => <span className="font-mono text-gray-400">#{row.id}</span>,
          },
          {
            key: 'rental',
            label: 'Rental Info',
            render: (row) => (
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Rental #{row.rental_id ?? '—'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{row.rental?.equipment?.name ?? ''}</p>
              </div>
            ),
          },
          {
            key: 'amount',
            label: 'Amount',
            align: 'right',
            render: (row) => (
              <span className="font-bold text-green-700">
                ₱{parseFloat(row.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            ),
          },
          {
            key: 'payment_method',
            label: 'Method',
            render: (row) => (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
                {row.payment_method ?? '—'}
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

      default:
        return [];
    }
  };

  const tabs = [
    { id: 'owners', label: 'Owners', icon: <Users className="w-4 h-4" /> },
    { id: 'equipment', label: 'Equipment', icon: <Tractor className="w-4 h-4" /> },
    { id: 'rentals', label: 'Rentals', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'payments', label: 'Payments', icon: <Banknote className="w-4 h-4" /> },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7 text-green-600 dark:text-green-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage system settings and archived items
            </p>
          </div>
        </div>
      </div>

      {/* Profile/Accounts/Audit/Email/Backup/Archive Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6 overflow-x-auto">
        <button
          onClick={() => navigate('/admin/settings')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap"
        >
          <User className="w-4 h-4" />
          Profile
        </button>
        <button
          onClick={() => navigate('/admin/settings')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap"
        >
          <Users className="w-4 h-4" />
          Accounts
        </button>
        <button
          onClick={() => navigate('/admin/settings')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap"
        >
          <FileText className="w-4 h-4" />
          Audit Trail
        </button>
        <button
          onClick={() => navigate('/admin/settings')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap"
        >
          <Server className="w-4 h-4" />
          Email
        </button>
        <button
          onClick={() => navigate('/admin/settings')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap"
        >
          <Database className="w-4 h-4" />
          Backup
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm whitespace-nowrap"
        >
          <Archive className="w-4 h-4" />
          Archive
        </button>
      </div>

      {/* Archive Page Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors p-6">
        {/* Tabs */}
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

      {/* Bulk Actions Bar */}
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

      {/* Warning message */}
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

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : data.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Archive className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No archived {activeTab} found.</p>
        </div>
      ) : (
        <DataTable
          columns={getColumns()}
          data={data}
          searchKeys={activeTab === 'owners' ? ['name', 'email'] : 
                     activeTab === 'equipment' ? ['name', 'category'] :
                     activeTab === 'rentals' ? ['equipment.name', 'renter.name'] :
                     ['rental_id', 'payment_method']}
          defaultSort={{ key: 'archived_at', dir: 'desc' }}
          emptyMessage={`No archived ${activeTab} found.`}
        />
      )}
      </div>
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        danger={config.danger}
      />
    </div>
  );
}
