
import React, { useEffect, useRef, useState } from 'react';
import { InventoryItem } from '../../types';
import JsBarcode from 'jsbarcode';
import Logo from '../icons/Logo';

interface AssetLabelModalProps {
    item: InventoryItem;
    onClose: () => void;
}

export type LabelTemplate = 'official' | 'industrial' | 'compact' | 'modern' | 'strip' | 'thermal';

export const SIZE_PRESETS = [
    { name: 'Standard (100x50mm)', width: 100, height: 50 },
    { name: 'Large (100x75mm)', width: 100, height: 75 },
    { name: 'Square (50x50mm)', width: 50, height: 50 },
    { name: 'Thermal (50x25mm)', width: 50, height: 25 },
    { name: 'Cable/Strip (100x25mm)', width: 100, height: 25 },
];

/**
 * MULTI-TEMPLATE PRINTABLE LABEL
 * Updated 'official' template to match user PDF exactly.
 */
export const PrintableLabel: React.FC<{
    item: InventoryItem;
    labelWidth: number;
    labelHeight: number;
    rotation: number;
    template: LabelTemplate;
    isHighContrast: boolean;
    isDarkMode?: boolean;
    qrCodeUrl: string;
    barcodeWidthScale: number;
    barcodeHeightScale: number;
    fontScale: number;
    idPrefix?: string;
}> = ({ item, labelWidth, labelHeight, rotation, template, isHighContrast, isDarkMode = false, qrCodeUrl, barcodeWidthScale, barcodeHeightScale, fontScale, idPrefix = "" }) => {
    const barcodeRef = useRef<SVGSVGElement>(null);

    // Base scaling relative to 100x50 standard
    const scaleX = labelWidth / 100;
    const scaleY = labelHeight / 50;

    // For very small labels (like 50x25), we need to scale up the content slightly more than linear
    // to maintain readability on thermal printers.
    const isSmallLabel = labelWidth <= 55 && labelHeight <= 30;
    const baseScale = (isSmallLabel ? Math.min(scaleX, scaleY) * 1.3 : Math.min(scaleX, scaleY)) * fontScale;

    useEffect(() => {
        if (barcodeRef.current) {
            try {
                barcodeRef.current.innerHTML = "";
                JsBarcode(barcodeRef.current, item.id, {
                    format: "CODE128",
                    width: Math.max(1, 2.2 * scaleX * barcodeWidthScale),
                    height: Math.max(8, 15 * scaleY * barcodeHeightScale),
                    displayValue: false,
                    margin: 0,
                    background: "transparent",
                    lineColor: isDarkMode ? "#ffffff" : "#000000"
                });
            } catch (err) {
                console.error("Barcode Render Failure:", err);
            }
        }
    }, [item.id, labelWidth, labelHeight, scaleX, scaleY, barcodeWidthScale, barcodeHeightScale, template, isDarkMode]);

    const containerStyle: React.CSSProperties = {
        width: `${labelWidth}mm`,
        height: `${labelHeight}mm`,
        boxSizing: 'border-box',
        padding: `${2 * baseScale}mm`,
        backgroundColor: isDarkMode ? '#000000' : 'white',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        color: isDarkMode ? '#ffffff' : 'black',
        border: `${0.8 * baseScale}mm solid ${isDarkMode ? '#ffffff' : '#000'}`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
    };

    // --- TEMPLATE: OFFICIAL (MATCHES PDF PROVIDED BY USER) ---
    if (template === 'official') {
        return (
            <div id={`${idPrefix}printable-label-content`} style={{ ...containerStyle, flexDirection: 'column', gap: 0, padding: 0 }} className={isHighContrast ? 'high-contrast-mode' : ''}>
                {/* Header Row: Logo | Asset ID | Verified */}
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${1.5 * baseScale}mm` }}>
                    <div style={{ width: '25%' }}>
                        <Logo className={isDarkMode ? "brightness-200" : "grayscale brightness-0"} style={{ height: `${5 * baseScale}mm`, width: 'auto' }} />
                    </div>
                    <div style={{ flex: 1, borderLeft: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, paddingLeft: `${3 * baseScale}mm` }}>
                        <span style={{ fontSize: `${1.8 * baseScale}mm`, fontWeight: 800, textTransform: 'uppercase', display: 'block', color: isDarkMode ? '#fff' : '#000' }}>Asset ID</span>
                        <span style={{ fontSize: `${4 * baseScale}mm`, fontWeight: 900, display: 'block', marginTop: '-0.5mm', color: isDarkMode ? '#fff' : '#000' }}>{item.id}</span>
                    </div>
                    <div style={{ width: '20%', textAlign: 'right' }}>
                        <span style={{ fontSize: `${1.8 * baseScale}mm`, fontWeight: 800, textTransform: 'uppercase', display: 'block', color: isDarkMode ? '#fff' : '#000' }}>Verified</span>
                        <span style={{ fontSize: `${3 * baseScale}mm`, fontWeight: 900, display: 'block', marginTop: '-0.5mm', color: isDarkMode ? '#fff' : '#000' }}>{new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Designation Row */}
                <div style={{ borderBottom: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${1.5 * baseScale}mm` }}>
                    <span style={{ fontSize: `${1.8 * baseScale}mm`, fontWeight: 800, textTransform: 'uppercase', display: 'block', color: isDarkMode ? '#fff' : '#000' }}>Designation</span>
                    <p style={{ fontSize: `${4.5 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 1.1, color: isDarkMode ? '#fff' : '#000' }}>{item.name}</p>
                </div>

                {/* Middle Section: QR (Left) | Category & Bin (Right) */}
                <div style={{ flex: 1, display: 'flex' }}>
                    {/* QR Section */}
                    <div style={{ width: '35%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${1 * baseScale}mm` }}>
                        <img src={qrCodeUrl} style={{ width: '75%', height: 'auto', imageRendering: 'pixelated', filter: isDarkMode ? 'invert(1)' : 'none' }} alt="QR" />
                        <p style={{ fontSize: `${1.2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', marginTop: `${1 * baseScale}mm`, textAlign: 'center', lineHeight: 1.2, width: '90%', color: isDarkMode ? '#fff' : '#000' }}>
                            Property Of<br />Vistaran Health Care<br />Services
                        </p>
                    </div>

                    {/* Category & Bin Section */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: `${2 * baseScale}mm`, gap: `${2 * baseScale}mm`, justifyContent: 'center' }}>
                        <div style={{ display: 'flex', gap: `${2 * baseScale}mm` }}>
                            <div style={{ flex: 1, border: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${1.5 * baseScale}mm` }}>
                                <span style={{ fontSize: `${1.8 * baseScale}mm`, fontWeight: 900, display: 'block', textTransform: 'uppercase', color: isDarkMode ? '#fff' : '#000' }}>Category</span>
                                <span style={{ fontSize: `${3.2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', display: 'block', marginTop: `${0.5 * baseScale}mm`, color: isDarkMode ? '#fff' : '#000' }}>{item.category}</span>
                            </div>
                            <div style={{ flex: 1, border: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${1.5 * baseScale}mm` }}>
                                <span style={{ fontSize: `${1.8 * baseScale}mm`, fontWeight: 900, display: 'block', textTransform: 'uppercase', color: isDarkMode ? '#fff' : '#000' }}>Bin / Rack</span>
                                <span style={{ fontSize: `${3.2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', display: 'block', marginTop: `${0.5 * baseScale}mm`, color: isDarkMode ? '#fff' : '#000' }}>{item.location || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Barcode Section */}
                <div style={{ borderTop: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${1.5 * baseScale}mm`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <svg ref={barcodeRef} style={{ width: '95%', height: `${9 * baseScale}mm`, filter: isDarkMode ? 'invert(1)' : 'none' }}></svg>
                    <span style={{ fontSize: `${4 * baseScale}mm`, fontWeight: 900, fontFamily: 'monospace', letterSpacing: `${1 * baseScale}mm`, marginTop: `${0.5 * baseScale}mm`, color: isDarkMode ? '#fff' : '#000' }}>{item.id}</span>
                </div>
            </div>
        );
    }

    // --- TEMPLATE: THERMAL (OPTIMIZED FOR 50x25) ---
    if (template === 'thermal') {
        return (
            <div id={`${idPrefix}printable-label-content`} style={{ ...containerStyle, flexDirection: 'column', padding: 0, gap: 0 }} className={isHighContrast ? 'high-contrast-mode' : ''}>
                {/* Top Row: Logo | System ID */}
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: `${0.6 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${0.8 * baseScale}mm` }}>
                    <div style={{ width: '30%' }}>
                        <Logo className={isDarkMode ? "brightness-200" : "grayscale brightness-0"} style={{ height: `${3.5 * baseScale}mm`, width: 'auto' }} />
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                        <span style={{ fontSize: `${1.2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', display: 'block', color: isDarkMode ? '#fff' : '#000', lineHeight: 1 }}>System ID</span>
                        <span style={{ fontSize: `${3.2 * baseScale}mm`, fontWeight: 900, display: 'block', color: isDarkMode ? '#fff' : '#000', lineHeight: 1 }}>{item.id}</span>
                    </div>
                </div>

                {/* Middle Section: QR (Left) | Description & Boxes (Right) */}
                <div style={{ flex: 1, display: 'flex' }}>
                    {/* QR Section */}
                    <div style={{ width: '30%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `${0.6 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${0.5 * baseScale}mm` }}>
                        <img src={qrCodeUrl} style={{ width: '100%', height: 'auto', imageRendering: 'pixelated', filter: isDarkMode ? 'invert(1)' : 'none' }} alt="QR" />
                    </div>

                    {/* Description Section */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: `${0.8 * baseScale}mm`, gap: `${0.5 * baseScale}mm` }}>
                        <div>
                            <span style={{ fontSize: `${1.2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', display: 'block', color: isDarkMode ? '#fff' : '#000' }}>Asset Description</span>
                            <span style={{ fontSize: `${3.5 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', display: 'block', color: isDarkMode ? '#fff' : '#000', lineHeight: 1.1 }}>{item.name}</span>
                        </div>
                        <div style={{ display: 'flex', gap: `${1 * baseScale}mm`, marginTop: 'auto' }}>
                            <div style={{ flex: 1, border: `${0.4 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${0.4 * baseScale}mm` }}>
                                <span style={{ fontSize: `${1 * baseScale}mm`, fontWeight: 900, display: 'block', textTransform: 'uppercase', color: isDarkMode ? '#fff' : '#000' }}>Type</span>
                                <span style={{ fontSize: `${2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', display: 'block', color: isDarkMode ? '#fff' : '#000' }}>{item.category}</span>
                            </div>
                            <div style={{ flex: 1, border: `${0.4 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${0.4 * baseScale}mm` }}>
                                <span style={{ fontSize: `${1 * baseScale}mm`, fontWeight: 900, display: 'block', textTransform: 'uppercase', color: isDarkMode ? '#fff' : '#000' }}>Loc</span>
                                <span style={{ fontSize: `${2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', display: 'block', color: isDarkMode ? '#fff' : '#000' }}>{item.location || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Barcode Section */}
                <div style={{ borderTop: `${0.6 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${0.5 * baseScale}mm`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg ref={barcodeRef} style={{ width: '90%', height: `${6 * baseScale}mm`, filter: isDarkMode ? 'invert(1)' : 'none' }}></svg>
                </div>
            </div>
        );
    }

    // --- TEMPLATE: INDUSTRIAL (LEGACY) ---
    if (template === 'industrial') {
        return (
            <div id={`${idPrefix}printable-label-content`} style={{ ...containerStyle, flexDirection: 'column' }} className={isHighContrast ? 'high-contrast-mode' : ''}>
                <div style={{ height: '25%', borderBottom: `${0.5 * baseScale}mm solid #000`, display: 'flex', alignItems: 'center', padding: `0 ${3 * baseScale}mm` }}>
                    <Logo className="grayscale brightness-0" style={{ height: '70%', width: 'auto' }} />
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: `${6 * baseScale}mm` }}>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: `${2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', display: 'block' }}>Ref ID</span>
                            <span style={{ fontSize: `${4.5 * baseScale}mm`, fontWeight: 900, display: 'block', marginTop: '-0.2mm' }}>{item.id}</span>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1, display: 'flex' }}>
                    <div style={{ width: '32%', borderRight: `${0.5 * baseScale}mm solid #000`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${2 * baseScale}mm` }}>
                        <img src={qrCodeUrl} style={{ width: '100%', height: 'auto', imageRendering: 'pixelated' }} alt="QR" />
                        <span style={{ fontSize: `${1.2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', marginTop: `${1.5 * baseScale}mm` }}>Property of Vistaran</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: `${2 * baseScale}mm ${3 * baseScale}mm`, flex: 1 }}>
                            <span style={{ fontSize: `${1.8 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase' }}>Hardware Model</span>
                            <p style={{ fontSize: `${4 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', margin: `${0.5 * baseScale}mm 0`, lineHeight: 1.1, overflow: 'hidden' }}>{item.brand} {item.name}</p>
                            <div style={{ display: 'flex', gap: `${2 * baseScale}mm`, marginTop: `${1.5 * baseScale}mm` }}>
                                <div style={{ flex: 1, border: `${0.3 * baseScale}mm solid #000`, padding: `${1 * baseScale}mm`, backgroundColor: '#fff' }}>
                                    <span style={{ fontSize: `${1.2 * baseScale}mm`, fontWeight: 900, display: 'block' }}>Type</span>
                                    <span style={{ fontSize: `${2.8 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase' }}>{item.category}</span>
                                </div>
                                <div style={{ flex: 1, border: `${0.3 * baseScale}mm solid #000`, padding: `${1 * baseScale}mm`, backgroundColor: '#fff' }}>
                                    <span style={{ fontSize: `${1.2 * baseScale}mm`, fontWeight: 900, display: 'block' }}>Loc</span>
                                    <span style={{ fontSize: `${2.8 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase' }}>{item.location || 'DC-WH'}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ height: '35%', borderTop: `${0.5 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${1 * baseScale}mm` }}>
                            <svg ref={barcodeRef} style={{ width: '92%', height: 'auto', filter: isDarkMode ? 'invert(1)' : 'none' }}></svg>
                            <p style={{ fontSize: `${3.5 * baseScale}mm`, fontWeight: 900, margin: `${0.5 * baseScale}mm 0 0 0`, fontFamily: 'monospace', letterSpacing: `${1 * baseScale}mm` }}>{item.id}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- TEMPLATE: COMPACT ---
    if (template === 'compact') {
        return (
            <div id={`${idPrefix}printable-label-content`} style={{ ...containerStyle, flexDirection: 'column', padding: `${2 * baseScale}mm` }} className={isHighContrast ? 'high-contrast-mode' : ''}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Logo className={isDarkMode ? "brightness-200" : "grayscale brightness-0"} style={{ height: `${5 * baseScale}mm`, width: 'auto' }} />
                    <span style={{ fontSize: `${4 * baseScale}mm`, fontWeight: 900, fontFamily: 'monospace' }}>{item.id.slice(-6)}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: `${2 * baseScale}mm 0` }}>
                    <img src={qrCodeUrl} style={{ width: '60%', height: 'auto' }} alt="QR" />
                </div>
                <div style={{ textAlign: 'center', borderTop: '0.2mm solid #000', paddingTop: `${1.5 * baseScale}mm` }}>
                    <p style={{ fontSize: `${3 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>{item.name}</p>
                    <p style={{ fontSize: `${2 * baseScale}mm`, fontWeight: 900, margin: 0 }}>{item.serialNumber || item.id}</p>
                </div>
            </div>
        );
    }

    // --- TEMPLATE: MODERN ---
    if (template === 'modern') {
        return (
            <div id={`${idPrefix}printable-label-content`} style={{ ...containerStyle, flexDirection: 'row' }} className={isHighContrast ? 'high-contrast-mode' : ''}>
                <div style={{ width: '40%', height: '100%', borderRight: `0.5mm solid ${isDarkMode ? '#fff' : '#000'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${4 * baseScale}mm` }}>
                    <img src={qrCodeUrl} style={{ width: '100%', height: 'auto', filter: isDarkMode ? 'invert(1)' : 'none' }} alt="QR" />
                    <div style={{ marginTop: `${4 * baseScale}mm`, textAlign: 'center' }}>
                        <span style={{ fontSize: `${5 * baseScale}mm`, fontWeight: 900, letterSpacing: '1px' }}>{item.id}</span>
                    </div>
                </div>
                <div style={{ flex: 1, padding: `${6 * baseScale}mm`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h2 style={{ fontSize: `${6 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', margin: '0 0 2mm 0' }}>{item.brand}</h2>
                    <h3 style={{ fontSize: `${5 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', margin: '0 0 4mm 0' }}>{item.name}</h3>
                    <div style={{ marginTop: 'auto' }}>
                        <svg ref={barcodeRef} style={{ width: '100%', height: 'auto' }}></svg>
                    </div>
                </div>
            </div>
        );
    }

    // --- TEMPLATE: STRIP ---
    if (template === 'strip') {
        return (
            <div id={`${idPrefix}printable-label-content`} style={{ ...containerStyle, flexDirection: 'row', alignItems: 'center', padding: `0 ${3 * baseScale}mm` }} className={isHighContrast ? 'high-contrast-mode' : ''}>
                <img src={qrCodeUrl} style={{ height: '80%', width: 'auto', marginRight: `${4 * baseScale}mm` }} alt="QR" />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: `${3.5 * baseScale}mm`, fontWeight: 900, margin: 0, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{item.brand} {item.name}</p>
                    <p style={{ fontSize: `${2.5 * baseScale}mm`, fontWeight: 900, margin: 0 }}>SN: {item.serialNumber || item.id}</p>
                </div>
                <div style={{ width: '35%', textAlign: 'right', marginLeft: `${4 * baseScale}mm` }}>
                    <svg ref={barcodeRef} style={{ width: '100%', height: `${12 * baseScale}mm`, filter: isDarkMode ? 'invert(1)' : 'none' }}></svg>
                    <p style={{ fontSize: `${3 * baseScale}mm`, fontWeight: 900, margin: 0, fontFamily: 'monospace' }}>{item.id}</p>
                </div>
            </div>
        );
    }

    // Default Fallback
    return <div style={containerStyle}>Template Error</div>;
};

const AssetLabelModal: React.FC<AssetLabelModalProps> = ({ item, onClose }) => {
    const [labelScale] = useState(2.0);
    const [printQty, setPrintQty] = useState(1);
    const [labelWidth, setLabelWidth] = useState(100);
    const [labelHeight, setLabelHeight] = useState(70); // Adjusted for the official 2x4 layout
    const [rotation, setRotation] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isHighContrast, setIsHighContrast] = useState(true);
    const [fontScale, setFontScale] = useState(1.0);
    const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate>('official');

    const handlePrint = () => {
        const labelElement = document.getElementById('modal-printable-label-content');
        if (!labelElement) return;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        const labelHtml = labelElement.outerHTML;
        const finalPageWidth = (rotation === 90 || rotation === 270) ? labelHeight : labelWidth;
        const finalPageHeight = (rotation === 90 || rotation === 270) ? labelWidth : labelHeight;

        doc.open();
        doc.write(`
            <html>
                <head>
                    <title>Print_Asset_Tag</title>
                    <style>
                        @page { size: ${finalPageWidth}mm ${finalPageHeight}mm; margin: 0 !important; }
                        * { box-sizing: border-box !important; -webkit-print-color-adjust: exact !important; }
                        body { margin: 0 !important; padding: 0 !important; background: white !important; width: ${finalPageWidth}mm; height: ${finalPageHeight}mm; display: flex; align-items: center; justify-content: center; overflow: hidden; }
                        #modal-printable-label-content { width: ${labelWidth}mm !important; height: ${labelHeight}mm !important; transform: rotate(${rotation}deg) !important; transform-origin: center center !important; }
                        .high-contrast-mode { filter: contrast(100) grayscale(1) !important; }
                    </style>
                </head>
                <body>
                    ${Array(printQty).fill(labelHtml).join('')}
                    <script>
                        window.onload = function() { window.focus(); window.print(); setTimeout(() => { window.frameElement.remove(); }, 2000); };
                    </script>
                </body>
            </html>
        `);
        doc.close();
    };

    const assetDeepLink = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(item.id)}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(assetDeepLink)}&margin=0&ecc=H`;

    return (
        <div className="fixed inset-0 z-[150] overflow-y-auto no-print">
            <div className="min-h-screen bg-slate-900/98 backdrop-blur-3xl flex justify-center items-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-[50px] shadow-2xl w-full max-w-6xl overflow-hidden border border-white/10 flex flex-col animate-in zoom-in-95 duration-300">
                    <header className="p-8 border-b dark:border-slate-800 flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white"><i className="fas fa-print"></i></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Tag Calibrator</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Tag ID: {item.id}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Template</span>
                                <select
                                    value={selectedTemplate}
                                    onChange={e => {
                                        const val = e.target.value as LabelTemplate;
                                        setSelectedTemplate(val);
                                        if (val === 'thermal') {
                                            setLabelWidth(50);
                                            setLabelHeight(25);
                                        }
                                    }}
                                    className="p-2 text-xs font-bold border rounded-lg dark:bg-slate-700"
                                >
                                    <option value="official">Official Vistaran</option>
                                    <option value="thermal">Thermal Vistaran (50x25)</option>
                                    <option value="industrial">Industrial</option>
                                    <option value="compact">Compact</option>
                                    <option value="modern">Modern</option>
                                    <option value="strip">Strip</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Presets</span>
                                <select
                                    onChange={e => {
                                        const [w, h] = e.target.value.split('x').map(Number);
                                        setLabelWidth(w);
                                        setLabelHeight(h);
                                    }}
                                    className="p-2 text-xs font-bold border rounded-lg dark:bg-slate-700"
                                >
                                    <option value="100x70">100x70mm (Default)</option>
                                    <option value="50x75">50x75mm (Portrait)</option>
                                    <option value="100x50">100x50mm (Standard)</option>
                                    <option value="50x50">50x50mm (Square)</option>
                                    <option value="50x25">50x25mm (Small)</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Rotate</span>
                                <select value={rotation} onChange={e => setRotation(parseInt(e.target.value))} className="p-2 text-xs font-bold border rounded-lg dark:bg-slate-700">
                                    <option value="0">0°</option>
                                    <option value="90">90°</option>
                                    <option value="180">180°</option>
                                    <option value="270">270°</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Font Scale</span>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0.5"
                                    max="3.0"
                                    value={fontScale}
                                    onChange={e => setFontScale(parseFloat(e.target.value) || 1.0)}
                                    className="p-2 text-xs font-bold border rounded-lg dark:bg-slate-700 w-16"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Mode</span>
                                <button
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className={`p-2 text-xs font-bold border rounded-lg dark:bg-slate-700 transition-all ${isDarkMode ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200'}`}
                                >
                                    {isDarkMode ? 'Dark' : 'Light'}
                                </button>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Contrast</span>
                                <button
                                    onClick={() => setIsHighContrast(!isHighContrast)}
                                    className={`p-2 text-xs font-bold border rounded-lg dark:bg-slate-700 transition-all ${isHighContrast ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200'}`}
                                >
                                    {isHighContrast ? 'High' : 'Normal'}
                                </button>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">W (mm)</span>
                                <input type="number" value={labelWidth} onChange={e => setLabelWidth(parseInt(e.target.value) || 1)} className="w-16 p-2 text-xs font-bold border rounded-lg dark:bg-slate-700 text-center" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">H (mm)</span>
                                <input type="number" value={labelHeight} onChange={e => setLabelHeight(parseInt(e.target.value) || 1)} className="w-16 p-2 text-xs font-bold border rounded-lg dark:bg-slate-700 text-center" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Print Qty</span>
                                <input type="number" min="1" value={printQty} onChange={e => setPrintQty(parseInt(e.target.value) || 1)} className="w-16 p-2 text-xs font-bold border rounded-lg dark:bg-slate-700 text-center" />
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-red-500 text-3xl transition-all ml-2">&times;</button>
                        </div>
                    </header>

                    <div className="flex-1 p-8 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center overflow-auto">
                        <div style={{ transform: `scale(${labelScale})`, transition: 'transform 0.3s ease' }} className="bg-white shadow-2xl">
                            <PrintableLabel
                                item={item}
                                labelWidth={labelWidth}
                                labelHeight={labelHeight}
                                rotation={rotation}
                                template={selectedTemplate}
                                isHighContrast={isHighContrast}
                                isDarkMode={isDarkMode}
                                qrCodeUrl={qrCodeUrl}
                                barcodeWidthScale={1.0}
                                barcodeHeightScale={1.0}
                                fontScale={fontScale}
                                idPrefix="modal-"
                            />
                        </div>
                    </div>

                    <footer className="p-8 border-t dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                        <div className="flex gap-4">
                            <button onClick={onClose} className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Close</button>
                            <button onClick={handlePrint} className="bg-primary text-white font-black px-16 py-5 rounded-[22px] shadow-2xl hover:bg-primary-hover active:scale-95 transition-all text-sm uppercase tracking-widest flex items-center gap-3">
                                <i className="fas fa-print"></i> Generate Physical Label
                            </button>
                        </div>
                    </footer>
                    <style>{`
                        .high-contrast-mode { filter: contrast(200%) grayscale(100%) !important; }
                        .high-contrast-mode * { font-weight: 900 !important; border-color: #000 !important; color: #000 !important; }
                        .high-contrast-mode svg, .high-contrast-mode img { filter: contrast(300%) !important; image-rendering: pixelated; }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default AssetLabelModal;
