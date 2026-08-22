import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import { CalendarDays, Filter, X, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';

const localizer = momentLocalizer(moment);

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [filters, setFilters] = useState({
    status: '',
    owner_id: '',
    equipment_id: '',
  });
  const [stats, setStats] = useState(null);
  const toast = useToast();

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [filters, date, view]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Calculate start and end dates based on current view
      const start = moment(date).startOf(view).format('YYYY-MM-DD');
      const end = moment(date).endOf(view).format('YYYY-MM-DD');

      const response = await api.get('/admin/calendar/events', {
        params: { ...filters, start, end },
      });
      
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load calendar events');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const start = moment(date).startOf('month').format('YYYY-MM-DD');
      const end = moment(date).endOf('month').format('YYYY-MM-DD');
      
      const response = await api.get('/admin/calendar/events', {
        params: { start, end },
      });
      
      const allEvents = response.data;
      const stats = {
        total: allEvents.length,
        active: allEvents.filter(e => e.display_status === 'active').length,
        approved: allEvents.filter(e => e.display_status === 'approved').length,
        pending: allEvents.filter(e => e.status === 'pending').length,
      };
      setStats(stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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
      cancelled: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400', label: 'Cancelled' },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays className="w-7 h-7 text-green-600 dark:text-green-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rental Calendar</h1>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/40 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.total}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Rentals This Month</p>
          </div>

          <div className="bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/30 dark:to-emerald-900/40 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.active}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Active Rentals</p>
          </div>

          <div className="bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/30 dark:to-violet-900/40 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.approved}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Upcoming Bookings</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-100 to-amber-200 dark:from-yellow-900/30 dark:to-amber-900/40 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stats.pending}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Pending Approval</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {filters.status || filters.owner_id || filters.equipment_id ? (
            <button
              onClick={() => setFilters({ status: '', owner_id: '', equipment_id: '' })}
              className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 font-medium"
            >
              Clear Filters
            </button>
          ) : null}
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
        {loading ? (
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
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={['month', 'week', 'day', 'agenda']}
          />
        )}
      </div>

      {/* Event Detail Modal */}
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
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedEvent.rental.equipment_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Renter</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.rental.renter_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Owner</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.rental.owner_name || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Status</p>
                {getStatusBadge(selectedEvent.display_status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Start Date</p>
                  <p className="text-sm text-gray-900 dark:text-white">{moment(selectedEvent.rental.start_date).format('MMM DD, YYYY')}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">End Date</p>
                  <p className="text-sm text-gray-900 dark:text-white">{moment(selectedEvent.rental.end_date).format('MMM DD, YYYY')}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Duration</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.rental.rental_days} day(s)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Farm Size</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedEvent.rental.farm_size_sqm?.toLocaleString()} sqm</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Total Cost</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedEvent.rental.total_cost)}</p>
                </div>
              </div>

              {selectedEvent.rental.delivery_address && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Location</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedEvent.rental.barangay && `${selectedEvent.rental.barangay}, `}
                    {selectedEvent.rental.municipality}
                  </p>
                </div>
              )}

              {selectedEvent.rental.payment_status && (
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
    </div>
  );
}
