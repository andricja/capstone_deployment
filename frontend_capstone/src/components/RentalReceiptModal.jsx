import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Receipt, Printer, X, CheckCircle, Clock, Send, XCircle } from 'lucide-react';

/**
 * Receipt modal for rental requests.
 *
 * Props:
 *   rental  – rental request object with equipment, cost breakdown fields
 *   onClose – callback to close the modal
 */
export default function RentalReceiptModal({ rental, onClose }) {
  const receiptRef = useRef(null);
  const [proofImage, setProofImage] = useState(null);

  if (!rental) return null;

  const eq = rental.equipment || {};
  const fmt = (v) => parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const statusConfig = {
    forwarded: { label: 'Forwarded to Owner', color: 'blue', icon: <Send className="w-4 h-4" /> },
    approved:  { label: 'Approved', color: 'green', icon: <CheckCircle className="w-4 h-4" /> },
    rejected:  { label: 'Rejected', color: 'red', icon: <XCircle className="w-4 h-4" /> },
  };
  const st = statusConfig[rental.status] || statusConfig.forwarded;

  const statusBg = { blue: 'bg-blue-50 border-blue-100 text-blue-700', green: 'bg-green-50 border-green-100 text-green-700', red: 'bg-red-50 border-red-100 text-red-700' };

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=420,height=700');
    win.document.write(`
      <html><head><title>Rental Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
        h2 { text-align: center; margin-bottom: 4px; }
        .sub { text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 6px 4px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        td:first-child { color: #6b7280; width: 42%; }
        .total { font-weight: bold; font-size: 18px; }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #9ca3af; }
        .section { font-weight: 600; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; padding-top: 12px; border-bottom: none; }
      </style></head><body>
      ${content.innerHTML}
      <div class="footer">FERMs &bull; Farm Equipment Rental and Monitoring System</div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 text-white text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Rental Receipt</h3>
          <p className="text-green-100 text-sm">Booking Reference</p>
        </div>

        {/* Receipt body */}
        <div ref={receiptRef} className="px-6 py-5">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">FERMs</h2>
            <p className="text-xs text-gray-400">Farm Equipment Rental and Monitoring System</p>
          </div>

          <div className="border-t border-dashed pt-4 space-y-2.5 text-sm">
            {/* Reference info */}
            <div className="flex justify-between">
              <span className="text-gray-500">Receipt No.</span>
              <span className="font-mono font-medium text-gray-900">RNT-{String(rental.id).padStart(5, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">{new Date(rental.created_at).toLocaleDateString()}</span>
            </div>

            {/* Equipment info */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Equipment</p>
            <div className="flex justify-between">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900">{eq.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="font-medium text-gray-900 capitalize">{eq.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Location</span>
              <span className="font-medium text-gray-900">{eq.location}</span>
            </div>
            {eq.owner && (
              <div className="flex justify-between">
                <span className="text-gray-500">Owner</span>
                <span className="font-medium text-gray-900">{eq.owner.name}</span>
              </div>
            )}

            {/* Farm & rental details */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Rental Details</p>
            <div className="flex justify-between">
              <span className="text-gray-500">Farm Size</span>
              <span className="font-medium text-gray-900">{parseFloat(rental.farm_size_sqm || 0).toLocaleString()} sqm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Est. Hours</span>
              <span className="font-medium text-gray-900">{parseFloat(rental.estimated_hours || 0)} hrs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Rental Days</span>
              <span className="font-medium text-gray-900">{rental.rental_days} day(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Period</span>
              <span className="font-medium text-gray-900">
                {new Date(rental.start_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                {rental.rental_days > 1 && ` — ${new Date(rental.end_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery To</span>
              <span className="font-medium text-gray-900 text-right max-w-[55%]">{rental.delivery_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method</span>
              <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                rental.payment_method === 'downpayment' ? 'bg-blue-100 text-blue-700' : 
                rental.payment_method === 'fullpayment' ? 'bg-green-100 text-green-700' : 
                'bg-yellow-100 text-yellow-700'
              }`}>
                {rental.payment_method === 'downpayment' ? 'GCash Down Payment (50%)' : 
                 rental.payment_method === 'fullpayment' ? 'GCash Full Payment (100%)' : 
                 rental.payment_method === 'gcash' ? 'GCash' : 'COD'}
              </span>
            </div>
            {rental.payment_proof && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">Payment Proof:</p>
                <img src={`/storage/${rental.payment_proof}`} alt="Payment proof"
                  className="max-h-32 rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setProofImage(`/storage/${rental.payment_proof}`)} />
              </div>
            )}

            {/* Cost breakdown */}
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-2">Cost Breakdown</p>
            <div className="flex justify-between">
              <span className="text-gray-500">Base Cost (₱{fmt(eq.daily_rate)} × {rental.rental_days}d)</span>
              <span className="font-medium text-gray-900">₱{fmt(rental.base_cost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transportation Fee</span>
              <span className="font-medium text-gray-900">₱{fmt(rental.delivery_fee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Service Charge (5%)</span>
              <span className="font-medium text-gray-900">₱{fmt(rental.service_charge)}</span>
            </div>
            <div className="border-t border-dashed pt-3 flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Total Cost</span>
              <span className="text-xl font-bold text-green-600">₱{fmt(rental.total_cost)}</span>
            </div>
          </div>

          {/* Status badge */}
          <div className={`mt-4 border rounded-lg p-3 text-center ${statusBg[st.color]}`}>
            <p className="font-semibold text-sm flex items-center justify-center gap-1.5">
              {st.icon} Status: {st.label}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg hover:from-green-700 hover:to-emerald-600"
          >
            Done
          </button>
        </div>
      </div>

      {/* Payment proof enlarged modal */}
      {proofImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setProofImage(null)}>
          <div className="relative max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setProofImage(null)}
              className="absolute -top-3 -right-3 bg-white text-gray-600 rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 text-lg font-bold z-10">&times;</button>
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-blue-600 px-4 py-3 text-white text-sm font-semibold text-center">GCash Payment Proof</div>
              <div className="p-4">
                <img src={proofImage} alt="Payment Proof" className="w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
