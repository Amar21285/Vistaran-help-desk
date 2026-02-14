import React, { useState } from 'react';
import ToggleSwitch from '../ToggleSwitch';

const SettingCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-lg border dark:border-slate-200 dark:border-slate-700">
        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b dark:border-slate-700">{title}</h4>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const InputField: React.FC<{ label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string; disabled?: boolean }> = 
({ label, id, value, onChange, placeholder = '', type = 'text', disabled = false }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-600 dark:text-slate-300">{label}</label>
        <input 
            type={type}
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-sm disabled:bg-slate-100 dark:disabled:bg-slate-700/50"
        />
    </div>
);

const NetworkSettings: React.FC = () => {
    const [tcp, setTcp] = useState({ ip: '192.168.1.100', subnet: '255.255.255.0', gateway: '192.168.1.1' });
    const [ddns, setDdns] = useState({ enabled: false, server: '', port: '80', user: '', pass: '' });
    const [pppoe, setPppoe] = useState({ enabled: false, user: '', pass: '' });
    const [portNat, setPortNat] = useState({ enabled: false, externalPort: '8080', internalPort: '80', internalIp: '192.168.1.100' });
    
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    const handleChange = (setter: React.Dispatch<React.SetStateAction<any>>, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSave = () => {
        alert("Network settings saved! (This is a simulation. No actual network changes have been made.)");
    };

    const handleTest = () => {
        setTestStatus('testing');
        setTimeout(() => {
            // Simulate a 50/50 chance of success or failure
            if (Math.random() > 0.5) {
                setTestStatus('success');
            } else {
                setTestStatus('error');
            }
            setTimeout(() => setTestStatus('idle'), 4000); // Reset after 4 seconds
        }, 2000);
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md space-y-8">
             <div>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Network Configuration</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Configure IP, DDNS, and port settings. These settings would require a backend service and server restarts to apply in a real application.
                </p>
            </div>
            
            <div className="space-y-6">
                <SettingCard title="TCP/IP Settings">
                    <InputField label="IP Address" id="ip" value={tcp.ip} onChange={handleChange(setTcp, 'ip')} />
                    <InputField label="Subnet Mask" id="subnet" value={tcp.subnet} onChange={handleChange(setTcp, 'subnet')} />
                    <InputField label="Default Gateway" id="gateway" value={tcp.gateway} onChange={handleChange(setTcp, 'gateway')} />
                </SettingCard>
                
                <SettingCard title="DDNS (Dynamic DNS)">
                    <ToggleSwitch 
                        label="Enable DDNS"
                        enabled={ddns.enabled}
                        onChange={(enabled) => setDdns(prev => ({ ...prev, enabled }))}
                    />
                    <InputField label="Server Address" id="ddns-server" value={ddns.server} onChange={handleChange(setDdns, 'server')} disabled={!ddns.enabled} />
                    <InputField label="Server Port" id="ddns-port" type="number" value={ddns.port} onChange={handleChange(setDdns, 'port')} disabled={!ddns.enabled} />
                    <InputField label="Username" id="ddns-user" value={ddns.user} onChange={handleChange(setDdns, 'user')} disabled={!ddns.enabled} />
                    <InputField label="Password" id="ddns-pass" type="password" value={ddns.pass} onChange={handleChange(setDdns, 'pass')} disabled={!ddns.enabled} />
                </SettingCard>
                
                <SettingCard title="PPPoE (Point-to-Point Protocol over Ethernet)">
                     <ToggleSwitch 
                        label="Enable PPPoE"
                        enabled={pppoe.enabled}
                        onChange={(enabled) => setPppoe(prev => ({ ...prev, enabled }))}
                    />
                    <InputField label="Username" id="pppoe-user" value={pppoe.user} onChange={handleChange(setPppoe, 'user')} disabled={!pppoe.enabled} />
                    <InputField label="Password" id="pppoe-pass" type="password" value={pppoe.pass} onChange={handleChange(setPppoe, 'pass')} disabled={!pppoe.enabled} />
                </SettingCard>

                <SettingCard title="Port NAT (Port Forwarding)">
                     <ToggleSwitch 
                        label="Enable Port NAT"
                        enabled={portNat.enabled}
                        onChange={(enabled) => setPortNat(prev => ({ ...prev, enabled }))}
                    />
                    <InputField label="External Port" id="nat-external" type="number" value={portNat.externalPort} onChange={handleChange(setPortNat, 'externalPort')} disabled={!portNat.enabled} />
                    <InputField label="Internal Port" id="nat-internal" type="number" value={portNat.internalPort} onChange={handleChange(setPortNat, 'internalPort')} disabled={!portNat.enabled} />
                     <InputField label="Internal IP Address" id="nat-ip" value={portNat.internalIp} onChange={handleChange(setPortNat, 'internalIp')} disabled={!portNat.enabled} />
                </SettingCard>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t dark:border-slate-700">
                <div className="flex items-center gap-2 h-10">
                    {testStatus === 'testing' && <><i className="fas fa-spinner fa-spin text-blue-500"></i><span className="text-sm text-slate-500">Testing connection...</span></>}
                    {testStatus === 'success' && <><i className="fas fa-check-circle text-green-500"></i><span className="text-sm font-semibold text-green-600">Connection Successful!</span></>}
                    {testStatus === 'error' && <><i className="fas fa-times-circle text-red-500"></i><span className="text-sm font-semibold text-red-600">Connection Failed.</span></>}
                </div>
                <button
                    onClick={handleTest}
                    disabled={testStatus !== 'idle'}
                    className="w-full sm:w-auto bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition disabled:opacity-50"
                >
                    Test Connection
                </button>
                <button
                    onClick={handleSave}
                    className="w-full sm:w-auto bg-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-primary-hover transition"
                >
                    Save Settings
                </button>
            </div>
        </div>
    );
};

export default NetworkSettings;
