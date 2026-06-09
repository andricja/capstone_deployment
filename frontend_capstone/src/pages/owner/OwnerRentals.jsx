import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { ListPageSkeleton } from '../../components/Skeleton';
import { Check, X, Ruler, Clock, Calendar, Truck, MapPin, LayoutGrid, Table, Banknote, Archive } from 'lucide-react';
import { useToast } from '../../components/Toast';
import Tooltip from '../../components/Tooltip';

export default function OwnerRentals() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [proofImage, setProofImage] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRow, setSelectedRow] = useState(null); // row detail modal

  // DataTable state
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const fetchAll = () => {
    setLoading(true);
    api.get('/owner/rental-requests', { params: { all: 1 } })
      .then((r) => setAllData(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAction = async (id, action) => {
    const confirmMsg = action === 'approve'
      ? 'Approve this rental? Equipment will be marked as rented.'
      : 'Reject this rental request?';
    if (!confirm(confirmMsg)) return;
    try {
      await api.patch(`/owner/rental-requests/${id}/${action}`);
      toast.success(`Rental request ${action}d.`);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} request.`);
    }
  };

  const handleArchive = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('Archive this rental request?')) return;
    try {
      await api.patch(`/owner/archived/rentals/${id}`);
      toast.success('Rental archived.');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive.');
    }
  };

  const fmt = (v) => parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  // Filtered + sorted data
  const processed = useMemo(() => {
    let rows = [...allData];
    if (statusFilter !== 'all') {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        (r.equipment?.name || '').toLowerCase().includes(q) ||
        (r.renter?.name || '').toLowerCase().includes(q) ||
        (r.renter?.email || '').toLowerCase().includes(q) ||
        (r.contact_number || '').toLowerCase().includes(q) ||
        (r.delivery_address || '').toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'equipment': va = a.equipment?.name || ''; vb = b.equipment?.name || ''; break;
        case 'renter': va = a.renter?.name || ''; vb = b.renter?.name || ''; break;
        case 'farm_size': va = parseFloat(a.farm_size_sqm || 0); vb = parseFloat(b.farm_size_sqm || 0); break;
        case 'total_cost': va = parseFloat(a.total_cost || 0); vb = parseFloat(b.total_cost || 0); break;
        case 'status': va = a.status || ''; vb = b.status || ''; break;
        case 'start_date': va = a.start_date || ''; vb = b.start_date || ''; break;
        default: va = a.id; vb = b.id;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [allData, search, sortCol, sortDir, statusFilter]);

  const totalPages = Math.ceil(processed.length / perPage) || 1;
  const paginated = processed.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const sortIcon = (col) => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  if (loading) return <ListPageSkeleton cols={6} rows={6} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rental Requests</h1>
        <button
          onClick={() => { setViewMode(viewMode === 'card' ? 'table' : 'card'); setPage(1); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        >
          {viewMode === 'card' ? <><Table className="w-4 h-4" /> Table View</> : <><LayoutGrid className="w-4 h-4" /> Card View</>}
        </button>
      </div>

      {/* Status filter buttons */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'forwarded', label: 'Pending' },
          { key: 'approved', label: 'Approved' },
          { key: 'rejected', label: 'Rejected' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => { setStatusFilter(f.key); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === f.key
                ? f.key === 'approved' ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-sm'
                  : f.key === 'rejected' ? 'bg-red-500 text-white shadow-sm'
                  : f.key === 'forwarded' ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {allData.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">No rental requests yet.</div>
      ) : viewMode === 'card' ? (
        /* ══════════ CARD VIEW ══════════ */
        processed.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">No {statusFilter !== 'all' ? statusFilter : ''} rental requests found.</div>
        ) : (
        <div className="space-y-4">
          {processed.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{r.equipment?.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{r.equipment?.category} • {r.equipment?.location}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              {/* Renter Information */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Renter Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">Name:</span> <span className="font-medium dark:text-gray-200">{r.renter?.name}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Email:</span> <span className="font-medium dark:text-gray-200">{r.renter?.email}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Phone:</span> <span className="font-medium dark:text-gray-200">{r.contact_number}</span></div>
                </div>
              </div>

              {/* Farm & Rental Details */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Farm & Rental Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-start gap-1.5">
                    <Ruler className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Farm Size</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{(parseFloat(r.farm_size_sqm || 0) / 10000).toFixed(2)} hectares</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Clock className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Est. Hours</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{parseFloat(r.estimated_hours || 0)} hrs</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Calendar className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Rental Days</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{r.rental_days} day(s)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Calendar className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Period</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{fmtDate(r.start_date)}{r.rental_days > 1 ? ` — ${fmtDate(r.end_date)}` : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Details</h4>
                <div className="flex items-start gap-1.5 text-sm">
                  <Truck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{r.delivery_address}</span>
                    {r.latitude && r.longitude && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {r.latitude}, {r.longitude}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cost Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Base Cost (₱{fmt(r.equipment?.daily_rate)} × {r.rental_days} day{r.rental_days > 1 ? 's' : ''})</span>
                    <span className="font-medium dark:text-gray-200">₱{fmt(r.base_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Transportation Fee</span>
                    <span className="font-medium dark:text-gray-200">₱{fmt(r.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Service Charge (5%)</span>
                    <span className="font-medium dark:text-gray-200">₱{fmt(r.service_charge)}</span>
                  </div>
                  <div className="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Total Cost</span>
                    <span className="font-bold text-green-700 text-base">₱{fmt(r.total_cost)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2">
                    <Banknote className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">Payment:</span>
                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                      r.payment_method === 'downpayment' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 
                      r.payment_method === 'fullpayment' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {r.payment_method === 'downpayment' ? 'GCash Down Payment (50%)' : 
                       r.payment_method === 'fullpayment' ? 'GCash Full Payment (100%)' : 
                       r.payment_method === 'gcash' ? 'GCash' : 'COD'}
                    </span>
                    {r.payment_proof && (
                      <button onClick={() => setProofImage(`/storage/${r.payment_proof}`)}
                        className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 ml-1">View Proof</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5">
                {r.status === 'forwarded' && (
                  <>
                    <Tooltip text="Approve">
                      <button onClick={() => handleAction(r.id, 'approve')}
                        className="p-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-600 transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                    </Tooltip>
                    <Tooltip text="Reject">
                      <button onClick={() => handleAction(r.id, 'reject')}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  </>
                )}
                <Tooltip text="Archive">
                  <button onClick={(e) => handleArchive(r.id, e)}
                    className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors">
                    <Archive className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}
        </div>
        )
      ) : (
        /* ══════════ TABLE VIEW ══════════ */
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors">
          {/* Toolbar */}
          <div className="p-4 border-b dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-500 dark:text-gray-400">Show</label>
              <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200">
                {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-gray-500 dark:text-gray-400">entries</span>
            </div>
            <input
              type="text" placeholder="Search requests..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none w-64 dark:bg-gray-700 dark:text-gray-200"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {[
                    ['id', '#'],
                    ['equipment', 'Equipment'],
                    ['renter', 'Renter'],
                    ['farm_size', 'Farm Size'],
                    ['start_date', 'Period'],
                    ['total_cost', 'Total Cost'],
                    ['status', 'Status'],
                  ].map(([col, label]) => (
                    <th key={col} onClick={() => toggleSort(col)}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none whitespace-nowrap">
                      {label}{sortIcon(col)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {paginated.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No matching requests.</td></tr>
                ) : paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setSelectedRow(r)}>
                    <td className="px-4 py-3 font-mono text-gray-400">{r.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{r.equipment?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{r.equipment?.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{r.renter?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{r.contact_number}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium dark:text-gray-200">{(parseFloat(r.farm_size_sqm || 0) / 10000).toFixed(2)} ha</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{parseFloat(r.estimated_hours || 0)} hrs • {r.rental_days}d</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium dark:text-gray-200">{fmtDate(r.start_date)}</p>
                      {r.rental_days > 1 && <p className="text-xs text-gray-500 dark:text-gray-400">to {fmtDate(r.end_date)}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-green-700">₱{fmt(r.total_cost)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {r.status === 'forwarded' ? (
                          <>
                            <Tooltip text="Approve">
                              <button onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'approve'); }}
                                className="p-1.5 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded hover:from-green-700 hover:to-emerald-600 transition-colors">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                            <Tooltip text="Reject">
                              <button onClick={(e) => { e.stopPropagation(); handleAction(r.id, 'reject'); }}
                                className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </Tooltip>
                          </>
                        ) : null}
                        <Tooltip text="Archive">
                          <button onClick={(e) => handleArchive(r.id, e)}
                            className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded">
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="px-4 py-3 border-t dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, processed.length)} of {processed.length}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded border dark:border-gray-600 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded border dark:border-gray-600 text-sm ${page === i + 1 ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border-green-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded border dark:border-gray-600 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment proof image modal */}
      {proofImage && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setProofImage(null)}>
          <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setProofImage(null)}
              className="absolute -top-3 -right-3 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-lg font-bold z-10">&times;</button>
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-blue-600 px-4 py-3 text-white text-sm font-semibold text-center">GCash Payment Proof</div>
              <div className="p-4">
                <img src={proofImage} alt="Payment Proof" className="w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Row detail modal */}
      {selectedRow && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedRow(null)}>
          <div className="relative max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedRow(null)}
              className="absolute top-3 right-3 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-lg font-bold z-10">&times;</button>
            <div className="bg-white dark:bg-gray-800 dark:text-white rounded-2xl overflow-hidden shadow-xl p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedRow.equipment?.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{selectedRow.equipment?.category} • {selectedRow.equipment?.location}</p>
                </div>
                <StatusBadge status={selectedRow.status} />
              </div>

              {/* Renter Information */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Renter Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">Name:</span> <span className="font-medium dark:text-gray-200">{selectedRow.renter?.name}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Email:</span> <span className="font-medium dark:text-gray-200">{selectedRow.renter?.email}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Phone:</span> <span className="font-medium dark:text-gray-200">{selectedRow.contact_number}</span></div>
                </div>
              </div>

              {/* Farm & Rental Details */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Farm & Rental Details</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-start gap-1.5">
                    <Ruler className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Farm Size</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{(parseFloat(selectedRow.farm_size_sqm || 0) / 10000).toFixed(2)} hectares</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Clock className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Est. Hours</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{parseFloat(selectedRow.estimated_hours || 0)} hrs</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Calendar className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Rental Days</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{selectedRow.rental_days} day(s)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Calendar className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Period</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{fmtDate(selectedRow.start_date)}{selectedRow.rental_days > 1 ? ` — ${fmtDate(selectedRow.end_date)}` : ''}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Details */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Details</h4>
                <div className="flex items-start gap-1.5 text-sm">
                  <Truck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedRow.delivery_address}</span>
                    {selectedRow.latitude && selectedRow.longitude && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {selectedRow.latitude}, {selectedRow.longitude}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cost Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Base Cost (₱{fmt(selectedRow.equipment?.daily_rate)} × {selectedRow.rental_days} day{selectedRow.rental_days > 1 ? 's' : ''})</span>
                    <span className="font-medium dark:text-gray-200">₱{fmt(selectedRow.base_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Transportation Fee</span>
                    <span className="font-medium dark:text-gray-200">₱{fmt(selectedRow.delivery_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Service Charge (5%)</span>
                    <span className="font-medium dark:text-gray-200">₱{fmt(selectedRow.service_charge)}</span>
                  </div>
                  <div className="border-t dark:border-gray-600 pt-2 mt-2 flex justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Total Cost</span>
                    <span className="font-bold text-green-700 text-base">₱{fmt(selectedRow.total_cost)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2">
                    <Banknote className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500 dark:text-gray-400">Payment:</span>
                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                      selectedRow.payment_method === 'downpayment' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 
                      selectedRow.payment_method === 'fullpayment' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    }`}>
                      {selectedRow.payment_method === 'downpayment' ? 'GCash Down Payment (50%)' : 
                       selectedRow.payment_method === 'fullpayment' ? 'GCash Full Payment (100%)' : 
                       selectedRow.payment_method === 'gcash' ? 'GCash' : 'COD'}
                    </span>
                    {selectedRow.payment_proof && (
                      <button onClick={() => { setSelectedRow(null); setProofImage(`/storage/${selectedRow.payment_proof}`); }}
                        className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 ml-1">View Proof</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5">
                {selectedRow.status === 'forwarded' && (
                  <>
                    <Tooltip text="Approve">
                      <button onClick={() => { handleAction(selectedRow.id, 'approve'); setSelectedRow(null); }}
                        className="p-2 bg-gradient-to-r from-green-600 to-emerald-500 text-white rounded-lg hover:from-green-700 hover:to-emerald-600 transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                    </Tooltip>
                    <Tooltip text="Reject">
                      <button onClick={() => { handleAction(selectedRow.id, 'reject'); setSelectedRow(null); }}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  </>
                )}
                <Tooltip text="Archive">
                  <button onClick={(e) => { handleArchive(selectedRow.id, e); setSelectedRow(null); }}
                    className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors">
                    <Archive className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
