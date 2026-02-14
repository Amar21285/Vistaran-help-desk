import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
 
const IntegrationSettings: React.FC = () => {
  const { notificationSettings, setNotificationSettings } = useSettings();
  
  // Since the settings context doesn't have SMS/WhatsApp settings, we'll use local state
  const [smsProvider, setSmsProvider] = useState('');
  const [whatsappProvider, setWhatsappProvider] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [senderId, setSenderId] = useState('');
  const [whatsappAccessToken, setWhatsappAccessToken] = useState('');
  
  // Load saved settings from localStorage if they exist
  useEffect(() => {
    const savedSmsProvider = localStorage.getItem('vistaran-smsProvider') || '';
    const savedWhatsappProvider = localStorage.getItem('vistaran-whatsappProvider') || '';
    const savedApiKey = localStorage.getItem('vistaran-apiKey') || '';
    const savedApiSecret = localStorage.getItem('vistaran-apiSecret') || '';
    const savedSenderId = localStorage.getItem('vistaran-senderId') || '';
    const savedWhatsappAccessToken = localStorage.getItem('vistaran-whatsappAccessToken') || '';
    
    setSmsProvider(savedSmsProvider);
    setWhatsappProvider(savedWhatsappProvider);
    setApiKey(savedApiKey);
    setApiSecret(savedApiSecret);
    setSenderId(savedSenderId);
    setWhatsappAccessToken(savedWhatsappAccessToken);
  }, []);
  
  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem('vistaran-smsProvider', smsProvider);
    localStorage.setItem('vistaran-whatsappProvider', whatsappProvider);
    localStorage.setItem('vistaran-apiKey', apiKey);
    localStorage.setItem('vistaran-apiSecret', apiSecret);
    localStorage.setItem('vistaran-senderId', senderId);
    localStorage.setItem('vistaran-whatsappAccessToken', whatsappAccessToken);
    
    // Update notification settings to enable SMS/WhatsApp
    setNotificationSettings({ enableSMSWhatsApp: true });
    
    alert('Integration settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Integration Hub</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium italic">Connect external services for enhanced notifications</p>
      </header>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md p-6 border border-slate-100 dark:border-slate-700">
        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">SMS Integration</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Configure your SMS service provider for ticket notifications</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">SMS Provider</label>
            <select 
              value={smsProvider} 
              onChange={(e) => setSmsProvider(e.target.value)}
              className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary outline-none font-bold"
            >
              <option value="">Select Provider</option>
              <option value="twilio">Twilio</option>
              <option value="msg91">MSG91</option>
              <option value="textlocal">TextLocal</option>
              <option value="firebase">Firebase</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">API Key</label>
            <input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">API Secret</label>
            <input 
              type="password" 
              value={apiSecret} 
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Enter your API secret"
              className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Sender ID</label>
            <input 
              type="text" 
              value={senderId} 
              onChange={(e) => setSenderId(e.target.value)}
              placeholder="Enter sender ID (e.g., VISTARAN)"
              className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary outline-none font-bold"
            />
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">WhatsApp Integration</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Configure your WhatsApp Business API for customer communications</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">WhatsApp Provider</label>
            <select 
              value={whatsappProvider} 
              onChange={(e) => setWhatsappProvider(e.target.value)}
              className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary outline-none font-bold"
            >
              <option value="">Select Provider</option>
              <option value="twilio">Twilio WhatsApp</option>
              <option value="meta">Meta WhatsApp Business API</option>
              <option value="360dialog">360dialog</option>
              <option value="gupshup">Gupshup</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Access Token</label>
            <input 
              type="password" 
              value={whatsappAccessToken}
              onChange={(e) => setWhatsappAccessToken(e.target.value)}
              placeholder="Enter WhatsApp access token"
              className="w-full p-3 border rounded-xl dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary outline-none font-bold"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            className="bg-primary text-white font-black px-8 py-3 rounded-xl hover:bg-primary-hover shadow-lg transition uppercase tracking-widest"
          >
            Save Integration Settings
          </button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
        <h4 className="font-black text-blue-800 dark:text-blue-200 uppercase tracking-tighter mb-2 flex items-center gap-2">
          <i className="fas fa-info-circle"></i> Integration Guide
        </h4>
        <ul className="text-blue-700 dark:text-blue-300 space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <i className="fas fa-check-circle mt-1 text-blue-600"></i>
            <span>For Twilio: Enter Account SID as API Key and Auth Token as API Secret</span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check-circle mt-1 text-blue-600"></i>
            <span>For MSG91: Use your auth key as API Key and sender ID as Sender ID</span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-check-circle mt-1 text-blue-600"></i>
            <span>WhatsApp Business API requires approval from Meta before use</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default IntegrationSettings;