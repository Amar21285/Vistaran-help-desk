import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

// Simple performance monitoring hook
export const usePerformanceMonitoring = (componentName: string) => {
  const renderStart = useRef<number>(0);
  
  // Start timing when component begins rendering
  renderStart.current = performance.now();
  
  useEffect(() => {
    // Calculate render time when component finishes rendering
    const renderTime = performance.now() - renderStart.current;
    
    // Log performance metrics
    const metrics: PerformanceMetrics = {
      componentName,
      renderTime,
      timestamp: Date.now()
    };
    
    console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    
    // In a real implementation, you might send this to analytics
    // sendToAnalytics(metrics);
  });
  
  // Return a function to start timing for specific operations
  const startTiming = (operationName: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      console.log(`[Performance] ${componentName}.${operationName} took ${duration.toFixed(2)}ms`);
      return duration;
    };
  };
  
  return { startTiming };
};