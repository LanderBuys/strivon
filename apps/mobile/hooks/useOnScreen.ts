import { useEffect, useState, RefObject } from 'react';
import { View, Dimensions } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function useOnScreen(ref: RefObject<View>, threshold = 0.5): boolean {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const checkVisibility = () => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width === 0 || height === 0) {
          setIntersecting(false);
          return;
        }

        // Calculate visible portion
        const visibleTop = Math.max(0, y);
        const visibleBottom = Math.min(SCREEN_HEIGHT, y + height);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const visibleRatio = visibleHeight / height;

        // Component is visible if it's on screen and meets threshold
        const isVisible = 
          y < SCREEN_HEIGHT && 
          y + height > 0 && 
          visibleRatio >= threshold;
        
        setIntersecting(isVisible);
      });
    };

    // Check immediately
    checkVisibility();
    
    // Check periodically (every 500ms) and on scroll
    const interval = setInterval(checkVisibility, 500);
    
    return () => clearInterval(interval);
  }, [ref, threshold]);

  return isIntersecting;
}
