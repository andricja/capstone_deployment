import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmModal from '../../components/ConfirmModal';
import { Trash2, Eye, EyeOff, ExternalLink, Calendar } from 'lucide-react';

function ManageAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
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

  // Pagination calculations
  const totalPages = Math.ceil(ads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAds = ads.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Manage Ads</h1>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {ads.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            No ads available.
          </div>
        ) : (
          <>
            {currentAds.map((ad) => (
              <div key={ad.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                <div className="flex flex-col gap-3">
                  {/* Image section - full width on mobile */}
                  {ad.image && (
                    <div className="w-full h-40 sm:h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img src={`/storage/${ad.image}`} alt={ad.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  {/* Content section */}
                  <div className="space-y-2">
                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words pr-2">{ad.title}</h3>
                    
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${ad.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {ad.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 whitespace-nowrap">
                        Order: {ad.display_order}
                      </span>
                    </div>
                    
                    {/* Description */}
                    {ad.description && (
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ad.description}</p>
                    )}
                    
                    {/* Links and dates */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {ad.link_url && (
                        <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
                          <ExternalLink className="w-3 h-3" />Link
                        </a>
                      )}
                      {ad.start_date && (
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="w-3 h-3" />Start: {formatDate(ad.start_date)}
                        </span>
                      )}
                      {ad.end_date && (
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Calendar className="w-3 h-3" />End: {formatDate(ad.end_date)}
                        </span>
                      )}
                    </div>
                    
                    {/* Action buttons at bottom */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <button 
                        onClick={() => handleToggleStatus(ad)} 
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={ad.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {ad.status === 'active' ? (
                          <>
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            <span className="hidden sm:inline">Inactive</span>
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => handleDelete(ad.id)} 
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  {/* Items per page selector */}
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <label className="text-gray-600 dark:text-gray-400">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                    >
                      <option value={5}>5 items</option>
                      <option value={10}>10 items</option>
                    </select>
                    <span className="text-gray-600 dark:text-gray-400">
                      Showing {startIndex + 1}-{Math.min(endIndex, ads.length)} of {ads.length}
                    </span>
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center justify-center sm:justify-end gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      Prev
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, idx) => {
                        const pageNum = idx + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-green-600 text-white'
                                  : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return <span key={pageNum} className="px-1 sm:px-2 text-gray-500 text-xs sm:text-sm">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
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

export default ManageAds;
