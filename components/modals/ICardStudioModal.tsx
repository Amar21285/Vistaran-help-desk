import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Role } from '../../types';
import JsBarcode from 'jsbarcode';
import Logo from '../icons/Logo';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export type ICardFormat = 'vertical' | 'executive' | 'cyber' | 'minimal' | 'rfid' | 'healthcare' | 'distributor2' | 'distributor3' | 'distributor4';
export type ThemeColor = 'blue' | 'emerald' | 'indigo' | 'charcoal' | 'amber' | 'crimson';

export interface ThemeConfig {
    id: ThemeColor;
    name: string;
    primary: string; // e.g. #2563eb
    dark: string;    // e.g. #1e40af
    light: string;   // e.g. #dbeafe
    accent: string;  // e.g. #60a5fa
    badgeBg: string;
    badgeText: string;
    border: string;
    glow: string;
}

export const THEMES: Record<ThemeColor, ThemeConfig> = {
    blue: {
        id: 'blue',
        name: 'Vistaran Blue',
        primary: '#2563eb',
        dark: '#1e40af',
        light: '#eff6ff',
        accent: '#3b82f6',
        badgeBg: '#dbeafe',
        badgeText: '#1e40af',
        border: '#93c5fd',
        glow: 'rgba(37, 99, 235, 0.4)',
    },
    emerald: {
        id: 'emerald',
        name: 'Emerald Green',
        primary: '#059669',
        dark: '#065f46',
        light: '#ecfdf5',
        accent: '#10b981',
        badgeBg: '#d1fae5',
        badgeText: '#065f46',
        border: '#6ee7b7',
        glow: 'rgba(5, 150, 105, 0.4)',
    },
    indigo: {
        id: 'indigo',
        name: 'Royal Indigo',
        primary: '#4f46e5',
        dark: '#3730a3',
        light: '#eef2ff',
        accent: '#6366f1',
        badgeBg: '#e0e7ff',
        badgeText: '#3730a3',
        border: '#a5b4fc',
        glow: 'rgba(79, 70, 229, 0.4)',
    },
    charcoal: {
        id: 'charcoal',
        name: 'Executive Charcoal',
        primary: '#374151',
        dark: '#111827',
        light: '#f9fafb',
        accent: '#4b5563',
        badgeBg: '#e5e7eb',
        badgeText: '#1f2937',
        border: '#9ca3af',
        glow: 'rgba(55, 65, 81, 0.4)',
    },
    amber: {
        id: 'amber',
        name: 'Golden Amber',
        primary: '#d97706',
        dark: '#78350f',
        light: '#fffbeb',
        accent: '#f59e0b',
        badgeBg: '#fef3c7',
        badgeText: '#92400e',
        border: '#fcd34d',
        glow: 'rgba(217, 119, 6, 0.4)',
    },
    crimson: {
        id: 'crimson',
        name: 'Crimson Red',
        primary: '#dc2626',
        dark: '#7f1d1d',
        light: '#fef2f2',
        accent: '#ef4444',
        badgeBg: '#fee2e2',
        badgeText: '#991b1b',
        border: '#fca5a5',
        glow: 'rgba(220, 38, 38, 0.4)',
    },
};

interface ICardStudioModalProps {
    users: User[];
    onClose: () => void;
    initialSelectedUserId?: string;
}

// Barcode rendering subcomponent
const BarcodeSVG: React.FC<{ value: string; lineColor?: string; width?: number; height?: number }> = ({
    value,
    lineColor = '#000000',
    width = 1.2,
    height = 28,
}) => {
    const barcodeRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (barcodeRef.current && value) {
            try {
                barcodeRef.current.innerHTML = '';
                JsBarcode(barcodeRef.current, value, {
                    format: 'CODE128',
                    width,
                    height,
                    displayValue: false,
                    margin: 0,
                    background: 'transparent',
                    lineColor,
                });
            } catch (err) {
                console.error('Barcode render failed:', err);
            }
        }
    }, [value, lineColor, width, height]);

    return <svg ref={barcodeRef} className="max-w-full" />;
};

// QR Code renderer with SVG matrix fallback
const QRCodeDisplay: React.FC<{ data: string; size?: number; color?: string; bgColor?: string }> = ({
    data,
    size = 64,
    color = '#000000',
    bgColor = '#ffffff',
}) => {
    const [imgError, setImgError] = useState(false);
    const cleanColor = color.replace('#', '');
    const cleanBg = bgColor.replace('#', '');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(
        data
    )}&color=${cleanColor}&bgcolor=${cleanBg}`;

    if (imgError) {
        // High quality inline vector SVG QR representation
        return (
            <div
                style={{ width: `${size}px`, height: `${size}px`, backgroundColor: bgColor }}
                className="p-1 rounded flex flex-col justify-between items-center border border-slate-300"
            >
                <div className="grid grid-cols-5 gap-0.5 w-full h-full">
                    {Array.from({ length: 25 }).map((_, i) => {
                        const isCorner = i === 0 || i === 4 || i === 20 || i === 24 || i === 12;
                        return (
                            <div
                                key={i}
                                style={{ backgroundColor: isCorner ? color : i % 2 === 0 ? color : bgColor }}
                                className="w-full h-full rounded-[0.5px]"
                            />
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <img
            src={qrUrl}
            alt="QR Code"
            style={{ width: `${size}px`, height: `${size}px` }}
            className="object-contain rounded"
            onError={() => setImgError(true)}
        />
    );
};

// RFID Microchip Graphic SVG
const RFIDChipGraphic: React.FC<{ className?: string }> = ({ className = 'w-10 h-8' }) => (
    <svg className={className} viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="30" rx="4" fill="url(#chip_grad)" stroke="#b45309" strokeWidth="0.75" />
        <path d="M 0 10 H 12 V 20 H 0" stroke="#78350f" strokeWidth="0.75" fill="none" />
        <path d="M 40 10 H 28 V 20 H 40" stroke="#78350f" strokeWidth="0.75" fill="none" />
        <path d="M 14 0 V 8 H 26 V 0" stroke="#78350f" strokeWidth="0.75" fill="none" />
        <path d="M 14 30 V 22 H 26 V 30" stroke="#78350f" strokeWidth="0.75" fill="none" />
        <rect x="15" y="10" width="10" height="10" rx="1.5" fill="#fef08a" stroke="#a16207" strokeWidth="0.75" />
        <defs>
            <linearGradient id="chip_grad" x1="0" y1="0" x2="40" y2="30" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fef08a" />
                <stop offset="0.5" stopColor="#eab308" />
                <stop offset="1" stopColor="#ca8a04" />
            </linearGradient>
        </defs>
    </svg>
);

export const ICardStudioModal: React.FC<ICardStudioModalProps> = ({ users, onClose, initialSelectedUserId }) => {
    const [selectedUserId, setSelectedUserId] = useState<string>(initialSelectedUserId || users[0]?.id || '');
    const [format, setFormat] = useState<ICardFormat>('vertical');
    const [themeKey, setThemeKey] = useState<ThemeColor>('blue');
    const [companyName, setCompanyName] = useState<string>('VISTARAN INFOTECH');
    const [tagline, setTagline] = useState<string>('Empowering Digital Infrastructure');
    const [contactPhone, setContactPhone] = useState<string>('+91 (080) 4567-8900');
    const [bloodGroup, setBloodGroup] = useState<string>('O+');
    const [accessLevel, setAccessLevel] = useState<string>('LEVEL 4 - FULL ACCESS');
    const [showQRCode, setShowQRCode] = useState<boolean>(true);
    const [showBarcode, setShowBarcode] = useState<boolean>(true);
    const [activeSide, setActiveSide] = useState<'front' | 'back' | 'both'>('front');
    const [isBatchMode, setIsBatchMode] = useState<boolean>(users.length > 1);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
    const [pdfProgress, setPdfProgress] = useState<number>(0);

    // Customization states
    const [customLogoUrl, setCustomLogoUrl] = useState<string>('');
    const [partnerLogoUrl, setPartnerLogoUrl] = useState<string>('');
    const [companyLogoUrl, setCompanyLogoUrl] = useState<string>('');
    const [customPrimaryColor, setCustomPrimaryColor] = useState<string>('');
    const [customTextColor, setCustomTextColor] = useState<string>('');
    const [userOverrides, setUserOverrides] = useState<Record<string, Partial<User>>>({});
    const logoInputRef = useRef<HTMLInputElement>(null);
    const partnerLogoInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const theme = useMemo(() => {
        const baseTheme = { ...THEMES[themeKey] };
        if (customPrimaryColor) baseTheme.primary = customPrimaryColor;
        if (customTextColor) baseTheme.dark = customTextColor;
        return baseTheme;
    }, [themeKey, customPrimaryColor, customTextColor]);
    
    // Effective user logic
    const getEffectiveUser = (u: User): User => ({ ...u, ...(userOverrides[u.id] || {}) });
    const baseActiveUser = users.find((u) => u.id === selectedUserId) || users[0];
    const activeUser = getEffectiveUser(baseActiveUser);

    const handleUpdateActiveUser = (field: keyof User, value: any) => {
        setUserOverrides(prev => ({
            ...prev,
            [activeUser.id]: {
                ...(prev[activeUser.id] || {}),
                [field]: value
            }
        }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) setCustomLogoUrl(event.target.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePartnerLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) setPartnerLogoUrl(event.target.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) handleUpdateActiveUser('photo', event.target.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderLogo = (className = 'w-4 h-4 text-white fill-current') => {
        if (customLogoUrl) return <img src={customLogoUrl} alt="Logo" className={`${className} object-contain`} />;
        return <Logo className={className} />;
    };

    const getEmpId = (u: User) => getEffectiveUser(u).employeeId || `EMP-${u.id.replace(/\D/g, '').slice(-4) || '101'}`;
    const getVerificationUrl = (u: User) => `https://vistaran.com/verify?id=${getEmpId(u)}&name=${encodeURIComponent(u.name)}`;

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        setPdfProgress(0);
        try {
            const isLandscape = format === 'executive' || format === 'rfid' || format === 'minimal';
            const cardW = isLandscape ? 85.6 : 53.98;
            const cardH = isLandscape ? 53.98 : 85.6;

            if (isBatchMode) {
                const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', [cardW, cardH]);
                const cardNodes = document.querySelectorAll('.batch-pdf-card-node');
                
                if (cardNodes.length > 0) {
                    for (let i = 0; i < cardNodes.length; i++) {
                        const node = cardNodes[i] as HTMLElement;
                        setPdfProgress(i + 1);
                        if (i > 0) pdf.addPage([cardW, cardH], isLandscape ? 'l' : 'p');

                        const canvas = await html2canvas(node, {
                            scale: 3,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#ffffff'
                        } as any);
                        const imgData = canvas.toDataURL('image/jpeg', 0.95);
                        pdf.addImage(imgData, 'JPEG', 0, 0, cardW, cardH);
                    }
                } else {
                    const printEl = document.getElementById('icard-printable-container');
                    if (printEl) {
                        const canvas = await html2canvas(printEl, {
                            scale: 3,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#ffffff'
                        } as any);
                        const imgData = canvas.toDataURL('image/jpeg', 0.95);
                        pdf.addImage(imgData, 'JPEG', 0, 0, cardW, cardH);
                    }
                }
                pdf.save(`Vistaran_iCards_Batch_${users.length}_Users_${Date.now()}.pdf`);
            } else {
                const previewEl = document.getElementById('icard-preview-active-card');
                if (previewEl) {
                    const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', [cardW, cardH]);
                    const cardNodes = previewEl.querySelectorAll('.print-card-box');
                    
                    // Temporarily remove transform on parent just in case it leaks scaling to children
                    const originalClassName = previewEl.className;
                    previewEl.className = previewEl.className.replace('scale-125 transform', '');
                    
                    for (let i = 0; i < cardNodes.length; i++) {
                        const node = cardNodes[i] as HTMLElement;
                        if (i > 0) pdf.addPage([cardW, cardH], isLandscape ? 'l' : 'p');
                        const canvas = await html2canvas(node, {
                            scale: 4,
                            useCORS: true,
                            logging: false,
                            backgroundColor: '#ffffff'
                        } as any);
                        const imgData = canvas.toDataURL('image/jpeg', 0.98);
                        pdf.addImage(imgData, 'JPEG', 0, 0, cardW, cardH);
                    }
                    
                    previewEl.className = originalClassName;

                    const empId = getEmpId(activeUser);
                    const safeName = activeUser.name.replace(/\s+/g, '_');
                    pdf.save(`Vistaran_iCard_${empId}_${safeName}.pdf`);
                }
            }
        } catch (err) {
            console.error('PDF Generation Error:', err);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleDownloadPNG = async () => {
        const previewEl = document.getElementById('icard-preview-active-card');
        if (!previewEl) return;
        
        // Temporarily remove scale class to prevent html2canvas stretching
        const originalClassName = previewEl.className;
        previewEl.className = previewEl.className.replace('scale-125 transform', '');
        
        try {
            const canvas = await html2canvas(previewEl, {
                scale: 4,
                useCORS: true,
                logging: false,
                backgroundColor: null
            } as any);
            const link = document.createElement('a');
            const empId = getEmpId(activeUser);
            const safeName = activeUser.name.replace(/\s+/g, '_');
            link.download = `Vistaran_iCard_${empId}_${safeName}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error('PNG Generation Error:', err);
        } finally {
            previewEl.className = originalClassName;
        }
    };

    // Handler for isolated window print
    const handlePrint = () => {
        const printContent = document.getElementById('icard-printable-container');
        if (!printContent) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        const isLandscape = format === 'executive' || format === 'rfid' || format === 'minimal';
        const cardW = isLandscape ? '85.6mm' : '53.98mm';
        const cardH = isLandscape ? '53.98mm' : '85.6mm';

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Print_Vistaran_iCards</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @page { 
                            size: ${isBatchMode ? 'A4 portrait' : `${cardW} ${cardH}`}; 
                            margin: ${isBatchMode ? '10mm' : '0mm'} !important; 
                        }
                        * { 
                            box-sizing: border-box !important; 
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important;
                        }
                        body { 
                            margin: 0 !important; 
                            padding: ${isBatchMode ? '5mm' : '0mm'} !important; 
                            background: white !important; 
                            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        }
                        .print-card-box {
                            width: ${cardW} !important;
                            height: ${cardH} !important;
                            page-break-inside: avoid !important;
                            break-inside: avoid !important;
                            overflow: hidden !important;
                        }
                        .batch-grid {
                            display: grid !important;
                            grid-template-columns: repeat(2, 1fr) !important;
                            gap: 6mm !important;
                            justify-items: center !important;
                        }
                    </style>
                </head>
                <body>
                    <div id="print-mount">
                        ${printContent.innerHTML}
                    </div>
                    <script>
                        setTimeout(() => {
                            window.print();
                            window.frameElement.remove();
                        }, 500);
                    </script>
                </body>
            </html>
        `);
        doc.close();
    };

    // Render individual Card (Front Side)
    const renderFrontCard = (user: User) => {
        const empId = getEmpId(user);
        const qrData = getVerificationUrl(user);

        // Modern Vertical Format
        if (format === 'vertical') {
            return (
                <div
                    className="print-card-box relative w-[53.98mm] h-[85.6mm] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col justify-between"
                    style={{ width: '53.98mm', height: '85.6mm' }}
                >
                    {/* Header Band */}
                    <div
                        className="w-full text-white p-2.5 flex flex-col items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <div className="absolute -right-4 -top-4 w-14 h-14 rounded-full bg-white/10 blur-sm pointer-events-none" />
                        <div className="flex items-center gap-1.5 z-10">
                            {companyLogoUrl ? (
                                <div className="bg-white/90 p-0.5 rounded flex items-center justify-center h-5">
                                    <img src={companyLogoUrl} alt="Company Logo" className="h-full w-auto object-contain" />
                                </div>
                            ) : (
                                <div className="bg-white/90 p-0.5 rounded flex items-center justify-center h-5 w-5">
                                    {renderLogo("w-full h-full object-contain")}
                                </div>
                            )}
                            <span className="font-black text-[11px] tracking-wider uppercase leading-none">
                                {companyName}
                            </span>
                        </div>
                        <span className="text-[7.5px] text-white/80 font-medium tracking-tight mt-0.5 z-10">
                            {tagline}
                        </span>
                    </div>

                    {/* Avatar & Key Info */}
                    <div className="px-3 pt-2 flex flex-col items-center flex-1">
                        <div
                            className="relative w-16 h-16 rounded-full p-0.5 shadow-md border-2"
                            style={{ borderColor: theme.primary }}
                        >
                            <img
                                src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                alt={user.name}
                                className="w-full h-full rounded-full object-cover"
                            />
                            <div
                                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full text-[6px] font-extrabold text-white uppercase whitespace-nowrap shadow-sm text-center"
                                style={{ backgroundColor: theme.dark }}
                            >
                                {user.role}
                            </div>
                        </div>

                        <h3 className="font-black text-[12px] text-slate-800 tracking-tight text-center mt-2.5 leading-tight">
                            {user.name}
                        </h3>
                        <p className="text-[9px] font-semibold text-slate-500 text-center leading-tight">
                            {user.designation || 'Specialist'}
                        </p>

                        <div
                            className="w-full my-2 py-1 px-2 rounded-md flex justify-between items-center text-[8px]"
                            style={{ backgroundColor: theme.light }}
                        >
                            <div>
                                <span className="text-slate-400 font-bold block uppercase text-[6px]">DEPT</span>
                                <span className="font-bold text-slate-800">{user.department}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-slate-400 font-bold block uppercase text-[6px]">EMP ID</span>
                                <span className="font-mono font-bold" style={{ color: theme.dark }}>
                                    {empId}
                                </span>
                            </div>
                        </div>

                        <div className="w-full text-[7.5px] space-y-0.5 text-slate-600">
                            <div className="flex justify-between border-b border-slate-100 pb-0.5">
                                <span className="text-slate-400">Blood Group:</span>
                                <span className="font-bold text-red-600">{user.bloodGroup || bloodGroup}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-0.5">
                                <span className="text-slate-400">Status:</span>
                                <span className="font-bold text-emerald-600 uppercase">{user.status}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Barcode & QR */}
                    <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                        {showQRCode && (
                            <div className="flex-shrink-0">
                                <QRCodeDisplay data={qrData} size={34} color={theme.dark} />
                            </div>
                        )}
                        {showBarcode && (
                            <div className="flex-1 flex flex-col items-end">
                                <BarcodeSVG value={empId} lineColor={theme.dark} width={0.9} height={16} />
                                <span className="font-mono text-[7px] font-extrabold text-slate-700 tracking-tighter mt-0.5 leading-none">
                                    {empId}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Executive Landscape Format
        if (format === 'executive') {
            return (
                <div
                    className="print-card-box relative w-[85.6mm] h-[53.98mm] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex flex-col justify-between"
                    style={{ width: '85.6mm', height: '53.98mm' }}
                >
                    {/* Header */}
                    <div
                        className="w-full px-3 py-1.5 flex justify-between items-center text-white"
                        style={{ backgroundColor: theme.primary }}
                    >
                        <div className="flex items-center gap-1.5">
                            {renderLogo("w-4 h-4 text-white fill-current")}
                            <span className="font-black text-[11px] tracking-wider uppercase">{companyName}</span>
                        </div>
                        <span className="text-[7.5px] font-bold tracking-wider uppercase opacity-90">
                            EXECUTIVE ACCESS
                        </span>
                    </div>

                    {/* Main Layout Body */}
                    <div className="p-3 flex gap-3 flex-1 items-center">
                        {/* Avatar Column */}
                        <div className="flex flex-col items-center">
                            <div
                                className="w-16 h-20 rounded-md overflow-hidden border-2 shadow-sm"
                                style={{ borderColor: theme.primary }}
                            >
                                <img
                                    src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <span
                                className="mt-1 font-mono text-[8px] font-extrabold"
                                style={{ color: theme.dark }}
                            >
                                {empId}
                            </span>
                        </div>

                        {/* User Details Grid */}
                        <div className="flex-1 space-y-1">
                            <div>
                                <h3 className="font-black text-[13px] text-slate-900 leading-tight">{user.name}</h3>
                                <p className="text-[9px] font-semibold text-slate-500 leading-tight">
                                    {user.designation || 'Executive Team'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[8px] border-t border-slate-100">
                                <div>
                                    <span className="text-slate-400 block text-[6.5px] uppercase font-bold">
                                        DEPARTMENT
                                    </span>
                                    <span className="font-bold text-slate-800">{user.department}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[6.5px] uppercase font-bold">ROLE</span>
                                    <span className="font-bold text-slate-800">{user.role}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[6.5px] uppercase font-bold">
                                        BLOOD GROUP
                                    </span>
                                    <span className="font-bold text-red-600">{user.bloodGroup || bloodGroup}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[6.5px] uppercase font-bold">
                                        ACCESS CLEARANCE
                                    </span>
                                    <span className="font-bold text-emerald-600">{accessLevel.split('-')[0]}</span>
                                </div>
                            </div>
                        </div>

                        {/* QR Code Column */}
                        {showQRCode && (
                            <div className="flex flex-col items-center justify-center border-l border-slate-100 pl-2">
                                <QRCodeDisplay data={qrData} size={42} color={theme.dark} />
                                <span className="text-[6px] font-extrabold text-slate-400 uppercase tracking-tighter mt-1">
                                    VERIFIED
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Bottom Barcode Strip */}
                    {showBarcode && (
                        <div className="w-full bg-slate-50 px-3 py-1 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[7px] text-slate-400 font-bold uppercase">{tagline}</span>
                            <BarcodeSVG value={empId} lineColor={theme.dark} width={1} height={16} />
                        </div>
                    )}
                </div>
            );
        }

        // Cyber Tech Dark Format
        if (format === 'cyber') {
            return (
                <div
                    className="print-card-box relative w-[53.98mm] h-[85.6mm] bg-slate-950 text-white rounded-xl shadow-xl border-2 overflow-hidden flex flex-col justify-between"
                    style={{
                        width: '53.98mm',
                        height: '85.6mm',
                        borderColor: theme.accent,
                        boxShadow: `0 0 12px ${theme.glow}`,
                    }}
                >
                    {/* Cyber Header */}
                    <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.accent }} />
                            <span className="font-mono text-[9px] font-black tracking-widest text-slate-100 uppercase">
                                {companyName}
                            </span>
                        </div>
                        <span
                            className="font-mono text-[6.5px] px-1 py-0.5 rounded border"
                            style={{ color: theme.accent, borderColor: theme.accent }}
                        >
                            SECURE
                        </span>
                    </div>

                    {/* Avatar Section */}
                    <div className="px-3 pt-3 flex flex-col items-center flex-1">
                        <div
                            className="relative w-16 h-16 rounded-lg p-0.5 border-2 shadow-lg"
                            style={{ borderColor: theme.accent }}
                        >
                            <img
                                src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                                alt={user.name}
                                className="w-full h-full rounded object-cover"
                            />
                            {/* Holographic Seal Badge */}
                            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 flex items-center justify-center text-[8px] shadow-sm">
                                ⚡
                            </div>
                        </div>

                        <h3 className="font-mono font-extrabold text-[12px] text-white tracking-wide text-center mt-2">
                            {user.name}
                        </h3>
                        <p
                            className="font-mono text-[8px] text-center font-bold tracking-tight"
                            style={{ color: theme.accent }}
                        >
                            {user.designation || 'SYSTEM OPERATOR'}
                        </p>

                        <div className="w-full my-2 bg-slate-900/80 border border-slate-800 rounded p-1.5 font-mono text-[7.5px] space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-400">CLEARANCE:</span>
                                <span className="font-bold text-cyan-400">{accessLevel}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">NODE/DEPT:</span>
                                <span className="font-bold text-slate-200">{user.department}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">SYS ID:</span>
                                <span className="font-bold text-amber-400">{empId}</span>
                            </div>
                        </div>
                    </div>

                    {/* Cyber Footer */}
                    <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-1">
                        {showQRCode && <QRCodeDisplay data={qrData} size={32} color="#ffffff" bgColor="#0f172a" />}
                        {showBarcode && (
                            <div className="flex-1 flex flex-col items-end">
                                <BarcodeSVG value={empId} lineColor="#ffffff" width={0.8} height={18} />
                                <span className="font-mono text-[6.5px] text-slate-400 font-bold mt-0.5">
                                    {empId}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // Minimal Corporate Format
        if (format === 'minimal') {
            return (
                <div
                    className="print-card-box relative w-[85.6mm] h-[53.98mm] bg-white rounded-xl shadow-md border border-slate-300 p-4 flex flex-col justify-between"
                    style={{ width: '85.6mm', height: '53.98mm' }}
                >
                    {/* Top Minimal Strip */}
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primary }} />
                                <h2 className="font-bold text-[12px] text-slate-900 tracking-tight uppercase">
                                    {companyName}
                                </h2>
                            </div>
                            <p className="text-[7.5px] text-slate-400 font-medium mt-0.5">{tagline}</p>
                        </div>
                        <span className="font-mono text-[9px] font-bold text-slate-400">{empId}</span>
                    </div>

                    {/* Middle Body */}
                    <div className="flex items-center gap-3">
                        <img
                            src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                            alt={user.name}
                            className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-sm"
                        />
                        <div className="flex-1">
                            <h3 className="font-extrabold text-[13px] text-slate-900 leading-snug">{user.name}</h3>
                            <p className="text-[9px] font-semibold text-slate-500">{user.designation || 'Staff Member'}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase"
                                    style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                                >
                                    {user.department}
                                </span>
                                <span className="text-[7px] text-slate-400 font-bold">
                                    BG: <strong className="text-slate-700">{user.bloodGroup || bloodGroup}</strong>
                                </span>
                            </div>
                        </div>
                        {showQRCode && <QRCodeDisplay data={qrData} size={38} color="#1e293b" />}
                    </div>

                    {/* Bottom Barcode */}
                    {showBarcode && (
                        <div className="border-t border-slate-100 pt-1 flex justify-between items-center">
                            <span className="text-[7px] text-slate-400 font-medium">Valid Corporate Identity</span>
                            <BarcodeSVG value={empId} lineColor="#334155" width={0.9} height={14} />
                        </div>
                    )}
                </div>
            );
        }

        // RFID Smart Card Format
        if (format === 'rfid') {
            return (
                <div
                    className="print-card-box relative w-[85.6mm] h-[53.98mm] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-xl shadow-lg border border-slate-700 p-3.5 flex flex-col justify-between overflow-hidden"
                    style={{ width: '85.6mm', height: '53.98mm' }}
                >
                    {/* Background Tech Mesh Graphic */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />

                    {/* Top Section: Logo + RFID Chip + NFC Icon */}
                    <div className="flex justify-between items-center z-10">
                        <div className="flex items-center gap-2">
                            <RFIDChipGraphic className="w-9 h-7" />
                            <div className="flex flex-col">
                                <span className="font-extrabold text-[11px] tracking-wider uppercase text-slate-100">
                                    {companyName}
                                </span>
                                <span className="text-[6.5px] text-amber-400 font-mono tracking-widest uppercase">
                                    RFID SMART CARD
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {/* NFC Waves Icon */}
                            <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3a9 9 0 0 1 9 9 1 1 0 0 1-2 0 7 7 0 0 0-7-7 1 1 0 0 1 0-2zm0 4a5 5 0 0 1 5 5 1 1 0 0 1-2 0 3 3 0 0 0-3-3 1 1 0 0 1 0-2zm0 4a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                            </svg>
                        </div>
                    </div>

                    {/* Middle Section: User Details + Avatar */}
                    <div className="flex items-center gap-3 z-10 my-1">
                        <img
                            src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                            alt={user.name}
                            className="w-13 h-13 rounded-lg object-cover border-2 border-amber-400 shadow-md"
                        />
                        <div className="flex-1 space-y-0.5">
                            <h3 className="font-extrabold text-[12px] text-white tracking-wide">{user.name}</h3>
                            <p className="text-[8px] text-slate-300 font-medium">{user.designation || 'Smart Badge Holder'}</p>
                            <div className="flex items-center gap-2 text-[7px] text-slate-400 pt-0.5">
                                <span>ID: <strong className="text-amber-400 font-mono">{empId}</strong></span>
                                <span>DEPT: <strong className="text-slate-200">{user.department}</strong></span>
                            </div>
                        </div>
                        {showQRCode && <QRCodeDisplay data={qrData} size={36} color="#ffffff" bgColor="#0f172a" />}
                    </div>

                    {/* Bottom Section: Serial CSN & Barcode */}
                    <div className="flex justify-between items-end z-10 pt-1 border-t border-slate-700/80">
                        <div className="flex flex-col">
                            <span className="text-[5.5px] text-slate-400 font-mono">CSN: 04:A2:B8:31:9C</span>
                            <span className="text-[6.5px] font-bold text-amber-400 uppercase">{accessLevel}</span>
                        </div>
                        {showBarcode && <BarcodeSVG value={empId} lineColor="#ffffff" width={0.85} height={14} />}
                    </div>
                </div>
            );
        }        // Healthcare Distributor Formats (4 Variants matching User Image)
        if (format === 'healthcare' || format === 'distributor2' || format === 'distributor3' || format === 'distributor4') {
            const isF1 = format === 'healthcare';
            const isF2 = format === 'distributor2';
            const isF3 = format === 'distributor3';
            const isF4 = format === 'distributor4';
            
            return (
                <div
                    className="print-card-box relative bg-white rounded-xl shadow-md border border-slate-300 flex flex-col justify-between overflow-hidden"
                    style={{ width: '53.98mm', height: '85.6mm' }}
                >
                    {/* Background SVG Accents */}
                    {isF1 && (
                        <>
                            {/* Left thin wavy lines */}
                            <svg className="absolute top-0 left-0 h-full w-[8mm] pointer-events-none z-0" viewBox="0 0 100 400" preserveAspectRatio="none">
                                <path d="M0 0 L0 400 L30 400 C80 300 -30 150 20 0 Z" fill={theme.primary} />
                                <path d="M20 400 C70 300 -40 150 10 0" fill="none" stroke={theme.primary} strokeWidth="1" strokeOpacity="0.4"/>
                                <path d="M10 400 C60 300 -50 150 0 0" fill="none" stroke={theme.primary} strokeWidth="1" strokeOpacity="0.2"/>
                            </svg>
                            {/* Right thin wavy lines */}
                            <svg className="absolute top-0 right-0 h-full w-[10mm] pointer-events-none z-0" viewBox="0 0 100 400" preserveAspectRatio="none">
                                <path d="M100 0 L100 400 L70 400 C150 250 -20 150 70 0 Z" fill={theme.primary} opacity="0.1" />
                                <path d="M100 200 C70 250 80 300 60 400" fill="none" stroke={theme.primary} strokeWidth="1" strokeOpacity="0.5"/>
                                <path d="M100 150 C60 250 70 300 50 400" fill="none" stroke={theme.primary} strokeWidth="1" strokeOpacity="0.3"/>
                            </svg>
                        </>
                    )}

                    {isF2 && (
                        <>
                            {/* Top massive curved wave */}
                            <svg className="absolute top-0 left-0 w-full h-[30mm] pointer-events-none" viewBox="0 0 200 100" preserveAspectRatio="none">
                                <path d="M0 0 L200 0 L200 60 C130 90 70 110 0 50 Z" fill={theme.primary} />
                            </svg>
                        </>
                    )}

                    {isF3 && (
                        <>
                            {/* Top left geometric triangle */}
                            <div className="absolute top-0 left-0 w-[20mm] h-[20mm]" style={{ background: `linear-gradient(135deg, ${theme.primary} 50%, transparent 50%)` }} />
                            {/* Bottom right geometric triangle block */}
                            <div className="absolute bottom-[6mm] right-0 w-[30mm] h-[30mm]" style={{ background: `linear-gradient(-45deg, ${theme.primary} 50%, transparent 50%)`, opacity: 0.9 }} />
                            <div className="absolute bottom-[6mm] right-[10mm] w-[15mm] h-[15mm]" style={{ background: `linear-gradient(-45deg, ${theme.primary} 50%, transparent 50%)`, opacity: 0.5 }} />
                        </>
                    )}

                    {/* Top Hole Punch (Lanyard Slot) */}
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[12mm] h-[2.5mm] border border-slate-300 rounded-full shadow-inner z-20 pointer-events-none bg-white/50 backdrop-blur-sm" />

                    {/* Top Header Block */}
                    <div className={`pt-[7.5mm] pb-0.5 px-4 flex flex-col items-center relative z-20 text-center ${isF2 ? 'text-white' : ''}`}>
                        <div className={`flex justify-center mb-1 ${isF2 ? 'text-white' : ''}`} style={!isF2 ? { color: theme.primary } : {}}>
                            {companyLogoUrl ? (
                                <img src={companyLogoUrl} alt="Company Logo" className="w-[18mm] max-h-[12mm] object-contain drop-shadow-sm" />
                            ) : (
                                renderLogo("w-[18mm] h-auto fill-current")
                            )}
                        </div>
                        <h2 className={`mt-1 font-black text-[10px] leading-[1.1] uppercase ${isF2 ? 'mt-2' : ''}`} style={isF2 ? { color: theme.dark } : { color: theme.dark }}>
                            {companyName || 'VISTARAN HEALTH CARE'}<br/>SERVICES PVT LTD
                        </h2>
                        <div className="flex items-center justify-center gap-1 w-full mt-1 px-2">
                            <div className="h-[0.5px] flex-1" style={{ backgroundColor: theme.primary }} />
                            <span className="text-[5px] font-extrabold tracking-widest uppercase" style={{ color: theme.primary }}>
                                COMPASSION | CARE | COMMITMENT
                            </span>
                            <div className="h-[0.5px] flex-1" style={{ backgroundColor: theme.primary }} />
                        </div>
                    </div>

                    {/* AUTHORISED DISTRIBUTOR BAR */}
                    <div className="w-full z-10 my-0.5">
                        <div className="py-0.5 text-center" style={{ backgroundColor: theme.primary }}>
                            <span className="text-white text-[10px] font-black uppercase tracking-widest drop-shadow-sm">
                                {user.designation || 'AUTHORISED DISTRIBUTOR'}
                            </span>
                        </div>
                    </div>

                    {/* Middle Content (Partner Logo, Photo, & Name) */}
                    <div className="flex-1 flex flex-col items-center justify-center px-2 relative z-20 w-full mt-1">
                        <div className="flex items-center gap-3 mb-1.5 w-full justify-center px-4">
                            {/* Partner Logo */}
                            <div className={`relative w-10 h-10 flex items-center justify-center flex-shrink-0 drop-shadow-sm bg-white rounded p-0.5 ${isF4 ? 'scale-125 my-1' : ''}`}>
                                {partnerLogoUrl ? (
                                    <img src={partnerLogoUrl} alt="Partner Logo" className="max-w-full max-h-full object-contain" />
                                ) : (
                                    <div className="text-center flex flex-col items-center">
                                        <div className="text-[20px] font-black leading-none mb-0.5" style={{ color: theme.primary }}>U</div>
                                        <div className="font-['Brush_Script_MT',cursive,serif] text-[6px] font-bold" style={{ color: theme.primary }}>Hindustan Unilever Limited</div>
                                    </div>
                                )}
                            </div>
                            
                            {/* User Photo */}
                            {!isF4 && (
                                <div
                                    className="relative w-10 h-10 rounded-lg shadow-sm border border-slate-200 overflow-hidden flex-shrink-0 bg-white"
                                >
                                    <img
                                        src={user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=ffffff&color=${theme.primary.replace('#', '')}`}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        {/* HUL Text Line */}
                        {!isF1 && (
                            <div className="w-full text-center mb-0.5">
                                <div className="py-0.5 w-full" style={isF4 ? { backgroundColor: theme.primary } : {}}>
                                    {!isF4 && <div className="h-[0.5px] w-full mb-1" style={{ backgroundColor: theme.primary }} />}
                                    <span className={`text-[7.5px] font-black uppercase tracking-[0.1em] leading-none ${isF4 ? 'text-white' : ''}`} style={!isF4 ? { color: theme.primary } : {}}>
                                        HINDUSTAN UNILEVER LIMITED
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* User Details */}
                        {!isF4 && (
                            <div className="text-center w-full leading-tight mt-1 relative z-40">
                                <h3 className="font-black text-[11px] tracking-tight uppercase leading-none pb-0.5" style={{ color: theme.dark }}>
                                    {user.name}
                                </h3>
                                <p className="text-[6px] font-extrabold mt-0.5 uppercase tracking-wider leading-none" style={{ color: theme.primary }}>
                                    ID: {getEmpId(user)} | PH: {user.phone || contactPhone}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Footer Blocks */}
                    {isF1 && (
                        <div className="w-full relative z-20 mt-auto bg-white">
                            <div className="py-1 text-center" style={{ backgroundColor: theme.primary }}>
                                <span className="text-white text-[7.5px] font-black uppercase tracking-[0.1em]">
                                    HINDUSTAN UNILEVER LIMITED
                                </span>
                            </div>
                            <div className="py-1.5 px-2 text-center min-h-[12mm] flex items-center justify-center border-t border-slate-200">
                                <p className="text-[5px] text-slate-800 font-extrabold leading-[1.3] uppercase break-words w-full px-1">
                                    DEVIDAYAL COMPOUND PANNA HOUSE GROUND FLOOR GALA NO 4,5,6<br/>
                                    LBS MARG JAYDEV SINGH NAGAR, (ISHWAR NAGAR) BHANDUP WEST,<br/>
                                    MUMBAI, MAHARASHTRA 400078
                                </p>
                            </div>
                        </div>
                    )}

                    {(isF2 || isF4) && (
                        <div className="w-full z-10 mt-auto pt-2 px-3 pb-2" style={isF4 ? { backgroundColor: 'white', borderTop: `1.5px solid ${theme.primary}` } : { backgroundColor: theme.primary }}>
                            <div className="flex items-start gap-1.5 mb-1.5 justify-center">
                                <p className={`text-[5.5px] font-black leading-[1.3] uppercase text-center ${isF4 ? 'text-black' : 'text-white'}`}>
                                    DEVIDAYAL COMPOUND PANNA HOUSE GROUND FLOOR GALA NO 4,5,6<br/>
                                    LBS MARG JAYDEV SINGH NAGAR, (ISHWAR NAGAR) BHANDUP WEST,<br/>
                                    MUMBAI, MAHARASHTRA 400078
                                </p>
                            </div>
                            {!isF4 && (
                                <>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <i className="fas fa-phone text-white text-[6px]"></i>
                                        <p className="text-white text-[6px] font-medium">022-XXXX XXXX</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <i className="fas fa-envelope text-white text-[6px]"></i>
                                        <p className="text-white text-[6px] font-medium">info@vistaranhealthcare.com</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {isF3 && (
                        <div className="w-full z-10 mt-auto">
                            <div className="bg-transparent py-2 px-4 text-left flex items-start gap-1.5 relative z-20">
                                <i className="fas fa-location-dot mt-[1px] text-[7px]" style={{ color: theme.dark }}></i>
                                <p className="text-[5.5px] font-extrabold leading-[1.4] uppercase" style={{ color: theme.dark }}>
                                    DEVIDAYAL COMPOUND PANNA HOUSE<br/>
                                    GROUND FLOOR GALA NO 4,5,6<br/>
                                    LBS MARG JAYDEV SINGH NAGAR,<br/>
                                    BHANDUP WEST, MUMBAI 400078
                                </p>
                            </div>
                            <div className="py-1.5 px-4 text-center flex items-center justify-between relative z-20" style={{ backgroundColor: theme.primary }}>
                                <div className="flex items-center gap-1">
                                    <i className="fas fa-phone text-white text-[6px]"></i>
                                    <span className="text-white text-[5.5px] font-medium">022-XXXX XXXX</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <i className="fas fa-globe text-white text-[6px]"></i>
                                    <span className="text-white text-[5.5px] font-medium">www.vistaranhealthcare.com</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    // Render individual Card (Back Side)
    const renderBackCard = (user: User) => {
        const isLandscape = format === 'executive' || format === 'rfid' || format === 'minimal';
        const cardW = isLandscape ? '85.6mm' : '53.98mm';
        const cardH = isLandscape ? '53.98mm' : '85.6mm';
        const empId = getEmpId(user);

        return (
            <div
                className="print-card-box relative bg-white rounded-xl shadow-md border border-slate-300 p-3 flex flex-col justify-between overflow-hidden text-slate-800"
                style={{ width: cardW, height: cardH }}
            >
                {/* Magnetic Stripe if RFID or Executive */}
                {(format === 'rfid' || format === 'executive') && (
                    <div className="-mx-3 -mt-3 mb-2 h-7 bg-slate-900 border-b border-slate-800 flex items-center justify-end px-4">
                        <span className="text-[6px] font-mono text-slate-400 tracking-widest uppercase">
                            MAGNETIC STRIPE TRACK 1/2
                        </span>
                    </div>
                )}

                {/* Header Back */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-slate-800">
                        TERMS & CONDITIONS
                    </span>
                    <span className="text-[7.5px] font-mono font-bold text-slate-400">{empId}</span>
                </div>

                {/* Terms text */}
                <p className="text-[7px] text-slate-500 leading-snug my-1">
                    This identity card is non-transferable and remains property of <strong>{companyName}</strong>. If
                    found, please return to nearest HR office or contact emergency helpline immediately.
                </p>

                {/* Emergency Contact & Signature Row */}
                <div className="grid grid-cols-2 gap-2 text-[7.5px] my-1">
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                        <span className="text-slate-400 font-bold block text-[6px] uppercase">EMERGENCY HELPLINE</span>
                        <span className="font-bold text-slate-800">{contactPhone}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded border border-slate-100 flex flex-col justify-between">
                        <span className="text-slate-400 font-bold block text-[6px] uppercase">
                            AUTHORIZED SIGNATURE
                        </span>
                        <div className="border-b border-dashed border-slate-400 w-full my-0.5" />
                        <span className="text-[6px] text-slate-400 italic">Chief Security Officer</span>
                    </div>
                </div>

                {/* Address & Return footer */}
                <div className="border-t border-slate-100 pt-1 flex justify-between items-center text-[6.5px] text-slate-400">
                    <span>Vistaran Corporate Tower, Cyber City</span>
                    <span className="font-bold text-slate-600">www.vistaran.com</span>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex justify-center items-center z-50 p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border dark:border-slate-700">
                {/* Header */}
                <header className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: theme.primary }}
                        >
                            <i className="fas fa-id-card text-xl text-white"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                iCard Generator & Print Studio
                                <span className="bg-blue-600/30 text-blue-300 text-xs px-2 py-0.5 rounded-full font-medium border border-blue-500/30">
                                    PRO v2.5
                                </span>
                            </h2>
                            <p className="text-xs text-slate-400">
                                Customize, preview, and print high-resolution employee ID cards
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-2xl transition p-1 hover:bg-slate-800 rounded-lg"
                        title="Close Studio"
                    >
                        &times;
                    </button>
                </header>

                {/* Studio Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
                    {/* Controls Sidebar (Left) */}
                    <div className="lg:col-span-5 p-5 border-r border-slate-200 dark:border-slate-700 overflow-y-auto space-y-5 bg-slate-50 dark:bg-slate-900/40">
                        {/* Selected User Switcher */}
                        {users.length > 1 && (
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Active Preview User ({users.length} Selected)
                                </label>
                                <select
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-primary"
                                >
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} — ({u.department} | #{getEmpId(u)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* 1. Layout Format Picker */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                1. Printable Card Layout
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {[
                                    { id: 'vertical', label: 'Modern Vertical', icon: 'fa-portrait' },
                                    { id: 'executive', label: 'Executive Landscape', icon: 'fa-id-badge' },
                                    { id: 'cyber', label: 'Cyber Tech Dark', icon: 'fa-shield-halved' },
                                    { id: 'minimal', label: 'Minimal Corporate', icon: 'fa-square' },
                                    { id: 'rfid', label: 'RFID Smart Card', icon: 'fa-microchip' },
                                    { id: 'healthcare', label: 'Distributor Card 1', icon: 'fa-id-card-clip' },
                                    { id: 'distributor2', label: 'Distributor Card 2', icon: 'fa-address-card' },
                                    { id: 'distributor3', label: 'Distributor Card 3', icon: 'fa-contact-card' },
                                    { id: 'distributor4', label: 'Distributor Blank', icon: 'fa-id-badge' },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setFormat(item.id as ICardFormat)}
                                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition ${
                                            format === item.id
                                                ? 'bg-primary text-white border-primary shadow-md'
                                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                        }`}
                                    >
                                        <i className={`fas ${item.icon} text-lg mb-1`} />
                                        <span className="text-[11px] font-bold leading-tight">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. Color Theme Picker */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                2. Brand Color Theme
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(Object.keys(THEMES) as ThemeColor[]).map((tKey) => {
                                    const t = THEMES[tKey];
                                    return (
                                        <button
                                            key={tKey}
                                            onClick={() => {
                                                setThemeKey(tKey);
                                                setCustomPrimaryColor(''); // Reset custom when selecting a preset
                                                setCustomTextColor('');
                                            }}
                                            className={`p-2 rounded-xl border flex flex-col items-center transition ${
                                                themeKey === tKey && !customPrimaryColor
                                                    ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500 shadow-inner'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                        >
                                            <div
                                                className="w-full h-4 rounded shadow-sm mb-1"
                                                style={{ backgroundColor: t.primary }}
                                            />
                                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                {t.name.replace('Vistaran ', '')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            
                            <div className="mt-3 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                        Custom Primary Color (Shapes)
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={customPrimaryColor || THEMES[themeKey].primary}
                                            onChange={(e) => setCustomPrimaryColor(e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input 
                                            type="text" 
                                            value={customPrimaryColor || THEMES[themeKey].primary}
                                            onChange={(e) => setCustomPrimaryColor(e.target.value)}
                                            className="w-full text-xs p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                        Custom Text Color
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={customTextColor || THEMES[themeKey].dark}
                                            onChange={(e) => setCustomTextColor(e.target.value)}
                                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                        />
                                        <input 
                                            type="text" 
                                            value={customTextColor || THEMES[themeKey].dark}
                                            onChange={(e) => setCustomTextColor(e.target.value)}
                                            className="w-full text-xs p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Company Branding */}
                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                3. Company Branding
                            </label>
                            
                            <div className="flex flex-col gap-2 mb-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Custom Logo</span>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
                                    <button onClick={() => logoInputRef.current?.click()} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                                        Upload Logo
                                    </button>
                                    <input 
                                        type="text" 
                                        placeholder="Or paste image URL" 
                                        value={customLogoUrl} 
                                        onChange={(e) => setCustomLogoUrl(e.target.value)} 
                                        className="flex-1 min-w-[120px] px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary"
                                    />
                                    {customLogoUrl && (
                                        <button onClick={() => setCustomLogoUrl('')} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition">
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-slate-500 font-semibold block mb-1">Company Name</span>
                                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <span className="text-slate-500 font-semibold block mb-1">Tagline</span>
                                    <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <span className="text-slate-500 font-semibold block mb-1">Support Phone</span>
                                    <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary" />
                                </div>
                            </div>
                            
                            {/* Primary Company Logo Upload */}
                            <div className="mt-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-1">Company Logo (Top)</span>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <label className="cursor-pointer bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-3 py-1.5 rounded transition font-medium flex items-center gap-1">
                                        <i className="fas fa-upload"></i> Upload
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (e) => setCompanyLogoUrl(e.target?.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Or paste image URL"
                                        className="flex-1 p-1.5 min-w-[120px] text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                                        value={companyLogoUrl}
                                        onChange={(e) => setCompanyLogoUrl(e.target.value)}
                                    />
                                    {companyLogoUrl && (
                                        <button onClick={() => setCompanyLogoUrl('')} className="text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Partner / Client Logo Upload */}
                            {(format === 'healthcare' || format === 'distributor2' || format === 'distributor3') && (
                                <div className="mt-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <span className="text-slate-500 font-semibold block text-[10px] uppercase mb-1">Partner Logo (Middle)</span>
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <input type="file" accept="image/*" className="hidden" ref={partnerLogoInputRef} onChange={handlePartnerLogoUpload} />
                                        <button onClick={() => partnerLogoInputRef.current?.click()} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                                            Upload Logo
                                        </button>
                                        <input 
                                            type="text" 
                                            placeholder="URL" 
                                            value={partnerLogoUrl} 
                                            onChange={(e) => setPartnerLogoUrl(e.target.value)} 
                                            className="flex-1 min-w-[120px] px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary"
                                        />
                                        {partnerLogoUrl && (
                                            <button onClick={() => setPartnerLogoUrl('')} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition" title="Reset">
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Employee Details Editor */}
                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                                4. Employee Details Editor
                                {Object.keys(userOverrides[activeUser.id] || {}).length > 0 && (
                                    <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Modified</span>
                                )}
                            </label>
                            
                            <div className="flex flex-col gap-2 mb-3 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="text-slate-500 font-semibold block text-[10px] uppercase">Employee Photo</span>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <input type="file" accept="image/*" className="hidden" ref={photoInputRef} onChange={handlePhotoUpload} />
                                    <button onClick={() => photoInputRef.current?.click()} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">
                                        Upload Photo
                                    </button>
                                    <input 
                                        type="text" 
                                        placeholder="Or paste image URL" 
                                        value={activeUser.photo || ''} 
                                        onChange={(e) => handleUpdateActiveUser('photo', e.target.value)} 
                                        className="flex-1 min-w-[120px] px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary"
                                    />
                                    {activeUser.photo !== baseActiveUser.photo && (
                                        <button onClick={() => handleUpdateActiveUser('photo', baseActiveUser.photo)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition" title="Revert to original">
                                            Revert
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-slate-500 font-semibold block mb-1">Employee Name</span>
                                    <input type="text" value={activeUser.name} onChange={(e) => handleUpdateActiveUser('name', e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <span className="text-slate-500 font-semibold block mb-1">Employee ID</span>
                                    <input type="text" value={activeUser.employeeId || getEmpId(activeUser)} onChange={(e) => handleUpdateActiveUser('employeeId', e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <span className="text-slate-500 font-semibold block mb-1">Designation</span>
                                    <input type="text" value={activeUser.designation || ''} onChange={(e) => handleUpdateActiveUser('designation', e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary" placeholder="e.g. Specialist" />
                                </div>
                                <div>
                                    <span className="text-slate-500 font-semibold block mb-1">Department</span>
                                    <input type="text" value={activeUser.department} onChange={(e) => handleUpdateActiveUser('department', e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary" />
                                </div>
                                <div>
                                    <span className="text-slate-500 font-semibold block mb-1">Blood Group</span>
                                    <select value={activeUser.bloodGroup || bloodGroup} onChange={(e) => handleUpdateActiveUser('bloodGroup', e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary">
                                        {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-semibold block mb-1">Emergency Contact</span>
                                    <input type="text" value={activeUser.emergencyContact || ''} onChange={(e) => handleUpdateActiveUser('emergencyContact', e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary" placeholder="e.g. +91 98765..." />
                                </div>
                            </div>
                        </div>

                        {/* 5. Display Toggles */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                4. Element Toggles
                            </label>
                            <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showQRCode}
                                        onChange={(e) => setShowQRCode(e.target.checked)}
                                        className="w-4 h-4 rounded text-primary"
                                    />
                                    <span>Verifiable QR Code</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showBarcode}
                                        onChange={(e) => setShowBarcode(e.target.checked)}
                                        className="w-4 h-4 rounded text-primary"
                                    />
                                    <span>CODE128 Barcode Strip</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Preview Screen (Right) */}
                    <div className="lg:col-span-7 p-6 flex flex-col justify-between items-center bg-slate-200 dark:bg-slate-900 overflow-y-auto">
                        {/* View Mode Toolbar */}
                        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
                            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border dark:border-slate-700">
                                <button
                                    onClick={() => setActiveSide('front')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                                        activeSide === 'front'
                                            ? 'bg-primary text-white'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                                    }`}
                                >
                                    Front Side
                                </button>
                                <button
                                    onClick={() => setActiveSide('back')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                                        activeSide === 'back'
                                            ? 'bg-primary text-white'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                                    }`}
                                >
                                    Back Side
                                </button>
                                <button
                                    onClick={() => setActiveSide('both')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                                        activeSide === 'both'
                                            ? 'bg-primary text-white'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                                    }`}
                                >
                                    Dual Side View
                                </button>
                            </div>

                            {users.length > 1 && (
                                <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isBatchMode}
                                            onChange={(e) => setIsBatchMode(e.target.checked)}
                                            className="w-4 h-4 rounded text-primary"
                                        />
                                        <span>Batch Print Grid ({users.length} Cards)</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Interactive Live Render Container */}
                        <div className="flex-1 w-full flex items-center justify-center py-4 min-h-[360px]">
                            {/* Hidden printable container formatted for isolated iframe print & PDF export */}
                            <div id="icard-printable-container" className="hidden">
                                {isBatchMode ? (
                                    <div className="batch-grid">
                                        {users.map((baseU) => {
                                            const u = getEffectiveUser(baseU);
                                            return (
                                                <div key={u.id} className="batch-pdf-card-node flex flex-col gap-2">
                                                    {(activeSide === 'front' || activeSide === 'both') && renderFrontCard(u)}
                                                    {(activeSide === 'back' || activeSide === 'both') && renderBackCard(u)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4 items-center">
                                        {(activeSide === 'front' || activeSide === 'both') && renderFrontCard(activeUser)}
                                        {(activeSide === 'back' || activeSide === 'both') && renderBackCard(activeUser)}
                                    </div>
                                )}
                            </div>

                            {/* Visible Interactive Preview Screen */}
                            <div id="icard-preview-active-card" className="scale-125 transform transition-transform duration-300 flex flex-wrap gap-6 justify-center items-center">
                                {(activeSide === 'front' || activeSide === 'both') && renderFrontCard(activeUser)}
                                {(activeSide === 'back' || activeSide === 'both') && renderBackCard(activeUser)}
                            </div>
                        </div>

                        {/* Bottom Studio Action Footer */}
                        <div className="w-full pt-4 border-t border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3">
                            <span className="text-xs text-slate-500 font-semibold">
                                {isGeneratingPDF
                                    ? `Generating PDF... (${pdfProgress}/${users.length})`
                                    : isBatchMode
                                    ? `Ready to print/download ${users.length} card(s)`
                                    : `Single Card Mode: ${activeUser?.name}`}
                            </span>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-slate-400 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDownloadPNG}
                                    disabled={isGeneratingPDF}
                                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs hover:bg-emerald-700 transition shadow-md flex items-center gap-1.5"
                                    title="Download HD PNG Image"
                                >
                                    <i className="fas fa-image"></i>
                                    PNG
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={isGeneratingPDF}
                                    className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition shadow-md flex items-center gap-1.5 disabled:opacity-50"
                                    title="Download printable PDF file"
                                >
                                    <i className="fas fa-file-pdf"></i>
                                    {isGeneratingPDF ? 'Generating...' : isBatchMode ? `Download Batch PDF (${users.length})` : 'Download PDF'}
                                </button>
                                <button
                                    onClick={handlePrint}
                                    disabled={isGeneratingPDF}
                                    className="px-5 py-2 bg-primary text-white font-bold rounded-xl text-xs hover:bg-primary-hover transition shadow-lg flex items-center gap-2"
                                >
                                    <i className="fas fa-print"></i>
                                    {isBatchMode ? `Print Batch (${users.length})` : 'Print iCard Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ICardStudioModal;
