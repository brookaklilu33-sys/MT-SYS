import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, ExternalLink, RefreshCw } from 'lucide-react';
import { DEFAULT_INVOICE_IMAGE } from '../../services/receiptAssets';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  subtitle?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = 'Document Evidence',
  subtitle
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(imageUrl);

  React.useEffect(() => {
    setCurrentSrc(imageUrl);
    setScale(1);
    setRotation(0);
  }, [imageUrl, isOpen]);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E8EDF2] flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EDF2] bg-[#F7FAFD]">
          <div>
            <h3 className="text-sm font-bold text-[#202B38]">{title}</h3>
            {subtitle && <p className="text-xs text-[#778493]">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Zoom & Rotation Controls */}
            <div className="hidden sm:flex items-center bg-white border border-[#E8EDF2] rounded-lg p-0.5 mr-2">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 text-[#778493] hover:text-[#2878B9] hover:bg-[#EAF4FC] rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 text-[#778493] hover:text-[#2878B9] hover:bg-[#EAF4FC] rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 text-[#778493] hover:text-[#2878B9] hover:bg-[#EAF4FC] rounded"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 text-[#778493] hover:text-[#2878B9] hover:bg-[#EAF4FC] rounded"
                title="Reset View"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <a
              href={currentSrc}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-[#778493] hover:text-[#2878B9] hover:bg-[#EAF4FC] rounded-lg transition-colors"
              title="Open full size"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={currentSrc}
              download="receipt-evidence.png"
              className="p-1.5 text-[#778493] hover:text-[#2878B9] hover:bg-[#EAF4FC] rounded-lg transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-[#778493] hover:text-[#202B38] hover:bg-[#EAF4FC] rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Viewer with Zoom & Rotation */}
        <div className="p-4 overflow-auto flex items-center justify-center bg-[#F7FAFD]/70 min-h-[350px] max-h-[75vh]">
          <img
            src={currentSrc}
            alt={title}
            onError={() => setCurrentSrc(DEFAULT_INVOICE_IMAGE)}
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.15s ease-out'
            }}
            className="max-h-[70vh] w-auto object-contain rounded-lg shadow-sm border border-[#E8EDF2] select-none"
          />
        </div>

        {/* Footer info */}
        <div className="px-5 py-2 bg-white border-t border-[#E8EDF2] text-center text-[11px] text-[#778493]">
          Click outside or press Close to dismiss • Verified Moderntech ERP Document Evidence
        </div>
      </div>
    </div>
  );
};
