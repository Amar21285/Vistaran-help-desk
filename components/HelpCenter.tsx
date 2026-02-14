import React, { useState, useMemo } from 'react';
import { FAQItem } from '../types';
import { FAQ_DATA } from '../constants';

const TroubleshootingStep: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800 transition hover:border-primary/30">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-black text-sm shadow-lg shadow-primary/20">
            {number}
        </div>
        <div>
            <h5 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wider mb-1">{title}</h5>
            <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {children}
            </div>
        </div>
    </div>
);

const CategoryCard: React.FC<{ icon: string; title: string; color: string; onClick: () => void; isActive: boolean }> = ({ icon, title, color, onClick, isActive }) => (
    <button 
        onClick={onClick}
        className={`p-6 rounded-2xl border-2 transition-all text-left flex flex-col gap-4 shadow-sm hover:shadow-md active:scale-95 ${isActive ? `border-primary bg-primary/5 ring-4 ring-primary/10` : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800'}`}
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>
            <i className={`fas ${icon}`}></i>
        </div>
        <div>
            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm">{title}</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Browse Topics</p>
        </div>
    </button>
);

const AccordionItem: React.FC<{ item: FAQItem }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${isOpen ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-5 px-4 flex justify-between items-center text-left focus:outline-none group"
            >
                <span className={`font-bold text-sm transition-colors ${isOpen ? 'text-primary' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900'}`}>{item.question}</span>
                <i className={`fas fa-chevron-down transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-slate-300'}`}></i>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] pb-6 px-4' : 'max-h-0'}`}>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-inner">
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                        {item.answer}
                    </p>
                </div>
            </div>
        </div>
    );
};

const HelpCenter: React.FC = () => {
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'faq' | 'troubleshoot'>('faq');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filteredFAQs = useMemo(() => {
        let results = FAQ_DATA;
        if (selectedCategory) {
            results = results.filter(f => f.category === selectedCategory);
        }
        if (search) {
            const lower = search.toLowerCase();
            results = results.filter(f => 
                f.question.toLowerCase().includes(lower) || 
                f.answer.toLowerCase().includes(lower) ||
                f.category.toLowerCase().includes(lower)
            );
        }
        return results;
    }, [search, selectedCategory]);

    const categories = Array.from(new Set(FAQ_DATA.map(f => f.category))).sort();

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-24">
            {/* Premium Hero Section */}
            <header className="relative py-16 px-6 rounded-3xl overflow-hidden bg-slate-900 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
                    <i className="fas fa-question-circle text-[200px] -rotate-12 translate-x-20"></i>
                </div>
                <div className="relative z-10 text-center space-y-6 max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                        Vistaran Knowledge Base
                    </h2>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs md:text-sm">
                        Find instant solutions to technical and operational hurdles.
                    </p>
                    <div className="relative group max-w-xl mx-auto pt-4">
                        <div className="absolute inset-0 bg-primary/20 blur-xl group-focus-within:blur-2xl transition-all"></div>
                        <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 z-10"></i>
                        <input
                            type="text"
                            placeholder="Search help topics (e.g. 'printer jam', 'wifi password')..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="relative w-full pl-14 pr-6 py-5 rounded-2xl border-0 bg-white/10 backdrop-blur-md focus:bg-white focus:text-slate-900 transition-all shadow-lg text-lg outline-none placeholder-slate-500"
                        />
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                        {['Reset Password', 'Printer Jam', 'CCTV Offline', 'New Ticket'].map(tag => (
                            <button 
                                key={tag}
                                onClick={() => setSearch(tag)}
                                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <nav className="flex justify-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mx-auto shadow-inner border dark:border-slate-700">
                <button 
                    onClick={() => setActiveTab('faq')}
                    className={`px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'faq' ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="fas fa-list-ul mr-2"></i> FAQ Library
                </button>
                <button 
                    onClick={() => setActiveTab('troubleshoot')}
                    className={`px-10 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'troubleshoot' ? 'bg-white dark:bg-slate-700 text-primary shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <i className="fas fa-wrench mr-2"></i> Troubleshooting
                </button>
            </nav>

            {activeTab === 'faq' ? (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <CategoryCard 
                            icon="fa-globe" title="All Topics" color="bg-slate-100 text-slate-600" 
                            isActive={selectedCategory === null} onClick={() => setSelectedCategory(null)} 
                        />
                        <CategoryCard 
                            icon="fa-microchip" title="Technical" color="bg-blue-100 text-blue-600" 
                            isActive={selectedCategory === 'Technical'} onClick={() => setSelectedCategory('Technical')} 
                        />
                        <CategoryCard 
                            icon="fa-boxes" title="Operations" color="bg-emerald-100 text-emerald-600" 
                            isActive={selectedCategory === 'Operations'} onClick={() => setSelectedCategory('Operations')} 
                        />
                        <CategoryCard 
                            icon="fa-user-lock" title="Account" color="bg-rose-100 text-rose-600" 
                            isActive={selectedCategory === 'Account'} onClick={() => setSelectedCategory('Account')} 
                        />
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <i className="fas fa-book-open text-primary"></i>
                                {selectedCategory || 'Consolidated Documentation'}
                            </h3>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredFAQs.length} Results</span>
                        </div>
                        <div className="divide-y dark:divide-slate-700">
                            {filteredFAQs.map((item, idx) => (
                                <AccordionItem key={idx} item={item} />
                            ))}
                        </div>
                        {filteredFAQs.length === 0 && (
                            <div className="p-20 text-center space-y-4">
                                <i className="fas fa-search-minus text-5xl opacity-10"></i>
                                <p className="font-black text-slate-400 uppercase tracking-tighter text-xl">No Matching Topics Found</p>
                                <button 
                                    onClick={() => {setSearch(''); setSelectedCategory(null);}} 
                                    className="text-primary font-bold hover:underline"
                                >
                                    Clear all filters and search again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <article className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 space-y-8 flex flex-col">
                        <header className="flex items-center gap-5 border-b dark:border-slate-700 pb-6">
                            <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-3xl text-blue-600">
                                <i className="fas fa-network-wired"></i>
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Connectivity Troubleshooting</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Network & VPN Support</p>
                            </div>
                        </header>
                        <div className="space-y-4 flex-1">
                            <TroubleshootingStep number={1} title="Cable Check">
                                Ensure the Ethernet cable (Blue/Gray) is firmly clicked into the laptop/PC and the wall port.
                            </TroubleshootingStep>
                            <TroubleshootingStep number={2} title="Wi-Fi Gateway">
                                Toggle your device Wi-Fi OFF for 5 seconds, then reconnect to <strong>Vistaran_Internal</strong>.
                            </TroubleshootingStep>
                            <TroubleshootingStep number={3} title="Identity Refresh">
                                Open Command Prompt (CMD) and run <code>ipconfig /renew</code> to refresh your server lease.
                            </TroubleshootingStep>
                            <TroubleshootingStep number={4} title="Escalation">
                                If connectivity persists after restart, create a <strong>URGENT</strong> ticket for IT Dept.
                            </TroubleshootingStep>
                        </div>
                        <button className="w-full py-4 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-100 transition border border-slate-100 dark:border-slate-800">
                            Download PDF Guide
                        </button>
                    </article>

                    <article className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 space-y-8 flex flex-col">
                        <header className="flex items-center gap-5 border-b dark:border-slate-700 pb-6">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-3xl text-indigo-600">
                                <i className="fas fa-video"></i>
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">CCTV & Security Feed</h4>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Hardware & DVR Maintenance</p>
                            </div>
                        </header>
                        <div className="space-y-4 flex-1">
                            <TroubleshootingStep number={1} title="DVR Status">
                                Check if the main DVR unit has a glowing blue/green power light. If red, power cycle the unit.
                            </TroubleshootingStep>
                            <TroubleshootingStep number={2} title="Power Supply Unit">
                                Verify the 4/8/16 channel power adapter is plugged in. Check for loose DC pins behind the unit.
                            </TroubleshootingStep>
                            <TroubleshootingStep number={3} title="Connector Check">
                                Gently tighten the BNC (Silver) connectors on the back of the DVR if a specific channel is "No Signal".
                            </TroubleshootingStep>
                            <TroubleshootingStep number={4} title="Hard Drive Error">
                                If the DVR is beeping, the hard drive may be full or faulty. Notify IT Admin immediately.
                            </TroubleshootingStep>
                        </div>
                         <button className="w-full py-4 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-100 transition border border-slate-100 dark:border-slate-800">
                            View Instructional Video
                        </button>
                    </article>
                </div>
            )}

            <footer className="bg-gradient-to-br from-primary to-blue-600 p-12 rounded-[40px] text-center space-y-6 shadow-2xl shadow-primary/30 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32 blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-black rounded-full translate-x-32 translate-y-32 blur-3xl"></div>
                </div>
                <div className="relative z-10">
                    <h4 className="text-3xl font-black uppercase tracking-tighter">Still Encountering Friction?</h4>
                    <p className="text-white/80 font-medium max-w-xl mx-auto">
                        Our specialized technician task force is standing by. We aim to resolve all standard requests within the defined SLA parameters.
                    </p>
                    <div className="flex justify-center gap-4 pt-4">
                        <button 
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="bg-white text-primary font-black px-10 py-4 rounded-2xl hover:scale-105 transition-all shadow-xl text-sm uppercase tracking-widest"
                        >
                            Open Support Ticket
                        </button>
                        <a 
                            href="mailto:ITsupport@vistaran.in"
                            className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-black px-10 py-4 rounded-2xl hover:bg-white/20 transition-all text-sm uppercase tracking-widest"
                        >
                            Direct Email
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HelpCenter;