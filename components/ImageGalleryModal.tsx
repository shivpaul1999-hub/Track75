
import React, { useEffect } from 'react';
import Icon from './Icon';

interface ImageGalleryModalProps {
  items: { url: string; name: string; type: 'image' | 'video' }[];
  initialIndex: number;
  onExit: () => void;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ items, initialIndex, onExit }) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const currentItem = items[currentIndex];

  if (!currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in">
      {/* Close Button */}
      <button
        onClick={onExit}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <Icon name="x" className="w-6 h-6" />
      </button>

      {/* Navigation Buttons */}
      {items.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors group"
          >
            <Icon name="chevron-left" className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors group"
          >
            <Icon name="chevron-right" className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </>
      )}

      {/* Content */}
      <div className="w-full max-w-5xl h-[80vh] flex flex-col items-center justify-center px-12">
        <div className="relative w-full h-full flex items-center justify-center">
          {currentItem.type === 'image' ? (
            <img
              src={currentItem.url}
              alt={currentItem.name}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
            />
          ) : (
            <video
              src={currentItem.url}
              controls
              autoPlay
              className="max-w-full max-h-full shadow-2xl rounded-lg"
            />
          )}
        </div>

        <div className="mt-4 text-center">
          <p className="text-white font-medium text-lg">{currentItem.name}</p>
          <p className="text-white/60 text-sm">{currentIndex + 1} of {items.length}</p>
        </div>
      </div>
    </div>
  );
};

export default ImageGalleryModal;
