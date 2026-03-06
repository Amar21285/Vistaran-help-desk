
import React, { useState, useMemo } from 'react';
import { InventoryItem } from '../../types';
import { PrintableLabel, LabelTemplate } from './AssetLabelModal';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface BatchAssetLabelModalProps {
    items: InventoryItem[];
    onClose: () => void;
}

const PAGE_SIZES = {
    a3: { name: 'A3 (297x420)', width: 297, height: 420 },
    a4: { name: 'A4 (210x297)', width: 210, height: 297 },
    letter: { name: 'Letter (216x279)', width: 215.9, height: 279.4 },
};

const BatchAssetLabelModal: React.FC<BatchAssetLabelModalProps> = ({ items, onClose }) => {
    // Processing State
    const [isGenerating, setIsGenerating] = useState(false);
    const [processProgress, setProcessProgress] = useState(0);
    const [processTotal, setProcessTotal] = useState(0);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>(items.map(i => i.id));

    // Tag Dimensions - Adjusted for "Official" aspect ratio
    const [labelWidth, setLabelWidth] = useState(95);
    const [labelHeight, setLabelHeight] = useState(65);
    const [rotation, setRotation] = useState(0);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isHighContrast, setIsHighContrast] = useState(true);
    const [fontScale, setFontScale] = useState(1.0);
    const [selectedTemplate, setSelectedTemplate] = useState<LabelTemplate>('official');

    // Grid Layout State - Default to 2x4 as per PDF
    const [pageSize, setPageSize] = useState('a4');
    const [gridCols, setGridCols] = useState(2);
    const [gridRows, setGridRows] = useState(4);
    const [gridGapX, setGridGapX] = useState(2);
    const [gridGapY, setGridGapY] = useState(2);
    const [pagePadding, setPagePadding] = useState(5);

    const activeItems = useMemo(() => items.filter(i => selectedIds.includes(i.id)), [items, selectedIds]);

    const handleToggleAsset = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAll = () => setSelectedIds(items.map(i => i.id));
    const handleClearAll = () => setSelectedIds([]);

    const handlePrintAll = () => {
        if (activeItems.length === 0) return;
        setIsGenerating(true);

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        const finalPageWidth = (rotation === 90 || rotation === 270) ? labelHeight : labelWidth;
        const finalPageHeight = (rotation === 90 || rotation === 270) ? labelWidth : labelHeight;

        // Collect HTML from current rendered units
        const labelsHtml = activeItems.map((_, idx) => {
            const el = document.querySelectorAll('.batch-label-unit > div')[idx] as HTMLElement;
            return el ? `<div class="page-wrapper">${el.outerHTML}</div>` : '';
        }).join('');

        doc.open();
        doc.write(`
            <html>
                <head>
                    <title>Vistaran_Batch_Print</title>
                    <style>
                        @page { size: ${finalPageWidth}mm ${finalPageHeight}mm; margin: 0 !important; }
                        * { box-sizing: border-box !important; -webkit-print-color-adjust: exact !important; }
                        body { margin: 0 !important; padding: 0 !important; background: white !important; }
                        .page-wrapper {
                            width: ${finalPageWidth}mm; height: ${finalPageHeight}mm;
                            display: flex; align-items: center; justify-content: center;
                            page-break-after: always; overflow: hidden;
                        }
                        .page-wrapper > div { 
                            width: ${labelWidth}mm !important; height: ${labelHeight}mm !important; 
                            transform: rotate(${rotation}deg) !important;
                            transform-origin: center center !important;
                        }
                        .high-contrast-mode { filter: contrast(100) grayscale(1) !important; }
                        svg, img { image-rendering: pixelated; }
                    </style>
                </head>
                <body>
                    ${labelsHtml}
                    <script>
                        window.onload = function() {
                            window.focus(); window.print();
                            setTimeout(() => { window.frameElement.remove(); }, 3000);
                        };
                    </script>
                </body>
            </html>
        `);
        doc.close();
        setIsGenerating(false);
    };

    const handleDownloadGridPDF = async () => {
        if (activeItems.length === 0) return;
        setIsGenerating(true);
        setProcessTotal(activeItems.length);
        setProcessProgress(0);

        try {
            const pdf = new jsPDF('p', 'mm', pageSize);
            const labelsPerPage = gridCols * gridRows;

            const labelElements = document.querySelectorAll('.batch-label-unit > div');

            for (let i = 0; i < labelElements.length; i++) {
                const element = labelElements[i] as HTMLElement;
                const itemOnPage = i % labelsPerPage;
                const colIndex = itemOnPage % gridCols;
                const rowIndex = Math.floor(itemOnPage / gridCols);

                if (i > 0 && itemOnPage === 0) pdf.addPage();

                const canvas = await html2canvas(element, {
                    scale: 5,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const x = pagePadding + (colIndex * (labelWidth + gridGapX));
                const y = pagePadding + (rowIndex * (labelHeight + gridGapY));

                pdf.addImage(imgData, 'JPEG', x, y, labelWidth, labelHeight);
                setProcessProgress(i + 1);
            }

            pdf.save(`Vistaran_Grid_${pageSize}_${new Date().getTime()}.pdf`);
        } catch (err) {
            console.error("Grid Export Error:", err);
        } finally {
            // Fixed: Use 'setIsGenerating' instead of undefined 'setIsGeneratingPDF'
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[160] bg-slate-950 flex flex-col no-print font-sans">
            {/* TOP DYNAMIC HEADER */}
            <header className="p-6 border-b border-white/10 flex flex-wrap justify-between items-center bg-slate-900/50 backdrop-blur-xl gap-6 shrink-0">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                        <i className="fas fa-layer-group text-xl"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Batch Tag Console</h2>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">{activeItems.length} of {items.length} units active</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* PAGE & GRID CALIBRATION */}
                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
                        <div className="flex flex-col px-3">
                            <span className="text-[7px] font-black text-slate-500 uppercase">Page Size</span>
                            <select value={pageSize} onChange={e => setPageSize(e.target.value)} className="bg-transparent text-white text-[10px] font-black outline-none cursor-pointer">
                                {Object.entries(PAGE_SIZES).map(([k, v]) => <option key={k} value={k} className="text-slate-900">{v.name}</option>)}
                            </select>
                        </div>
                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                        <div className="flex flex-col px-3">
                            <span className="text-[7px] font-black text-slate-500 uppercase">Layout</span>
                            <div className="flex items-center gap-2">
                                <input type="number" value={gridCols} onChange={e => setGridCols(parseInt(e.target.value) || 1)} className="w-6 bg-transparent text-white text-[10px] font-black outline-none" />
                                <span className="text-slate-600 text-[8px]">×</span>
                                <input type="number" value={gridRows} onChange={e => setGridRows(parseInt(e.target.value) || 1)} className="w-6 bg-transparent text-white text-[10px] font-black outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* DIMENSION & TEMPLATE */}
                    <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10">
                        <div className="flex flex-col px-3">
                            <span className="text-[7px] font-black text-slate-500 uppercase">Presets</span>
                            <select
                                onChange={e => {
                                    const [w, h] = e.target.value.split('x').map(Number);
                                    setLabelWidth(w);
                                    setLabelHeight(h);
                                }}
                                className="bg-transparent text-white text-[10px] font-black outline-none cursor-pointer"
                            >
                                <option value="95x65" className="text-slate-900">95x65mm (Default)</option>
                                <option value="50x75" className="text-slate-900">50x75mm (Portrait)</option>
                                <option value="100x50" className="text-slate-900">100x50mm (Standard)</option>
                                <option value="50x50" className="text-slate-900">50x50mm (Square)</option>
                                <option value="50x25" className="text-slate-900">50x25mm (Small)</option>
                            </select>
                        </div>
                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                        <div className="flex flex-col px-3">
                            <span className="text-[7px] font-black text-slate-500 uppercase">Template</span>
                            <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value as LabelTemplate)} className="bg-transparent text-white text-[10px] font-black outline-none cursor-pointer">
                                <option value="official" className="text-slate-900 uppercase">Official Vistaran</option>
                                <option value="thermal" className="text-slate-900 uppercase">Thermal Vistaran (50x25)</option>
                                <option value="industrial" className="text-slate-900 uppercase">Industrial</option>
                                <option value="compact" className="text-slate-900 uppercase">Compact</option>
                                <option value="modern" className="text-slate-900 uppercase">Modern</option>
                                <option value="strip" className="text-slate-900 uppercase">Strip</option>
                            </select>
                        </div>
                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                        <div className="flex flex-col px-3">
                            <span className="text-[7px] font-black text-slate-500 uppercase">Mode</span>
                            <button
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className={`text-[10px] font-black uppercase transition-all ${isDarkMode ? 'text-indigo-400' : 'text-slate-400'}`}
                            >
                                {isDarkMode ? 'Dark' : 'Light'}
                            </button>
                        </div>
                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                        <div className="flex flex-col px-3">
                            <span className="text-[7px] font-black text-slate-500 uppercase">Contrast</span>
                            <button
                                onClick={() => setIsHighContrast(!isHighContrast)}
                                className={`text-[10px] font-black uppercase transition-all ${isHighContrast ? 'text-emerald-400' : 'text-slate-400'}`}
                            >
                                {isHighContrast ? 'High' : 'Normal'}
                            </button>
                        </div>
                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                        <div className="flex flex-col px-3">
                            <span className="text-[7px] font-black text-slate-500 uppercase">Rotate</span>
                            <select value={rotation} onChange={e => setRotation(parseInt(e.target.value))} className="bg-transparent text-white text-[10px] font-black outline-none cursor-pointer">
                                <option value="0" className="text-slate-900">0°</option>
                                <option value="90" className="text-slate-900">90°</option>
                                <option value="180" className="text-slate-900">180°</option>
                                <option value="270" className="text-slate-900">270°</option>
                            </select>
                        </div>
                        <div className="w-px h-6 bg-white/10 mx-1"></div>
                        <div className="flex items-center gap-3 px-3">
                            <div className="flex flex-col">
                                <span className="text-[7px] font-black text-slate-500 uppercase">W (mm)</span>
                                <input type="number" value={labelWidth} onChange={e => setLabelWidth(parseInt(e.target.value) || 1)} className="w-8 bg-transparent text-white text-[10px] font-black outline-none" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[7px] font-black text-slate-500 uppercase">H (mm)</span>
                                <input type="number" value={labelHeight} onChange={e => setLabelHeight(parseInt(e.target.value) || 1)} className="w-8 bg-transparent text-white text-[10px] font-black outline-none" />
                            </div>
                        </div>
                    </div>

                    <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all text-xl">&times;</button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* ASSET SELECTION SIDEBAR */}
                <aside className="w-80 border-r border-white/10 bg-slate-900/30 flex flex-col shrink-0">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master List</h4>
                        <div className="flex gap-2">
                            <button onClick={handleSelectAll} className="text-[8px] font-black text-primary uppercase hover:underline">All</button>
                            <button onClick={handleClearAll} className="text-[8px] font-black text-slate-500 uppercase hover:underline">None</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {items.map(i => (
                            <div
                                key={i.id}
                                onClick={() => handleToggleAsset(i.id)}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${selectedIds.includes(i.id) ? 'bg-primary/10 border-primary shadow-lg' : 'bg-white/5 border-white/5 opacity-50 hover:opacity-100'}`}
                            >
                                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.includes(i.id) ? 'bg-primary border-primary text-white' : 'border-white/20'}`}>
                                    {selectedIds.includes(i.id) && <i className="fas fa-check text-[10px]"></i>}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[12px] font-black text-slate-900 dark:text-white uppercase truncate">{i.name}</p>
                                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase font-mono tracking-tighter mt-1">{i.id}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* PREVIEW STAGING AREA */}
                <main className="flex-1 bg-slate-100 dark:bg-slate-950/50 p-12 overflow-y-auto custom-scrollbar flex flex-col items-center">
                    <div className="flex flex-wrap justify-center gap-10">
                        {activeItems.length > 0 ? activeItems.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="batch-label-unit shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500 bg-white">
                                <PrintableLabel
                                    item={item}
                                    labelWidth={labelWidth}
                                    labelHeight={labelHeight}
                                    rotation={rotation}
                                    template={selectedTemplate}
                                    isHighContrast={isHighContrast}
                                    isDarkMode={isDarkMode}
                                    qrCodeUrl={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(item.id)}&margin=0&ecc=H`}
                                    barcodeWidthScale={1.1}
                                    barcodeHeightScale={1.1}
                                    fontScale={fontScale}
                                    idPrefix={`batch-${idx}-`}
                                />
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-full text-center py-40">
                                <i className="fas fa-barcode text-6xl text-slate-800 mb-6 opacity-20"></i>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">No Active Tags</h3>
                                <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">Select assets from the sidebar to generate previews</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* ACTION FOOTER */}
            <footer className="p-8 border-t border-white/10 bg-slate-900/80 backdrop-blur-xl flex justify-between items-center shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Calibration: Grid Gap (mm)</span>
                        <div className="flex gap-2">
                            <input type="number" value={gridGapX} onChange={e => setGridGapX(parseInt(e.target.value) || 0)} className="w-12 p-2 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] font-black text-center" placeholder="X" />
                            <input type="number" value={gridGapY} onChange={e => setGridGapY(parseInt(e.target.value) || 0)} className="w-12 p-2 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] font-black text-center" placeholder="Y" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Page Margin (mm)</span>
                        <input type="number" value={pagePadding} onChange={e => setPagePadding(parseInt(e.target.value) || 0)} className="w-20 p-2 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] font-black text-center" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Font Scale</span>
                        <input
                            type="number"
                            step="0.1"
                            min="0.5"
                            max="3.0"
                            value={fontScale}
                            onChange={e => setFontScale(parseFloat(e.target.value) || 1.0)}
                            className="w-20 p-2 bg-white/5 border border-white/10 rounded-lg text-white text-[10px] font-black text-center"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleDownloadGridPDF}
                        disabled={isGenerating || activeItems.length === 0}
                        className="bg-indigo-600 text-white font-black px-10 py-5 rounded-[22px] shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-3 border border-white/10"
                    >
                        <i className="fas fa-th"></i> Export Grid PDF
                    </button>
                    <button
                        onClick={handlePrintAll}
                        disabled={isGenerating || activeItems.length === 0}
                        className="bg-primary text-white font-black px-12 py-5 rounded-[22px] shadow-2xl hover:bg-primary-hover active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-3 border border-white/10"
                    >
                        <i className="fas fa-print"></i> Thermal Print All
                    </button>
                </div>
            </footer>

            {/* GENERATING OVERLAY */}
            {isGenerating && (
                <div className="fixed inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-[300] backdrop-blur-xl animate-in fade-in">
                    <div className="bg-white p-16 rounded-[60px] text-center space-y-8 shadow-2xl max-w-sm border border-white/10">
                        <div className="relative w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-8 border-slate-100 rounded-full"></div>
                            <div
                                className="absolute inset-0 border-8 border-primary rounded-full transition-all duration-300"
                                style={{
                                    clipPath: `inset(0 0 0 0)`,
                                    borderTopColor: 'transparent',
                                    borderLeftColor: 'transparent',
                                    transform: `rotate(${(processProgress / processTotal) * 360}deg)`
                                }}
                            ></div>
                            <div className="w-full h-full border-8 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div>
                            <h5 className="font-black text-2xl uppercase tracking-tighter text-slate-800">Processing Hub</h5>
                            <p className="font-bold text-slate-400 uppercase tracking-[0.3em] text-[10px] mt-3 animate-pulse">
                                {processTotal > 0 ? `Rasterizing Unit ${processProgress} / ${processTotal}` : 'Preparing Visual Protocol...'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .high-contrast-mode { filter: contrast(200%) grayscale(100%) !important; }
                .high-contrast-mode * { font-weight: 900 !important; border-color: #000 !important; color: #000 !important; }
                .high-contrast-mode svg, .high-contrast-mode img { filter: contrast(300%) !important; image-rendering: pixelated; }
            `}</style>
        </div>
    );
};

export default BatchAssetLabelModal;
