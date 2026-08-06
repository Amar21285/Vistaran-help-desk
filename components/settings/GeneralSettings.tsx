import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useSettings } from '../../hooks/useSettings';
import ToggleSwitch from '../ToggleSwitch';

const WALLPAPER_PRESETS = [
    { name: 'None', url: '' },
    { name: 'Professional City', url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Clean Desk', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Forest Mist', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Workspace', url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Abstract Blue', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Tech Network', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Dark Space', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200' },
];

const FONTS = [
    { id: 'sans', label: 'Classic Sans', font: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
    { id: 'modern', label: 'Modern UI', font: "Inter, system-ui, sans-serif" },
    { id: 'serif', label: 'Classic Serif', font: "Georgia, 'Times New Roman', serif" },
    { id: 'elegant', label: 'Elegant Sans', font: "'Trebuchet MS', Lucida Sans, sans-serif" },
    { id: 'mono', label: 'Tech Monospace', font: "ui-monospace, SFMono-Regular, monospace" },
];

const GeneralSettings: React.FC = () => {
    const { theme, setTheme, colorTheme, setColorTheme, wallpaper, setWallpaper, fontFamily, setFontFamily } = useTheme();
    const { appName, setAppName, logoUrl, setLogoUrl, companyDetails, setCompanyDetails } = useSettings();

    const [localAppName, setLocalAppName] = useState(appName);
    const [localCompany, setLocalCompany] = useState(companyDetails);
    const [isUploadFormVisible, setUploadFormVisible] = useState(false);
    const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');
    const [isBoldText, setIsBoldText] = useState(localStorage.getItem('vistaran-bold-fonts') === 'true');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const THEMES = [
        { name: 'default', label: 'Default Blue', color: 'bg-blue-500' },
        { name: 'emerald', label: 'Emerald Green', color: 'bg-emerald-500' },
        { name: 'crimson', label: 'Crimson Red', color: 'bg-red-600' },
        { name: 'royal', label: 'Royal Blue', color: 'bg-blue-700' },
        { name: 'indigo', label: 'Deep Indigo', color: 'bg-indigo-600' },
        { name: 'sunset', label: 'Sunset Orange', color: 'bg-orange-500' },
        { name: 'teal', label: 'Modern Teal', color: 'bg-teal-500' },
        { name: 'rose', label: 'Elegant Rose', color: 'bg-rose-500' },
        { name: 'cyan', label: 'Bright Cyan', color: 'bg-cyan-500' },
        { name: 'fuchsia', label: 'Vivid Fuchsia', color: 'bg-fuchsia-600' },
        { name: 'amber', label: 'Golden Amber', color: 'bg-amber-500' },
        { name: 'slate', label: 'Professional Slate', color: 'bg-slate-700' },
        { name: 'lime', label: 'Fresh Lime', color: 'bg-lime-500' },
    ];

    useEffect(() => {
        if (isBoldText) {
            document.body.classList.add('font-bold-app');
        } else {
            document.body.classList.remove('font-bold-app');
        }
        localStorage.setItem('vistaran-bold-fonts', String(isBoldText));
    }, [isBoldText]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setLogoUrl(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleSaveBranding = (e: React.FormEvent) => {
        e.preventDefault();
        setAppName(localAppName);
        setCompanyDetails(localCompany);
        alert(`Details updated successfully!`);
    }

    const ThemeButton: React.FC<{ value: 'light' | 'dark' | 'system', label: string, iconClass: string }> = ({ value, label, iconClass }) => (
        <button
            onClick={() => setTheme(value)}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${theme === value ? 'bg-primary-light dark:dark:bg-primary-light-dark border-primary' : 'bg-slate-50 dark:bg-slate-700 border-transparent hover:border-slate-300'}`}
        >
            <i className={`text-2xl ${iconClass}`}></i>
            <p className="font-semibold mt-2 text-sm">{label}</p>
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Appearance</h3>
                 <div className="flex flex-col sm:flex-row gap-4 text-slate-700 dark:text-slate-200 text-center">
                    <ThemeButton value="light" label="Light" iconClass="fas fa-sun" />
                    <ThemeButton value="dark" label="Dark" iconClass="fas fa-moon" />
                    <ThemeButton value="system" label="System" iconClass="fas fa-desktop" />
                </div>
                 <div className="mt-6 pt-6 border-t dark:border-slate-700">
                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Accent Color</h4>
                    <div className="flex flex-wrap gap-3">
                        {THEMES.map((t) => (
                             <button
                                key={t.name}
                                title={t.label}
                                onClick={() => setColorTheme(t.name as any)}
                                className={`h-10 w-10 rounded-full ${t.color} transition-transform hover:scale-110 ${colorTheme === t.name ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                            />
                        ))}
                    </div>
                 </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Typography & Style</h3>
                <div className="mt-4">
                    <ToggleSwitch 
                        label="Bold Typography"
                        description="Force bold font weights across the entire application for better readability."
                        enabled={isBoldText}
                        onChange={setIsBoldText}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                    {FONTS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFontFamily(f.id as any)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${fontFamily === f.id ? 'border-primary bg-primary-light' : 'border-slate-100 bg-slate-50'}`}
                        >
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{f.label}</span>
                            <p style={{ fontFamily: f.font }} className="text-lg truncate mt-1">Aa Bb Cc 123</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Theme Wallpapers</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {WALLPAPER_PRESETS.map((wp) => (
                        <div 
                            key={wp.name}
                            onClick={() => setWallpaper(wp.url)}
                            className={`group relative h-24 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${wallpaper === wp.url ? 'border-primary scale-105' : 'border-transparent'}`}
                        >
                            {!wp.url ? <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs font-bold">Default</div> : <img src={wp.url} className="w-full h-full object-cover" />}
                            <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] p-1 text-center font-bold">{wp.name}</div>
                        </div>
                    ))}
                </div>
            </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4 font-black uppercase tracking-tighter">🏢 Company & Bank Details</h3>
                <form className="mt-4 space-y-6" onSubmit={handleSaveBranding}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-primary uppercase tracking-widest border-b pb-2">Business Information</h4>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Company Registered Name</label>
                                <input type="text" value={localCompany.name} onChange={e => setLocalCompany({...localCompany, name: e.target.value})} className="w-full p-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm focus:border-primary outline-none transition-all"/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Full Business Address</label>
                                <textarea value={localCompany.address} onChange={e => setLocalCompany({...localCompany, address: e.target.value})} className="w-full p-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm focus:border-primary outline-none transition-all h-20 resize-none"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">GSTIN Number</label>
                                    <input type="text" value={localCompany.gstin} onChange={e => setLocalCompany({...localCompany, gstin: e.target.value})} className="w-full p-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm focus:border-primary outline-none transition-all"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Application Title</label>
                                    <input type="text" value={localAppName} onChange={e => setLocalAppName(e.target.value)} className="w-full p-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm focus:border-primary outline-none transition-all"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">State</label>
                                    <input type="text" value={localCompany.state} onChange={e => setLocalCompany({...localCompany, state: e.target.value})} className="w-full p-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm focus:border-primary outline-none transition-all"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">State Code</label>
                                    <input type="text" value={localCompany.stateCode} onChange={e => setLocalCompany({...localCompany, stateCode: e.target.value})} className="w-full p-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm focus:border-primary outline-none transition-all"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">ID Card Back Side Terms & Conditions</label>
                                <textarea value={localCompany.idCardTermsAndConditions || ''} onChange={e => setLocalCompany({...localCompany, idCardTermsAndConditions: e.target.value})} className="w-full p-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm focus:border-primary outline-none transition-all h-28 resize-none" placeholder="Enter the terms to be printed on the back of ID cards..."/>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-primary uppercase tracking-widest border-b pb-2">Banking Details</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Bank Name</label>
                                    <input type="text" value={localCompany.bankName} onChange={e => setLocalCompany({...localCompany, bankName: e.target.value})} className="w-full p-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm focus:border-primary outline-none transition-all"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Account Number</label>
                                    <input type="text" value={localCompany.accountNumber} onChange={e => setLocalCompany({...localCompany, accountNumber: e.target.value})} className="w-full p-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm focus:border-primary outline-none transition-all"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">IFSC Code</label>
                                    <input type="text" value={localCompany.ifscCode} onChange={e => setLocalCompany({...localCompany, ifscCode: e.target.value})} className="w-full p-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm focus:border-primary outline-none transition-all"/>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Branch Name</label>
                                    <input type="text" value={localCompany.branch} onChange={e => setLocalCompany({...localCompany, branch: e.target.value})} className="w-full p-3 border-2 border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-700 font-bold text-sm focus:border-primary outline-none transition-all"/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-4 border-t dark:border-slate-700 text-right">
                        <button type="submit" className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-hover shadow-xl shadow-primary/20 active:scale-95 transition-all">Save All Details</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GeneralSettings;