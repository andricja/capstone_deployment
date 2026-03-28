import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import api from '../lib/api';

export default function AdCarousel() {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await api.get('/ads/active');
      setAds(response.data || []);
    } catch (error) {
      console.error('Failed to fetch ads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (ads.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [ads.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  };

  const handleAdClick = (ad) => {
    if (ad.link_url) {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (!isVisible || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentIndex];

  return (
    <div className="relative bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg overflow-hidden shadow-md mb-6">
      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 z-10 p-1 bg-white/80 dark:bg-gray-900/80 rounded-full hover:bg-white dark:hover:bg-gray-900 transition-colors"
        title="Close ad"
      >
        <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>

      <div
        className={`relative ${currentAd.link_url ? 'cursor-pointer' : ''}`}
        onClick={() => handleAdClick(currentAd)}
      >
        {/* Ad content */}
        <div className="flex flex-col md:flex-row items-center gap-4 p-6">
          {/* Ad image */}
          {currentAd.image && (
            <div className="flex-shrink-0 w-full md:w-48 h-32 rounded-lg overflow-hidden bg-white dark:bg-gray-700">
              <img
                src={`/storage/${currentAd.image}`}
                alt={currentAd.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Ad text */}
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              {currentAd.title}
            </h3>
            {currentAd.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                {currentAd.description}
              </p>
            )}
            {currentAd.link_url && (
              <div className="mt-2 flex items-center justify-center md:justify-start gap-1 text-blue-600 dark:text-blue-400 text-sm font-medium">
                <span>Learn More</span>
                <ExternalLink className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        {/* Navigation arrows (only show if multiple ads) */}
        {ads.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-900/80 rounded-full hover:bg-white dark:hover:bg-gray-900 transition-colors"
              title="Previous ad"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 dark:bg-gray-900/80 rounded-full hover:bg-white dark:hover:bg-gray-900 transition-colors"
              title="Next ad"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </>
        )}
      </div>

      {/* Dots indicator (only show if multiple ads) */}
      {ads.length > 1 && (
        <div className="flex justify-center gap-2 pb-4">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-green-600 w-6'
                  : 'bg-gray-400 dark:bg-gray-500'
              }`}
              title={`Go to ad ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
