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
      console.log('React version:', (React as any).version);
      console.log('ReactDOM version:', (ReactDOM as any).version);
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

if (import.meta.env.DEV) {
  console.log('Index.tsx execution completed');
}