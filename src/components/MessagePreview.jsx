import React from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { formatPhoneForDisplay } from '../utils/phoneUtils';

function MessagePreview({ previews, totalCount, onClose, onConfirm }) {
  if (!previews || previews.length === 0) return null;

  const hasMissingPlaceholders = previews.some(
    (p) => p.message.includes('{') || p.message.includes('{{')
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold">Preview Messages</h2>
            <p className="text-sm text-gray-600">
              Reviewing 5 samples from {totalCount} contacts
            </p>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* STATUS */}
        {hasMissingPlaceholders ? (
          <div className="p-4 bg-yellow-50 flex gap-3">
            <AlertTriangle className="text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Some placeholders could not be replaced.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-green-50 flex gap-3">
            <CheckCircle className="text-green-600" />
            <p className="text-sm text-green-800">
              All placeholders replaced successfully.
            </p>
          </div>
        )}

        {/* PREVIEW LIST */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {previews.map((preview, index) => (
            <div key={index} className="bg-white border rounded-xl p-4 shadow-sm">
              <div className="font-bold mb-2">
                {formatPhoneForDisplay(preview.phone)}
              </div>
              <pre className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                {preview.message}
              </pre>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t bg-white flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={onConfirm}
          >
            Confirm & Proceed
          </Button>
        </div>
      </div>
    </div>
  );
}

export default MessagePreview;
