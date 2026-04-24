import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PDFPreviewModal({ 
  isOpen, 
  onClose, 
  pdfBase64, 
  fileName, 
  onConfirmDownload 
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const handleDownload = () => {
    onConfirmDownload();
    onClose();
  };

  const pdfUrl = pdfBase64 ? `data:application/pdf;base64,${pdfBase64}` : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg">PDF Preview</DialogTitle>
            <p className="text-xs text-slate-600 mt-1">{fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto"
          >
            <X className="w-5 h-5 text-slate-500 hover:text-slate-700" />
          </button>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden bg-slate-100 flex flex-col">
          <iframe
            src={pdfUrl}
            className="flex-1 w-full border-0"
            title="PDF Preview"
            onLoad={(e) => {
              try {
                const iframeDoc = e.target.contentDocument;
                if (iframeDoc && iframeDoc.readyState === 'complete') {
                  // Try to get page count from PDF
                  const scripts = iframeDoc.querySelectorAll('script');
                  // Most PDF viewers will render page info
                }
              } catch (err) {
                // CORS or other restrictions
              }
            }}
          />
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-t bg-white space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Review the document structure, pagination, and order before confirming download.
            </p>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            >
              <Download className="w-4 h-4" />
              Confirm Download
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}