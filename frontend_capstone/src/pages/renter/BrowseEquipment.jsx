import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { CardGridSkeleton } from '../../components/Skeleton';
import DualLocationPicker from '../../components/DualLocationPicker';
import AdCarousel from '../../components/AdCarousel';
import PaymentModal from '../../components/PaymentModal';
import { Search, MapPin, Ruler, Clock, Calendar, Truck, Calculator, LayoutGrid, Table, Banknote, Upload, ImageIcon, X, CheckCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';

const CATEGORIES = ['', 'tractor', 'harvester', 'planter', 'irrigation', 'cultivator', 'sprayer', 'trailer', 'other'];
const MUNICIPALITIES = [
  '', 'Baco', 'Bansud', 'Bongabong', 'Bulalacao', 'Calapan', 'Gloria',
  'Mansalay', 'Naujan', 'Pinamalayan', 'Pola', 'Puerto Galera',
  'Roxas', 'San Teodoro', 'Socorro', 'Victoria',
];

// Note: Coverage rates are now set by equipment owners, not fixed by category

export default function BrowseEquipment() {
  const navigate = useNavigate();
  const toast = useToast();
  const [allEquipment, setAllEquipment] = useState([]);
  const [filters, setFilters] = useState({ location: '', category: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('card');

  // DataTable state
  const [tableSearch, setTableSearch] = useState('');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [perPage, setPerPage] = useState(12);
  const [page, setPage] = useState(1);

  // Rental modal
  const [selected, setSelected] = useState(null);
  const [rentalForm, setRentalForm] = useState({
    contact_number: '', farm_size_hectares: '', start_date: '',
    sitio_street: '', barangay: '', municipality: '', province: 'Oriental Mindoro',
    latitude: '', longitude: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [calculatedTransportationFee, setCalculatedTransportationFee] = useState(0);

  // Success and payment modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdRental, setCreatedRental] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Address dropdowns
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // Auto-calculated cost breakdown (mirrors backend logic)
  const costBreakdown = useMemo(() => {
    if (!selected || !rentalForm.farm_size_hectares || parseFloat(rentalForm.farm_size_hectares) < 0.25) return null;
    const farmSizeHectares = parseFloat(rentalForm.farm_size_hectares);
    
    // Calculate base cost based on pricing model
    let baseCost = 0;
    const pricingModel = selected.pricing_model || 'per_hectare';
    
    if (pricingModel === 'per_hectare') {
      // Hectare-based pricing: price per hectare × farm size
      const pricePerHectare = parseFloat(selected.price_per_hectare || 0);
      baseCost = pricePerHectare * farmSizeHectares;
    } else {
      // Flat rate pricing: fixed price regardless of farm size
      baseCost = parseFloat(selected.price_per_equipment || 0);
    }
    
    const deliveryFee = calculatedTransportationFee; // Use the calculated fee from DualLocationPicker
    const totalCost = baseCost + deliveryFee;
    const estimatedHours = Math.max(Math.ceil(farmSizeHectares * 6.7 * 10) / 10, 1); // Rough estimate: 6.7 hours per hectare
    const rentalDays = Math.max(Math.ceil(estimatedHours / 8), 1);
    return { farmSizeHectares, estimatedHours, rentalDays, baseCost, deliveryFee, totalCost, pricingModel };
  }, [selected, rentalForm.farm_size_hectares, calculatedTransportationFee]);

  const fetchEquipment = () => {
    setLoading(true);
    const params = { all: 1 };
    if (filters.location) params.location = filters.location;
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    api.get('/equipment', { params })
      .then((r) => setAllEquipment(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEquipment(); }, []);

  // Load municipalities on mount
  useEffect(() => {
    api.get('/addresses/municipalities')
      .then(res => setMunicipalities(res.data.municipalities || []))
      .catch(err => console.error('Failed to load municipalities:', err));
  }, []);

  // Load barangays when municipality changes
  useEffect(() => {
    if (rentalForm.municipality) {
      api.get(`/addresses/municipalities/${encodeURIComponent(rentalForm.municipality)}/barangays`)
        .then(res => setBarangays(res.data.barangays || []))
        .catch(err => {
          console.error('Failed to load barangays:', err);
          setBarangays([]);
        });
    } else {
      setBarangays([]);
    }
  }, [rentalForm.municipality]);

  const handleFilter = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEquipment();
  };

  const openRentalModal = (eq) => {
    setSelected(eq);
    setRentalForm({ 
      contact_number: '', 
      farm_size_hectares: '', 
      start_date: '', 
      sitio_street: '', 
      barangay: '', 
      municipality: '', 
      province: 'Oriental Mindoro',
      latitude: '', 
      longitude: '',
    });
    setBarangays([]);
    setCalculatedTransportationFee(0);
  };

  const submitRental = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('equipment_id', selected.id);
      formData.append('contact_number', rentalForm.contact_number);
      // Convert hectares to sqm for backend
      const farmSizeSqm = parseFloat(rentalForm.farm_size_hectares) * 10000;
      formData.append('farm_size_sqm', farmSizeSqm);
      formData.append('start_date', rentalForm.start_date);
      
      // Structured address fields
      formData.append('sitio_street', rentalForm.sitio_street);
      formData.append('barangay', rentalForm.barangay);
      formData.append('municipality', rentalForm.municipality);
      formData.append('province', rentalForm.province);
      
      // Coordinates are required for transportation fee calculation
      formData.append('latitude', parseFloat(rentalForm.latitude) || 0);
      formData.append('longitude', parseFloat(rentalForm.longitude) || 0);

      const response = await api.post('/renter/rental-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Store created rental and show success modal
      setCreatedRental(response.data.rental_request);
      setSelected(null);
      setShowSuccessModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit rental request.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) => parseFloat(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Filtered + sorted rows for table view
  const processed = useMemo(() => {
    let rows = [...allEquipment];
    if (tableSearch) {
      const q = tableSearch.toLowerCase();
      rows = rows.filter((eq) =>
        (eq.name || '').toLowerCase().includes(q) ||
        (eq.category || '').toLowerCase().includes(q) ||
        (eq.location || '').toLowerCase().includes(q) ||
        (eq.owner?.name || '').toLowerCase().includes(q) ||
        (eq.status || '').toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      let va, vb;
      switch (sortCol) {
        case 'name': va = a.name || ''; vb = b.name || ''; break;
        case 'category': va = a.category || ''; vb = b.category || ''; break;
        case 'location': va = a.location || ''; vb = b.location || ''; break;
        case 'daily_rate': va = parseFloat(a.price_per_hectare || 0); vb = parseFloat(b.price_per_hectare || 0); break;
        case 'status': va = a.status || ''; vb = b.status || ''; break;
        default: va = a.id; vb = b.id;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [allEquipment, tableSearch, sortCol, sortDir]);

  const totalPages = Math.ceil(processed.length / perPage) || 1;
  const paginated = processed.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const sortIcon = (col) => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Equipment</h1>
        <button
          onClick={() => { setViewMode(viewMode === 'card' ? 'table' : 'card'); setPage(1); }}
          className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        >
          {viewMode === 'card' ? <><Table className="w-4 h-4" /> Table View</> : <><LayoutGrid className="w-4 h-4" /> Card View</>}
        </button>
      </div>

      {/* Ad Carousel */}
      <AdCarousel />

      {/* Filters */}
      <form onSubmit={handleFilter} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-4 mb-6 flex flex-wrap gap-3 items-end transition-colors">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"><MapPin className="inline mr-1 w-3 h-3" />Municipality</label>
          <select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200">
            {MUNICIPALITIES.map((m) => <option key={m} value={m}>{m || 'All Locations'}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
          <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All Categories'}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-600 flex items-center gap-1">
          <Search className="w-4 h-4" /> Filter
        </button>
      </form>

      {/* Equipment listing */}
      {loading ? (
        <CardGridSkeleton count={6} />
      ) : allEquipment.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No equipment found matching your filters.</div>
      ) : viewMode === 'card' ? (
        /* ══════════ CARD VIEW ══════════ */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allEquipment.map((eq) => (
            <div key={eq.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 overflow-hidden transition-colors">
              {eq.image ? (
                <img src={`/storage/${eq.image}`} alt={eq.name} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-4xl text-gray-300">🚜</div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{eq.name}</h3>
                  <StatusBadge status={eq.status} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">{eq.category} • {eq.location}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{eq.description || 'No description provided.'}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-green-700">
                      {eq.pricing_model === 'per_equipment' 
                        ? `₱${parseFloat(eq.price_per_equipment || 0).toLocaleString()}` 
                        : `₱${parseFloat(eq.price_per_hectare || 0).toLocaleString()}`
                      }
                      <span className="text-xs font-normal text-gray-500">
                        {eq.pricing_model === 'per_equipment' ? '/equipment' : '/hectare'}
                      </span>
                    </p>
                    
                  </div>
                  {eq.status === 'available' ? (
                    <button onClick={() => openRentalModal(eq)}
                      className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-600">
                      Request Rental
                    </button>
                  ) : (
                    <button disabled
                      className="bg-gray-400 text-white px-3 py-1.5 rounded-lg text-sm font-medium cursor-not-allowed opacity-60">
                      {eq.status === 'rented' ? 'Currently Rented' : 'Unavailable'}
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  {eq.owner && <p className="text-xs text-gray-400">Owner: {eq.owner.name}</p>}
                  <StatusBadge status={eq.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors">
          {/* Toolbar */}
          <div className="p-4 border-b dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-500 dark:text-gray-400">Show</label>
              <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200">
                {[6, 12, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-gray-500 dark:text-gray-400">entries</span>
            </div>
            <input
              type="text" placeholder="Search equipment..."
              value={tableSearch} onChange={(e) => { setTableSearch(e.target.value); setPage(1); }}
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
                    ['name', 'Equipment'],
                    ['category', 'Category'],
                    ['location', 'Location'],
                    ['daily_rate', 'Price/sqm'],
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
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No matching equipment.</td></tr>
                ) : paginated.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-mono text-gray-400 dark:text-gray-500">{eq.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {eq.image ? (
                          <img src={`/storage/${eq.image}`} alt={eq.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg text-gray-300">🚜</div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{eq.name}</p>
                          {eq.owner && <p className="text-xs text-gray-400 dark:text-gray-500">Owner: {eq.owner.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{eq.category}</td>
                    <td className="px-4 py-3">{eq.location}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-bold text-green-700">
                        {eq.pricing_model === 'per_equipment' 
                          ? `₱${parseFloat(eq.price_per_equipment || 0).toLocaleString()}/eq` 
                          : `₱${parseFloat(eq.price_per_hectare || 0).toLocaleString()}/ha`
                        }
                      </p>
                      
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={eq.status} /></td>
                    <td className="px-4 py-3">
                      {eq.status === 'available' ? (
                        <button onClick={() => openRentalModal(eq)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg hover:from-green-700 hover:to-emerald-600">
                          Request Rental
                        </button>
                      ) : (
                        <button disabled
                          className="px-3 py-1.5 text-xs font-medium text-white bg-gray-400 rounded-lg cursor-not-allowed opacity-60">
                          {eq.status === 'rented' ? 'Currently Rented' : 'Unavailable'}
                        </button>
                      )}
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

      {/* Rental modal — farm-size based */}
      {selected && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            {/* Header with close button */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Request Rental</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selected.name} <span className="capitalize">({selected.category})</span> — 
                  {selected.pricing_model === 'per_equipment' 
                    ? ` ₱${parseFloat(selected.price_per_equipment || 0).toLocaleString()}/equipment (Flat Rate)` 
                    : ` ₱${parseFloat(selected.price_per_hectare || 0).toLocaleString()}/hectare`
                  }
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={submitRental} className="space-y-3">
              {/* Pricing info banner */}
              {selected.pricing_model === 'per_equipment' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                    💰 Flat Rate Pricing: ₱{parseFloat(selected.price_per_equipment || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    This equipment has a fixed rental price regardless of farm size.
                  </p>
                </div>
              )}

              {/* Farm Size — conditional based on pricing model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Ruler className="inline w-4 h-4 mr-1 -mt-0.5" />Farm Size (hectares)
                  {selected.pricing_model === 'per_equipment' && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(for time estimation only)</span>
                  )}
                </label>
                <input 
                  type="number" 
                  min="0.25" 
                  step="0.01" 
                  required 
                  value={rentalForm.farm_size_hectares}
                  onChange={(e) => setRentalForm({ ...rentalForm, farm_size_hectares: e.target.value })}
                  placeholder="e.g. 0.5"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" 
                />
                <p className="text-xs text-gray-400 mt-1">
                  {selected.pricing_model === 'per_equipment' 
                    ? 'Farm size is used to estimate working hours and rental days only.'
                    : 'Minimum 0.25 hectares (2,500 sqm) - one-fourth of a hectare.'
                  }
                </p>
              </div>

              {/* Auto-calculated estimates — shown when farm_size_sqm is valid */}
              {costBreakdown && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                  {selected.pricing_model === 'per_equipment' ? (
                    /* Flat Rate - Show base price separately */
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-green-200 dark:border-green-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Equipment Rental (Flat Rate)</span>
                        <span className="text-lg font-bold text-green-700 dark:text-green-400">₱{fmt(costBreakdown.baseCost)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <Clock className="w-4 h-4 mx-auto text-green-600 dark:text-green-400 mb-1" />
                          <p className="text-sm font-bold text-green-700 dark:text-green-400">{costBreakdown.estimatedHours}h</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Est. Hours</p>
                        </div>
                        <div className="text-center">
                          <Calendar className="w-4 h-4 mx-auto text-green-600 dark:text-green-400 mb-1" />
                          <p className="text-sm font-bold text-green-700 dark:text-green-400">{costBreakdown.rentalDays}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Days</p>
                        </div>
                        <div className="text-center">
                          <Calculator className="w-4 h-4 mx-auto text-green-600 dark:text-green-400 mb-1" />
                          <p className="text-sm font-bold text-green-700 dark:text-green-400">₱{fmt(costBreakdown.totalCost)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Per Hectare - Show calculation breakdown */
                    <div className="flex gap-4">
                      <div className="flex-1 text-center">
                        <Clock className="w-4 h-4 mx-auto text-green-600 dark:text-green-400 mb-1" />
                        <p className="text-lg font-bold text-green-700 dark:text-green-400">{costBreakdown.estimatedHours}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Est. Hours</p>
                      </div>
                      <div className="flex-1 text-center">
                        <Calendar className="w-4 h-4 mx-auto text-green-600 dark:text-green-400 mb-1" />
                        <p className="text-lg font-bold text-green-700 dark:text-green-400">{costBreakdown.rentalDays}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Rental Day(s)</p>
                      </div>
                      <div className="flex-1 text-center">
                        <Calculator className="w-4 h-4 mx-auto text-green-600 dark:text-green-400 mb-1" />
                        <p className="text-lg font-bold text-green-700 dark:text-green-400">₱{fmt(costBreakdown.totalCost)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Cost</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Number</label>
                <input type="text" required value={rentalForm.contact_number}
                  onChange={(e) => setRentalForm({ ...rentalForm, contact_number: e.target.value })}
                  placeholder="e.g. 09171234567"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input type="date" required value={rentalForm.start_date}
                  onChange={(e) => setRentalForm({ ...rentalForm, start_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" />
                {costBreakdown && rentalForm.start_date && (
                  <p className="text-xs text-gray-400 mt-1">
                    End date (auto): {new Date(new Date(rentalForm.start_date).getTime() + costBreakdown.rentalDays * 86400000).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Structured Address - 4 Fields */}
              <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <MapPin className="inline w-4 h-4 mr-1 -mt-0.5" />Delivery Address
                </p>

                {/* 1. Sitio/Street */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Sitio / Street / House Number
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={rentalForm.sitio_street}
                    onChange={(e) => setRentalForm({ ...rentalForm, sitio_street: e.target.value })}
                    placeholder="e.g., Purok 1, Sitio Maligaya"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" 
                  />
                </div>

                {/* 2. Municipality */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Municipality
                  </label>
                  <select 
                    required 
                    value={rentalForm.municipality}
                    onChange={(e) => setRentalForm({ ...rentalForm, municipality: e.target.value, barangay: '' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
                  >
                    <option value="">Select Municipality</option>
                    {municipalities.map(mun => (
                      <option key={mun} value={mun}>{mun}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Barangay */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Barangay
                  </label>
                  <select 
                    required 
                    value={rentalForm.barangay}
                    onChange={(e) => setRentalForm({ ...rentalForm, barangay: e.target.value })}
                    disabled={!rentalForm.municipality}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Barangay</option>
                    {barangays.map(brgy => (
                      <option key={brgy} value={brgy}>{brgy}</option>
                    ))}
                  </select>
                  {!rentalForm.municipality && (
                    <p className="text-xs text-gray-400 mt-1">Select municipality first</p>
                  )}
                </div>

                {/* 4. Province (Fixed) */}
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
              </div>

              {/* Dual Location Map - Shows both equipment and delivery locations */}
              <DualLocationPicker
                equipmentLatitude={selected?.latitude}
                equipmentLongitude={selected?.longitude}
                equipmentName={selected?.name}
                deliveryLatitude={rentalForm.latitude}
                deliveryLongitude={rentalForm.longitude}
                freeDistanceKm={parseFloat(selected?.free_distance_km) || 5}
                baseFee={parseFloat(selected?.base_transportation_fee) || 100}
                perKmRate={parseFloat(selected?.transportation_fee_per_km) || 15}
                onChange={({ latitude, longitude }) => {
                  setRentalForm(prev => ({ ...prev, latitude, longitude }));
                }}
                onFeeCalculated={(fee) => setCalculatedTransportationFee(fee)}
              />

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelected(null)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={submitting || !costBreakdown} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Success Modal */}
      {showSuccessModal && createdRental && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => {setShowSuccessModal(false); navigate('/renter/rentals');}}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Request Submitted!</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your rental request has been created successfully.
              </p>

              {/* Rental Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Request Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Equipment:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{createdRental.equipment?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Cost:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">₱{fmt(createdRental.total_cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">Pending Payment</span>
                  </div>
                </div>
              </div>

              {/* Next Step Message */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Next Step:</strong> Complete your payment to forward this request to the equipment owner for approval.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/renter/rentals');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Pay Later
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setShowPaymentModal(true);
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-600 transition-colors"
                >
                  Go to Payment
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Payment Modal */}
      {showPaymentModal && createdRental && (
        <PaymentModal
          rental={createdRental}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            toast.success('Payment submitted! Redirecting to My Rentals...');
            setTimeout(() => navigate('/renter/rentals'), 1500);
          }}
        />
      )}
    </div>
  );
}
