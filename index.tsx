import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import CSS file for global styles

// Dynamically import the App component for better code splitting
const App = React.lazy(() => import('./App'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <React.Suspense fallback={
      <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Loading application...</p>
        </div>
      </div>
    }>
      <App />
    </React.Suspense>
  </React.StrictMode>
);