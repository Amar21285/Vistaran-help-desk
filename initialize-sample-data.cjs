const fs = require('fs');
const path = require('path');

// Define the data directory
const dataDir = path.join(__dirname, 'data');

// Sample data for each collection
const sampleData = {
  users: [
    {
      id: 'USR001',
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'hashed_password_here',
      role: 'admin',
      department: 'IT',
      createdAt: new Date().toISOString(),
      isActive: true
    },
    {
      id: 'USR002',
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'hashed_password_here',
      role: 'user',
      department: 'Sales',
      createdAt: new Date().toISOString(),
      isActive: true
    }
  ],
  tickets: [
    {
      id: 'TKT001',
      title: 'Sample Ticket',
      description: 'This is a sample ticket for testing purposes',
      priority: 'medium',
      status: 'open',
      assignee: 'USR001',
      reporter: 'USR002',
      department: 'IT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'TKT002',
      title: 'Network Issue',
      description: 'Internet is not working in the development department',
      priority: 'high',
      status: 'in-progress',
      assignee: 'USR001',
      reporter: 'USR002',
      department: 'IT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  technicians: [
    {
      id: 'TECH001',
      name: 'Tech Support',
      email: 'tech@example.com',
      phone: '+1234567890',
      specialization: 'General IT Support',
      department: 'IT',
      isActive: true
    }
  ],
  departments: [
    {
      id: 'DEPT001',
      name: 'Information Technology',
      head: 'USR001',
      description: 'Handles all IT related issues'
    },
    {
      id: 'DEPT002',
      name: 'Sales',
      head: 'USR002',
      description: 'Handles sales related activities'
    }
  ]
};

// Write sample data to files
Object.keys(sampleData).forEach(collection => {
  const filePath = path.join(dataDir, `${collection}.json`);
  fs.writeFileSync(filePath, JSON.stringify(sampleData[collection], null, 2));
  console.log(`Sample data written to ${filePath}`);
});

console.log('Sample data initialization complete!');