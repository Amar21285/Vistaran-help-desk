import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface ScannerModalProps {
    onClose: () => void;
    onResult: (decodedText: string) => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onResult }) => {
    const [error, setError] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerId = 'reader';

    useEffect(() => {
        scannerRef.current = new Html5Qrcode(containerId);

        const startScanner = async () => {
            try {
                // Configured for both QR codes and 1D Barcodes (wide aspect ratio)
                const config = { 
                    fps: 20, 
                    // Wide rectangle for 1D Barcode support
                    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                        return {
                            width: Math.min(viewfinderWidth * 0.8, 400),
                            height: Math.min(viewfinderHeight * 0.4, 250)
                        };
                    },
                    aspectRatio: 1.0,
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8
                    ]
                };
                
                await scannerRef.current?.start(
                    { facingMode: "environment" }, 
                    config, 
                    (decodedText) => {
                        // Success audio feedback
                        try {
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                            audio.volume = 0.4;
                            audio.play().catch(() => {});
                        } catch (e) {}
                        
                        onResult(decodedText);
                        stopScanner();
                    },
                    (errorMessage) => {
                        // Suppress scanning noise logs
                    }
                );
                setIsCameraActive(true);
            } catch (err: any) {
                console.error("Camera error:", err);
                setError(err.message || "Unable to access camera. Please check browser permissions.");
            }
        };

        startScanner();

        return () => {
            stopScanner();
        };
    }, []);

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
            } catch (e) {
                console.error("Failed to stop scanner", e);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex justify-center items-center z-[200] p-4 modal-backdrop">
            <div className="bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-lg modal-content overflow-hidden border border-white/10">
                <header className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Universal Scanner</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Supports QR & Industrial 1D Barcodes</p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white text-3xl transition">&times;</button>
                </header>

                <div className="p-8 space-y-8 flex flex-col items-center">
                    <div className="relative w-full aspect-square bg-black rounded-3xl overflow-hidden border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <div id={containerId} className="w-full h-full"></div>
                        
                        {/* Scanning Overlay UI */}
                        {isCameraActive && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                {/* Letterbox effect */}
                                <div className="absolute inset-0 border-x-[20px] border-y-[60px] border-black/60"></div>
                                
                                {/* Wide Target Frame for Barcodes */}
                                <div className="w-[80%] h-[35%] relative border-2 border-primary/40 rounded-2xl">
                                    {/* Corners */}
                                    <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                    <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                    <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                    <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                    
                                    {/* Vertical Scanning Bar Animation */}
                                    <div className="absolute left-1/2 -translate-x-1/2 w-[95%] h-0.5 bg-primary/80 shadow-[0_0_20px_#3b82f6] animate-[laser_1.8s_ease-in-out_infinite]"></div>
                                    
                                    <div className="absolute inset-0 bg-primary/5 animate-pulse"></div>
                                </div>
                            </div>
                        )}

                        {!isCameraActive && !error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(59,130,246,0.3)]"></div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Warming Up Optical Hub...</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 p-12 text-center">
                                <div className="space-y-6">
                                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                                        <i className="fas fa-video-slash text-4xl text-red-500"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white mb-2">Hardware Error</p>
                                        <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
                                    </div>
                                    <button 
                                        onClick={() => window.location.reload()}
                                        className="bg-red-500 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                                    >
                                        Re-initialize
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 text-center w-full">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                            <i className="fas fa-barcode text-primary"></i> 
                            Scanning Instructions
                        </p>
                        <p className="text-xs font-bold text-slate-300 leading-relaxed">
                            Position the tag inside the illuminated box. For long barcodes, hold the phone in landscape or move back slightly.
                        </p>
                    </div>
                </div>

                <footer className="p-8 border-t border-slate-800 flex justify-center bg-slate-950/20">
                    <button 
                        onClick={onClose}
                        className="px-12 py-4 font-black text-slate-400 hover:text-white transition uppercase tracking-widest text-[10px] border border-slate-700 rounded-2xl hover:border-slate-500"
                    >
                        Close Terminal
                    </button>
                </footer>
            </div>
            <style>{`
                @keyframes laser {
                    0% { top: 15%; opacity: 0.3; }
                    50% { top: 85%; opacity: 1; }
                    100% { top: 15%; opacity: 0.3; }
                }
            `}</style>
        </div>
    );
};

export default ScannerModal;