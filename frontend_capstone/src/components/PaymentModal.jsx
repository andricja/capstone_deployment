import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Banknote, Upload, ImageIcon, CreditCard, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useToast } from './Toast';

export default function PaymentModal({ rental, onClose, onSuccess }) {
  const toast = useToast();
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'downpayment',
    paid_amount: '',
  });
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Debug: Log rental data
  console.log('PaymentModal rental data:', rental);
  console.log('Equipment:', rental.equipment);
  console.log('Owner:', rental.equipment?.owner);
  console.log('GCash Setting (snake_case):', rental.equipment?.owner?.gcash_setting);
  console.log('GCash Setting (camelCase):', rental.equipment?.owner?.gcashSetting);

  // Support both naming conventions
  const gcashSetting = rental.equipment?.owner?.gcashSetting || rental.equipment?.owner?.gcash_setting;

  const totalCost = parseFloat(rental.total_cost || 0);
  const suggestedDownPayment = totalCost * 0.5;
  const suggestedFullPayment = totalCost;

  const fmt = (n) => parseFloat(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate amount
      const paidAmount = parseFloat(paymentForm.paid_amount);
      if (isNaN(paidAmount) || paidAmount <= 0) {
        toast.error('Please enter a valid payment amount.');
        setSubmitting(false);
        return;
      }

      // Validate proof
      if (!paymentProofFile) {
        toast.error('Please upload payment proof.');
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('payment_method', paymentForm.payment_method);
      formData.append('paid_amount', paidAmount);
      formData.append('payment_proof', paymentProofFile);

      await api.post(`/renter/rental-requests/${rental.id}/payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Payment submitted successfully!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit payment.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Complete Payment</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Submit payment for your rental request
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Rental Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-3">Rental Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Equipment:</span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.equipment?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Farm Size:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {rental.farm_size_sqm ? `${(rental.farm_size_sqm / 10000).toFixed(2)} ha` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 dark:text-gray-300">Rental Days:</span>
                <span className="font-medium text-gray-900 dark:text-white">{rental.rental_days || 0} day(s)</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-green-200 dark:border-green-700">
                <span className="text-gray-900 dark:text-gray-200 font-semibold">Total Cost:</span>
                <span className="text-lg font-bold text-green-700 dark:text-green-400">₱{fmt(totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Banknote className="inline w-4 h-4 mr-1 -mt-0.5" />Payment Method
            </label>
            <div className="flex gap-3">
              {[
                { value: 'downpayment', label: 'Down Payment (50%)', icon: '💰' },
                { value: 'fullpayment', label: 'Full Payment', icon: '💳' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex-1 flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer transition-colors ${
                    paymentForm.payment_method === opt.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={opt.value}
                    checked={paymentForm.payment_method === opt.value}
                    onChange={(e) => {
                      setPaymentForm({ ...paymentForm, payment_method: e.target.value });
                      // Auto-fill suggested amount
                      if (e.target.value === 'downpayment') {
                        setPaymentForm({ ...paymentForm, payment_method: e.target.value, paid_amount: suggestedDownPayment.toFixed(2) });
                      } else {
                        setPaymentForm({ ...paymentForm, payment_method: e.target.value, paid_amount: suggestedFullPayment.toFixed(2) });
                      }
                    }}
                    className="accent-green-600"
                  />
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount Paid <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={paymentForm.paid_amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, paid_amount: e.target.value })}
              placeholder={
                paymentForm.payment_method === 'downpayment'
                  ? `Suggested: ₱${fmt(suggestedDownPayment)}`
                  : `Suggested: ₱${fmt(suggestedFullPayment)}`
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none dark:bg-gray-700 dark:text-gray-200"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {paymentForm.payment_method === 'downpayment' ? (
                <>
                  Suggested down payment (50%): <span className="font-semibold text-green-600 dark:text-green-400">₱{fmt(suggestedDownPayment)}</span>
                </>
              ) : (
                <>
                  Full payment amount: <span className="font-semibold text-green-600 dark:text-green-400">₱{fmt(suggestedFullPayment)}</span>
                </>
              )}
            </p>
          </div>

          {/* GCash Payment Section */}
          {gcashSetting ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
              {/* Owner GCash QR Code */}
              <div className="text-center">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                  {paymentForm.payment_method === 'downpayment' ? 'Pay Down Payment via GCash' : 'Pay Full Amount via GCash'}
                </p>
                {gcashSetting.qr_code_image ? (
                  <img
                    src={`/storage/${gcashSetting.qr_code_image}`}
                    alt="GCash QR Code"
                    className="mx-auto w-48 h-48 object-contain border-2 border-blue-300 dark:border-blue-600 rounded-lg"
                    onError={(e) => {
                      console.error('QR Code image failed to load:', `/storage/${gcashSetting.qr_code_image}`);
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EQR Code Not Found%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="mx-auto w-48 h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-xs text-gray-500 dark:text-gray-400">No QR Code</p>
                  </div>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {gcashSetting.account_name} &bull; {gcashSetting.account_number}
                </p>
                {paymentForm.payment_method === 'downpayment' && (
                  <p className="text-sm font-bold text-green-700 dark:text-green-400 mt-2">
                    Down Payment (50%): ₱{fmt(suggestedDownPayment)}
                  </p>
                )}
                {paymentForm.payment_method === 'fullpayment' && (
                  <p className="text-sm font-bold text-green-700 dark:text-green-400 mt-2">
                    Full Payment: ₱{fmt(suggestedFullPayment)}
                  </p>
                )}
              </div>

              {/* Upload Payment Proof */}
              <div>
                <label className="block text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                  <Upload className="inline w-4 h-4 mr-1 -mt-0.5" />Upload Payment Proof (Screenshot) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-300 dark:hover:file:bg-blue-800"
                  required={!proofPreview}
                />
                {proofPreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={proofPreview} alt="Payment proof preview" className="max-h-40 rounded-lg border border-blue-200 dark:border-blue-700" />
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProofFile(null);
                        setProofPreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      &times;
                    </button>
                  </div>
                )}
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  📸 Take a screenshot of your GCash payment confirmation
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-medium">Owner has not set up GCash yet. Please contact the owner.</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !paymentProofFile || !gcashSetting}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-700 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
