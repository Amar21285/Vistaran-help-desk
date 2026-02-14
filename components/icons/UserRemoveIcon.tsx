import React from 'react';

const UserRemoveIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 17v-2a4 4 0 00-4-4H3a4 4 0 00-4 4v2m17-4a4 4 0 11-8 0 4 4 0 018 0zm-4-4v.01M19 21l-4-4m0 4l4-4" />
    </svg>
);

export default UserRemoveIcon;
