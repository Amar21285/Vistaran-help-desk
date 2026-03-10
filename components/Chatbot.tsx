import React, { useState, useRef, useEffect, FormEvent, useCallback, useMemo } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { decode, decodeAudioData, encode } from '../utils/audio';
import { FAQ_DATA, SYMPTOMS } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { Ticket } from '../types';

const AUTO_MINIMIZE_TIMEOUT = 60000;

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isStreaming?: boolean;
}

interface ChatTurn {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface ChatbotProps {
    currentView?: string;
    activeTicket?: Ticket | null;
}

const VIEW_BASED_CHIPS: Record<string, string[]> = {
    'dashboard': ["Analyze metrics", "Efficiency trends"],
    'tickets': ["Search ID", "SLA check"],
    'create-ticket': ["Writing help", "Category guide"],
    'inventory': ["Stock check", "Asset tags"],
    'attendance': ["GPS fix", "Punch protocol"]
};

const Chatbot: React.FC<ChatbotProps> = ({ currentView, activeTicket }) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', sender: 'ai', text: "Hello! I'm your Vistaran AI Assistant. How can I help you today?" }
    ]);
    const [history, setHistory] = useState<ChatTurn[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isTtsEnabled, setIsTtsEnabled] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isLiveActive, setIsLiveActive] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const recognitionRef = useRef<any>(null);
    const liveSessionRef = useRef<any>(null);
    const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // --- TTS Sanitization Helper ---
    const sanitizeForTts = (text: string) => {
        if (!text) return "";
        return text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove Markdown links but keep text
            .replace(/[*#_~`>|]/g, ' ')               // Remove common Markdown characters
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Remove Emojis
            .replace(/[^\x00-\x7F]/g, "")           // Remove non-ASCII
            .replace(/\s+/g, ' ')                    // Normalize whitespace
            .trim()
            .substring(0, 1000);                     // Limit length to avoid backend issues
    };

    const quickChips = useMemo(() => {
        if (activeTicket) return ["Summarize Incident", "Fix suggestion", "Suggest reply"];
        return (currentView && VIEW_BASED_CHIPS[currentView]) || ["New ticket", "Office Wi-Fi", "SLA Policy"];
    }, [currentView, activeTicket]);

    const initAudioContext = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    };

    const resetAutoMinimizeTimer = useCallback(() => {
        if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
        if (isOpen && !isLoading && !isLiveMode) {
            autoCloseTimerRef.current = setTimeout(() => setIsOpen(false), AUTO_MINIMIZE_TIMEOUT);
        }
    }, [isOpen, isLoading, isLiveMode]);

    useEffect(() => {
        resetAutoMinimizeTimer();
        return () => { if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current); };
    }, [isOpen, messages, isLoading, resetAutoMinimizeTimer]);

    useEffect(() => {
        if (isOpen) setIsOpen(false);
    }, [currentView]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const playAudioResponse = async (text: string) => {
        const cleanText = sanitizeForTts(text);
        if (!cleanText || cleanText.length < 2) return;
        
        try {
            initAudioContext();
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: cleanText }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                const source = audioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContextRef.current.destination);
                source.start();
            }
        } catch (error) { 
            console.error('TTS Engine Error (sanitized):', error); 
        }
    };

    const startLiveSession = async () => {
        if (isLiveActive) return;
        initAudioContext();
        setIsLiveMode(true);
        setIsLiveActive(true);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-12-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputCtx.createMediaStreamSource(stream);
                        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
                            const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
                            sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputCtx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio && audioContextRef.current) {
                            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
                            const source = audioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audioContextRef.current.destination);
                            source.start();
                        }
                    },
                    onerror: () => setIsLiveActive(false),
                    onclose: () => setIsLiveActive(false),
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    systemInstruction: `You are Vistaran AI. You are on a live call with ${user?.name}. Help with ${currentView} or tickets. Tone: Helpful, professional.`,
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
                }
            });
            liveSessionRef.current = await sessionPromise;
        } catch (err) {
            console.error(err);
            setIsLiveActive(false);
        }
    };

    const stopLiveSession = () => {
        if (liveSessionRef.current) {
            liveSessionRef.current.close();
            liveSessionRef.current = null;
        }
        setIsLiveActive(false);
        setIsLiveMode(false);
    };

    const handleAction = async (text: string) => {
        if (isLoading || !text.trim()) return;
        initAudioContext();
        resetAutoMinimizeTimer();
        const userMsg = text.trim();
        const msgId = Date.now().toString();
        setInput('');
        setMessages(prev => [...prev, { id: msgId, sender: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const knowledgeBase = FAQ_DATA.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
            const systemInstruction = `Vistaran AI assistant for ${user?.name} (${user?.department}). Knowledge Base: ${knowledgeBase}. Provide simple, actionable support.`;
            
            const responseStream = await ai.models.generateContentStream({
                model: "gemini-3-flash-preview",
                contents: [...history, { role: 'user', parts: [{ text: userMsg }] }],
                config: { systemInstruction, temperature: 0.7 }
            });

            let fullAiText = "";
            const aiMsgId = 'ai_' + Date.now();
            setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: '', isStreaming: true }]);

            for await (const chunk of responseStream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullAiText += chunkText;
                    setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: fullAiText } : m));
                }
            }

            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isStreaming: false } : m));
            setHistory(prev => [...prev, { role: 'user', parts: [{ text: userMsg }] }, { role: 'model', parts: [{ text: fullAiText }] }]);
            
            if (isTtsEnabled) await playAudioResponse(fullAiText);
        } catch (error) {
            setMessages(prev => [...prev, { id: 'err', sender: 'ai', text: "Service temporary unavailable. Please retry." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className={`fixed bottom-0 right-0 m-6 transition-all duration-500 z-50 no-print ${isOpen ? 'opacity-0 scale-90 translate-y-10' : 'opacity-100'}`}>
                <button
                    onClick={() => { setIsOpen(true); initAudioContext(); }}
                    className="bg-primary text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:bg-primary-hover transition-all transform hover:scale-110 active:scale-95 group border-4 border-white dark:border-slate-800"
                >
                    <i className="fas fa-headset text-2xl animate-pulse"></i>
                </button>
            </div>

            <div className={`fixed bottom-0 right-0 m-0 sm:m-6 w-full sm:w-[420px] h-full sm:h-[680px] flex flex-col bg-white dark:bg-slate-900 sm:rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 transition-all duration-500 origin-bottom-right z-50 overflow-hidden no-print ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-95 pointer-events-none'}`}>
                
                <div className="flex-shrink-0 flex justify-between items-center p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-colors ${isLiveActive ? 'bg-rose-500' : 'bg-primary'}`}>
                                <i className={`fas ${isLiveActive ? 'fa-phone-volume' : 'fa-headset'}`}></i>
                            </div>
                            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${isLiveActive ? 'bg-rose-500 animate-ping' : 'bg-green-500'}`}></span>
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">Vistaran Core</h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">{isLiveActive ? 'Live Call Active' : 'Neural Link Ready'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => { initAudioContext(); setIsTtsEnabled(!isTtsEnabled); }} 
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isTtsEnabled ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}
                            title="Auto Speak"
                        >
                            <i className={`fas ${isTtsEnabled ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
                        </button>
                        <button 
                            onClick={() => isLiveMode ? stopLiveSession() : startLiveSession()} 
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isLiveActive ? 'bg-rose-50 text-rose-500 ring-2 ring-rose-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary'}`}
                            title={isLiveActive ? "End Call" : "Voice Mode"}
                        >
                            <i className={`fas ${isLiveActive ? 'fa-phone-slash' : 'fa-microphone'}`}></i>
                        </button>
                        <button onClick={() => setIsOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-colors"><i className="fas fa-times"></i></button>
                    </div>
                </div>

                {isLiveMode ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-12 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
                        <div className="relative">
                            <div className="w-48 h-48 rounded-full bg-primary/10 border-4 border-primary/20 flex items-center justify-center animate-pulse">
                                <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-white text-5xl shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                                    <i className="fas fa-brain"></i>
                                </div>
                            </div>
                            <div className="absolute inset-0 border-[10px] border-primary/5 rounded-full animate-[ping_2s_infinite]"></div>
                        </div>
                        <div className="text-center space-y-4">
                            <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Neural Link Established</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Speaking... Listening... Solving</p>
                        </div>
                        <button onClick={stopLiveSession} className="bg-rose-600 text-white font-black px-10 py-4 rounded-3xl shadow-2xl shadow-rose-500/30 hover:bg-rose-700 transition-all uppercase tracking-widest text-xs flex items-center gap-3">
                            <i className="fas fa-phone-slash"></i> Terminate Call
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white dark:bg-slate-900 custom-scrollbar">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[85%] space-y-1.5`}>
                                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm group relative ${
                                            msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700'
                                        }`}>
                                            <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                                            {msg.sender === 'ai' && !msg.isStreaming && (
                                                <button 
                                                    onClick={() => playAudioResponse(msg.text)}
                                                    className="absolute -right-8 bottom-0 p-2 text-slate-300 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <i className="fas fa-volume-up text-xs"></i>
                                                </button>
                                            )}
                                        </div>
                                        <span className={`text-[8px] text-slate-400 font-black uppercase tracking-widest block ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                            {msg.sender === 'user' ? 'Authenticated' : 'Neural Core'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 overflow-x-auto flex gap-2 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 no-scrollbar">
                            {quickChips.map((chip, idx) => (
                                <button key={idx} onClick={() => handleAction(chip)} className="whitespace-nowrap px-4 py-2 rounded-full bg-white dark:bg-slate-800 border dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-primary hover:text-primary transition-all shadow-sm">{chip}</button>
                            ))}
                        </div>

                        <div className="p-6 border-t dark:border-slate-800 bg-white dark:bg-slate-900">
                            <form onSubmit={(e) => { e.preventDefault(); handleAction(input); }} className="flex gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Command interface..."
                                        className="w-full pl-5 pr-5 py-4 border rounded-[22px] bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/10 shadow-inner"
                                        disabled={isLoading}
                                    />
                                </div>
                                <button type="submit" className="bg-primary text-white w-14 h-14 rounded-[22px] shadow-xl shadow-primary/20 flex items-center justify-center hover:bg-primary-hover transition-all active:scale-90 disabled:opacity-30" disabled={isLoading || !input.trim()}><i className="fas fa-paper-plane"></i></button>
                            </form>
                        </div>
                    </>
                )}
            </div>
            <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }`}</style>
        </>
    );
};

export default Chatbot;