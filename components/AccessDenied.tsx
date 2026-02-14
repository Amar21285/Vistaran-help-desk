import React from 'react';

const AccessDenied: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
            <p className="text-slate-600 mt-2">You do not have permission to view this page.</p>
        </div>
    );
};

export default AccessDenied;
