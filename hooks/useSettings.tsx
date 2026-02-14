import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Role, Permission } from '../types';

const DEFAULT_LOGO_URL = ''; // Default to icon
const DEFAULT_APP_NAME = 'Vistaran Help Desk';
const DEFAULT_EMAILJS_SERVICE_ID = 'service_ee55frm';
const DEFAULT_EMAILJS_PUBLIC_KEY = 'Askap9zd4U9UO242i';

export interface NotificationSettings {
  // Email Notifications
  adminOnNewTicket: boolean;
  userOnNewTicket: boolean;
  userOnTicketResolved: boolean;
  adminOnTicketResolved: boolean;
  techOnTicketAssigned: boolean;
  userOnTicketStatusChanged: boolean;
  
  // Optional Channels
  enableSMSWhatsApp: boolean;
  enableInAppNotifications: boolean;
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    adminOnNewTicket: true,
    userOnNewTicket: true,
    userOnTicketResolved: true,
    adminOnTicketResolved: true,
    techOnTicketAssigned: true,
    userOnTicketStatusChanged: true,
    enableSMSWhatsApp: false,
    enableInAppNotifications: true,
};

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface EmailTemplateSettings {
  adminOnNewTicket: EmailTemplate;
  userOnNewTicket: EmailTemplate;
  userOnTicketResolved: EmailTemplate;
  adminOnTicketResolved: EmailTemplate;
  techOnTicketAssigned: EmailTemplate;
  userOnTicketStatusChanged: EmailTemplate;
  receivingChallan: EmailTemplate;
  outwardInvoice: EmailTemplate;
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplateSettings = {
  adminOnNewTicket: {
    subject: `[New Ticket #{ticket.id}] {ticket.department} - {ticket.priority} Priority`,
    body: `<p>Hello Admin,</p>
<p>A new support ticket has been created by <strong>{user.name}</strong> and requires attention.</p>
<br>
<p><strong>Ticket ID:</strong> #{ticket.id}</p>
<p><strong>User:</strong> {user.name} ({user.email})</p>
<p><strong>Department:</strong> {ticket.department}</p>
<p><strong>Priority:</strong> {ticket.priority}</p>
<p><strong>Description:</strong></p>
<p>{ticket.description}</p>`
  },
  userOnNewTicket: {
    subject: `Your Support Ticket #{ticket.id} Has Been Received`,
    body: `<p>Hello {user.name},</p>
<p>Thank you for reaching out. We have received your support request. Here are the details:</p>
<br>
<p><strong>Ticket ID:</strong> #{ticket.id}</p>
<p><strong>Priority:</strong> {ticket.priority}</p>
<p><strong>Your Description:</strong></p>
<p>{ticket.description}</p>
<br>
<p>Our team will review your request and get back to you soon.</p>`
  },
  userOnTicketResolved: {
    subject: `Your Support Ticket #{ticket.id} has been resolved by {resolver.name}`,
    body: `<p>Hello {user.name},</p>
<p>Your support ticket regarding "{ticket.description}" has been resolved by our technician, <strong>{resolver.name}</strong>.</p>
<br>
<p><strong>Ticket ID:</strong> #{ticket.id}</p>
<p><strong>Resolution Notes:</strong></p>
<p>{ticket.notes}</p>
<br>
<p>If you feel the issue is not fully resolved, please create a new ticket referencing this one.</p>`
  },
  adminOnTicketResolved: {
    subject: `[Ticket Resolved #{ticket.id}] by {resolver.name}`,
    body: `<p>Hello Admin,</p>
<p>The support ticket <strong>#{ticket.id}</strong> has been marked as resolved by <strong>{resolver.name}</strong>.</p>
<br>
<p><strong>Ticket ID:</strong> #{ticket.id}</p>
<p><strong>Original User:</strong> {user.name} ({user.email})</p>
<p><strong>Description:</strong></p>
<p>{ticket.description}</p>
<p><strong>Resolution Notes by {resolver.name}:</strong></p>
<p>{ticket.notes}</p>`
  },
  userOnTicketStatusChanged: {
    subject: `Update on Your Support Ticket #{ticket.id}: Now "{ticket.status}"`,
    body: `<p>Hello {user.name},</p>
<p>Your support ticket has been updated by <strong>{updater.name}</strong>. The new status is now: <strong>{ticket.status}</strong>.</p>
<br>
<p><strong>Ticket ID:</strong> #{ticket.id}</p>
<p><strong>Description:</strong> {ticket.description}</p>
<p><strong>Notes from {updater.name}:</strong></p>
<p>{ticket.notes}</p>
<br>
<p>We are actively working on your request. Thank you for your patience.</p>`
  },
  techOnTicketAssigned: {
    subject: `[New Assignment by {assigner.name}] Ticket #{ticket.id} - {ticket.priority} Priority`,
    body: `<p>Hello {tech.name},</p>
<p>A new support ticket has been assigned to you by <strong>{assigner.name}</strong>.</p>
<br>
<p><strong>Ticket ID:</strong> #{ticket.id}</p>
<p><strong>User:</strong> {user.name} ({user.email})</p>
<p><strong>Priority:</strong> {ticket.priority}</p>
<p><strong>Description:</strong></p>
<p>{ticket.description}</p>`
  },
  receivingChallan: {
    subject: `Goods Receipt Acknowledgement: {challan.id} - Vistaran Inc.`,
    body: `<p>Dear {vendor.name},</p>
<p>This email is to acknowledge that we have received the following items from you on <strong>{challan.date}</strong>.</p>
<br>
{items.table}
<br>
<p><strong>Remarks:</strong> {challan.notes}</p>
<p><strong>Received By:</strong> {receiver.name}</p>
<p>Please keep this for your records as confirmation of delivery.</p>`
  },
  outwardInvoice: {
    subject: `Material Outward Notification: {invoice.id} - Vistaran Inc.`,
    body: `<p>Dear {vendor.name},</p>
<p>This email is to notify you that the following materials have been issued / dispatched to you from our office on <strong>{invoice.date}</strong>.</p>
<br>
{items.table}
<br>
<p><strong>Delivery Mode:</strong> {invoice.deliveryMethod}</p>
<p><strong>Additional Notes:</strong> {invoice.notes}</p>
<p><strong>Issued By:</strong> {issuer.name}</p>
<p>Please acknowledge receipt upon arrival.</p>`
  }
};

export type RolePermissions = Record<Role, Permission[]>;

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
    [Role.ADMIN]: Object.values(Permission),
    [Role.TECHNICIAN]: [
        Permission.VIEW_DASHBOARD,
        Permission.CREATE_TICKETS,
        Permission.VIEW_ASSIGNED_TICKETS,
        Permission.MARK_ATTENDANCE,
        Permission.ACCESS_FILE_MANAGER,
        Permission.VIEW_INVENTORY
    ],
    [Role.STAFF]: [
        Permission.CREATE_TICKETS,
        Permission.MARK_ATTENDANCE,
        Permission.ACCESS_FILE_MANAGER,
        Permission.VIEW_DASHBOARD
    ],
    [Role.USER]: [
        Permission.CREATE_TICKETS,
        Permission.ACCESS_FILE_MANAGER
    ],
    [Role.READ_ONLY]: [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_INVENTORY
    ],
};

interface SettingsContextType {
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  appName: string;
  setAppName: (name: string) => void;
  notificationSettings: NotificationSettings;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  resetSettings: () => void;
  emailjsServiceId: string;
  setEmailjsServiceId: (id: string) => void;
  emailjsPublicKey: string;
  setEmailjsPublicKey: (key: string) => void;
  emailTemplates: EmailTemplateSettings;
  setEmailTemplates: (templates: Partial<EmailTemplateSettings>) => void;
  rolePermissions: RolePermissions;
  setRolePermissions: (permissions: RolePermissions) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrlState] = useState<string>(DEFAULT_LOGO_URL);
  const [appName, setAppNameState] = useState<string>(DEFAULT_APP_NAME);
  const [notificationSettings, setNotificationSettingsState] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [emailjsServiceId, setEmailjsServiceIdState] = useState<string>(DEFAULT_EMAILJS_SERVICE_ID);
  const [emailjsPublicKey, setEmailjsPublicKeyState] = useState<string>(DEFAULT_EMAILJS_PUBLIC_KEY);
  const [emailTemplates, setEmailTemplatesState] = useState<EmailTemplateSettings>(DEFAULT_EMAIL_TEMPLATES);
  const [rolePermissions, setRolePermissionsState] = useState<RolePermissions>(DEFAULT_ROLE_PERMISSIONS);


  useEffect(() => {
    try {
        const savedLogoUrl = localStorage.getItem('vistaran-helpdesk-logoUrl');
        if (savedLogoUrl) {
          setLogoUrlState(savedLogoUrl);
        }
        const savedAppName = localStorage.getItem('vistaran-helpdesk-appName');
        if (savedAppName) {
          setAppNameState(savedAppName);
        }
        const savedNotificationSettings = localStorage.getItem('vistaran-helpdesk-notificationSettings');
        if (savedNotificationSettings) {
            setNotificationSettingsState(JSON.parse(savedNotificationSettings));
        }
        const savedServiceId = localStorage.getItem('vistaran-helpdesk-emailjsServiceId');
        if (savedServiceId) {
            setEmailjsServiceIdState(savedServiceId);
        } else {
            setEmailjsServiceIdState(DEFAULT_EMAILJS_SERVICE_ID);
        }
        const savedPublicKey = localStorage.getItem('vistaran-helpdesk-emailjsPublicKey');
        if (savedPublicKey) {
            setEmailjsPublicKeyState(savedPublicKey);
        } else {
            setEmailjsPublicKeyState(DEFAULT_EMAILJS_PUBLIC_KEY);
        }
        const savedEmailTemplates = localStorage.getItem('vistaran-helpdesk-emailTemplates');
        if (savedEmailTemplates) {
            setEmailTemplatesState(JSON.parse(savedEmailTemplates));
        }
        const savedRolePermissions = localStorage.getItem('vistaran-helpdesk-rolePermissions');
        if (savedRolePermissions) {
            setRolePermissionsState(JSON.parse(savedRolePermissions));
        }
    } catch (error) {
        console.error("Failed to load settings from localStorage", error);
    }
  }, []);

  const setLogoUrl = (url: string) => {
    setLogoUrlState(url);
    localStorage.setItem('vistaran-helpdesk-logoUrl', url);
  };

  const setAppName = (name: string) => {
    setAppNameState(name);
    localStorage.setItem('vistaran-helpdesk-appName', name);
  };

  const setNotificationSettings = (settings: Partial<NotificationSettings>) => {
    const newSettings = { ...notificationSettings, ...settings };
    setNotificationSettingsState(newSettings);
    localStorage.setItem('vistaran-helpdesk-notificationSettings', JSON.stringify(newSettings));
  };
  
  const setEmailjsServiceId = (id: string) => {
    setEmailjsServiceIdState(id);
    localStorage.setItem('vistaran-helpdesk-emailjsServiceId', id);
  };

  const setEmailjsPublicKey = (key: string) => {
    setEmailjsPublicKeyState(key);
    localStorage.setItem('vistaran-helpdesk-emailjsPublicKey', key);
  };
  
  const setEmailTemplates = (templates: Partial<EmailTemplateSettings>) => {
    const newTemplates = { ...emailTemplates, ...templates };
    setEmailTemplatesState(newTemplates);
    localStorage.setItem('vistaran-helpdesk-emailTemplates', JSON.stringify(newTemplates));
  };

  const setRolePermissions = (permissions: RolePermissions) => {
    setRolePermissionsState(permissions);
    localStorage.setItem('vistaran-helpdesk-rolePermissions', JSON.stringify(permissions));
  };

  const resetSettings = useCallback(() => {
    setLogoUrlState(DEFAULT_LOGO_URL);
    localStorage.removeItem('vistaran-helpdesk-logoUrl');
    setAppNameState(DEFAULT_APP_NAME);
    localStorage.removeItem('vistaran-helpdesk-appName');
    setNotificationSettingsState(DEFAULT_NOTIFICATION_SETTINGS);
    localStorage.removeItem('vistaran-helpdesk-notificationSettings');
    
    setEmailjsServiceIdState(DEFAULT_EMAILJS_SERVICE_ID);
    localStorage.removeItem('vistaran-helpdesk-emailjsServiceId');
    setEmailjsPublicKeyState(DEFAULT_EMAILJS_PUBLIC_KEY);
    localStorage.removeItem('vistaran-helpdesk-emailjsPublicKey');
    
    setEmailTemplatesState(DEFAULT_EMAIL_TEMPLATES);
    localStorage.removeItem('vistaran-helpdesk-emailTemplates');

    setRolePermissionsState(DEFAULT_ROLE_PERMISSIONS);
    localStorage.removeItem('vistaran-helpdesk-rolePermissions');
    
    alert("All application settings have been reset to default.");
  }, []);

  return (
    <SettingsContext.Provider value={{ 
        logoUrl, setLogoUrl, 
        appName, setAppName,
        notificationSettings, setNotificationSettings, 
        resetSettings,
        emailjsServiceId, setEmailjsServiceId,
        emailjsPublicKey, setEmailjsPublicKey,
        emailTemplates, setEmailTemplates,
        rolePermissions, setRolePermissions
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};