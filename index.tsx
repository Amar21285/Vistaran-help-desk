import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import CSS file for global styles
import '@fortawesome/fontawesome-free/css/all.min.css'; // Font Awesome
import App from './App';

// Only log in development mode
if (import.meta.env.DEV) {
  console.log('Index.tsx loading');
}

// Enhanced global error handling
window.addEventListener('error', (event) => {
  if (import.meta.env.DEV) {
    console.error('Global error caught:', event.error);
    console.error('Error filename:', event.filename);
    console.error('Error lineno:', event.lineno);
    console.error('Error colno:', event.colno);
    console.error('Error message:', event.message);
    
    // Try to get more detailed error info
    if (event.error && event.error.stack) {
      console.error('Error stack:', event.error.stack);
    }
  }
  
  // Prevent default error handling
  event.preventDefault();
}, true); // Use capturing phase

window.addEventListener('unhandledrejection', (event) => {
  if (import.meta.env.DEV) {
    console.error('Unhandled promise rejection:', event.reason);
    if (event.reason && event.reason.stack) {
      console.error('Rejection stack:', event.reason.stack);
    }
  }
  
  // Prevent default rejection handling
  event.preventDefault();
});

// Add a more defensive approach to getting the root element
const getRootElement = () => {
  let rootElement = document.getElementById('root');
  
  if (!rootElement) {
    if (import.meta.env.DEV) {
      console.warn('Root element not found, creating one');
    }
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  }
  
  return rootElement;
};

// Add safety wrapper for the entire initialization
const initializeApp = () => {
  try {
    if (import.meta.env.DEV) {
      console.log('Attempting to render app');
    }
    
    const rootElement = getRootElement();
    
    // Add extra safety check
    if (!rootElement) {
      throw new Error('Could not create or find root element');
    }
    
    // Ensure the root element is clean
    while (rootElement.firstChild) {
      rootElement.removeChild(rootElement.firstChild);
    }
    
    // Debug information (only in development)
    if (import.meta.env.DEV) {
      console.log('React version:', React.version);
      console.log('Root element:', rootElement);
    }
    
    const root = ReactDOM.createRoot(rootElement);
    
    // Add extra logging (only in development)
    if (import.meta.env.DEV) {
      console.log('ReactDOM root created successfully');
    }
    
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
    if (import.meta.env.DEV) {
      console.log('App rendered successfully');
    }
  } catch (error: any) {
    console.error('Critical error during app initialization:', error);
    
    // Show detailed error to user
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #fff; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif; z-index: 999999;">
        <div style="text-align: center; padding: 20px; border: 1px solid #ccc; border-radius: 8px; max-width: 500px; background: #f8f9fa;">
          <h2 style="color: #dc3545;">Application Error</h2>
          <p>Something went wrong while loading the application.</p>
          <p style="font-size: 0.9em; color: #6c757d;">${error.message || 'Unknown error'}</p>
          <div style="margin: 15px 0; padding: 10px; background: #fff; border: 1px solid #dee2e6; border-radius: 4px; text-align: left; font-family: monospace; font-size: 0.8em; max-height: 200px; overflow-y: auto;">
            ${error.stack ? error.stack.replace(/\n/g, '<br>') : 'No stack trace available'}
          </div>
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px;">
            Refresh Page
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
};

// Add a small delay to ensure DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}

// Add a fallback in case the app doesn't load
setTimeout(() => {
  if (!document.getElementById('root')?.hasChildNodes()) {
    console.warn('App may not have loaded properly, attempting re-initialization');
    initializeApp();
  }
}, 3000);

// Additional error handling for production
if (!import.meta.env.DEV) {
  // If we're in production and the app hasn't loaded after 5 seconds, show an error
  setTimeout(() => {
    const rootElement = document.getElementById('root');
    if (rootElement && !rootElement.hasChildNodes()) {
      // Create a more user-friendly error message
      rootElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 500px;">
            <h2 style="color: #dc3545; margin-bottom: 1rem;">Application Failed to Load</h2>
            <p style="color: #6c757d; margin-bottom: 1rem;">We're sorry, but the application failed to load properly.</p>
            <p style="color: #6c757d; margin-bottom: 1rem; font-size: 0.9rem;">This could be due to:</p>
            <ul style="text-align: left; color: #6c757d; margin-bottom: 1rem; font-size: 0.9rem;">
              <li>Network connectivity issues</li>
              <li>Browser compatibility problems</li>
              <li>Blocked JavaScript execution</li>
            </ul>
            <button onclick="window.location.reload()" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Try Again
            </button>
          </div>
        </div>
      `;
    }
  }, 5000);
}

if (import.meta.env.DEV) {
  console.log('Index.tsx execution completed');
}