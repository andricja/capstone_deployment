import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { TableSkeleton } from '../../components/Skeleton';
import Pagination from '../../components/Pagination';
import { Check, X } from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function AdminPoints() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const [previewImg, setPreviewImg] = useState(null);

  const fetch = (p = 1) => {
    setLoading(true);
    const params = { page: p };
    if (filter) params.status = filter;
    api.get('/admin/points-requests', { params })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(page); }, [page, filter]);

  const handleAction = async (id, action) => {
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this points request?`)) return;
    try {
      await api.patch(`/admin/points-requests/${id}/${action}`);
      toast.success(`Points request ${action}d.`);
      fetch(page);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action}.`);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Points Requests</h1>
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none">
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : data?.data?.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No points requests found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-green-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renter</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proof</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.data.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-gray-600">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium">{r.renter?.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.renter?.email}</td>
                    <td className="px-4 py-3 text-green-700 font-medium">₱{parseFloat(r.amount_paid).toLocaleString()}</td>
                    <td className="px-4 py-3 font-medium">{r.points_requested}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => setPreviewImg(`/storage/${r.payment_proof}`)}
                        className="text-blue-600 hover:underline text-xs">View Proof</button>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3">
                      {r.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => handleAction(r.id, 'approve')}
                            className="text-green-600 hover:bg-green-50 p-1 rounded" title="Approve">
                            <Check className="text-lg" />
                          </button>
                          <button onClick={() => handleAction(r.id, 'reject')}
                            className="text-red-500 hover:bg-red-50 p-1 rounded" title="Reject">
                            <X className="text-lg" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination data={data} onPageChange={setPage} />
        </div>
      )}

      {/* Image preview modal */}
      {previewImg && createPortal(
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPreviewImg(null)}>
          <div className="bg-white rounded-2xl p-4 max-w-lg w-full">
            <h3 className="font-semibold text-gray-900 mb-3">Payment Proof</h3>
            <img src={previewImg} alt="Payment proof" className="w-full rounded-lg" />
            <button onClick={() => setPreviewImg(null)} className="mt-3 w-full py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200">Close</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
