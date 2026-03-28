import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { TableSkeleton } from '../../components/Skeleton';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import { useToast } from '../../components/Toast';

export default function BuyPoints() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Form
  const [points, setPoints] = useState(1);
  const [proof, setProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = (p = 1) => {
    setLoading(true);
    api.get('/renter/points-requests', { params: { page: p } })
      .then((r) => setRequests(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(page); }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!proof) { toast.error('Please upload payment proof.'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('points_requested', points);
      fd.append('payment_proof', proof);
      await api.post('/renter/points-requests', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Points request submitted! Awaiting admin verification.');
      setPoints(1);
      setProof(null);
      fetchRequests(1);
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Buy Points</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Current balance: <span className="font-bold text-yellow-600">{user.points} points</span></p>

      {/* Purchase form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-6 mb-8 transition-colors">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Purchase Points</h2>
        <div className="bg-blue-50 rounded-lg p-4 mb-4 text-sm text-blue-800">
          <p><strong>Rate:</strong> ₱20 per point</p>
          <p className="mt-1">Make a GCash payment to the equipment owner's account, then upload the screenshot as proof.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points to Purchase</label>
              <input type="number" min="1" value={points} onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" />
            </div>
            <div className="flex items-end">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-2 w-full text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                <p className="text-2xl font-bold text-green-700">₱{(points * 20).toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Proof (GCash Screenshot)</label>
            <input type="file" accept="image/*" onChange={(e) => setProof(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          </div>
          <button type="submit" disabled={submitting}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-6 py-2.5 rounded-lg font-medium hover:from-green-700 hover:to-emerald-600 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Points Request'}
          </button>
        </form>
      </div>

      {/* Request history */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors">
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Points Request History</h2>
        </div>
        {loading ? (
          <TableSkeleton rows={4} cols={4} />
        ) : requests?.data?.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No points requests yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {requests.data.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium">{r.points_requested}</td>
                    <td className="px-4 py-3 text-green-700">₱{parseFloat(r.amount_paid).toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination data={requests} onPageChange={setPage} />
      </div>
    </div>
  );
}
