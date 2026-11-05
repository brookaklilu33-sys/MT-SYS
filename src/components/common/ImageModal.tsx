import React from 'react';
import { X, Download, ZoomIn, ExternalLink } from 'lucide-react';

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
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="relative max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden border border-[#E8EDF2] flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EDF2] bg-[#F7FAFD]">
          <div>
            <h3 className="text-sm font-semibold text-[#202B38]">{title}</h3>
            {subtitle && <p className="text-xs text-[#778493]">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-[#778493] hover:text-[#2878B9] hover:bg-[#EAF4FC] rounded-md transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href={imageUrl}
              download="receipt-evidence.jpg"
              className="p-1.5 text-[#778493] hover:text-[#2878B9] hover:bg-[#EAF4FC] rounded-md transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-[#778493] hover:text-[#202B38] hover:bg-[#EAF4FC] rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto flex items-center justify-center bg-[#F7FAFD]/50 min-h-[300px]">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[75vh] w-auto object-contain rounded-lg shadow-sm border border-[#E8EDF2]"
          />
        </div>
      </div>
    </div>
  );
};
