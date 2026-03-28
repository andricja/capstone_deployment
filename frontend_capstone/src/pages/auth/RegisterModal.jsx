import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { Tractor, X, MailCheck, ArrowLeft } from 'lucide-react';

export default function RegisterModal({ open, onClose, onSwitchToLogin, onVerifyEmail }) {
  const { register } = useAuth();
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'renter',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Verification state
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const codeRefs = useRef([]);

  // Reset everything when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep('form');
      setForm({ name: '', email: '', password: '', password_confirmation: '', role: 'renter' });
      setErrors({});
      setCode(['', '', '', '', '', '']);
      setVerifyMessage('');
      setVerifyError('');
      setVerified(false);
    }
  }, [open]);

  // Auto-focus first code input when switching to verify step
  useEffect(() => {
    if (step === 'verify') {
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  if (!open) return null;

  // ─── Step 1: Register ───
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const data = await register(form.name, form.email, form.password, form.password_confirmation, form.role);
      if (data.requires_verification) {
        setStep('verify');
      }
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setErrors({ general: [err.response?.data?.message || 'Registration failed.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify Code ───
  const handleCodeChange = (idx, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...code];
    next[idx] = value;
    setCode(next);
    if (value && idx < 5) codeRefs.current[idx + 1]?.focus();
  };

  const handleCodeKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setCode(text.split(''));
      codeRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const codeStr = code.join('');
    if (codeStr.length !== 6) {
      setVerifyError('Please enter the full 6-digit code.');
      return;
    }
    setVerifyLoading(true);
    setVerifyError('');
    setVerifyMessage('');
    try {
      const res = await api.post('/verify-email', { email: form.email, code: codeStr });
      const msg = res.data.auto_approved
        ? 'Email verified! Your account is ready — you can now log in.'
        : 'Email verified! Your account is now pending admin approval.';
      setVerifyMessage(res.data.message || msg);
      setVerified(true);
      setTimeout(() => onClose(), 3000);
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setVerifyError('');
    setVerifyMessage('');
    try {
      const res = await api.post('/resend-verification', { email: form.email });
      setVerifyMessage(res.data.message || 'A new code has been sent to your email.');
      setCode(['', '', '', '', '', '']);
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch (err) {
      setVerifyError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative max-h-[90vh] overflow-y-auto animate-in" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-5 h-5" />
        </button>

        {step === 'form' ? (
          <>
            {/* ════════ STEP 1: Registration Form ════════ */}
            <div className="text-center mb-8">
              <Tractor className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Join FERMs as a renter or equipment owner</p>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {errors.general[0]}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I want to:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'renter' })}
                    className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-colors ${
                      form.role === 'renter'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    🌾 Rent Equipment
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, role: 'owner' })}
                    className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-colors ${
                      form.role === 'owner'
                        ? 'border-green-600 bg-green-50 text-green-700'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    🚜 List Equipment
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input type="text" required value={form.name} onChange={set('name')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" required value={form.email} onChange={set('email')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <input type="password" required value={form.password} onChange={set('password')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                <input type="password" required value={form.password_confirmation} onChange={set('password_confirmation')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-shadow dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-2.5 rounded-lg font-medium hover:from-green-700 hover:to-emerald-600 transition-colors disabled:opacity-50">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              Already have an account?{' '}
              <button onClick={onSwitchToLogin} className="text-green-600 hover:text-green-700 font-medium">
                Sign In
              </button>
            </p>
          </>
        ) : (
          <>
            {/* ════════ STEP 2: Email Verification ════════ */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MailCheck className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Your Email</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                We sent a 6-digit code to<br />
                <span className="font-medium text-gray-700 dark:text-gray-300">{form.email}</span>
              </p>
            </div>

            {verifyMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm text-center">
                {verifyMessage}
              </div>
            )}
            {verifyError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm text-center">
                {verifyError}
              </div>
            )}

            {!verified && (
              <form onSubmit={handleVerify}>
                <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                  {code.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (codeRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(idx, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={verifyLoading || code.join('').length !== 6}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-500 text-white py-2.5 rounded-lg font-medium hover:from-green-700 hover:to-emerald-600 transition-colors disabled:opacity-50"
                >
                  {verifyLoading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>
            )}

            {!verified && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                Didn't receive the code?{' '}
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
