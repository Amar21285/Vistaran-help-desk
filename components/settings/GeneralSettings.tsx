import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { useSettings } from '../../hooks/useSettings';
import ToggleSwitch from '../ToggleSwitch';

const WALLPAPER_PRESETS = [
    { name: 'None', url: '' },
    { name: 'Abstract Blue', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Tech Network', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Modern Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Minimalist Mountain', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Dark Space', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Soft Gradient', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200' },
    { name: 'Coding Matrix', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1200' },
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
    const { appName, setAppName, logoUrl, setLogoUrl } = useSettings();

    const [localAppName, setLocalAppName] = useState(appName);
    const [isUploadFormVisible, setUploadFormVisible] = useState(false);
    const [customWallpaperUrl, setCustomWallpaperUrl] = useState('');
    const [isBoldText, setIsBoldText] = useState(localStorage.getItem('vistaran-bold-fonts') === 'true');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const THEMES = [
        { name: 'default', label: 'Default Blue', color: 'bg-blue-500' },
        { name: 'emerald', label: 'Emerald Green', color: 'bg-emerald-500' },
        { name: 'crimson', label: 'Crimson Red', color: 'bg-red-600' },
        { name: 'royal', label: 'Royal Purple', color: 'bg-violet-600' },
        { name: 'sunset', label: 'Sunset Orange', color: 'bg-orange-500' },
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
        alert(`Branding updated successfully!`);
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
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Branding</h3>
                <form className="mt-4 space-y-4" onSubmit={handleSaveBranding}>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">Application Title</label>
                        <input type="text" value={localAppName} onChange={e => setLocalAppName(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-white dark:bg-slate-700"/>
                    </div>
                    <div className="text-right">
                        <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-hover shadow-md">Save Branding</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GeneralSettings;