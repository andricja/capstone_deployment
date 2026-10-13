import { Link, useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Menu, X, Tractor, LogOut,
  Home, Search, ClipboardList, Mail,
  Package, Settings, Users,
  Megaphone, Sun, Moon, ChevronRight, User, DollarSign, CalendarDays,
  TrendingUp, Archive, AlertTriangle, Wallet,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import NotificationBell from './NotificationBell';
import api from '../lib/api';

const HEADER_H = 'h-14'; // shared height token
const HEADER_PX = '56px';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pendingCounts, setPendingCounts] = useState({});
  const dropdownRef = useRef(null);

  // Fetch pending counts
  useEffect(() => {
    const fetchPendingCounts = async () => {
      if (!user) return;
      try {
        const response = await api.get('/pending-counts');
        setPendingCounts(response.data);
      } catch (error) {
        console.error('Failed to fetch pending counts:', error);
      }
    };

    fetchPendingCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchPendingCounts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    navigate('/');
  };

  const confirmLogout = () => {
    setDropdownOpen(false);
    setShowLogoutModal(true);
  };

  const navLinks = getNavLinks(user?.role, pendingCounts);
  const isActive = (path) => location.pathname === path;

  // Derive breadcrumb from current route
  const currentLink = navLinks.find((l) => l.to === location.pathname);
  const pageTitle = currentLink?.label || 'Dashboard';
  const roleLabel = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';

  return (
    <>
      {/* ═══════ Top Header Bar (always visible) ═══════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 ${HEADER_H} bg-gradient-to-r from-green-800 to-emerald-800 md:from-white md:to-white dark:from-gray-900 dark:to-gray-900 text-white md:text-gray-900 dark:text-white flex items-center shadow-sm md:border-b md:border-gray-200 dark:border-gray-800 transition-colors`}
      >
        {/* Logo area — matches sidebar width on desktop */}
        <div className="flex items-center gap-2 px-4 md:w-64 md:px-5 shrink-0 md:bg-gradient-to-r md:from-green-800 md:to-emerald-800 dark:from-gray-800 dark:to-gray-800 self-stretch">
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden text-white hover:text-green-200 mr-1"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link to="/" className="flex items-center gap-2 text-white">
            <Tractor className="w-6 h-6 text-green-300 dark:text-green-400" />
            <span className="text-xl font-bold tracking-wide">FERMs</span>
          </Link>
        </div>

        {/* Center: breadcrumb - show page title on mobile, full breadcrumb on desktop */}
        <div className="flex-1 flex items-center px-2 sm:px-4 min-w-0 overflow-hidden">
          <nav className="flex items-center gap-1.5 text-sm min-w-0 max-w-full overflow-hidden">
            <span className="hidden md:inline text-gray-500 dark:text-gray-400 flex-shrink-0">{roleLabel}</span>
            <ChevronRight className="hidden md:inline w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <span className="text-gray-900 dark:text-white font-semibold truncate text-xs sm:text-sm md:text-base">{pageTitle}</span>
          </nav>
        </div>

        {/* Right side: notification bell + dark toggle + user info */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 px-2 sm:px-4 flex-shrink-0">
          {/* Notification Bell */}
          <NotificationBell />

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-white/20 md:hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 md:text-gray-500" />}
          </button>

          {user && (
            <div className="relative flex-shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="text-right hidden lg:block min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight truncate max-w-[120px]">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                </div>
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 dark:from-gray-600 dark:to-gray-700 text-white flex items-center justify-center text-xs sm:text-sm font-bold shadow-sm cursor-pointer hover:shadow-md transition-shadow flex-shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate(`/${user.role}/settings`);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile Settings
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40" style={{ top: HEADER_PX }} onClick={() => setOpen(false)} />
      )}

      {/* ═══════ Sidebar (below header) ═══════ */}
      <aside
        className={`fixed left-0 z-40 w-64 bg-gradient-to-b from-green-800 via-green-800 to-emerald-900 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900 text-white flex flex-col transition-all duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ top: HEADER_PX, height: `calc(100vh - ${HEADER_PX})` }}
      >
        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'bg-gradient-to-r from-green-600 to-emerald-500 dark:from-green-700 dark:to-green-700 text-white shadow-sm'
                  : 'text-green-100 dark:text-gray-300 hover:bg-green-700/80 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="flex-1">{link.label}</span>
              {/* Red badge for pending items */}
              {link.badge > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {link.badge > 99 ? '99+' : link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Logout + Version footer */}
        <div className="px-3 py-4 border-t border-green-700 dark:border-gray-700 shrink-0">
          {user && (
            <button
              onClick={confirmLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-green-700 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          )}
          <p className="text-[10px] text-green-500 dark:text-gray-500 text-center mt-3">FERMs v1.2.1</p>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowLogoutModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Logout</h2>
              </div>
              <button onClick={() => setShowLogoutModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to logout? You will need to sign in again to access your account.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function getNavLinks(role, pendingCounts = {}) {
  if (!role) return [];
  switch (role) {
    case 'renter':
      return [
        { to: '/renter/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
        { to: '/renter/browse', label: 'Browse Equipment', icon: <Search className="w-5 h-5" /> },
        { to: '/renter/rentals', label: 'My Rentals', icon: <ClipboardList className="w-5 h-5" /> },
        { to: '/renter/calendar', label: 'My Calendar', icon: <CalendarDays className="w-5 h-5" /> },
        { to: '/renter/messages', label: 'Contact Us', icon: <Mail className="w-5 h-5" /> },
        { to: '/renter/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
      ];
    case 'owner':
      return [
        { to: '/owner/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
        { to: '/owner/equipment', label: 'My Equipment & Rentals', icon: <Package className="w-5 h-5" />, badge: pendingCounts.pending_rentals || 0 },
        { to: '/owner/sales', label: 'Sales & Earnings', icon: <TrendingUp className="w-5 h-5" /> },
        { to: '/owner/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
      ];
    case 'admin':
      return [
        { to: '/admin/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
        { to: '/admin/owners', label: 'Owners & Equipment', icon: <Users className="w-5 h-5" />, badge: (pendingCounts.pending_owners || 0) + (pendingCounts.pending_equipment || 0) },
        { to: '/admin/rentals', label: 'Rental Management', icon: <ClipboardList className="w-5 h-5" />, badge: pendingCounts.pending_rentals || 0 },
        { to: '/admin/sales', label: 'Sales & Revenue', icon: <TrendingUp className="w-5 h-5" /> },
        { to: '/admin/messages', label: 'Messages', icon: <Mail className="w-5 h-5" /> },
        { to: '/admin/ads', label: 'Manage Ads', icon: <Megaphone className="w-5 h-5" /> },
        { to: '/admin/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
      ];
    default:
      return [];
  }
}
