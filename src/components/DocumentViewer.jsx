import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Highlighter, Trash2 } from 'lucide-react';

export default function DocumentViewer({ fileUrl, fileType, annotations = [], onHighlightCreate = () => {}, onHighlightDelete = () => {} }) {
  const [selectedText, setSelectedText] = useState(null);
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const containerRef = useRef(null);

  const colorOptions = [
    { name: 'yellow', bg: 'bg-yellow-200', border: 'border-yellow-400' },
    { name: 'red', bg: 'bg-red-200', border: 'border-red-400' },
    { name: 'blue', bg: 'bg-blue-200', border: 'border-blue-400' },
    { name: 'green', bg: 'bg-green-200', border: 'border-green-400' },
    { name: 'purple', bg: 'bg-purple-200', border: 'border-purple-400' }
  ];

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

      setSelectedText({
        text: selection.toString(),
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height
      });
      setShowColorPicker(true);
    }
  };

  const handleCreateHighlight = () => {
    if (selectedText) {
      onHighlightCreate({
        highlight_text: selectedText.text,
        highlight_color: highlightColor,
        x: selectedText.x,
        y: selectedText.y,
        width: selectedText.width,
        height: selectedText.height
      });
      setSelectedText(null);
      setShowColorPicker(false);
    }
  };

  const renderContent = () => {
    if (fileType === 'pdf') {
      return (
        <iframe
          src={`${fileUrl}#toolbar=0`}
          className="w-full h-full border-0"
          title="PDF Viewer"
          onLoad={() => console.log('PDF loaded')}
        />
      );
    } else if (fileType === 'image') {
      return (
        <img src={fileUrl} alt="Document" className="max-w-full h-auto" onMouseUp={handleTextSelection} />
      );
    } else {
      return (
        <div className="p-6 text-center text-slate-500">
          <p>Document type not supported for annotation</p>
        </div>
      );
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-slate-50 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Highlighter className="w-5 h-5 text-indigo-600" />
            Document Viewer - Select text to annotate
          </CardTitle>
          <div className="flex gap-1">
            {colorOptions.map((color) => (
              <button
                key={color.name}
                onClick={() => setHighlightColor(color.name)}
                className={`w-6 h-6 rounded border-2 ${color.bg} ${highlightColor === color.name ? color.border : 'border-slate-300'}`}
              />
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 bg-white min-h-96">
        <div ref={containerRef} className="relative bg-slate-100 rounded-lg overflow-auto max-h-96">
          <div onMouseUp={handleTextSelection} className="relative">
            {renderContent()}
            
            {/* Annotation overlays */}
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                className={`absolute border-2 pointer-events-none opacity-60 ${
                  annotation.highlight_color === 'yellow' ? 'bg-yellow-200 border-yellow-400' :
                  annotation.highlight_color === 'red' ? 'bg-red-200 border-red-400' :
                  annotation.highlight_color === 'blue' ? 'bg-blue-200 border-blue-400' :
                  annotation.highlight_color === 'green' ? 'bg-green-200 border-green-400' :
                  'bg-purple-200 border-purple-400'
                }`}
                style={{
                  left: `${annotation.x}px`,
                  top: `${annotation.y}px`,
                  width: `${annotation.width}px`,
                  height: `${annotation.height}px`
                }}
              />
            ))}
          </div>
        </div>

        {/* Color picker and create button */}
        {showColorPicker && selectedText && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm font-medium text-slate-900 mb-3">Selected: "{selectedText.text.substring(0, 50)}..."</p>
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2"
                onClick={handleCreateHighlight}
              >
                <Highlighter className="w-4 h-4" />
                Highlight in {highlightColor.charAt(0).toUpperCase() + highlightColor.slice(1)}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowColorPicker(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Annotations list */}
        {annotations.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Highlights ({annotations.length})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {annotations.map((annotation) => (
                <div key={annotation.id} className="text-xs bg-slate-50 p-3 rounded border border-slate-200 flex justify-between items-start">
                  <div>
                    <p className="text-slate-700 font-medium">"{annotation.highlight_text.substring(0, 40)}..."</p>
                    {annotation.annotation_note && (
                      <p className="text-slate-600 mt-1">{annotation.annotation_note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onHighlightDelete(annotation.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}