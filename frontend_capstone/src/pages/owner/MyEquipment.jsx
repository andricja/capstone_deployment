// MyEquipment - Owner Equipment Management with Hectare Pricing - Updated 2026-04-11
// Force reload timestamp: 1712851200
console.log('MyEquipment module loaded - v2.0');
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { CardGridSkeleton } from '../../components/Skeleton';
import Pagination from '../../components/Pagination';
import ReceiptModal from '../../components/ReceiptModal';
import LocationPicker from '../../components/LocationPicker';
import { Plus, Pencil, Trash2, Settings, CheckCircle, Eye, Archive, Truck } from 'lucide-react';
import { useToast } from '../../components/Toast';
import Tooltip from '../../components/Tooltip';

const CATEGORIES = ['tractor', 'harvester', 'planter', 'irrigation', 'cultivator', 'sprayer', 'trailer', 'other'];

export default function MyEquipment() {
  const [equipment, setEquipment] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', category: 'tractor', description: '', 
    price_per_hectare: '',
    municipality: '', barangay: '', province: 'Oriental Mindoro',
    latitude: '', longitude: '', image: null,
    transportation_fee_per_km: '15',
  });
  const [submitting, setSubmitting] = useState(false);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [receiptItem, setReceiptItem] = useState(null);

  const fetchEquipment = (p = 1) => {
    setLoading(true);
    api.get('/owner/equipment', { params: { page: p } })
      .then((r) => setEquipment(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEquipment(page); }, [page]);

  useEffect(() => {
    api.get('/addresses/municipalities')
      .then(res => setMunicipalities(res.data.municipalities || []))
      .catch(err => console.error('Failed to load municipalities:', err));
  }, []);

  useEffect(() => {
    if (form.municipality) {
      const url = `/addresses/municipalities/${encodeURIComponent(form.municipality)}/barangays`;
      api.get(url)
        .then(res => setBarangays(res.data.barangays || []))
        .catch(err => {
          console.error('Failed to load barangays:', err);
          setBarangays([]);
        });
    } else {
      setBarangays([]);
    }
  }, [form.municipality]);

  const handleBarangayChange = (selectedBarangay) => {
    setForm(prev => ({ ...prev, barangay: selectedBarangay }));
    
    if (form.municipality && selectedBarangay) {
      const url = `/addresses/municipalities/${encodeURIComponent(form.municipality)}/barangays/${encodeURIComponent(selectedBarangay)}/coordinates`;
      api.get(url)
        .then(res => {
          if (res.data.latitude && res.data.longitude) {
            setForm(prev => ({
              ...prev,
              latitude: String(res.data.latitude),
              longitude: String(res.data.longitude)
            }));
          }
        })
        .catch(err => console.error('API Error:', err));
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ 
      name: '', category: 'tractor', description: '', 
      price_per_hectare: '',
      municipality: '', barangay: '', province: 'Oriental Mindoro',
      latitude: '', longitude: '', image: null,
      transportation_fee_per_km: '15',
    });
    setBarangays([]);
    setShowModal(true);
  };

  const openEdit = (eq) => {
    setEditing(eq);
    setForm({
      name: eq.name, 
      category: eq.category, 
      description: eq.description || '',
      price_per_hectare: eq.price_per_hectare || '',
      municipality: eq.municipality || '', 
      barangay: eq.barangay || '',
      province: eq.province || 'Oriental Mindoro',
      latitude: eq.latitude || '',
      longitude: eq.longitude || '',
      image: null,
      transportation_fee_per_km: eq.transportation_fee_per_km || '15',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== undefined) fd.append(k, v);
      });

      if (editing) {
        fd.append('_method', 'PUT');
        const url = `/owner/equipment/${editing.id}`;
        await api.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Equipment updated.');
      } else {
        await api.post('/owner/equipment', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Equipment submitted for admin review.');
      }
      setShowModal(false);
      fetchEquipment(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save equipment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this equipment?')) return;
    try {
      const url = `/owner/equipment/${id}`;
      await api.delete(url);
      toast.success('Equipment deleted.');
      fetchEquipment(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleArchive = async (id) => {
    if (!confirm('Archive this equipment?')) return;
    try {
      const url = `/owner/archived/equipment/${id}`;
      await api.patch(url);
      toast.success('Equipment archived.');
      fetchEquipment(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive.');
    }
  };

  const toggleStatus = async (id, action) => {
    try {
      const url = `/owner/equipment/${id}/${action}`;
      await api.patch(url);
      toast.success('Equipment status updated.');
      fetchEquipment(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // Calculate tab counts and filter equipment
  const allEquipment = equipment?.data || [];
  const tabs = [
    { id: 'all', label: 'All Equipment', count: allEquipment.length, color: 'gray' },
    { id: 'available', label: 'Available', count: allEquipment.filter(e => e.status === 'available').length, color: 'green' },
    { id: 'rented', label: 'Rented', count: allEquipment.filter(e => e.status === 'rented').length, color: 'blue' },
    { id: 'maintenance', label: 'Maintenance', count: allEquipment.filter(e => e.status === 'maintenance').length, color: 'amber' },
    { id: 'pending', label: 'Pending', count: allEquipment.filter(e => e.status === 'pending').length, color: 'yellow' },
    { id: 'rejected', label: 'Rejected', count: allEquipment.filter(e => e.status === 'rejected').length, color: 'red' },
  ];

  const filteredEquipment = activeTab === 'all' 
    ? allEquipment 
    : allEquipment.filter(e => e.status === activeTab);

  const getTabColorClasses = (tabId, isActive) => {
    const colors = {
      all: {
        active: 'bg-gray-600 text-white border-gray-700',
        inactive: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
      },
      available: {
        active: 'bg-green-600 text-white border-green-700',
        inactive: 'bg-white dark:bg-gray-800 text-green-700 dark:text-green-400 border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
      },
      rented: {
        active: 'bg-blue-600 text-white border-blue-700',
        inactive: 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
      },
      maintenance: {
        active: 'bg-amber-600 text-white border-amber-700',
        inactive: 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
      },
      pending: {
        active: 'bg-yellow-600 text-white border-yellow-700',
        inactive: 'bg-white dark:bg-gray-800 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
      },
      rejected: {
        active: 'bg-red-600 text-white border-red-700',
        inactive: 'bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
      }
    };
    return colors[tabId]?.[isActive ? 'active' : 'inactive'] || colors.all.inactive;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Equipment</h1>
        <button onClick={openAdd} className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-600 flex items-center gap-1">
          <Plus /> Add Equipment
        </button>
      </div>

      {/* Status Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1); // Reset to first page when changing tabs
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${getTabColorClasses(tab.id, activeTab === tab.id)}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === tab.id 
                    ? 'bg-white/20' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton count={4} />
      ) : allEquipment.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>You haven&apos;t listed any equipment yet.</p>
          <button onClick={openAdd} className="mt-3 text-green-600 hover:underline font-medium">Add your first equipment</button>
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-lg mb-2">No equipment in this category</p>
          <p className="text-sm">Try selecting a different tab or add new equipment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEquipment.map((eq) => (
            <div key={eq.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {eq.image ? (
                    <img src={`/storage/${eq.image}`} alt={eq.name} className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl text-gray-300">📦</div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{eq.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {eq.category} • {eq.barangay ? `Brgy. ${eq.barangay}, ${eq.municipality}` : eq.location || eq.municipality}
                    </p>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">
                      ₱{(parseFloat(eq.price_per_hectare || 0)).toLocaleString()}/hectare
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <StatusBadge status={eq.status} />
                  {eq.status === 'available' && (
                    <Tooltip text="Set Maintenance">
                      <button onClick={() => toggleStatus(eq.id, 'set-maintenance')}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded border border-amber-200">
                        <Settings className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  )}
                  {(eq.status === 'rented' || eq.status === 'maintenance') && (
                    <Tooltip text="Set Available">
                      <button onClick={() => toggleStatus(eq.id, 'set-available')}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded border border-green-200">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  )}
                  {eq.approval_fee != null && eq.approved_at && (
                    <Tooltip text="View Receipt">
                      <button onClick={() => setReceiptItem(eq)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-200">
                        <Eye className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  )}
                  {(eq.status === 'pending' || eq.status === 'rejected') && (
                    <>
                      <Tooltip text="Edit">
                        <button onClick={() => openEdit(eq)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded border border-blue-200">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip text="Delete">
                        <button onClick={() => handleDelete(eq.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip text="Archive">
                    <button onClick={() => handleArchive(eq.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded border border-amber-200">
                      <Archive className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
          <Pagination data={equipment} onPageChange={setPage} />
        </div>
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 dark:text-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{editing ? 'Edit Equipment' : 'Add Equipment'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipment Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none capitalize dark:bg-gray-700 dark:text-gray-200">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price per hectare (₱)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  required 
                  value={form.price_per_hectare}
                  onChange={(e) => setForm({ ...form, price_per_hectare: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" 
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter price per hectare
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none resize-none dark:bg-gray-700 dark:text-gray-200" />
              </div>

              <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Equipment Location</p>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Municipality <span className="text-red-500">*</span>
                  </label>
                  <select 
                    required 
                    value={form.municipality}
                    onChange={(e) => setForm({ ...form, municipality: e.target.value, barangay: '', latitude: '', longitude: '' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
                  >
                    <option value="">Select Municipality</option>
                    {municipalities.map(mun => (
                      <option key={mun} value={mun}>{mun}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Barangay <span className="text-red-500">*</span>
                  </label>
                  <select 
                    required 
                    value={form.barangay}
                    onChange={(e) => handleBarangayChange(e.target.value)}
                    disabled={!form.municipality}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Barangay</option>
                    {barangays.map(brgy => (
                      <option key={brgy} value={brgy}>{brgy}</option>
                    ))}
                  </select>
                  {!form.municipality && (
                    <p className="text-xs text-gray-400 mt-1">Select municipality first</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Province
                  </label>
                  <input 
                    type="text" 
                    value="Oriental Mindoro"
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
                  />
                </div>
                <LocationPicker
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={({ latitude, longitude }) => {
                    setForm(prev => ({ ...prev, latitude, longitude }));
                  }}
                />
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  📍 Click on the map to set your equipment location. Coordinates are required for automatic transportation fee calculation.
                </p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Truck className="inline w-4 h-4 mr-1 -mt-0.5" />Transportation Fee per KM (₱)
                </label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={form.transportation_fee_per_km || '15'}
                  onChange={(e) => setForm({ ...form, transportation_fee_per_km: e.target.value })}
                  placeholder="15"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" 
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Set your transportation fee per kilometer. Default: ₱15/km
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Equipment Image</label>
                <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-600 disabled:opacity-50">
                  {submitting ? 'Saving...' : editing ? 'Update Equipment' : 'Submit for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ReceiptModal equipment={receiptItem} onClose={() => setReceiptItem(null)} />
    </div>
  );
}
