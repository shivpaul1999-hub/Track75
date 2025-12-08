import React, { useState, useEffect, useCallback } from 'react';
import Icon from './Icon';

interface GalleryItem {
  url: string;
  name: string;
  author: string;
  date: string;
  type: 'image' | 'video';
  mimeType?: string;
}

interface ImageGalleryModalProps {
  items: GalleryItem[];
  initialIndex: number;
  onExit: () => void;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ items, initialIndex, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const currentItem = items[currentIndex];
  const isVideo = currentItem?.type === 'video';

  const handleClose = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => onExit(), 300); // Corresponds to lightbox-fade-out duration
  }, [onExit]);

  const goToPrevious = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prevIndex => (prevIndex === 0 ? items.length - 1 : prevIndex - 1));
  }, [items.length]);

  const goToNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prevIndex => (prevIndex === items.length - 1 ? 0 : prevIndex + 1));
  }, [items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (items.length > 1) {
        if (e.key === 'ArrowRight') goToNext();
        if (e.key === 'ArrowLeft') goToPrevious();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, goToNext, goToPrevious, items.length]);

  if (!currentItem) return null;

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4 ${isAnimatingOut ? 'animate-lightbox-fade-out' : 'animate-lightbox-fade-in'}`}
      onClick={handleClose}
    >
      {/* Media Content */}
      {isVideo ? (
        <video
          key={currentItem.url}
          src={currentItem.url}
          controls
          autoPlay
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          Your browser does not support the video tag.
        </video>
      ) : (
        <img
          src={currentItem.url}
          alt={currentItem.name}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={e => e.stopPropagation()}
        />
      )}
      
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white text-4xl leading-none font-bold hover:text-gray-300"
        aria-label="Close image viewer"
      >
        &times;
      </button>

      {/* Navigation Buttons */}
      {items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all"
            aria-label="Previous image"
          >
            <Icon name="chevron-left" className="w-8 h-8"/>
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-all"
            aria-label="Next image"
          >
            <Icon name="chevron-right" className="w-8 h-8"/>
          </button>
        </>
      )}
    </div>
  );
};

export default ImageGalleryModal;
