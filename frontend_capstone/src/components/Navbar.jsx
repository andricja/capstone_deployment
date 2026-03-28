import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Menu, X, Tractor, LogOut,
  Home, Search, ClipboardList, Mail,
  Package, ClipboardCheck, Settings, Users, BarChart3,
  CheckCircle, UserCheck, Bell, Megaphone,
  Sun, Moon, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const HEADER_H = 'h-14'; // shared height token
const HEADER_PX = '56px';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = getNavLinks(user?.role);
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

        {/* Center: breadcrumb (desktop) */}
        <div className="flex-1 flex items-center px-4">
          <nav className="hidden md:flex items-center gap-1.5 text-sm">
            <span className="text-gray-500 dark:text-gray-400">{roleLabel}</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-900 dark:text-white font-semibold">{pageTitle}</span>
          </nav>
        </div>

        {/* Right side: dark toggle + user info */}
        <div className="flex items-center gap-3 px-4">
          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg hover:bg-white/20 md:hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-white/80 md:text-gray-500" />}
          </button>

          {user && (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 dark:from-gray-600 dark:to-gray-700 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                {user.name?.charAt(0).toUpperCase()}
              </div>
            </>
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
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Logout + Version footer */}
        <div className="px-3 py-4 border-t border-green-700 dark:border-gray-700 shrink-0">
          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-green-700 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          )}
          <p className="text-[10px] text-green-500 dark:text-gray-500 text-center mt-3">FERMs v1.0.0</p>
        </div>
      </aside>
    </>
  );
}

function getNavLinks(role) {
  if (!role) return [];
  switch (role) {
    case 'renter':
      return [
        { to: '/renter/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
        { to: '/renter/browse', label: 'Browse Equipment', icon: <Search className="w-5 h-5" /> },
        { to: '/renter/rentals', label: 'My Rentals', icon: <ClipboardList className="w-5 h-5" /> },
        { to: '/renter/messages', label: 'Contact Us', icon: <Mail className="w-5 h-5" /> },
        { to: '/renter/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
      ];
    case 'owner':
      return [
        { to: '/owner/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
        { to: '/owner/equipment', label: 'My Equipment', icon: <Package className="w-5 h-5" /> },
        { to: '/owner/rentals', label: 'Rental Requests', icon: <ClipboardCheck className="w-5 h-5" /> },
        { to: '/owner/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
      ];
    case 'admin':
      return [
        { to: '/admin/dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
        { to: '/admin/owners', label: 'Owners', icon: <Users className="w-5 h-5" /> },
        { to: '/admin/equipment', label: 'Equipment Approvals', icon: <CheckCircle className="w-5 h-5" /> },
        { to: '/admin/rentals', label: 'All Rentals', icon: <ClipboardList className="w-5 h-5" /> },
        { to: '/admin/messages', label: 'Messages', icon: <Mail className="w-5 h-5" /> },
        { to: '/admin/reports', label: 'Revenue Reports', icon: <BarChart3 className="w-5 h-5" /> },
        { to: '/admin/accounts', label: 'Accounts', icon: <UserCheck className="w-5 h-5" /> },
        { to: '/admin/ads', label: 'Manage Ads', icon: <Megaphone className="w-5 h-5" /> },
        { to: '/admin/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
      ];
    default:
      return [];
  }
}
