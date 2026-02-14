
import React, { useState, useRef } from 'react';
import { BranchLocation, Role } from '../types';
import { useAuth } from '../hooks/useAuth';
import { logUserAction } from '../utils/auditLogger';

interface BranchHubProps {
    branches: BranchLocation[];
    setBranches: React.Dispatch<React.SetStateAction<BranchLocation[]>>;
}

const BranchHub: React.FC<BranchHubProps> = ({ branches, setBranches }) => {
    const { user, realUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingBranch, setViewingBranch] = useState<BranchLocation | null>(null);
    const [editingBranch, setEditingBranch] = useState<BranchLocation | null>(null);
    const [branchToDelete, setBranchToDelete] = useState<BranchLocation | null>(null);
    const [branchPhoto, setBranchPhoto] = useState<string>('');
    const photoInputRef = useRef<HTMLInputElement>(null);
    const isAdmin = realUser?.role === Role.ADMIN || user?.role === Role.ADMIN;

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setBranchPhoto(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data: BranchLocation = {
            id: editingBranch?.id || `BR${Date.now()}`,
            name: fd.get('name') as string,
            code: fd.get('code') as string,
            address: fd.get('address') as string,
            managerName: fd.get('manager') as string,
            phone: fd.get('phone') as string,
            email: fd.get('email') as string,
            googleMapsUrl: fd.get('mapUrl') as string || '',
            photoUrl: branchPhoto
        };

        if (editingBranch) {
            setBranches(prev => prev.map(b => b.id === editingBranch.id ? data : b));
            logUserAction(realUser || user, `Updated branch: ${data.name}`);
        } else {
            setBranches(prev => [...prev, data]);
            logUserAction(realUser || user, `Registered new branch: ${data.name}`);
        }
        setIsModalOpen(false);
        setBranchPhoto('');
    };

    const confirmDeleteBranch = () => {
        if (!branchToDelete) return;
        setBranches(prev => prev.filter(b => b.id !== branchToDelete.id));
        logUserAction(realUser || user, `Deleted branch: ${branchToDelete.id}`);
        setBranchToDelete(null);
    };

    const getPublicMapUrl = (address: string) => {
        return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
    };

    const openEdit = (branch: BranchLocation) => {
        setEditingBranch(branch);
        setBranchPhoto(branch.photoUrl || '');
        setIsModalOpen(true);
    };

    const openCreate = () => {
        setEditingBranch(null);
        setBranchPhoto('');
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-center no-print bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-20 translate-x-20"></div>
                <div className="relative z-10">
                    <h2 className="text-4xl font-black uppercase tracking-tighter leading-none">Fleet Network</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                        <i className="fas fa-map-location-dot text-primary"></i>
                        Business Presence & Geographical Hub
                    </p>
                </div>
                <div className="relative z-10">
                    <button 
                        onClick={openCreate}
                        className="bg-primary text-white font-black px-8 py-4 rounded-2xl shadow-xl hover:bg-primary-hover active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                        <i className="fas fa-plus"></i> Register New Location
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {branches.map(branch => (
                    <div key={branch.id} className="bg-white dark:bg-slate-800 rounded-[35px] shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:shadow-2xl transition-all group">
                        <div className="h-52 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
                            {branch.photoUrl ? (
                                <img src={branch.photoUrl} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt={branch.name} />
                            ) : (
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    frameBorder="0" 
                                    scrolling="no" 
                                    marginHeight={0} 
                                    marginWidth={0} 
                                    src={getPublicMapUrl(branch.address)}
                                    className="grayscale hover:grayscale-0 transition-all duration-700 opacity-60 group-hover:opacity-100"
                                ></iframe>
                            )}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => openEdit(branch)} className="w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"><i className="fas fa-edit text-xs"></i></button>
                                <button onClick={() => setBranchToDelete(branch)} className="w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-white transition-all"><i className="fas fa-trash text-xs"></i></button>
                            </div>
                            <div className="absolute bottom-4 left-4">
                                <span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-mono font-black text-[10px] tracking-tighter shadow-lg">#{branch.code}</span>
                            </div>
                            {branch.photoUrl && (
                                <div className="absolute bottom-4 right-4">
                                    <div className="w-8 h-8 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-lg"><i className="fas fa-image text-[10px]"></i></div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h4 className="font-black text-xl text-slate-800 dark:text-white uppercase tracking-tighter leading-tight">{branch.name}</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 truncate">{branch.address}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-slate-700">
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Manager</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{branch.managerName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{branch.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button 
                                    onClick={() => setViewingBranch(branch)}
                                    className="flex-1 bg-slate-900 text-white font-black py-3 rounded-xl text-[9px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-expand"></i> Full View
                                </button>
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-primary text-white font-black py-3 rounded-xl text-[9px] uppercase tracking-widest hover:bg-primary-hover transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fas fa-location-arrow"></i> Navigate
                                </a>
                            </div>
                        </div>
                    </div>
                ))}

                {branches.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] italic opacity-20">
                        No Branches Registered in Hub
                    </div>
                )}
            </div>

            {/* View Modal */}
            {viewingBranch && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex justify-center items-center z-[200] p-4 overflow-y-auto">
                    <div className="bg-white rounded-[50px] w-full max-w-5xl overflow-hidden flex flex-col shadow-2xl my-auto border-[10px] border-white">
                        <div className="h-[500px] w-full relative grid grid-cols-1 md:grid-cols-2">
                            <div className="bg-slate-900 overflow-hidden relative border-r-4 border-white">
                                {viewingBranch.photoUrl ? (
                                    <img src={viewingBranch.photoUrl} className="w-full h-full object-cover" alt={viewingBranch.name} />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                                        <i className="fas fa-image text-6xl mb-4"></i>
                                        <p className="font-black uppercase tracking-widest text-[10px]">No Photo Available</p>
                                    </div>
                                )}
                                <div className="absolute bottom-6 left-6 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl text-white font-black text-[10px] uppercase tracking-widest">Branch Live View</div>
                            </div>
                            <div className="bg-slate-200">
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    frameBorder="0" 
                                    scrolling="no" 
                                    marginHeight={0} 
                                    marginWidth={0} 
                                    src={getPublicMapUrl(viewingBranch.address)}
                                ></iframe>
                            </div>
                            <button onClick={() => setViewingBranch(null)} className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center text-slate-800 text-2xl font-black hover:text-rose-500 transition-all z-20">&times;</button>
                        </div>
                        <div className="p-10 bg-white grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div>
                                <span className="bg-primary/10 text-primary px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">Branch ID: {viewingBranch.code}</span>
                                <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mt-4 leading-none">{viewingBranch.name}</h3>
                                <p className="text-lg font-bold text-slate-500 mt-4 leading-relaxed">{viewingBranch.address}</p>
                            </div>
                            <div className="space-y-6">
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-primary"><i className="fas fa-user-tie"></i></div>
                                        <div><p className="text-[9px] font-black text-slate-400 uppercase">Site Manager</p><p className="font-black text-slate-800 uppercase">{viewingBranch.managerName || 'Pending'}</p></div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-primary"><i className="fas fa-phone"></i></div>
                                        <div><p className="text-[9px] font-black text-slate-400 uppercase">Operational Hotline</p><p className="font-black text-slate-800">{viewingBranch.phone || 'N/A'}</p></div>
                                    </div>
                                </div>
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingBranch.address)}`} 
                                    target="_blank" 
                                    className="w-full bg-primary text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    <i className="fas fa-directions"></i> Open in Google Maps App
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[200] p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-[45px] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/10 my-auto">
                        <header className="p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">{editingBranch ? 'Modify Location' : 'Register Location'}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Network Expansion Registry</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 text-3xl transition-all">&times;</button>
                        </header>
                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest ml-1">Branch Identity Photo</label>
                                    <div 
                                        onClick={() => photoInputRef.current?.click()}
                                        className={`relative h-44 rounded-[30px] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer group overflow-hidden ${branchPhoto ? 'border-emerald-500/50 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-primary/50'}`}
                                    >
                                        <input type="file" ref={photoInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
                                        {branchPhoto ? (
                                            <>
                                                <img src={branchPhoto} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Preview" />
                                                <div className="relative z-10 bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-full text-white font-black text-[9px] uppercase tracking-widest border border-white/10 flex items-center gap-2 group-hover:scale-110 transition-all">
                                                    <i className="fas fa-sync"></i> Change Location Photo
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={(e) => { e.stopPropagation(); setBranchPhoto(''); }}
                                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                                                >
                                                    <i className="fas fa-times text-xs"></i>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-700 shadow-xl flex items-center justify-center text-slate-400 group-hover:text-primary transition-all mb-2">
                                                    <i className="fas fa-camera text-xl"></i>
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Click to upload branch image</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest ml-1">Location Name *</label>
                                    <input name="name" defaultValue={editingBranch?.name} required placeholder="e.g. Bhandup Prime Hub" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold outline-none text-sm focus:ring-4 focus:ring-primary/10 transition-all shadow-inner" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest ml-1">Branch Code</label>
                                    <input name="code" defaultValue={editingBranch?.code} required placeholder="e.g. 021" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-black outline-none text-sm shadow-inner" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest ml-1">Site Manager</label>
                                    <input name="manager" defaultValue={editingBranch?.managerName} placeholder="Full Name" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold outline-none text-sm" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest ml-1">Full Physical Address *</label>
                                    <textarea name="address" defaultValue={editingBranch?.address} required rows={3} placeholder="Complete address for GPS mapping..." className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold outline-none text-sm shadow-inner resize-none"></textarea>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest ml-1">Hotline / Phone</label>
                                    <input name="phone" defaultValue={editingBranch?.phone} placeholder="Contact number" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest ml-1">Official Email</label>
                                    <input name="email" defaultValue={editingBranch?.email} type="email" placeholder="branch@vistaran.in" className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl dark:bg-slate-800 font-bold outline-none text-sm" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-primary text-white font-black py-6 rounded-3xl uppercase shadow-2xl hover:bg-primary-hover active:scale-95 transition-all text-xs tracking-[0.2em] shadow-primary/30">
                                <i className="fas fa-map-pin mr-2"></i> Commit to Network Hub
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE BRANCH CONFIRMATION */}
            {branchToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[300] p-4 modal-backdrop">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 w-full max-w-md text-center modal-content border border-white/10">
                        <div className="text-red-500 mb-4"><i className="fas fa-map-location-dot fa-3x"></i></div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">Confirm Decommission</h2>
                        <p className="text-slate-600 dark:text-slate-300 my-4 text-sm font-medium">Are you sure you want to permanently remove the branch <strong className="font-semibold">{branchToDelete.name}</strong> from the network registry?<br /><strong className="text-red-600">This action is irreversible.</strong></p>
                        <div className="flex justify-center gap-4 mt-8">
                            <button onClick={() => setBranchToDelete(null)} className="bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl hover:bg-slate-300 transition text-xs uppercase tracking-widest">Cancel</button>
                            <button onClick={confirmDeleteBranch} className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition text-xs uppercase tracking-widest shadow-lg shadow-red-500/20">Decommission Site</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchHub;
