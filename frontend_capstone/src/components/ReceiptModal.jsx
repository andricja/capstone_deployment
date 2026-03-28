import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Receipt, CheckCircle, Printer, X } from 'lucide-react';

/**
 * Reusable receipt modal for approved equipment.
 *
 * Props:
 *   equipment  – the equipment object (must have id, name, category, location,
 *                daily_rate, transportation_fee, approval_fee, approved_at, owner)
 *   onClose    – callback to close the modal
 */
export default function ReceiptModal({ equipment, onClose }) {
  const receiptRef = useRef(null);

  if (!equipment) return null;

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    win.document.write(`
      <html><head><title>Approval Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
        h2 { text-align: center; margin-bottom: 4px; }
        .sub { text-align: center; color: #6b7280; font-size: 13px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px 4px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
        td:first-child { color: #6b7280; width: 40%; }
        .total { font-weight: bold; font-size: 18px; }
        .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af; }
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 text-white text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
            <Receipt className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">Approval Receipt</h3>
          <p className="text-green-100 text-sm">Equipment successfully approved</p>
        </div>

        {/* Receipt body */}
        <div ref={receiptRef} className="px-6 py-5">
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">FERMs</h2>
            <p className="text-xs text-gray-400">Farm Equipment Rental and Monitoring System</p>
          </div>

          <div className="border-t border-dashed pt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Receipt No.</span>
              <span className="font-mono font-medium text-gray-900">RCP-{String(equipment.id).padStart(5, '0')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">{new Date(equipment.approved_at || equipment.updated_at).toLocaleString()}</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="text-gray-500">Equipment</span>
              <span className="font-medium text-gray-900">{equipment.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Category</span>
              <span className="font-medium text-gray-900 capitalize">{equipment.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Location</span>
              <span className="font-medium text-gray-900">{equipment.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Owner</span>
              <span className="font-medium text-gray-900">{equipment.owner?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Daily Rate</span>
              <span className="font-medium text-gray-900">₱{parseFloat(equipment.daily_rate).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transport Fee</span>
              <span className="font-medium text-gray-900">₱{parseFloat(equipment.transportation_fee).toLocaleString()}</span>
            </div>
            <div className="border-t border-dashed pt-3 flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Approval Fee</span>
              <span className="text-xl font-bold text-green-600">₱{parseFloat(equipment.approval_fee).toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-3 text-center">
            <p className="text-green-700 font-semibold text-sm flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" /> Status: Approved
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
    </div>,
    document.body
  );
}
