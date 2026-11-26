import { useState, useEffect, useRef } from 'react';
import { useTournament } from '../context/useTournament';
import { Modal } from './Modal';
import {
  X,
  Mail,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  RotateCw,
  Coins,
} from 'lucide-react';

export const LoginModal = ({ onClose, onLoginSuccess }) => {
  const { loginWithOtp, requestOtp } = useTournament();

  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'success'
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoCode, setDemoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [statusMessage, setStatusMessage] = useState(null);
  const [loggedUser, setLoggedUser] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  const inputRefs = useRef([]);
  const timersRef = useRef([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((id) => clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(id);
  }, [resendCooldown]);

  const smoothClose = (user = null) => {
    setIsClosing(true);
    const id = setTimeout(() => {
      if (user && onLoginSuccess) {
        onLoginSuccess(user);
      }
      onClose();
    }, 210);
    timersRef.current.push(id);
  };

  const triggerVerify = async (code) => {
    if (loading || code.length !== 6) return;

    setLoading(true);
    setStatusMessage(null);
    const res = await loginWithOtp(email, code);
    setLoading(false);

    if (res.success) {
      setLoggedUser(res.user);
      setStep('success');
      const id = setTimeout(() => {
        smoothClose(res.user);
      }, 1150);
      timersRef.current.push(id);
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Invalid or expired OTP.' });
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    const res = await requestOtp(email);
    setLoading(false);

    if (res.success) {
      setStep('otp');
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(30);
      setDemoCode(res.demoOtp || '');
      setStatusMessage({
        type: 'success',
        text: res.demoOtp
          ? `OTP generated for ${email}! (Dev Code: ${res.demoOtp})`
          : (res.message || `OTP sent to ${email}. Check your inbox.`),
      });
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Failed to send OTP.' });
    }
  };

  const handleDigitChange = (index, rawVal) => {
    const digit = rawVal.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setStatusMessage(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const combined = next.join('');
    if (combined.length === 6) {
      triggerVerify(combined);
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = Array.from({ length: 6 }, (_, i) => pasted[i] || '');
    setOtpDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === 6) {
      triggerVerify(pasted);
    }
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setStatusMessage({ type: 'error', text: 'Please enter the full 6-digit OTP.' });
      return;
    }
    triggerVerify(code);
  };

  const otpCode = otpDigits.join('');

  return (
    <Modal onClose={() => smoothClose()} maxWidth="md" isClosing={isClosing}>
      {/* Header */}
      {step !== 'success' && (
        <div className="px-5 py-3.5 pr-12 bg-[#11192b] border-b border-white/[0.08] relative flex-shrink-0">
          <button
            type="button"
            onClick={() => smoothClose()}
            aria-label="Close modal"
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-sm shadow-amber-500/20 text-white flex-shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Player OTP Login
              </h3>
              <p className="text-[11px] text-slate-400">
                {step === 'email'
                  ? 'Enter your office email to receive a one-time code'
                  : `Verification code sent to ${email}`}
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
            <span className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step === 'email' || step === 'otp' ? 'bg-amber-400' : 'bg-white/10'
              }`} />
            <span className={`flex-1 h-1 rounded-full transition-colors duration-300 ${step === 'otp' ? 'bg-emerald-400' : 'bg-white/10'
              }`} />
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 bg-[#0c1322]">
        {step === 'email' && (
          <form key="step-email" onSubmit={handleSendOtp} className="space-y-4 animate-step-in">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
                  autoFocus
                  required
                />
              </div>
            </div>

            {statusMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 border animate-step-in ${statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Verification OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form key="step-otp" onSubmit={handleVerifySubmit} className="space-y-4 animate-step-in">
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Enter 6-Digit OTP
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setStatusMessage(null);
                  }}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline transition"
                >
                  Change Email
                </button>
              </div>

              {/* 6-Box OTP Input */}
              <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    aria-label={`OTP digit ${idx + 1}`}
                    className={`h-12 sm:h-13 rounded-xl bg-slate-950 border text-center text-lg sm:text-xl font-mono font-bold transition focus:outline-none ${digit
                      ? 'border-emerald-400/70 text-emerald-300 shadow-sm shadow-emerald-500/10'
                      : 'border-white/[0.12] text-white focus:border-amber-400'
                      }`}
                  />
                ))}
              </div>

              {demoCode && (
                <div className="mt-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      const chars = demoCode.slice(0, 6).split('');
                      setOtpDigits(chars);
                      triggerVerify(demoCode);
                    }}
                    className="text-xs px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-mono font-semibold transition"
                  >
                    Auto-Fill Dev OTP: {demoCode}
                  </button>
                </div>
              )}
            </div>

            {/* {statusMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 border animate-step-in ${statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-950/40 text-rose-300 border-rose-500/40'
                }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )} */}

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify OTP &amp; Enter App</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center pt-1">
              <button
                type="button"
                disabled={loading || resendCooldown > 0}
                onClick={() => handleSendOtp()}
                className="text-[11px] font-medium text-slate-400 hover:text-amber-300 disabled:opacity-50 disabled:hover:text-slate-400 flex items-center space-x-1.5 transition"
              >
                <RotateCw className="w-3 h-3" />
                <span>
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                </span>
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div key="step-success" className="py-5 px-2 text-center space-y-4 animate-step-in">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border-2 border-emerald-400/60 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-success-ring">
              <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path className="animate-check-stroke" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                Verified &amp; Signed In
              </p>
              <h3 className="text-xl font-extrabold text-white">
                Welcome, {loggedUser?.name || 'Player'}!
              </h3>
              <p className="text-xs text-slate-400">{loggedUser?.email}</p>
            </div>

            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">Wallet Balance:</span>
              <span className="font-mono font-bold text-amber-300">₹{loggedUser?.balance ?? 0}</span>
            </div>

            <div className="w-48 h-1 mx-auto rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full animate-progress-shrink" />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
