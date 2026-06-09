import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { ListPageSkeleton } from '../../components/Skeleton';
import RentalReceiptModal from '../../components/RentalReceiptModal';
import { Eye, LayoutGrid, Table, Banknote, Archive } from 'lucide-react';
import { useToast } from '../../components/Toast';
import Tooltip from '../../components/Tooltip';

export default function MyRentals() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiptItem, setReceiptItem] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'forwarded' | 'approved' | 'rejected'
  const toast = useToast();

  // DataTable state
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [perPage, setPerPage] = useState(10);
  const [page, setPage] = useState(1);

  const fetchAll = () => {
    setLoading(true);
    api.get('/renter/rental-requests', { params: { all: 1 } })
      .then((r) => setAllData(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleArchive = async (id) => {
    if (!confirm('Archive this rental request?')) return;
    try {
      await api.patch(`/renter/archived/rentals/${id}`);
      toast.success('Rental archived.');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive.');
    }
  };

  const fmt = (v) => parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  // Filtered + sorted
  const processed = useMemo(() => {
    let rows = [...allData];
    if (statusFilter !== 'all') {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        (r.equipment?.name || '').toLowerCase().includes(q) ||
        (r.equipment?.category || '').toLowerCase().includes(q) ||
        (r.delivery_address || '').toLowerCase().includes(q) ||
        (r.status || '').toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'equipment': va = a.equipment?.name || ''; vb = b.equipment?.name || ''; break;
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

  if (loading) return <ListPageSkeleton cols={5} rows={6} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Rentals</h1>
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
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {allData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">You have no rental requests yet.</div>
      ) : viewMode === 'card' ? (
        /* ══════════ CARD VIEW ══════════ */
        processed.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No {statusFilter !== 'all' ? statusFilter : ''} rental requests found.</div>
        ) : (
        <div className="space-y-4">
          {processed.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{r.equipment?.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{r.equipment?.category} • {r.equipment?.location}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500 dark:text-gray-400">Farm Size:</span> <span className="font-medium">{(parseFloat(r.farm_size_sqm || 0) / 10000).toFixed(2)} hectares</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Est. Hours:</span> <span className="font-medium">{parseFloat(r.estimated_hours || 0)} hrs</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Days:</span> <span className="font-medium">{r.rental_days}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Period:</span> <span className="font-medium">{fmtDate(r.start_date)}{r.rental_days > 1 ? ` — ${fmtDate(r.end_date)}` : ''}</span></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mt-2">
                <div><span className="text-gray-500 dark:text-gray-400">Base Cost:</span> <span className="font-medium">₱{fmt(r.base_cost)}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Delivery:</span> <span className="font-medium">₱{fmt(r.delivery_fee)}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Service:</span> <span className="font-medium">₱{fmt(r.service_charge)}</span></div>
                <div><span className="text-gray-500 dark:text-gray-400">Total:</span> <span className="font-bold text-green-700">₱{fmt(r.total_cost)}</span></div>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-sm">
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

              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Delivery: {r.delivery_address}</p>
                  {r.equipment?.owner && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Owner: {r.equipment.owner.name} ({r.equipment.owner.email})</p>}
                </div>
                <div className="flex items-center gap-1.5">
                  <Tooltip text="View Receipt">
                    <button
                      onClick={() => setReceiptItem(r)}
                      className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  <Tooltip text="Archive">
                    <button
                      onClick={() => handleArchive(r.id)}
                      className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
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
              type="text" placeholder="Search rentals..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200 w-64"
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
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No matching rentals.</td></tr>
                ) : paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-mono text-gray-400 dark:text-gray-500">{r.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{r.equipment?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{r.equipment?.category}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium">{(parseFloat(r.farm_size_sqm || 0) / 10000).toFixed(2)} ha</p>
                      <p className="text-xs text-gray-500">{parseFloat(r.estimated_hours || 0)} hrs • {r.rental_days}d</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium">{fmtDate(r.start_date)}</p>
                      {r.rental_days > 1 && <p className="text-xs text-gray-500">to {fmtDate(r.end_date)}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-green-700">₱{fmt(r.total_cost)}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Tooltip text="View Receipt">
                          <button onClick={() => setReceiptItem(r)}
                            className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Tooltip>
                        <Tooltip text="Archive">
                          <button onClick={() => handleArchive(r.id)}
                            className="p-1.5 text-amber-600 bg-amber-50 rounded hover:bg-amber-100">
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
                className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => setPage(i + 1)}
                  className={`px-3 py-1 rounded border text-sm ${page === i + 1 ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border-green-600' : 'hover:bg-gray-50'}`}>
                  {i + 1}
                </button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Rental receipt modal */}
      {receiptItem && <RentalReceiptModal rental={receiptItem} onClose={() => setReceiptItem(null)} />}

      {/* Payment proof image modal */}
      {proofImage && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setProofImage(null)}>
          <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setProofImage(null)}
              className="absolute -top-3 -right-3 bg-white text-gray-600 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 text-lg font-bold z-10">&times;</button>
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
    </div>
  );
}
