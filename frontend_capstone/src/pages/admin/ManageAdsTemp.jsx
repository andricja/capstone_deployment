import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmModal from '../../components/ConfirmModal';
import { Trash2, Eye, EyeOff, ExternalLink, Calendar, Plus, X } from 'lucide-react';

function ManageAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link_url: '',
    status: 'active',
    display_order: 0,
    start_date: '',
    end_date: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();
  const { confirm, isOpen, config, handleConfirm, handleClose } = useConfirm();

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await api.get('/admin/ads');
      setAds(response.data || []);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
      toast.error('Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAd(null);
    setFormData({
      title: '',
      description: '',
      link_url: '',
      status: 'active',
      display_order: 0,
      start_date: '',
      end_date: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title || '',
      description: ad.description || '',
      link_url: ad.link_url || '',
      status: ad.status || 'active',
      display_order: ad.display_order || 0,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
    });
    setImageFile(null);
    setImagePreview(ad.image ? `/storage/${ad.image}` : null);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('link_url', formData.link_url);
    data.append('status', formData.status);
    data.append('display_order', formData.display_order);
    if (formData.start_date) data.append('start_date', formData.start_date);
    if (formData.end_date) data.append('end_date', formData.end_date);
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingAd) {
        await api.post(`/admin/ads/${editingAd.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
          params: { _method: 'PUT' }
        });
        toast.success('Ad updated successfully');
      } else {
        await api.post('/admin/ads', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Ad created successfully');
      }
      setShowModal(false);
      fetchAds();
    } catch (error) {
      console.error('Failed to save ad:', error);
      toast.error(error.response?.data?.message || 'Failed to save ad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Delete Ad',
      message: 'Are you sure you want to delete this ad? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true
    });
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/admin/ads/${id}`);
      toast.success('Ad deleted successfully');
      fetchAds();
    } catch (error) {
      console.error('Failed to delete ad:', error);
      toast.error('Failed to delete ad');
    }
  };

  const handleToggleStatus = async (ad) => {
    try {
      await api.post(`/admin/ads/${ad.id}/toggle-status`);
      toast.success(`Ad ${ad.status === 'active' ? 'deactivated' : 'activated'}`);
      fetchAds();
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error('Failed to update ad status');
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-PH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <div className="p-6">Loading ads...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Ads</h1>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white rounded-lg font-medium transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Ad
        </button>
      </div>

      <div className="grid gap-4">
        {ads.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
            No ads available. Click "Create Ad" to get started.
          </div>
        ) : (
          ads.map((ad) => (
            <div key={ad.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex gap-4">
                {ad.image && (
                  <div className="flex-shrink-0 w-32 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img src={`/storage/${ad.image}`} alt={ad.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ad.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ad.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {ad.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          Order: {ad.display_order}
                        </span>
                      </div>
                      {ad.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{ad.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {ad.link_url && (
                          <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                            <ExternalLink className="w-3 h-3" />Link
                          </a>
                        )}
                        {ad.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Start: {formatDate(ad.start_date)}</span>}
                        {ad.end_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />End: {formatDate(ad.end_date)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleStatus(ad)} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title={ad.status === 'active' ? 'Deactivate' : 'Activate'}>
                        {ad.status === 'active' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDelete(ad.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Create/Edit Ad Modal ── */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl my-8" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingAd ? 'Edit Ad' : 'Create New Ad'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content - Scrollable */}
            <div className="px-6 py-4 max-h-[calc(90vh-200px)] overflow-y-auto">
              <form id="adForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors" 
                    required 
                    placeholder="Enter ad title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    rows={3} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none transition-colors" 
                    placeholder="Enter ad description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ad Image</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-green-900/20 dark:file:text-green-400 transition-colors" 
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg border border-gray-300 dark:border-gray-600" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">External Link URL</label>
                  <input 
                    type="url" 
                    value={formData.link_url} 
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} 
                    placeholder="https://example.com" 
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={formData.status} 
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors" 
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Order</label>
                    <input 
                      type="number" 
                      value={formData.display_order} 
                      onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} 
                      min="0" 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={formData.start_date} 
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={formData.end_date} 
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} 
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors" 
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="adForm"
                disabled={submitting}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  editingAd ? 'Update Ad' : 'Create Ad'
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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

export default ManageAds;
