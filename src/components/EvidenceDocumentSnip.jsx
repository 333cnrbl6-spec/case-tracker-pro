import React, { useState } from 'react';
import { ZoomIn, ZoomOut, ExternalLink, FileText, Image as ImageIcon, X } from 'lucide-react';

/**
 * Renders the original scanned document as a viewable image snip.
 * Supports JPG/PNG (direct img tag) and PDF (iframe embed with fallback).
 */
export default function EvidenceDocumentSnip({ fileUrl, title, compact = false }) {
  const [zoomed, setZoomed] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!fileUrl) return null;

  const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(fileUrl);
  const isPdf = /\.pdf(\?|$)/i.test(fileUrl);
  // Treat unknown extensions as image first (base44 media URLs are usually images)
  const tryAsImage = isImage || (!isPdf);

  if (compact) {
    // Compact thumbnail strip for inline use in narrative/cards
    return (
      <div className="mt-3">
        <div
          className="relative cursor-zoom-in group rounded-lg overflow-hidden border border-slate-200 shadow-sm"
          style={{ maxWidth: 320 }}
          onClick={() => setZoomed(true)}
        >
          {tryAsImage && !imgError ? (
            <img
              src={fileUrl}
              alt={title || 'Evidence document'}
              className="w-full object-cover"
              style={{ maxHeight: 180 }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="bg-slate-100 flex flex-col items-center justify-center gap-2 p-6" style={{ height: 120 }}>
              <FileText className="w-8 h-8 text-slate-400" />
              <span className="text-xs text-slate-500">PDF — click to view</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
            <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 drop-shadow transition" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
            <p className="text-white text-xs truncate">{title}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Normal view */}
      <div className="mt-3 rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-white">
        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            {tryAsImage && !imgError ? <ImageIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
            {title || 'Original Document'}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomed(true)}
              className="p-1 hover:bg-slate-200 rounded text-slate-500"
              title="Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 hover:bg-slate-200 rounded text-slate-500"
              title="Open original"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {tryAsImage && !imgError ? (
          <img
            src={fileUrl}
            alt={title || 'Evidence document'}
            className="w-full object-contain cursor-zoom-in"
            style={{ maxHeight: 400 }}
            onClick={() => setZoomed(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <iframe
            src={fileUrl}
            title={title || 'Document'}
            className="w-full"
            style={{ height: 500, border: 'none' }}
          />
        )}
      </div>

      {/* Lightbox / fullscreen zoom */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-slate-300 z-10"
            onClick={() => setZoomed(false)}
          >
            <X className="w-7 h-7" />
          </button>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 left-4 text-white hover:text-slate-300 z-10 flex items-center gap-1 text-sm"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4" /> Open original
          </a>
          {tryAsImage && !imgError ? (
            <img
              src={fileUrl}
              alt={title}
              className="max-w-full max-h-full object-contain rounded shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <iframe
              src={fileUrl}
              title={title}
              className="w-full rounded shadow-2xl"
              style={{ height: '85vh', maxWidth: 900, border: 'none' }}
              onClick={e => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
}