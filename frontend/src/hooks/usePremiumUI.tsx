import { useState, useEffect, useRef } from 'react';

/**
 * Hook for cinematic number counting (e.g. 0 -> 450)
 */
export function useCountUp(end: number, duration: number = 1000, start: number = 0) {
  const [count, setCount] = useState(start);
  const countRef = useRef(start);

  useEffect(() => {
    let startTime: number | null = null;
    const distance = end - start;

    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const current = Math.floor(start + distance * easeOutQuart(percentage));
      
      if (current !== countRef.current) {
        countRef.current = current;
        setCount(current);
      }

      if (progress < duration) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end); // Ensure exact finish
      }
    };

    window.requestAnimationFrame(step);
  }, [end, duration, start]);

  return count;
}

/**
 * Hook for detecting when an element enters viewport for scroll animations
 */
export function useIntersectionObserver(options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, { threshold: 0.1, ...options });

    const currentTarget = targetRef.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [options]);

  return { targetRef, isIntersecting };
}
