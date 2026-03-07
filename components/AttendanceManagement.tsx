
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AttendanceRecord, AttendanceStatus, Role, User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { logUserAction } from '../utils/auditLogger';
import useLocalStorage from '../hooks/useLocalStorage';
import { jsPDF } from 'jspdf';

interface AttendanceManagementProps {
    users?: User[];
}

const CameraCapture: React.FC<{ onCapture: (dataUrl: string) => void; onCancel: () => void; isOut?: boolean }> = ({ onCapture, onCancel, isOut }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isStreamReady, setIsStreamReady] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
                setStream(s);
                if (videoRef.current) {
                    videoRef.current.srcObject = s;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        setIsStreamReady(true);
                    };
                }
            } catch {
                // Camera access denied
                alert("Camera access denied. Please enable permissions in your browser settings.");
                onCancel();
            }
        };
        startCamera();
        return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
    }, [onCancel]);

    const capture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                onCapture(canvas.toDataURL('image/jpeg', 0.8));
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[200] p-4 backdrop-blur-xl">
            <div className="bg-white dark:bg-slate-900 rounded-[48px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b dark:border-slate-800 text-center">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white flex items-center justify-center gap-2">
                        <i className={`fas ${isOut ? 'fa-door-open' : 'fa-face-viewfinder'} ${isOut ? 'text-indigo-500' : 'text-primary'}`}></i>
                        {isOut ? 'Departure Check' : 'Face ID Verification'}
                    </h3>
                </div>
                <div className="relative aspect-square bg-slate-900 overflow-hidden">
                    <video ref={videoRef} className="w-full h-full object-cover mirror" playsInline muted></video>
                    <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none">
                         <div className={`w-full h-full border-2 rounded-full animate-pulse ${isOut ? 'border-indigo-500/50' : 'border-primary/50'}`}></div>
                    </div>
                </div>
                <div className="p-8 flex flex-col gap-4">
                    <button onClick={capture} disabled={!isStreamReady} className={`w-full text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 ${isOut ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-primary hover:bg-primary-hover'}`}>
                        <i className="fas fa-camera"></i> {isOut ? 'Log Punch Out' : 'Capture Identity'}
                    </button>
                    <button onClick={onCancel} className="w-full py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors">Discard</button>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
            <style>{`.mirror { transform: rotateY(180deg); }`}</style>
        </div>
    );
};

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ users = [] }) => {
    const { user, realUser } = useAuth();
    const [attendance, setAttendance] = useLocalStorage<AttendanceRecord[]>('vistaran-helpdesk-attendance', []);
    const [activeSubTab, setActiveSubTab] = useState<'live' | 'history'>('live');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [nameSortOrder, setNameSortOrder] = useState<'asc' | 'desc' | 'none'>('none');
    
    const [isPunching, setIsPunching] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const [capturedLocation, setCapturedLocation] = useState<{lat: number, lng: number} | null>(null);
    const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'failed'>('idle');
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
    
    const isAdmin = realUser?.role === Role.ADMIN || user?.role === Role.ADMIN;
    const todayStr = new Date().toISOString().split('T')[0];

    // UPDATED: Filter only Staff members for attendance monitoring
    const staffMembers = useMemo(() => users.filter(u => u.role === Role.STAFF), [users]);

    const todayRecord = useMemo(() => attendance.find(r => r.userId === user?.id && r.date === todayStr), [attendance, user, todayStr]);
    const isOutMode = !!(todayRecord && !todayRecord.checkOut);
    const isDayComplete = !!(todayRecord && todayRecord.checkOut);

    const fetchLocation = () => {
        setLocationStatus('fetching');
        if (!navigator.geolocation) {
            alert("GPRS/GPS is not supported by your browser.");
            setLocationStatus('failed');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCapturedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocationStatus('success');
            },
            (err) => {
                console.error("GPS System Failure:", err);
                setLocationStatus('failed');
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    const handleSelfPunch = async () => {
        if (!user || !capturedPhoto) return;
        setIsPunching(true);

        if (isOutMode && todayRecord) {
            // Updating existing record with Checkout info
            setAttendance(prev => prev.map(r => 
                r.id === todayRecord.id 
                    ? { 
                        ...r, 
                        checkOut: new Date().toISOString(), 
                        checkOutPhoto: capturedPhoto, 
                        checkOutLocation: capturedLocation ? { lat: capturedLocation.lat, lng: capturedLocation.lng } : undefined,
                        lastUpdated: new Date().toISOString()
                    } 
                    : r
            ));
            logUserAction(realUser || user, `Secure Selfie Check-Out: Logged departure successfully.`);
        } else {
            // Create new In record
            const newRecord: AttendanceRecord = { 
                id: `ATT-${Date.now()}`, 
                userId: user.id, 
                userName: user.name, 
                date: todayStr, 
                checkIn: new Date().toISOString(), 
                status: AttendanceStatus.PRESENT, 
                photo: capturedPhoto,
                location: capturedLocation ? { lat: capturedLocation.lat, lng: capturedLocation.lng } : undefined
            };
            setAttendance(prev => [newRecord, ...prev]);
            logUserAction(realUser || user, `Secure Selfie Check-In: Logged arrival successfully.`);
        }

        setIsPunching(false);
        setCapturedPhoto(null);
        setCapturedLocation(null);
        setLocationStatus('idle');
    };

    const handleMarkAttendanceAdmin = (staff: User, status: AttendanceStatus) => {
        if (!isAdmin) return;
        setAttendance(prev => {
            const existingIndex = prev.findIndex(r => r.userId === staff.id && r.date === todayStr);
            if (existingIndex !== -1) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], status, lastUpdated: new Date().toISOString(), notes: 'Admin Override' };
                return updated;
            }
            const newRecord: AttendanceRecord = {
                id: `ATT-${Date.now()}`,
                userId: staff.id,
                userName: staff.name,
                date: todayStr,
                checkIn: new Date().toISOString(),
                status: status,
                notes: 'Manual Admin Entry'
            };
            return [newRecord, ...prev];
        });
        logUserAction(realUser || user, `Administrative Override: Marked ${staff.name} as ${status}.`);
    };

    const handleUpdateRecord = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingRecord || !isAdmin) return;
        
        const formData = new FormData(e.currentTarget);
        const newDate = formData.get('editDate') as string;
        const newInTime = formData.get('editInTime') as string;
        const newOutTime = formData.get('editOutTime') as string;
        const newStatus = formData.get('editStatus') as AttendanceStatus;

        const updatedCheckIn = new Date(`${newDate}T${newInTime}`).toISOString();
        const updatedCheckOut = newOutTime ? new Date(`${newDate}T${newOutTime}`).toISOString() : undefined;

        setAttendance(prev => prev.map(r => 
            r.id === editingRecord.id 
                ? { 
                    ...r, 
                    date: newDate, 
                    checkIn: updatedCheckIn, 
                    checkOut: updatedCheckOut,
                    status: newStatus, 
                    lastUpdated: new Date().toISOString(), 
                    notes: 'Manual Modification' 
                } 
                : r
        ));

        logUserAction(realUser || user, `Database Modification: Updated record ${editingRecord.id} for ${editingRecord.userName}.`);
        setEditingRecord(null);
    };

    const historyData = useMemo(() => {
        const filtered = attendance.filter(r => r.date >= startDate && r.date <= endDate);
        
        if (nameSortOrder === 'none') return filtered;
        
        return [...filtered].sort((a, b) => {
            if (nameSortOrder === 'asc') {
                return a.userName.localeCompare(b.userName);
            } else {
                return b.userName.localeCompare(a.userName);
            }
        });
    }, [attendance, startDate, endDate, nameSortOrder]);

    const toggleNameSort = () => {
        setNameSortOrder(prev => {
            if (prev === 'none') return 'asc';
            if (prev === 'asc') return 'desc';
            return 'none';
        });
    };

    const handleExportCSV = () => {
        const headers = ["ID", "Staff", "Date", "In Time", "Out Time", "Status", "GPS In", "GPS Out", "Notes"];
        const rows = historyData.map(r => [
            r.id, r.userName, r.date, 
            new Date(r.checkIn).toLocaleTimeString(), 
            r.checkOut ? new Date(r.checkOut).toLocaleTimeString() : 'N/A',
            r.status, 
            r.location ? `${r.location.lat};${r.location.lng}` : '', 
            r.checkOutLocation ? `${r.checkOutLocation.lat};${r.checkOutLocation.lng}` : '',
            r.notes || ''
        ]);
        const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Attendance_Ledger_${startDate}_to_${endDate}.csv`;
        link.click();
    };

    const handleExportPDF = async () => {
        if (historyData.length === 0) return;
        setIsGeneratingPDF(true);
        
        try {
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            let currentY = 55;

            const drawHeader = (pageNum: number) => {
                pdf.setFillColor(15, 23, 42); // slate-900
                pdf.rect(0, 0, pageWidth, 45, 'F');
                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(20);
                pdf.setFont('helvetica', 'bold');
                pdf.text("Vistaran Staff Evidence Ledger", margin, 20);
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`ATTENDANCE AUDIT: ${startDate} TO ${endDate}`, margin, 28);
                pdf.text(`STAMP: ${new Date().toLocaleString()}`, margin, 34);
                pdf.text(`PAGE: ${pageNum}`, pageWidth - 30, 20);
                pdf.setFontSize(8);
                pdf.text("AUTHORIZED FOR PERSONNEL TRACKING & VERIFICATION", margin, 40);
            };

            const drawTableHeaders = (y: number) => {
                pdf.setFillColor(241, 245, 249);
                pdf.rect(margin, y, pageWidth - (margin * 2), 10, 'F');
                pdf.setTextColor(30, 41, 59);
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'bold');
                pdf.text("STAFF IDENTITY", margin + 5, y + 7);
                pdf.text("DATE & STATUS", margin + 55, y + 7);
                pdf.text("IN-PUNCH SELFIE", margin + 90, y + 7);
                pdf.text("OUT-PUNCH SELFIE", margin + 135, y + 7);
                return y + 10;
            };

            let pageNum = 1;
            drawHeader(pageNum);
            currentY = drawTableHeaders(currentY);

            for (let i = 0; i < historyData.length; i++) {
                const record = historyData[i];
                // Check for page break (Row height increased for photos)
                if (currentY + 30 > pageHeight - 20) {
                    pdf.addPage();
                    pageNum++;
                    drawHeader(pageNum);
                    currentY = drawTableHeaders(55);
                }

                if (i % 2 !== 0) {
                    pdf.setFillColor(252, 252, 252);
                    pdf.rect(margin, currentY, pageWidth - (margin * 2), 25, 'F');
                }

                // Text details
                pdf.setTextColor(30, 41, 59);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(8);
                pdf.text(record.userName.toUpperCase(), margin + 5, currentY + 8);
                
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(7);
                pdf.text(`Date: ${record.date}`, margin + 5, currentY + 13);
                pdf.text(`Status: ${record.status}`, margin + 5, currentY + 18);

                pdf.text(`Time: ${new Date(record.checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`, margin + 55, currentY + 8);
                pdf.text(`Exit: ${record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'ACTIVE'}`, margin + 55, currentY + 13);

                // Punch-In Photo
                if (record.photo) {
                    try {
                        pdf.addImage(record.photo, 'JPEG', margin + 90, currentY + 2, 21, 21);
                        pdf.setDrawColor(0);
                        pdf.setLineWidth(0.1);
                        pdf.rect(margin + 90, currentY + 2, 21, 21);
                    } catch {
                        // Ignore image errors
                    }
                } else {
                    pdf.setFontSize(6);
                    pdf.setTextColor(150);
                    pdf.text("NO IN-PHOTO", margin + 90, currentY + 12);
                }

                // Punch-Out Photo
                if (record.checkOutPhoto) {
                    try {
                        pdf.addImage(record.checkOutPhoto, 'JPEG', margin + 135, currentY + 2, 21, 21);
                        pdf.setDrawColor(0);
                        pdf.setLineWidth(0.1);
                        pdf.rect(margin + 135, currentY + 2, 21, 21);
                    } catch {
                        // Ignore image errors
                    }
                } else {
                    pdf.setFontSize(6);
                    pdf.setTextColor(150);
                    pdf.text(record.checkOut ? "NO OUT-PHOTO" : "SHIFT ACTIVE", margin + 135, currentY + 12);
                }

                currentY += 25;
            }

            pdf.save(`Vistaran_Staff_Visual_Ledger_${startDate}_${endDate}.pdf`);
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-24">
            {showCamera && <CameraCapture isOut={isOutMode} onCapture={photo => { setCapturedPhoto(photo); setShowCamera(false); fetchLocation(); }} onCancel={() => setShowCamera(false)} />}
            
            <header className="flex flex-col md:flex-row justify-between md:items-end gap-6 no-print">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter leading-none">Staff Registry</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                        Unified Evidence-Based Attendance
                    </p>
                </div>
                
                {isAdmin && (
                    <nav className="flex p-1 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
                        <button onClick={() => setActiveSubTab('live')} className={`px-10 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeSubTab === 'live' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Live Terminal</button>
                        <button onClick={() => setActiveSubTab('history')} className={`px-10 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${activeSubTab === 'history' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Ledger History</button>
                    </nav>
                )}
            </header>

            {activeSubTab === 'live' ? (
                <div className="space-y-10 animate-in fade-in duration-500">
                    {isAdmin ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {staffMembers.map(staff => {
                                const record = attendance.find(r => r.userId === staff.id && r.date === todayStr);
                                return (
                                    <div key={staff.id} className={`bg-white dark:bg-slate-800 p-6 rounded-[35px] shadow-xl border-2 transition-all group ${record ? 'border-emerald-500/20' : 'border-slate-50 dark:border-slate-800'}`}>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="relative">
                                                <img src={staff.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}&background=random`} className="w-14 h-14 rounded-2xl object-cover border-2 dark:border-slate-600 shadow-lg" alt="" />
                                                {record?.checkOut && <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] text-white shadow-lg"><i className="fas fa-home"></i></div>}
                                                {record && !record.checkOut && <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] text-white shadow-lg"><i className="fas fa-check"></i></div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter truncate leading-tight">{staff.name}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{staff.department}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {record ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="grid grid-cols-2 gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border dark:border-slate-700">
                                                        <div className="border-r dark:border-slate-800 pr-2">
                                                            <p className="text-[7px] font-black text-slate-400 uppercase">In Time</p>
                                                            <p className="text-[10px] font-black text-primary">{new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                        <div className="pl-1">
                                                            <p className="text-[7px] font-black text-slate-400 uppercase">Out Time</p>
                                                            <p className={`text-[10px] font-black ${record.checkOut ? 'text-indigo-500' : 'text-slate-300 italic'}`}>
                                                                {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1">
                                                        <button onClick={() => handleMarkAttendanceAdmin(staff, AttendanceStatus.PRESENT)} className={`py-2 rounded-lg text-[8px] font-black uppercase border transition-all ${record.status === AttendanceStatus.PRESENT ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white text-slate-400'}`}>Present</button>
                                                        <button onClick={() => handleMarkAttendanceAdmin(staff, AttendanceStatus.LATE)} className={`py-2 rounded-lg text-[8px] font-black uppercase border transition-all ${record.status === AttendanceStatus.LATE ? 'bg-amber-500 border-amber-500 text-white shadow-lg' : 'bg-white text-slate-400'}`}>Late</button>
                                                        <button onClick={() => handleMarkAttendanceAdmin(staff, AttendanceStatus.ABSENT)} className={`py-2 rounded-lg text-[8px] font-black uppercase border transition-all ${record.status === AttendanceStatus.ABSENT ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white text-slate-400'}`}>Absent</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2">
                                                     <button onClick={() => handleMarkAttendanceAdmin(staff, AttendanceStatus.PRESENT)} className="py-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 font-black text-[9px] uppercase hover:bg-emerald-50 hover:text-emerald-600 transition-all tracking-widest">Mark Present</button>
                                                     <button onClick={() => handleMarkAttendanceAdmin(staff, AttendanceStatus.ABSENT)} className="py-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 font-black text-[9px] uppercase hover:bg-rose-50 hover:text-rose-600 transition-all tracking-widest">Mark Absent</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-12 rounded-[50px] shadow-2xl border border-slate-100 dark:border-slate-700 text-center flex flex-col items-center gap-10">
                            {!isDayComplete ? (
                                <>
                                    <div className="space-y-4">
                                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 ${isOutMode ? 'bg-indigo-50 text-indigo-500' : 'bg-primary/10 text-primary'}`}>
                                            <i className={`fas ${isOutMode ? 'fa-door-open' : 'fa-shield-halved'}`}></i>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                            {isOutMode ? 'Home Time Check-Out' : 'Arrival Check-In'}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] max-w-sm">
                                            {isOutMode ? 'Log your departure time to complete your attendance record for today.' : 'Face verification and GPRS positioning are required for authorized presence reporting.'}
                                        </p>
                                        
                                        <div className="flex items-center justify-center gap-4 py-4">
                                            <div className={`w-3 h-3 rounded-full ${todayRecord ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                                            <div className={`h-1 w-12 rounded-full ${todayRecord ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
                                            <div className={`w-3 h-3 rounded-full ${isDayComplete ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                                        </div>
                                    </div>

                                    {!capturedPhoto ? (
                                        <button onClick={() => setShowCamera(true)} className={`text-white font-black px-16 py-6 rounded-[30px] shadow-2xl active:scale-95 transition-all uppercase tracking-[0.2em] text-sm flex items-center gap-4 ${isOutMode ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30' : 'bg-primary hover:bg-primary-hover shadow-primary/30'}`}>
                                            <i className="fas fa-camera text-xl"></i>
                                            {isOutMode ? 'Proceed to Out-Punch' : 'Start In-Punch'}
                                        </button>
                                    ) : (
                                        <div className="w-full space-y-6 animate-in zoom-in-95">
                                            <div className={`relative w-40 h-40 mx-auto rounded-3xl overflow-hidden border-4 shadow-2xl ${isOutMode ? 'border-indigo-500 shadow-indigo-500/20' : 'border-emerald-500 shadow-emerald-500/20'}`}>
                                                <img src={capturedPhoto} className="w-full h-full object-cover mirror" alt="" />
                                                <div className={`absolute inset-0 flex items-center justify-center ${isOutMode ? 'bg-indigo-500/10' : 'bg-emerald-500/10'}`}>
                                                    <i className={`fas ${isOutMode ? 'fa-sign-out' : 'fa-check-circle'} text-white text-4xl`}></i>
                                                </div>
                                            </div>
                                            
                                            <div className={`p-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${locationStatus === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                                <i className={`fas ${locationStatus === 'fetching' ? 'fa-spinner fa-spin' : 'fa-location-dot'}`}></i>
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {locationStatus === 'fetching' ? 'Acquiring GPS Signal...' : 
                                                     locationStatus === 'success' ? 'GPRS Coordinates Identified' : 
                                                     locationStatus === 'failed' ? 'GPS Signal Blocked' : 'Waiting for GPS'}
                                                </span>
                                            </div>

                                            <button onClick={handleSelfPunch} disabled={isPunching || locationStatus !== 'success'} className={`w-full text-white font-black py-6 rounded-[30px] shadow-2xl active:scale-95 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-30 ${isOutMode ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-emerald-600 shadow-emerald-600/20'}`}>
                                                {isOutMode ? 'Confirm Day Closing' : 'Confirm Presence Protocol'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="space-y-8 animate-in zoom-in-95">
                                    <div className="w-32 h-32 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-5xl mx-auto shadow-inner">
                                        <i className="fas fa-check-double"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Day Complete</h3>
                                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Both arrival and departure punches have been verified.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 w-full">
                                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">In-Stamp</p>
                                            <p className="text-sm font-mono font-black text-primary uppercase mt-1">
                                                {new Date(todayRecord?.checkIn || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border dark:border-slate-700">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Out-Stamp</p>
                                            <p className="text-sm font-mono font-black text-indigo-500 uppercase mt-1">
                                                {new Date(todayRecord?.checkOut || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-10 animate-in fade-in duration-500 pb-20">
                    <div className="flex flex-wrap items-center justify-center gap-6 bg-white dark:bg-slate-800 p-10 rounded-[45px] shadow-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-1">Timeline Start</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-900 font-black outline-none focus:border-primary transition-all text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-4 mb-1">Timeline End</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-900 font-black outline-none focus:border-primary transition-all text-sm" />
                        </div>
                        <div className="flex items-end gap-3 pt-5">
                            <button onClick={handleExportCSV} className="bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                <i className="fas fa-file-excel"></i> Export CSV
                            </button>
                            <button onClick={handleExportPDF} disabled={isGeneratingPDF} className="bg-rose-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl hover:bg-rose-700 transition-all flex items-center gap-2 uppercase tracking-widest text-[10px] disabled:opacity-50">
                                <i className={isGeneratingPDF ? "fas fa-spinner fa-spin" : "fas fa-file-pdf"}></i> {isGeneratingPDF ? 'Compiling Visuals...' : 'PDF Visual Ledger'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-[45px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                                <thead className="bg-slate-50/50 dark:bg-slate-900/50">
                                    <tr>
                                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest cursor-pointer hover:text-primary transition-colors select-none" onClick={toggleNameSort}>
                                            <div className="flex items-center gap-2">
                                                Personnel Identity
                                                <i className={`fas ${nameSortOrder === 'asc' ? 'fa-sort-alpha-down' : nameSortOrder === 'desc' ? 'fa-sort-alpha-up' : 'fa-sort'} text-[12px] opacity-60`}></i>
                                            </div>
                                        </th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">In-Evidence</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase text-slate-400 tracking-widest">Out-Evidence</th>
                                        <th className="px-8 py-6 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                                        <th className="px-8 py-6 text-right text-[10px] font-black uppercase text-slate-400 tracking-widest">Hub</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {historyData.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden border dark:border-slate-700 shadow-sm">
                                                        <img src={r.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.userName)}&background=random`} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-tight">{r.userName}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{r.date}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    {r.photo && <img src={r.photo} className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-md" alt="In" />}
                                                    <p className="text-[9px] font-bold text-primary uppercase">{new Date(r.checkIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {r.checkOut ? (
                                                    <div className="flex items-center gap-3">
                                                        {r.checkOutPhoto && <img src={r.checkOutPhoto} className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-md" alt="Out" />}
                                                        <p className="text-[9px] font-bold text-indigo-500 uppercase">{new Date(r.checkOut).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-black text-slate-300 uppercase italic">On Duty</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                                    r.status === AttendanceStatus.PRESENT ? 'bg-emerald-100 text-emerald-600' :
                                                    r.status === AttendanceStatus.LATE ? 'bg-amber-100 text-amber-600' :
                                                    'bg-rose-100 text-rose-600'
                                                }`}>{r.status}</span>
                                            </td>
                                            <td className="px-8 py-6 text-right opacity-40 group-hover:opacity-100 transition-opacity">
                                                {isAdmin && (
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={() => setEditingRecord(r)} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition" title="Modify Record"><i className="fas fa-edit"></i></button>
                                                        <button onClick={() => { if(confirm('Delete record?')) setAttendance(prev => prev.filter(att => att.id !== r.id)) }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Purge Record"><i className="fas fa-trash-alt"></i></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Modification Hub */}
            {editingRecord && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[250] p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-[45px] shadow-2xl w-full max-w-lg modal-content overflow-hidden border border-white/10 my-auto">
                        <header className="p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Admin override</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Personnel: {editingRecord.userName}</p>
                            </div>
                            <button onClick={() => setEditingRecord(null)} className="text-slate-400 hover:text-red-500 text-3xl transition-all">&times;</button>
                        </header>
                        
                        <form onSubmit={handleUpdateRecord} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Shift Date</label>
                                    <input name="editDate" type="date" defaultValue={editingRecord.date} required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">In Time</label>
                                        <input name="editInTime" type="time" defaultValue={new Date(editingRecord.checkIn).toLocaleTimeString('it-IT').slice(0, 5)} required className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Out Time</label>
                                        <input name="editOutTime" type="time" defaultValue={editingRecord.checkOut ? new Date(editingRecord.checkOut).toLocaleTimeString('it-IT').slice(0, 5) : ''} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Presence State</label>
                                <select name="editStatus" defaultValue={editingRecord.status} className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 font-bold text-sm outline-none">
                                    {Object.values(AttendanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <button type="submit" className="w-full bg-primary text-white font-black py-5 rounded-2xl shadow-xl hover:bg-primary-hover active:scale-95 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3">
                                <i className="fas fa-cloud-upload"></i> Commit database changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Compiled PDF Generator Overlay */}
            {isGeneratingPDF && (
                <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[300] backdrop-blur-xl">
                    <div className="bg-white p-16 rounded-[60px] text-center space-y-8 shadow-2xl max-w-sm">
                        <div className="w-24 h-24 border-8 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <div>
                            <h5 className="font-black text-2xl uppercase tracking-tighter text-slate-800">Compiling Visual Ledger</h5>
                            <p className="font-bold text-slate-400 uppercase tracking-[0.3em] text-[10px] mt-2">Embedding Photo Evidence...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceManagement;
