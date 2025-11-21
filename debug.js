// Simple debug script to check for common issues
console.log('Debug script started');

// Check if all required globals are available
const requiredGlobals = ['React', 'ReactDOM'];
const missingGlobals = [];

for (const globalName of requiredGlobals) {
  if (typeof window[globalName] === 'undefined') {
    missingGlobals.push(globalName);
  }
}

if (missingGlobals.length > 0) {
  console.error('Missing globals:', missingGlobals);
} else {
  console.log('All required globals are present');
}

// Check if the root element exists
const rootElement = document.getElementById('root');
if (rootElement) {
  console.log('Root element found');
} else {
  console.error('Root element not found');
}

console.log('Debug script completed');