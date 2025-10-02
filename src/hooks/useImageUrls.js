import { useState, useEffect } from 'react';

// Configuration - Update this after running 'terraform apply' to get your actual API Gateway URL
// The URL will be in format: https://{api-id}.execute-api.eu-west-1.amazonaws.com/prod
const API_BASE_URL = 'https://your-api-gateway-id.execute-api.eu-west-1.amazonaws.com/prod';

/**
 * Custom hook to fetch pre-signed URLs for S3 images
 * Returns { imageUrls, loading, error }
 */
export const useImageUrls = () => {
  const [imageUrls, setImageUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchImageUrls = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/images`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image URLs: ${response.status}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          setImageUrls(data.imageUrls || {});
          console.log('✅ Fetched pre-signed URLs:', Object.keys(data.imageUrls || {}));
        }

      } catch (err) {
        console.error('❌ Error fetching image URLs:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchImageUrls();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, []);

  return { imageUrls, loading, error };
};

/**
 * Helper function to get image URL with fallback
 * @param {Object} imageUrls - Object containing pre-signed URLs
 * @param {string} imageName - Name of the image file
 * @param {string} [fallbackUrl] - Optional fallback URL if pre-signed URL not available
 * @returns {string} Image URL to use
 */
export const getImageUrl = (imageUrls, imageName, fallbackUrl) => {
  // Check if we have a pre-signed URL for this image
  if (imageUrls[imageName]) {
    return imageUrls[imageName];
  }

  // Use fallback URL if provided
  if (fallbackUrl) {
    return fallbackUrl;
  }

  // Use local public folder as last resort
  return `${import.meta.env.BASE_URL}${imageName}`;
};