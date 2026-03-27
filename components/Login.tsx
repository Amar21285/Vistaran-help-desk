
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Logo from './icons/Logo';
import { LoginStatus, User } from '../types';
import { sendEmail } from '../utils/email-service';
import { useSettings } from '../hooks/useSettings';
import { GENERIC_EMAIL_TEMPLATE_ID } from '../utils/email';

const Login: React.FC = () => {
  const { emailjsServiceId, emailjsPublicKey } = useSettings();
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [otpSentToast, setOtpSentToast] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  const { login, finalizeLogin } = useAuth();

  useEffect(() => {
    // Remove locked class when on login page
    document.body.classList.remove('app-is-logged-in');
  }, []);

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(identity, password);
    
    if (result.status === LoginStatus.INVALID_CREDENTIALS) {
      setError('Invalid identity or password.');
    } else if (result.status === LoginStatus.USER_INACTIVE) {
        setError('Account inactive. Contact Admin.');
    } else if (result.status === LoginStatus.OTP_REQUIRED && result.pendingUser) {
        const userToAuth = result.pendingUser;
        setPendingUser(userToAuth);
        
        const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(newOtp);
        setIsSendingOtp(true);

        try {
            const emailResult = await sendEmail(emailjsServiceId, emailjsPublicKey, GENERIC_EMAIL_TEMPLATE_ID, {
                subject: "Access Code - Vistaran",
                to_name: userToAuth.name,
                to_email: userToAuth.email,
                message: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;"><h2>Verification</h2><p>Your code: <b>${newOtp}</b></p></div>`
            });

            if (emailResult.success) {
                setStep('otp');
                setOtpSentToast(true);
                setTimeout(() => setOtpSentToast(false), 5000);
            } else {
                setError(`Mail Error: ${emailResult.message}`);
            }
        } catch (err) {
            setError("Transmission error.");
        } finally {
            setIsSendingOtp(false);
        }
    }
  };

  const handleOtpVerification = (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (otp === generatedOtp && pendingUser) {
          finalizeLogin(pendingUser);
      } else {
          setError('Invalid code.');
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-0 md:p-6 font-sans">
      
      {otpSentToast && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10">
              <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">
                      <i className="fas fa-paper-plane"></i>
                  </div>
                  <p className="text-xs font-bold uppercase">OTP Sent to {pendingUser?.email}</p>
              </div>
          </div>
      )}

      <div className="w-full max-w-5xl bg-white md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-screen md:min-h-[600px] border-slate-100">
        
        {/* Left Branding Panel */}
        <div className="w-full md:w-1/2 bg-[#1a3a8a] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden text-white border-r border-slate-200 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-indigo-950 opacity-95"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight">
              Vistaran <br/> <span className="text-blue-400">Help Desk</span>
            </h1>
          </div>

          <div className="flex-1 flex items-center justify-center py-4 md:py-6 relative z-10 hidden sm:flex">
            <img 
              src="https://img.freepik.com/free-vector/it-specialist-working-pc-service-maintenance-concept-flat-vector-illustration_613284-1801.jpg" 
              alt="IT Support" 
              className="w-48 md:w-full max-w-[340px] h-auto rounded-3xl shadow-2xl grayscale-[0.2]"
            />
          </div>

          <div className="relative z-10 mt-2">
            <p className="text-[8px] md:text-[9px] font-bold text-blue-300/60 uppercase tracking-widest">
                © 2024 Vistaran Health Care <br/> 
                <span className="opacity-40">Unified Service Architecture</span>
            </p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full md:w-1/2 bg-white p-6 md:p-14 flex flex-col justify-center overflow-y-auto">
          <div className="max-w-sm mx-auto w-full">
            <div className="flex items-center justify-center mb-6 md:mb-10">
              <Logo className="h-10 md:h-12 w-auto" />
            </div>

            {step === 'login' ? (
                <div className="animate-in fade-in duration-300">
                    <div className="mb-6 md:mb-8">
                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Sign In</h3>
                        <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Enterprise Access Portal</p>
                    </div>

                    <form onSubmit={handleInitialLogin} className="space-y-4 md:space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider ml-1">User Identity</label>
                            <div className="relative">
                                <i className="far fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input
                                    type="text"
                                    value={identity}
                                    onChange={(e) => setIdentity(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3 md:py-3.5 bg-slate-50 border-2 border-slate-100 focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm text-slate-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-11 pr-4 py-3 md:py-3.5 bg-slate-50 border-2 border-slate-100 focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm text-slate-700"
                                />
                            </div>
                        </div>

                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-[10px] font-black text-center border border-red-100 uppercase">{error}</div>}

                        <button
                            type="submit"
                            disabled={isSendingOtp}
                            className="w-full bg-[#1a3a8a] text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-800 active:scale-[0.98] transition-all text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isSendingOtp ? <i className="fas fa-circle-notch fa-spin"></i> : <span>Authenticate</span>}
                        </button>
                    </form>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="mb-8 text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-2xl mx-auto mb-5 border border-blue-100">
                            <i className="fas fa-shield-halved"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">Verify Identity</h3>
                        <p className="text-[10px] font-black text-primary mt-1 uppercase tracking-widest">{pendingUser?.email}</p>
                    </div>

                    <form onSubmit={handleOtpVerification} className="space-y-6">
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            required
                            className="w-full text-center py-4 bg-slate-50 border-2 border-slate-100 focus:border-primary focus:bg-white rounded-2xl outline-none transition-all font-black text-3xl tracking-[0.4em] text-slate-800"
                        />
                        <button type="submit" className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-emerald-700 active:scale-[0.98] transition-all text-xs uppercase tracking-[0.2em]">Verify & Access</button>
                    </form>
                </div>
            )}

            <div className="relative py-6 md:py-10">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.3em]"><span className="bg-white px-4 text-slate-300">Unified Vistaran Core</span></div>
            </div>

            <div className="py-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
