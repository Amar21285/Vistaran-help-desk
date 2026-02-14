import React from 'react';

const NodemailerSettings: React.FC = () => {
    // This component is not used in the application.
    // Email configuration is handled by EmailSettings.tsx using the EmailJS service.
    // The error "412 Gmail_API: Request had insufficient authentication scopes" is related
    // to a direct server-side integration, which is not how this frontend application operates.
    return null;
};

export default NodemailerSettings;
