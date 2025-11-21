import React, { useState } from 'react';
import GeneralSettings from './settings/GeneralSettings';
import NotificationSettings from './settings/NotificationSettings';
import SecuritySettings from './settings/SecuritySettings';
import SystemSettings from './settings/SystemSettings';
import EmailSettings from './settings/EmailSettings';
import TemplateSettings from './settings/TemplateSettings';
import EmailTemplates from './settings/EmailTemplates';
import DepartmentSettings from './settings/DepartmentSettings';
import NetworkSettings from './settings/NetworkSettings';
import type { TicketTemplate, Symptom, User, Ticket } from '../types';

interface SettingsProps {
    templates: TicketTemplate[];
    setTemplates: React.Dispatch<React.SetStateAction<TicketTemplate[]>>;
    symptoms: Symptom[];
    setSymptoms: React.Dispatch<React.SetStateAction<Symptom[]>>;
    departments: string[];
    setDepartments: React.Dispatch<React.SetStateAction<string[]>>;
    users: User[];
    tickets: Ticket[];
}

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; iconClass: string; }> = ({ label, isActive, onClick, iconClass }) => (
    <button
        onClick={onClick}
        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors duration-200 focus:outline-none ${
            isActive
                ? 'border-primary text-primary dark:text-primary-dark dark:border-primary-dark'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
    >
        <i className={iconClass}></i>
        <span className="whitespace-nowrap">{label}</span>
    </button>
);


const Settings: React.FC<SettingsProps> = (props) => {
    const { templates, setTemplates, symptoms, setSymptoms, departments, setDepartments, users, tickets } = props;
    const [activeTab, setActiveTab] = useState('general');

    const renderContent = () => {
        switch(activeTab) {
            case 'general':
                return <GeneralSettings />;
            case 'notifications':
                return <NotificationSettings />;
            case 'security':
                return <SecuritySettings />;
            case 'system':
                return <SystemSettings />;
            case 'email':
                return <EmailSettings />;
            case 'templates':
                return <TemplateSettings templates={templates} setTemplates={setTemplates} symptoms={symptoms} departments={departments} />;
            case 'email-templates':
                return <EmailTemplates />;
            case 'departments':
                return <DepartmentSettings departments={departments} setDepartments={setDepartments} symptoms={symptoms} setSymptoms={setSymptoms} users={users} tickets={tickets} />;
            case 'network':
                return <NetworkSettings />;
            default:
                return <GeneralSettings />;
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <header>
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Application Settings</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage branding, security, and system configurations.</p>
            </header>

            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-2 overflow-x-auto" aria-label="Tabs">
                    <TabButton label="General" iconClass="fas fa-sliders-h" isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} />
                    <TabButton label="Departments & Issues" iconClass="fas fa-sitemap" isActive={activeTab === 'departments'} onClick={() => setActiveTab('departments')} />
                    <TabButton label="Notifications" iconClass="fas fa-bell" isActive={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
                    <TabButton label="Ticket Templates" iconClass="fas fa-paste" isActive={activeTab === 'templates'} onClick={() => setActiveTab('templates')} />
                    <TabButton label="Email Templates" iconClass="fas fa-paint-brush" isActive={activeTab === 'email-templates'} onClick={() => setActiveTab('email-templates')} />
                    <TabButton label="Network" iconClass="fas fa-network-wired" isActive={activeTab === 'network'} onClick={() => setActiveTab('network')} />
                    <TabButton label="Security" iconClass="fas fa-shield-alt" isActive={activeTab === 'security'} onClick={() => setActiveTab('security')} />
                    <TabButton label="System" iconClass="fas fa-hdd" isActive={activeTab === 'system'} onClick={() => setActiveTab('system')} />
                    <TabButton label="Email" iconClass="fas fa-envelope" isActive={activeTab === 'email'} onClick={() => setActiveTab('email')} />
                </nav>
            </div>

            <div className="mt-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default Settings;
