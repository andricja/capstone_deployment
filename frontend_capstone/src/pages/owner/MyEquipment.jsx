// MyEquipment - Owner Equipment Management with Rentals & Calendar - Updated 2026-04-11
// Force reload timestamp: 1712851200
console.log('MyEquipment module loaded - v3.0 with tabs');
import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import api from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { CardGridSkeleton, ListPageSkeleton } from '../../components/Skeleton';
import Pagination from '../../components/Pagination';
import ReceiptModal from '../../components/ReceiptModal';
import LocationPicker from '../../components/LocationPicker';
import { Plus, Pencil, Trash2, Settings, CheckCircle, Eye, Archive, Truck, Package, ClipboardList, CalendarDays, Check, X, Ruler, Clock, Calendar as CalIcon, MapPin, LayoutGrid, Table, Banknote } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmModal from '../../components/ConfirmModal';
import Tooltip from '../../components/Tooltip';
import SearchBar from '../../components/SearchBar';
import { useViewedItems } from '../../hooks/useViewedItems';
import { TabBadge, RowBadge } from '../../components/NotificationBadge';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../admin/calendar.css';

const CATEGORIES = ['tractor', 'harvester', 'planter', 'irrigation', 'cultivator', 'sprayer', 'trailer', 'other'];
const localizer = momentLocalizer(moment);

export default function MyEquipment() {
  const toast = useToast();
  const { confirm, isOpen, config, handleConfirm, handleClose } = useConfirm();
  
  // Tab state
  const [activeMainTab, setActiveMainTab] = useState('equipment'); // 'equipment' | 'rentals' | 'calendar'
  
  // Equipment tab state
  const [equipment, setEquipment] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [equipmentSearchQuery, setEquipmentSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', category: 'tractor', description: '', 
    pricing_model: 'per_hectare',
    price_per_hectare: '',
    price_per_equipment: '',
    municipality: '', barangay: '', province: 'Oriental Mindoro',
    latitude: '', longitude: '', image: null,
    transportation_fee_per_km: '15',
  });
  const [submitting, setSubmitting] = useState(false);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [receiptItem, setReceiptItem] = useState(null);

  // Rentals tab state  
  // Track viewed items for notifications
  const rentalViewed = useViewedItems('viewed_owner_rentals');
  const [allData, setAllData] = useState([]);
  const [rentalsLoading, setRentalsLoading] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRow, setSelectedRow] = useState(null);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('id');
  const [sortDir, setSortDir] = useState('desc');
  const [perPage, setPerPage] = useState(10);
  const [rentalPage, setRentalPage] = useState(1);

  // Calendar tab state
  const [events, setEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [calendarView, setCalendarView] = useState('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [myEquipment, setMyEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState('');

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
    
    // Only fetch barangay coordinates if user hasn't manually set coordinates yet
    // Check if coordinates are empty or still at default/unset values
    const hasUserSetCoordinates = form.latitude && form.longitude && 
                                   parseFloat(form.latitude) !== 0 && 
                                   parseFloat(form.longitude) !== 0;
    
    if (form.municipality && selectedBarangay && !hasUserSetCoordinates) {
      const url = `/addresses/municipalities/${encodeURIComponent(form.municipality)}/barangays/${encodeURIComponent(selectedBarangay)}/coordinates`;
      api.get(url)
        .then(res => {
          if (res.data.latitude && res.data.longitude) {
            console.log('Auto-filling coordinates from barangay:', res.data);
            setForm(prev => ({
              ...prev,
              latitude: String(res.data.latitude),
              longitude: String(res.data.longitude)
            }));
          }
        })
        .catch(err => {
          // Silently fail - coordinates will need to be set manually
          console.log('No coordinates available for this barangay, user must set manually');
        });
    } else if (hasUserSetCoordinates) {
      console.log('User has already set coordinates, preserving them:', form.latitude, form.longitude);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ 
      name: '', category: 'tractor', description: '', 
      pricing_model: 'per_hectare',
      price_per_hectare: '',
      price_per_equipment: '',
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
      pricing_model: eq.pricing_model || 'per_hectare',
      price_per_hectare: eq.price_per_hectare || '',
      price_per_equipment: eq.price_per_equipment || '',
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
    const confirmed = await confirm({
      title: 'Delete Equipment',
      message: 'Delete this equipment? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true
    });
    if (!confirmed) return;
    
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
    const confirmed = await confirm({
      title: 'Archive Equipment',
      message: 'Archive this equipment?',
      confirmText: 'Archive',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    
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

  const filteredEquipment = (activeTab === 'all' 
    ? allEquipment 
    : allEquipment.filter(e => e.status === activeTab)
  ).filter(eq =>
    !equipmentSearchQuery || 
    eq.name.toLowerCase().includes(equipmentSearchQuery.toLowerCase()) ||
    eq.category.toLowerCase().includes(equipmentSearchQuery.toLowerCase()) ||
    (eq.municipality && eq.municipality.toLowerCase().includes(equipmentSearchQuery.toLowerCase())) ||
    (eq.barangay && eq.barangay.toLowerCase().includes(equipmentSearchQuery.toLowerCase()))
  );

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

  // ================ RENTALS TAB FUNCTIONS ================
  useEffect(() => {
    if (activeMainTab === 'rentals') {
      fetchAllRentals();
    }
  }, [activeMainTab]);

  const fetchAllRentals = () => {
    setRentalsLoading(true);
    api.get('/owner/rental-requests', { params: { all: 1 } })
      .then((r) => setAllData(Array.isArray(r.data) ? r.data : r.data?.data || []))
      .finally(() => setRentalsLoading(false));
  };

  const handleAction = async (id, action) => {
    const confirmed = await confirm({
      title: action === 'approve' ? 'Approve Rental' : 'Reject Rental',
      message: action === 'approve' 
        ? 'Approve this rental? Equipment will be marked as rented.'
        : 'Reject this rental request?',
      confirmText: action === 'approve' ? 'Approve' : 'Reject',
      cancelText: 'Cancel',
      danger: action === 'reject'
    });
    if (!confirmed) return;
    
    try {
      await api.patch(`/owner/rental-requests/${id}/${action}`);
      toast.success(`Rental request ${action}d.`);
      fetchAllRentals();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} request.`);
    }
  };

  const handleArchiveRental = async (id, e) => {
    e?.stopPropagation();
    const confirmed = await confirm({
      title: 'Archive Rental',
      message: 'Archive this rental request?',
      confirmText: 'Archive',
      cancelText: 'Cancel'
    });
    if (!confirmed) return;
    
    try {
      await api.patch(`/owner/archived/rentals/${id}`);
      toast.success('Rental archived.');
      fetchAllRentals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive.');
    }
  };

  const fmt = (v) => parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

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

  const totalRentalPages = Math.ceil(processed.length / perPage) || 1;
  const paginated = processed.slice((rentalPage - 1) * perPage, rentalPage * perPage);

  // Calculate forwarded (new) rentals count for notifications
  const forwardedRentals = allData.filter(r => r.status === 'forwarded');
  const newRentalsCount = rentalViewed.getNewCount(forwardedRentals);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const sortIcon = (col) => sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  // ================ CALENDAR TAB FUNCTIONS ================
  useEffect(() => {
    if (activeMainTab === 'calendar') {
      fetchMyEquipmentList();
    }
  }, [activeMainTab]);

  useEffect(() => {
    if (activeMainTab === 'calendar') {
      fetchCalendarEvents();
    }
  }, [activeMainTab, selectedEquipment, calendarDate, calendarView]);

  const fetchMyEquipmentList = async () => {
    try {
      const response = await api.get('/owner/equipment', { params: { all: true } });
      setMyEquipment(response.data);
    } catch (error) {
      console.error('Failed to fetch equipment:', error);
    }
  };

  const fetchCalendarEvents = async () => {
    setCalendarLoading(true);
    try {
      const start = moment(calendarDate).startOf(calendarView).format('YYYY-MM-DD');
      const end = moment(calendarDate).endOf(calendarView).format('YYYY-MM-DD');
      const params = { start, end };
      if (selectedEquipment) {
        params.equipment_id = selectedEquipment;
      }
      const response = await api.get('/owner/calendar/events', { params });
      
      // Convert date strings to Date objects for react-big-calendar
      const formattedEvents = response.data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setCalendarLoading(false);
    }
  };

  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.backgroundColor,
        borderColor: event.borderColor,
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        padding: '2px 4px',
        fontSize: '12px',
      },
    };
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pending' },
      approved: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Approved' },
      active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Active' },
      completed: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', label: 'Completed' },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Rejected' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };
  // ================ END CALENDAR TAB FUNCTIONS ================
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">My Equipment & Rentals</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your equipment, rental requests, and schedule</p>
        </div>
        {activeMainTab === 'equipment' && (
          <button onClick={openAdd} className="bg-gradient-to-r from-green-600 to-emerald-500 text-white px-3 py-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium hover:from-green-700 hover:to-emerald-600 flex items-center gap-1 justify-center sm:justify-start flex-shrink-0">
            <Plus className="w-4 h-4" /> Add Equipment
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div className="mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 sm:gap-4 min-w-max sm:min-w-0">
          <button
            onClick={() => setActiveMainTab('equipment')}
            className={`px-3 py-2 sm:px-4 border-b-2 font-medium transition-colors flex items-center gap-2 text-xs sm:text-sm flex-shrink-0 ${
              activeMainTab === 'equipment'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="whitespace-nowrap">My Equipment</span>
          </button>
          <button
            onClick={() => setActiveMainTab('rentals')}
            className={`px-3 py-2 sm:px-4 border-b-2 font-medium transition-colors flex items-center gap-2 text-xs sm:text-sm flex-shrink-0 ${
              activeMainTab === 'rentals'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="whitespace-nowrap">Rental Requests</span>
            <TabBadge count={newRentalsCount} active={activeMainTab === 'rentals'} />
          </button>
          <button
            onClick={() => setActiveMainTab('calendar')}
            className={`px-3 py-2 sm:px-4 border-b-2 font-medium transition-colors flex items-center gap-2 text-xs sm:text-sm flex-shrink-0 ${
              activeMainTab === 'calendar'
                ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="whitespace-nowrap">Calendar</span>
          </button>
        </div>
      </div>

      {/* Equipment Tab Content */}
      {activeMainTab === 'equipment' && (
        <>
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

          {/* Search Bar */}
          <SearchBar
            value={equipmentSearchQuery}
            onChange={setEquipmentSearchQuery}
            placeholder="Search equipment by name, category, or location..."
            className="mb-6"
          />

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
                      {eq.pricing_model === 'per_equipment' 
                        ? `₱${(parseFloat(eq.price_per_equipment || 0)).toLocaleString()}/equipment` 
                        : `₱${(parseFloat(eq.price_per_hectare || 0)).toLocaleString()}/hectare`
                      }
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
        </>
      )}

      {/* Rentals Tab Content */}
      {activeMainTab === 'rentals' && (
        <>
          {/* View Mode Toggle & Status Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: 'all', label: 'All' },
                { key: 'forwarded', label: 'Pending' },
                { key: 'approved', label: 'Approved' },
                { key: 'rejected', label: 'Rejected' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => { setStatusFilter(f.key); setRentalPage(1); }}
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
            <button
              onClick={() => { setViewMode(viewMode === 'card' ? 'table' : 'card'); setRentalPage(1); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {viewMode === 'card' ? <><Table className="w-4 h-4" /> Table View</> : <><LayoutGrid className="w-4 h-4" /> Card View</>}
            </button>
          </div>

          {rentalsLoading ? (
            <ListPageSkeleton cols={6} rows={6} />
          ) : allData.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">No rental requests yet.</div>
          ) : viewMode === 'card' ? (
            /* ══════════ CARD VIEW ══════════ */
            processed.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">No {statusFilter !== 'all' ? statusFilter : ''} rental requests found.</div>
            ) : (
            <div className="space-y-4">
              {processed.map((r) => (
                <div 
                  key={r.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-5 transition-colors"
                  onClick={() => {
                    // Mark rental as viewed when clicked
                    if (r.status === 'forwarded') {
                      rentalViewed.markAsViewed(r.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {/* Red dot badge for new forwarded rentals */}
                      {r.status === 'forwarded' && <RowBadge isNew={rentalViewed.isNew(r.id)} />}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{r.equipment?.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{r.equipment?.category} • {r.equipment?.location}</p>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Renter Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                      <div><span className="text-gray-500 dark:text-gray-400">Name:</span> <span className="font-medium dark:text-gray-200">{r.renter?.name}</span></div>
                      <div><span className="text-gray-500 dark:text-gray-400">Email:</span> <span className="font-medium dark:text-gray-200">{r.renter?.email}</span></div>
                      <div><span className="text-gray-500 dark:text-gray-400">Phone:</span> <span className="font-medium dark:text-gray-200">{r.contact_number}</span></div>
                    </div>
                  </div>
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
                        <CalIcon className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 block text-xs">Rental Days</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{r.rental_days} day(s)</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CalIcon className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-gray-500 dark:text-gray-400 block text-xs">Period</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{fmtDate(r.start_date)}{r.rental_days > 1 ? ` — ${fmtDate(r.end_date)}` : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cost Breakdown</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Base Cost</span>
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
                          {r.payment_method === 'downpayment' ? 'Down Payment (50%)' : 
                           r.payment_method === 'fullpayment' ? 'Full Payment (100%)' : 
                           r.payment_method === 'gcash' ? 'GCash' : 'COD'}
                        </span>
                        {r.payment_proof && (
                          <button onClick={() => setProofImage(`/storage/${r.payment_proof}`)}
                            className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 ml-1">View Proof</button>
                        )}
                      </div>
                    </div>
                  </div>
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
                      <button onClick={(e) => handleArchiveRental(r.id, e)}
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
              <div className="p-4 border-b dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <label className="text-gray-500 dark:text-gray-400">Show</label>
                  <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setRentalPage(1); }}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200">
                    {[5, 10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <span className="text-gray-500 dark:text-gray-400">entries</span>
                </div>
                <input
                  type="text" placeholder="Search requests..."
                  value={search} onChange={(e) => { setSearch(e.target.value); setRentalPage(1); }}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none w-64 dark:bg-gray-700 dark:text-gray-200"
                />
              </div>
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
                      <tr 
                        key={r.id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" 
                        onClick={() => {
                          // Mark rental as viewed when row is clicked
                          if (r.status === 'forwarded') {
                            rentalViewed.markAsViewed(r.id);
                          }
                          setSelectedRow(r);
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-gray-400">{r.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {/* Red dot badge for new forwarded rentals */}
                            {r.status === 'forwarded' && <RowBadge isNew={rentalViewed.isNew(r.id)} />}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{r.equipment?.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{r.equipment?.category}</p>
                            </div>
                          </div>
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
                              <button onClick={(e) => handleArchiveRental(r.id, e)}
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
              <div className="px-4 py-3 border-t dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Showing {((rentalPage - 1) * perPage) + 1}–{Math.min(rentalPage * perPage, processed.length)} of {processed.length}</span>
                <div className="flex gap-1">
                  <button disabled={rentalPage <= 1} onClick={() => setRentalPage(rentalPage - 1)}
                    className="px-3 py-1 rounded border dark:border-gray-600 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">Prev</button>
                  {Array.from({ length: totalRentalPages }, (_, i) => (
                    <button key={i + 1} onClick={() => setRentalPage(i + 1)}
                      className={`px-3 py-1 rounded border dark:border-gray-600 text-sm ${rentalPage === i + 1 ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white border-green-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'}`}>
                      {i + 1}
                    </button>
                  ))}
                  <button disabled={rentalPage >= totalRentalPages} onClick={() => setRentalPage(rentalPage + 1)}
                    className="px-3 py-1 rounded border dark:border-gray-600 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">Next</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Calendar Tab Content */}
      {activeMainTab === 'calendar' && (
        <>
          {/* Equipment Filter */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Equipment</span>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">All Equipment</option>
                {myEquipment.map((eq) => (
                  <option key={eq.id} value={eq.id}>{eq.name}</option>
                ))}
              </select>
              {selectedEquipment && (
                <button
                  onClick={() => setSelectedEquipment('')}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Status Legend:</p>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Rejected</span>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            {calendarLoading ? (
              <div className="h-96 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Loading calendar...
              </div>
            ) : (
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                onSelectEvent={handleEventClick}
                eventPropGetter={eventStyleGetter}
                view={calendarView}
                onView={setCalendarView}
                date={calendarDate}
                onNavigate={setCalendarDate}
                views={['month', 'week', 'day', 'agenda']}
                messages={{
                  noEventsInRange: 'No rentals scheduled for this period',
                  today: 'Today',
                  previous: 'Back',
                  next: 'Next',
                  month: 'Month',
                  week: 'Week',
                  day: 'Day',
                  agenda: 'Agenda',
                }}
              />
            )}
          </div>
        </>
      )}

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 dark:text-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header with Close Button */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit Equipment' : 'Add Equipment'}</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
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

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Banknote className="inline w-4 h-4 mr-1 -mt-0.5" />Pricing Model
                </label>
                
                {/* Pricing Model Selector */}
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                    form.pricing_model === 'per_hectare'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      name="pricing_model"
                      value="per_hectare"
                      checked={form.pricing_model === 'per_hectare'}
                      onChange={(e) => setForm({ ...form, pricing_model: e.target.value })}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Price per Hectare</div>
                      <div className="text-xs opacity-75">Charge based on farm size</div>
                    </div>
                  </label>

                  <label className={`flex-1 flex items-center gap-2 px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                    form.pricing_model === 'per_equipment'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      name="pricing_model"
                      value="per_equipment"
                      checked={form.pricing_model === 'per_equipment'}
                      onChange={(e) => setForm({ ...form, pricing_model: e.target.value })}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Flat Rate</div>
                      <div className="text-xs opacity-75">Fixed price per rental</div>
                    </div>
                  </label>
                </div>

                {/* Conditional Price Input - Per Hectare */}
                {form.pricing_model === 'per_hectare' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price per Hectare (₱)
                    </label>
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
                      Rental cost will be calculated: price × farm size in hectares
                    </p>
                  </div>
                )}

                {/* Conditional Price Input - Per Equipment */}
                {form.pricing_model === 'per_equipment' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Price per Equipment (₱)
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      required 
                      value={form.price_per_equipment}
                      onChange={(e) => setForm({ ...form, price_per_equipment: e.target.value })}
                      placeholder="e.g. 3000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200" 
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Fixed flat rate - same price regardless of farm size
                    </p>
                  </div>
                )}
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
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedRow.equipment?.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{selectedRow.equipment?.category} • {selectedRow.equipment?.location}</p>
                </div>
                <StatusBadge status={selectedRow.status} />
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Renter Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">Name:</span> <span className="font-medium dark:text-gray-200">{selectedRow.renter?.name}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Email:</span> <span className="font-medium dark:text-gray-200">{selectedRow.renter?.email}</span></div>
                  <div><span className="text-gray-500 dark:text-gray-400">Phone:</span> <span className="font-medium dark:text-gray-200">{selectedRow.contact_number}</span></div>
                </div>
              </div>
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
                    <CalIcon className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Rental Days</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{selectedRow.rental_days} day(s)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CalIcon className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-500 dark:text-gray-400 block text-xs">Period</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{fmtDate(selectedRow.start_date)}{selectedRow.rental_days > 1 ? ` — ${fmtDate(selectedRow.end_date)}` : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
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
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cost Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Base Cost</span>
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
                      {selectedRow.payment_method === 'downpayment' ? 'Down Payment (50%)' : 
                       selectedRow.payment_method === 'fullpayment' ? 'Full Payment (100%)' : 
                       selectedRow.payment_method === 'gcash' ? 'GCash' : 'COD'}
                    </span>
                    {selectedRow.payment_proof && (
                      <button onClick={() => { setSelectedRow(null); setProofImage(`/storage/${selectedRow.payment_proof}`); }}
                        className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 ml-1">View Proof</button>
                    )}
                  </div>
                </div>
              </div>
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
                  <button onClick={(e) => { handleArchiveRental(selectedRow.id, e); setSelectedRow(null); }}
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

      {/* Calendar Event Detail Modal */}
      {selectedEvent && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rental Details</h2>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Equipment</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEvent.rental?.equipment_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Renter</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.rental?.renter_name}</p>
                {selectedEvent.rental?.renter_email && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedEvent.rental.renter_email}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Status</p>
                {getStatusBadge(selectedEvent.display_status)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Start Date</p>
                  <p className="text-sm text-gray-900 dark:text-white">{moment(selectedEvent.rental?.start_date).format('MMM DD, YYYY')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">End Date</p>
                  <p className="text-sm text-gray-900 dark:text-white">{moment(selectedEvent.rental?.end_date).format('MMM DD, YYYY')}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Duration</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.rental?.rental_days} day(s)</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Farm Size</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.rental?.farm_size_sqm?.toLocaleString()} sqm</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Total Cost</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedEvent.rental?.total_cost)}</p>
                </div>
              </div>
              {selectedEvent.rental?.payment_status && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Payment Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedEvent.rental.payment_status === 'verified' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : selectedEvent.rental.payment_status === 'paid'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {selectedEvent.rental.payment_status}
                  </span>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
              >
                Close
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
