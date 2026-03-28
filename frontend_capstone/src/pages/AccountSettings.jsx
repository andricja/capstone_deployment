import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { Settings, User, Lock, Eye, EyeOff, Save, Mail, Send, Server, Wallet, Archive, RotateCcw, Trash2 } from 'lucide-react';
import { FormSkeleton } from '../components/Skeleton';
import api from '../lib/api';

const TABS = {
  profile: { label: 'Profile', icon: User },
  password: { label: 'Password', icon: Lock },
  gcash: { label: 'GCash Settings', icon: Wallet, ownerOnly: true },
  archive: { label: 'Archive', icon: Archive },
  email: { label: 'Email Settings', icon: Server, adminOnly: true },
};

export default function AccountSettings() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const visibleTabs = Object.entries(TABS).filter(
    ([, t]) => {
      if (t.adminOnly) return user?.role === 'admin';
      if (t.ownerOnly) return user?.role === 'owner';
      return true;
    }
  );

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // SMTP form (admin only)
  const [smtpForm, setSmtpForm] = useState({
    mail_host: 'smtp.gmail.com',
    mail_port: 587,
    mail_username: '',
    mail_password: '',
    mail_encryption: 'tls',
    mail_from_address: '',
    mail_from_name: 'FERMs',
  });
  const [hasSmtpPassword, setHasSmtpPassword] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(true);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  // GCash form (owner only)
  const [gcashSetting, setGcashSetting] = useState(null);
  const [gcashForm, setGcashForm] = useState({ account_name: '', account_number: '', qr_code_image: null });
  const [gcashLoading, setGcashLoading] = useState(true);
  const [gcashSaving, setGcashSaving] = useState(false);

  // Load GCash settings for owner
  useEffect(() => {
    if (user?.role !== 'owner') {
      setGcashLoading(false);
      return;
    }
    api.get('/owner/gcash-settings')
      .then((r) => {
        setGcashSetting(r.data);
        setGcashForm({ account_name: r.data.account_name, account_number: r.data.account_number, qr_code_image: null });
      })
      .catch(() => { /* no settings yet */ })
      .finally(() => setGcashLoading(false));
  }, [user?.role]);

  const handleGcashSave = async (e) => {
    e.preventDefault();
    setGcashSaving(true);
    try {
      const fd = new FormData();
      fd.append('account_name', gcashForm.account_name);
      fd.append('account_number', gcashForm.account_number);
      if (gcashForm.qr_code_image) fd.append('qr_code_image', gcashForm.qr_code_image);
      const res = await api.post('/owner/gcash-settings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setGcashSetting(res.data.setting);
      toast.success('GCash settings saved successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save GCash settings.');
    } finally {
      setGcashSaving(false);
    }
  };

  // Load SMTP settings for admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      setSmtpLoading(false);
      return;
    }
    api.get('/admin/smtp-settings')
      .then((r) => {
        if (r.data) {
          setSmtpForm((prev) => ({
            ...prev,
            mail_host: r.data.mail_host || prev.mail_host,
            mail_port: r.data.mail_port || prev.mail_port,
            mail_username: r.data.mail_username || '',
            mail_encryption: r.data.mail_encryption || prev.mail_encryption,
            mail_from_address: r.data.mail_from_address || '',
            mail_from_name: r.data.mail_from_name || prev.mail_from_name,
          }));
          setHasSmtpPassword(r.data.has_password);
          setLastUpdated(r.data.updated_at);
        }
      })
      .finally(() => setSmtpLoading(false));
  }, [user?.role]);

  // Archive state
  const [archiveData, setArchiveData] = useState({ owners: [], equipment: [], rentals: [], messages: [] });
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveLoaded, setArchiveLoaded] = useState(false);

  const loadArchive = async () => {
    setArchiveLoading(true);
    try {
      const role = user?.role;
      if (role === 'admin') {
        const res = await api.get('/admin/archived/all');
        setArchiveData(res.data);
      } else if (role === 'owner') {
        const [eqRes, rentalRes] = await Promise.all([
          api.get('/owner/archived/equipment'),
          api.get('/owner/archived/rentals'),
        ]);
        setArchiveData({ owners: [], equipment: eqRes.data, rentals: rentalRes.data, messages: [] });
      } else if (role === 'renter') {
        const [rentalRes, msgRes] = await Promise.all([
          api.get('/renter/archived/rentals'),
          api.get('/renter/archived/messages'),
        ]);
        setArchiveData({ owners: [], equipment: [], rentals: rentalRes.data, messages: msgRes.data });
      }
      setArchiveLoaded(true);
    } catch { /* ignore */ }
    finally { setArchiveLoading(false); }
  };

  // Load archive when tab is activated
  useEffect(() => {
    if (activeTab === 'archive' && !archiveLoaded) loadArchive();
  }, [activeTab]);

  const handleRestore = async (type, id) => {
    const role = user?.role;
    const prefix = role === 'admin' ? '/admin' : role === 'owner' ? '/owner' : '/renter';
    try {
      await api.patch(`${prefix}/archived/${type}/${id}`);
      toast.success('Item restored successfully.');
      loadArchive();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore.');
    }
  };

  const handlePermanentDelete = async (type, id) => {
    if (!window.confirm('This will permanently delete this item. Are you sure?')) return;
    const role = user?.role;
    const prefix = role === 'admin' ? '/admin' : role === 'owner' ? '/owner' : '/renter';
    try {
      await api.delete(`${prefix}/archived/${type}/${id}`);
      toast.success('Item permanently deleted.');
      loadArchive();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await api.put('/profile', { name, email });
      toast.success(res.data.message || 'Profile updated successfully.');
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await api.put('/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      toast.success(res.data.message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSmtpChange = (e) => {
    const { name, value } = e.target;
    setSmtpForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSmtpSave = async (e) => {
    e.preventDefault();
    setSmtpSaving(true);
    try {
      const res = await api.post('/admin/smtp-settings', smtpForm);
      toast.success(res.data.message);
      setHasSmtpPassword(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save SMTP settings.');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleSmtpTest = async () => {
    if (!testEmail) {
      toast.error('Enter a test email address first.');
      return;
    }
    setSmtpTesting(true);
    try {
      const res = await api.post('/admin/smtp-settings/test', { test_email: testEmail });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test failed.');
    } finally {
      setSmtpTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-7 h-7 text-green-600 dark:text-green-400" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {visibleTabs.map(([key, tab]) => {
          const Icon = tab.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                activeTab === key
                  ? 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors">
          <div className="flex items-center gap-2 px-6 py-4 border-b dark:border-gray-700">
            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
          </div>
          <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                required
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="inline-block px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-xs font-medium capitalize">
                {user?.role}
              </span>
              <span>account</span>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={profileLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors">
          <div className="flex items-center gap-2 px-6 py-4 border-b dark:border-gray-700">
            <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h2>
          </div>
          <form onSubmit={handlePasswordUpdate} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GCash Settings Tab (owner only) */}
      {activeTab === 'gcash' && user?.role === 'owner' && (
        <div className="max-w-xl space-y-6">
          {gcashLoading ? (
            <FormSkeleton fields={4} />
          ) : (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
                <p>These details will be shown to renters when they pay via GCash. Payments go directly to your GCash account.</p>
              </div>

              <form onSubmit={handleGcashSave} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-6 space-y-5 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">GCash Payment Details</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GCash Account Name</label>
                  <input
                    type="text"
                    required
                    value={gcashForm.account_name}
                    onChange={(e) => setGcashForm({ ...gcashForm, account_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                    placeholder="e.g. Juan Cruz"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GCash Account Number</label>
                  <input
                    type="text"
                    required
                    value={gcashForm.account_number}
                    onChange={(e) => setGcashForm({ ...gcashForm, account_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 transition-colors"
                    placeholder="e.g. 09123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">QR Code Image</label>
                  {gcashSetting?.qr_code_image && (
                    <div className="mb-2">
                      <img src={`/storage/${gcashSetting.qr_code_image}`} alt="Current QR" className="w-40 h-40 object-contain border dark:border-gray-600 rounded-lg" />
                      <p className="text-xs text-gray-400 mt-1">Current QR code</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setGcashForm({ ...gcashForm, qr_code_image: e.target.files[0] })}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={gcashSaving}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-2.5 rounded-lg font-medium hover:from-green-700 hover:to-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {gcashSaving ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save GCash Settings</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Archive Tab (all roles) */}
      {activeTab === 'archive' && (
        <div className="space-y-6">
          {archiveLoading ? (
            <FormSkeleton fields={5} />
          ) : (
            <>
              {/* Info banner */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-300">
                <p>Archived items are hidden from your main views. You can restore or permanently delete them here.</p>
              </div>

              {/* Admin: Archived Owners */}
              {user?.role === 'admin' && (
                <ArchiveSection title="Owners" empty="No archived owners.">
                  {archiveData.owners.map((o) => (
                    <ArchiveRow key={`owner-${o.id}`} onRestore={() => handleRestore('owners', o.id)} onDelete={() => handlePermanentDelete('owners', o.id)}>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{o.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{o.email}</p>
                      </div>
                      <ArchivedDate date={o.archived_at} />
                    </ArchiveRow>
                  ))}
                </ArchiveSection>
              )}

              {/* Admin + Owner: Archived Equipment */}
              {(user?.role === 'admin' || user?.role === 'owner') && (
                <ArchiveSection title="Equipment" empty="No archived equipment.">
                  {archiveData.equipment.map((eq) => (
                    <ArchiveRow key={`eq-${eq.id}`} onRestore={() => handleRestore('equipment', eq.id)} onDelete={() => handlePermanentDelete('equipment', eq.id)}>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{eq.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{eq.category} • ₱{Number(eq.daily_rate).toLocaleString()}/day{user?.role === 'admin' && eq.owner ? ` • ${eq.owner.name}` : ''}</p>
                      </div>
                      <ArchivedDate date={eq.archived_at} />
                    </ArchiveRow>
                  ))}
                </ArchiveSection>
              )}

              {/* All roles: Archived Rentals */}
              <ArchiveSection title="Rental Requests" empty="No archived rental requests.">
                {archiveData.rentals.map((r) => (
                  <ArchiveRow key={`rental-${r.id}`} onRestore={() => handleRestore('rentals', r.id)} onDelete={() => handlePermanentDelete('rentals', r.id)}>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{r.equipment?.name || 'Equipment'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user?.role === 'renter' ? '' : `${r.renter?.name || 'Renter'} • `}
                        {r.rental_days} day{r.rental_days > 1 ? 's' : ''} • ₱{Number(r.total_cost).toLocaleString()} • <span className="capitalize">{r.status}</span>
                      </p>
                    </div>
                    <ArchivedDate date={r.archived_at} />
                  </ArchiveRow>
                ))}
              </ArchiveSection>

              {/* Admin + Renter: Archived Messages */}
              {(user?.role === 'admin' || user?.role === 'renter') && (
                <ArchiveSection title="Messages" empty="No archived messages.">
                  {archiveData.messages.map((m) => (
                    <ArchiveRow key={`msg-${m.id}`} onRestore={() => handleRestore('messages', m.id)} onDelete={() => handlePermanentDelete('messages', m.id)}>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-md">{m.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user?.role === 'admin' ? `${m.renter?.name || 'Renter'} • ` : ''}
                          <span className="capitalize">{m.status}</span> • {m.location}
                        </p>
                      </div>
                      <ArchivedDate date={m.archived_at} />
                    </ArchiveRow>
                  ))}
                </ArchiveSection>
              )}
            </>
          )}
        </div>
      )}

      {/* Email Settings Tab (admin only) */}
      {activeTab === 'email' && user?.role === 'admin' && (
        <div className="max-w-2xl space-y-6">
          {smtpLoading ? (
            <FormSkeleton fields={7} />
          ) : (
            <>
              {/* SMTP Status */}
              {hasSmtpPassword && lastUpdated && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">SMTP Configured</p>
                    <p className="text-xs text-green-600 dark:text-green-500">
                      Last updated: {new Date(lastUpdated).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}

              {/* SMTP Form */}
              <form onSubmit={handleSmtpSave} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-6 space-y-5 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">SMTP Configuration</h2>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">Configure email delivery for verification and notification emails</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Host</label>
                    <input
                      name="mail_host"
                      value={smtpForm.mail_host}
                      onChange={handleSmtpChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
                    <input
                      name="mail_port"
                      type="number"
                      value={smtpForm.mail_port}
                      onChange={handleSmtpChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username (Email)</label>
                  <input
                    name="mail_username"
                    type="email"
                    value={smtpForm.mail_username}
                    onChange={handleSmtpChange}
                    required
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                    placeholder="yourname@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    App Password {hasSmtpPassword && <span className="text-gray-400">(leave blank to keep current)</span>}
                  </label>
                  <div className="relative">
                    <input
                      name="mail_password"
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={smtpForm.mail_password}
                      onChange={handleSmtpChange}
                      required={!hasSmtpPassword}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                      placeholder={hasSmtpPassword ? '••••••••••••••••' : 'Enter Gmail App Password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showSmtpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    For Gmail: Go to Google Account &rarr; Security &rarr; 2-Step Verification &rarr; App Passwords
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Encryption</label>
                  <select
                    name="mail_encryption"
                    value={smtpForm.mail_encryption}
                    onChange={handleSmtpChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="null">None</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Address</label>
                    <input
                      name="mail_from_address"
                      type="email"
                      value={smtpForm.mail_from_address}
                      onChange={handleSmtpChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                      placeholder="noreply@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Name</label>
                    <input
                      name="mail_from_name"
                      value={smtpForm.mail_from_name}
                      onChange={handleSmtpChange}
                      required
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                      placeholder="FERMs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={smtpSaving}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-2.5 rounded-lg font-medium hover:from-green-700 hover:to-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {smtpSaving ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Settings</>
                  )}
                </button>
              </form>

              {/* Test Email */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-6 transition-colors">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-green-600" />
                  Test Email Configuration
                </h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white dark:bg-gray-700 dark:text-gray-200"
                  />
                  <button
                    onClick={handleSmtpTest}
                    disabled={smtpTesting}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shrink-0"
                  >
                    {smtpTesting ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Sending...</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send Test</>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Archive helper sub-components                                      */
/* ================================================================== */

function ArchiveSection({ title, empty, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 transition-colors overflow-hidden">
      <div className="px-6 py-4 border-b dark:border-gray-700 flex items-center gap-2">
        <Archive className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-500">{empty}</div>
      ) : (
        <div className="divide-y dark:divide-gray-700">{children}</div>
      )}
    </div>
  );
}

function ArchiveRow({ children, onRestore, onDelete }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0 flex items-center gap-4">{children}</div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onRestore} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors" title="Restore">
          <RotateCcw className="w-3.5 h-3.5" /> Restore
        </button>
        <button onClick={onDelete} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" title="Delete permanently">
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </div>
  );
}

function ArchivedDate({ date }) {
  if (!date) return null;
  const d = new Date(date);
  return (
    <span className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
      Archived {d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
    </span>
  );
}


