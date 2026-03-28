import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Mail, Save, Send, Eye, EyeOff, Server } from 'lucide-react';
import { FormSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';

export default function AdminSmtpSettings() {
  const [form, setForm] = useState({
    mail_host: 'smtp.gmail.com',
    mail_port: 587,
    mail_username: '',
    mail_password: '',
    mail_encryption: 'tls',
    mail_from_address: '',
    mail_from_name: 'FERMs',
  });
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    api.get('/admin/smtp-settings')
      .then((r) => {
        if (r.data) {
          setForm((prev) => ({
            ...prev,
            mail_host: r.data.mail_host || prev.mail_host,
            mail_port: r.data.mail_port || prev.mail_port,
            mail_username: r.data.mail_username || '',
            mail_encryption: r.data.mail_encryption || prev.mail_encryption,
            mail_from_address: r.data.mail_from_address || '',
            mail_from_name: r.data.mail_from_name || prev.mail_from_name,
          }));
          setHasPassword(r.data.has_password);
          setLastUpdated(r.data.updated_at);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/smtp-settings', form);
      toast.success(res.data.message);
      setHasPassword(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save SMTP settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      toast.error('Enter a test email address first.');
      return;
    }
    setTesting(true);
    try {
      const res = await api.post('/admin/smtp-settings/test', { test_email: testEmail });
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Test failed.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <FormSkeleton fields={7} />;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Server className="w-7 h-7 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email (SMTP) Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure email delivery for verification and notification emails</p>
        </div>
      </div>

      {/* Status */}
      {hasPassword && lastUpdated && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <Mail className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">SMTP Configured</p>
            <p className="text-xs text-green-600 dark:text-green-500">
              Last updated: {new Date(lastUpdated).toLocaleString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-6 space-y-5 transition-colors">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Host</label>
            <input
              name="mail_host"
              value={form.mail_host}
              onChange={handleChange}
              required
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
            <input
              name="mail_port"
              type="number"
              value={form.mail_port}
              onChange={handleChange}
              required
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username (Email)</label>
          <input
            name="mail_username"
            type="email"
            value={form.mail_username}
            onChange={handleChange}
            required
            className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            placeholder="yourname@gmail.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            App Password {hasPassword && <span className="text-gray-400">(leave blank to keep current)</span>}
          </label>
          <div className="relative">
            <input
              name="mail_password"
              type={showPassword ? 'text' : 'password'}
              value={form.mail_password}
              onChange={handleChange}
              required={!hasPassword}
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
              placeholder={hasPassword ? '••••••••••••••••' : 'Enter Gmail App Password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            For Gmail: Go to Google Account → Security → 2-Step Verification → App Passwords
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Encryption</label>
          <select
            name="mail_encryption"
            value={form.mail_encryption}
            onChange={handleChange}
            className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
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
              value={form.mail_from_address}
              onChange={handleChange}
              required
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
              placeholder="noreply@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Name</label>
            <input
              name="mail_from_name"
              value={form.mail_from_name}
              onChange={handleChange}
              required
              className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
              placeholder="FERMs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-2.5 rounded-lg font-medium hover:from-green-700 hover:to-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4" /> Save Settings</>
          )}
        </button>
      </form>

      {/* Test Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-green-200 dark:border-green-700 p-6 mt-6 transition-colors">
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
            className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
          />
          <button
            onClick={handleTest}
            disabled={testing}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shrink-0"
          >
            {testing ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Sending...</>
            ) : (
              <><Send className="w-4 h-4" /> Send Test</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
