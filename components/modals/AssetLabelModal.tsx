
import React, { useEffect, useRef, useState } from 'react';
import { InventoryItem } from '../../types';
import JsBarcode from 'jsbarcode';
import Logo from '../icons/Logo';

interface AssetLabelModalProps {
    item: InventoryItem;
    onClose: () => void;
}

export type LabelTemplate = 'official' | 'industrial' | 'compact' | 'modern' | 'strip';

export const SIZE_PRESETS = [
    { name: 'Standard (100x50mm)', width: 100, height: 50 },
    { name: 'Large (100x75mm)', width: 100, height: 75 },
    { name: 'Square (50x50mm)', width: 50, height: 50 },
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
    barcodeRotation: number;
    idPrefix?: string;
}> = ({ item, labelWidth, labelHeight, rotation, template, isHighContrast, isDarkMode = false, qrCodeUrl, barcodeWidthScale, barcodeHeightScale, barcodeRotation, idPrefix = "" }) => {
    const barcodeRef = useRef<SVGSVGElement>(null);

    // Base scaling relative to 100x50 standard
    const scaleX = labelWidth / 100;
    const scaleY = labelHeight / 50;

    // Smart scaling: Use the smaller dimension to prevent overflow, 
    // but multiply by barcodeWidthScale (which we'll use as a general font scale)
    const baseScale = Math.min(scaleX, scaleY) * barcodeWidthScale;

    useEffect(() => {
        if (barcodeRef.current) {
            try {
                barcodeRef.current.innerHTML = "";
                JsBarcode(barcodeRef.current, item.id, {
                    format: "CODE128",
                    width: Math.max(1, 2.2 * scaleX * barcodeWidthScale),
                    height: Math.max(6, 12 * scaleY * barcodeHeightScale),
                    displayValue: false,
                    margin: 0,
                    background: "transparent",
                    lineColor: "#000000"
                });
            } catch (err) {
                console.error("Barcode Render Failure:", err);
            }
        }
    }, [item.id, labelWidth, labelHeight, scaleX, scaleY, barcodeWidthScale, barcodeHeightScale, template]);

    const containerStyle: React.CSSProperties = {
        width: `${labelWidth}mm`,
        height: `${labelHeight}mm`,
        boxSizing: 'border-box',
        padding: `${3 * baseScale}mm`, // Increased padding for safe zone
        backgroundColor: isDarkMode ? '#000000' : 'white',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        color: isDarkMode ? '#ffffff' : 'black',
        border: `${1.2 * baseScale}mm solid ${isDarkMode ? '#ffffff' : '#000'}`,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        fontFamily: 'Arial, Helvetica, sans-serif',
        wordBreak: 'break-word',
    };

    // --- TEMPLATE: OFFICIAL (EXACT MATCH FOR STEP 423 REFERENCE) ---
    if (template === 'official') {
        return (
            <div id={`${idPrefix}printable-label-content`} style={{ ...containerStyle, flexDirection: 'row', gap: 0, padding: 0 }} className={isHighContrast ? 'high-contrast-mode' : ''}>
                {/* Left Section (35%): Logo, QR, Property */}
                <div style={{ width: '35%', borderRight: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: `${2 * baseScale}mm 0`, boxSizing: 'border-box' }}>
                    <div style={{ height: '15%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Logo className={isDarkMode ? "brightness-200" : "grayscale brightness-0"} style={{ height: `${6 * baseScale}mm`, width: 'auto' }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '90%' }}>
                        <img src={qrCodeUrl} style={{ width: '85%', height: 'auto', imageRendering: 'pixelated', filter: isDarkMode ? 'invert(1)' : 'none' }} alt="QR" />
                    </div>
                    <div style={{ padding: `0 ${1 * baseScale}mm`, textAlign: 'center' }}>
                        <p style={{ fontSize: `${1.4 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 1.2 }}>
                            PROPERTY OF<br />VISTARAN HEALTH CARE<br />SERVICES
                        </p>
                    </div>
                </div>

                {/* Right Section (65%): Info Rows */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
                    {/* Row 1: ID & Verified (18%) */}
                    <div style={{ height: '23%', borderBottom: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, display: 'flex', boxSizing: 'border-box' }}>
                        <div style={{ flex: 1, padding: `0 ${2 * baseScale}mm`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ fontSize: `${1.4 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', color: isDarkMode ? '#aaa' : '#000', lineHeight: 1 }}>Asset ID</span>
                            <span style={{ fontSize: `${3.5 * baseScale}mm`, fontWeight: 900, marginTop: `${0.5 * baseScale}mm`, lineHeight: 1, wordBreak: 'break-all' }}>{item.id}</span>
                        </div>
                        <div style={{ width: '30%', padding: `0 ${3 * baseScale}mm`, borderLeft: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'right' }}>
                            <span style={{ fontSize: `${1.4 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', color: isDarkMode ? '#aaa' : '#000', lineHeight: 1 }}>Verified</span>
                            <span style={{ fontSize: `${2.8 * baseScale}mm`, fontWeight: 900, marginTop: `${0.5 * baseScale}mm`, lineHeight: 1 }}>{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Row 2: Designation (20%) */}
                    <div style={{ height: '20%', borderBottom: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `0 ${2 * baseScale}mm`, display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
                        <span style={{ fontSize: `${1.4 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', color: isDarkMode ? '#aaa' : '#000', lineHeight: 1 }}>Designation</span>
                        <p style={{ fontSize: `${4.5 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', margin: `${0.5 * baseScale}mm 0 0 0`, lineHeight: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', color: isDarkMode ? '#fff' : '#000' }}>{item.name}</p>
                    </div>

                    {/* Row 3: Category & Bin/Rack Boxes (25%) */}
                    <div style={{ height: '25%', borderBottom: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, display: 'flex', boxSizing: 'border-box' }}>
                        <div style={{ flex: 1, padding: `${1.5 * baseScale}mm`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ border: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${1 * baseScale}mm ${2 * baseScale}mm`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
                                <span style={{ fontSize: `${1.2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', color: isDarkMode ? '#aaa' : '#000', lineHeight: 1 }}>Category</span>
                                <span style={{ fontSize: `${3.5 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', marginTop: `${0.5 * baseScale}mm`, color: isDarkMode ? '#fff' : '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.category}</span>
                            </div>
                        </div>
                        <div style={{ flex: 1, padding: `${1.5 * baseScale}mm`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ border: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${1 * baseScale}mm ${2 * baseScale}mm`, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
                                <span style={{ fontSize: `${1.2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', color: isDarkMode ? '#aaa' : '#000', lineHeight: 1 }}>Bin / Rack</span>
                                <span style={{ fontSize: `${3.5 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', marginTop: `${0.5 * baseScale}mm`, color: isDarkMode ? '#fff' : '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.location || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Row 4: Barcode (32%) */}
                    <div style={{ height: '32%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${1 * baseScale}mm`, boxSizing: 'border-box' }}>
                        <div style={{ height: '55%', width: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg ref={barcodeRef} style={{ width: '100%', height: '100%', filter: isDarkMode ? 'invert(1)' : 'none' }}></svg>
                        </div>
                        <span style={{ fontSize: `${3.5 * baseScale}mm`, fontWeight: 900, fontFamily: 'monospace', letterSpacing: `${2 * baseScale}mm`, marginTop: `${1.5 * baseScale}mm`, color: isDarkMode ? '#fff' : '#000', lineHeight: 1, textAlign: 'center' }}>
                            {item.id.split('').join(' ')}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // --- TEMPLATE: INDUSTRIAL ---
    if (template === 'industrial') {
        return (
            <div id={`${idPrefix}printable-label-content`} style={{ ...containerStyle, flexDirection: 'column', padding: 0 }} className={isHighContrast ? 'high-contrast-mode' : ''}>
                <div style={{ height: '22%', borderBottom: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, display: 'flex', alignItems: 'center', padding: `0 ${4 * baseScale}mm`, backgroundColor: isDarkMode ? '#111' : '#f4f4f4', boxSizing: 'border-box' }}>
                    <Logo className={isDarkMode ? "brightness-200" : "grayscale brightness-0"} style={{ height: '65%', width: 'auto' }} />
                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                        <span style={{ fontSize: `${2.2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '40%' }}>System ID</span>
                        <span style={{ fontSize: `${4.5 * baseScale}mm`, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '60%' }}>{item.id}</span>
                    </div>
                </div>
                <div style={{ flex: 1, display: 'flex', boxSizing: 'border-box' }}>
                    <div style={{ width: '32%', borderRight: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${3 * baseScale}mm`, boxSizing: 'border-box' }}>
                        <img src={qrCodeUrl} style={{ width: '100%', height: 'auto', imageRendering: 'pixelated', filter: isDarkMode ? 'invert(1)' : 'none' }} alt="QR" />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                        <div style={{ padding: `${2 * baseScale}mm ${3 * baseScale}mm`, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <span style={{ fontSize: `${2.2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', height: '30%' }}>Asset Description</span>
                                <div style={{ height: '70%', display: 'flex', alignItems: 'center' }}>
                                    <p style={{ fontSize: `${4.5 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 1.1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>{item.brand} {item.name}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: `${3 * baseScale}mm`, height: '45%' }}>
                                <div style={{ flex: 1, border: `${0.6 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${1 * baseScale}mm ${1.5 * baseScale}mm`, backgroundColor: isDarkMode ? '#222' : '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
                                    <span style={{ fontSize: `${1.8 * baseScale}mm`, fontWeight: 900, display: 'flex', alignItems: 'center', height: '40%' }}>Type</span>
                                    <span style={{ fontSize: `${3.2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', height: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.category}</span>
                                </div>
                                <div style={{ flex: 1, border: `${0.6 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, padding: `${1 * baseScale}mm ${1.5 * baseScale}mm`, backgroundColor: isDarkMode ? '#222' : '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
                                    <span style={{ fontSize: `${1.8 * baseScale}mm`, fontWeight: 900, display: 'flex', alignItems: 'center', height: '40%' }}>Loc</span>
                                    <span style={{ fontSize: `${3.2 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', height: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.location || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ height: '35%', borderTop: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${1.5 * baseScale}mm`, boxSizing: 'border-box' }}>
                            <svg ref={barcodeRef} style={{ width: '92%', height: 'auto', filter: isDarkMode ? 'invert(1)' : 'none' }}></svg>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- TEMPLATE: COMPACT ---
    if (template === 'compact') {
        return (
            <div id={`${idPrefix}printable-label-content`} style={{ ...containerStyle, flexDirection: 'column', padding: `${2.5 * baseScale}mm`, gap: `${1.5 * baseScale}mm` }} className={isHighContrast ? 'high-contrast-mode' : ''}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `${0.6 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, paddingBottom: `${1.5 * baseScale}mm` }}>
                    <Logo className={isDarkMode ? "brightness-200" : "grayscale brightness-0"} style={{ height: `${5 * baseScale}mm`, width: 'auto' }} />
                    <span style={{ fontSize: `${4.5 * baseScale}mm`, fontWeight: 900, fontFamily: 'monospace' }}>{item.id.slice(-8)}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: `${3 * baseScale}mm` }}>
                    <img src={qrCodeUrl} style={{ width: '45%', height: 'auto', imageRendering: 'pixelated', filter: isDarkMode ? 'invert(1)' : 'none' }} alt="QR" />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ fontSize: `${4 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                        <p style={{ fontSize: `${3 * baseScale}mm`, fontWeight: 900, margin: `${0.5 * baseScale}mm 0` }}>{item.category}</p>
                        <p style={{ fontSize: `${2.2 * baseScale}mm`, fontWeight: 900, margin: 0, fontFamily: 'monospace', wordBreak: 'break-all' }}>{item.id}</p>
                    </div>
                </div>
                <div style={{ borderTop: `${0.6 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, paddingTop: `${1.5 * baseScale}mm` }}>
                    <svg ref={barcodeRef} style={{ width: '100%', height: `${9 * baseScale}mm`, filter: isDarkMode ? 'invert(1)' : 'none' }}></svg>
                </div>
            </div>
        );
    }

    // --- TEMPLATE: MODERN ---
    if (template === 'modern') {
        return (
            <div id={`${idPrefix}printable-label-content`} style={{ ...containerStyle, flexDirection: 'row', padding: 0 }} className={isHighContrast ? 'high-contrast-mode' : ''}>
                <div style={{ width: '40%', height: '100%', borderRight: `${0.8 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${4 * baseScale}mm`, backgroundColor: isDarkMode ? '#111' : '#f9f9f9' }}>
                    <img src={qrCodeUrl} style={{ width: '90%', height: 'auto', imageRendering: 'pixelated', filter: isDarkMode ? 'invert(1)' : 'none' }} alt="QR" />
                    <div style={{ marginTop: `${4 * baseScale}mm`, textAlign: 'center' }}>
                        <span style={{ fontSize: `${5 * baseScale}mm`, fontWeight: 900, letterSpacing: '0.5px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{item.id}</span>
                    </div>
                </div>
                <div style={{ flex: 1, padding: `${5 * baseScale}mm`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1 }}>
                        <Logo className={isDarkMode ? "brightness-200" : "grayscale brightness-0"} style={{ height: `${6 * baseScale}mm`, width: 'auto', marginBottom: `${4 * baseScale}mm` }} />
                        <h2 style={{ fontSize: `${6 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase', margin: 0, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word' }}>{item.name}</h2>
                        <div style={{ marginTop: `${3 * baseScale}mm`, display: 'flex', gap: `${3 * baseScale}mm` }}>
                            <span style={{ fontSize: `${3 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase' }}>{item.category}</span>
                            <span style={{ fontSize: `${3 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase' }}>•</span>
                            <span style={{ fontSize: `${3 * baseScale}mm`, fontWeight: 900, textTransform: 'uppercase' }}>{item.location || 'N/A'}</span>
                        </div>
                    </div>
                    <div style={{ borderTop: `${0.6 * baseScale}mm solid ${isDarkMode ? '#fff' : '#000'}`, paddingTop: `${4 * baseScale}mm` }}>
                        <svg ref={barcodeRef} style={{ width: '100%', height: `${12 * baseScale}mm`, filter: isDarkMode ? 'invert(1)' : 'none' }}></svg>
                    </div>
                </div>
            </div>
        );
    }

    // --- TEMPLATE: STRIP ---
    if (template === 'strip') {
        return (
            <div id={`${idPrefix}printable-label-content`} style={{ ...containerStyle, flexDirection: 'row', alignItems: 'center', padding: `0 ${4 * baseScale}mm`, gap: `${4 * baseScale}mm` }} className={isHighContrast ? 'high-contrast-mode' : ''}>
                <div style={{ height: '85%', display: 'flex', alignItems: 'center' }}>
                    <img src={qrCodeUrl} style={{ height: '100%', width: 'auto', imageRendering: 'pixelated', filter: isDarkMode ? 'invert(1)' : 'none' }} alt="QR" />
                </div>
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <p style={{ fontSize: `${4 * baseScale}mm`, fontWeight: 900, margin: 0, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                    <div style={{ display: 'flex', gap: `${3 * baseScale}mm`, alignItems: 'center', marginTop: `${0.5 * baseScale}mm` }}>
                        <span style={{ fontSize: `${3 * baseScale}mm`, fontWeight: 900, fontFamily: 'monospace' }}>{item.id}</span>
                        <span style={{ fontSize: `${3 * baseScale}mm`, fontWeight: 900 }}>|</span>
                        <span style={{ fontSize: `${3 * baseScale}mm`, fontWeight: 900 }}>{item.category}</span>
                    </div>
                </div>
                <div style={{ width: '35%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <svg ref={barcodeRef} style={{ width: '100%', height: `${14 * baseScale}mm`, filter: isDarkMode ? 'invert(1)' : 'none' }}></svg>
                </div>
            </div>
        );
    }

    // Default Fallback
    return <div style={containerStyle}>Template Error</div>;
};

const AssetLabelModal: React.FC<AssetLabelModalProps> = ({ item, onClose }) => {
    const [labelScale, setLabelScale] = useState(2.0);
    const [printQty, setPrintQty] = useState(1);
    const [labelWidth, setLabelWidth] = useState(100);
    const [labelHeight, setLabelHeight] = useState(70);
    const [rotation, setRotation] = useState(0);
    const [isHighContrast, setIsHighContrast] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate>('official');
    const [fontScale, setFontScale] = useState(1.0);

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
                    <title>Print_Batch_Tags</title>
                    <style>
                        @page { size: ${finalPageWidth}mm ${finalPageHeight}mm; margin: 0 !important; }
                        * { box-sizing: border-box !important; -webkit-print-color-adjust: exact !important; }
                        body { margin: 0 !important; padding: 0 !important; background: white !important; }
                        .print-page { 
                            width: ${finalPageWidth}mm; 
                            height: ${finalPageHeight}mm; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            overflow: hidden; 
                            page-break-after: always;
                        }
                        .print-page:last-child { page-break-after: auto; }
                        #modal-printable-label-content { 
                            width: ${labelWidth}mm !important; 
                            height: ${labelHeight}mm !important; 
                            transform: rotate(${rotation}deg) !important; 
                            transform-origin: center center !important; 
                            image-rendering: pixelated !important; 
                        }
                        .high-contrast-mode { filter: contrast(1.5) grayscale(1) !important; }
                    </style>
                </head>
                <body>
                    ${Array(printQty).fill(0).map(() => `<div class="print-page">${labelHtml}</div>`).join('')}
                    <script>
                        window.onload = function() { 
                            window.focus(); 
                            setTimeout(() => {
                                window.print(); 
                                setTimeout(() => { window.frameElement.remove(); }, 1000);
                            }, 500);
                        };
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
                                <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value as any)} className="p-2 text-xs font-bold border rounded-lg dark:bg-slate-700">
                                    <option value="official">Official Vistaran</option>
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
                                <span className="text-[8px] font-black text-slate-400 uppercase">Mode</span>
                                <button
                                    onClick={() => setIsDarkMode(!isDarkMode)}
                                    className={`p-2 text-xs font-bold border rounded-lg dark:bg-slate-700 transition-all ${isDarkMode ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200'}`}
                                >
                                    {isDarkMode ? 'Dark' : 'Light'}
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
                                <span className="text-[8px] font-black text-slate-400 uppercase">Font Scale</span>
                                <input type="number" step="0.1" min="0.5" max="2.0" value={fontScale} onChange={e => setFontScale(parseFloat(e.target.value) || 1.0)} className="w-16 p-2 text-xs font-bold border rounded-lg dark:bg-slate-700 text-center" />
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
                                barcodeWidthScale={fontScale}
                                barcodeHeightScale={fontScale}
                                barcodeRotation={0}
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
                </div>
            </div>
        </div>
    );
};

export default AssetLabelModal;
