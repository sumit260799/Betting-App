import { useState } from 'react';
import { useTournament } from '../context/useTournament';
import { Modal } from './Modal';
import {
  X,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Coins,
  ZoomIn,
  Download,
} from 'lucide-react';

const DEPOSIT_STATUS = {
  pending: {
    label: 'Pending Verification',
    classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: Clock,
  },
  approved: {
    label: 'Credited',
    classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: XCircle,
  },
};

export const AddMoneyModal = ({ onClose }) => {
  const {
    currentUser,
    myDeposits,
    requestDeposit,
  } = useTournament();

  const upiId = import.meta.env.VITE_UPI_ID || '';

  const [amount, setAmount] = useState('500');
  const [utr, setUtr] = useState('');
  const [playerNote, setPlayerNote] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [qrError, setQrError] = useState(false);
  const [showQrPreview, setShowQrPreview] = useState(false);

  const parsedAmount = Number(amount);
  const numAmount = amount !== '' && Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
  const isReadyToSubmit = !submitting && Boolean(currentUser) && numAmount >= 1 && utr.trim().length >= 6;

  const upiDeepLink = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('APL 2026')}&cu=INR${numAmount > 0 ? `&am=${numAmount}` : ''}`
    : '';

  const handleAmountChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setAmount('');
      return;
    }
    const digitsOnly = raw.replace(/\D/g, '');
    setAmount(digitsOnly);
  };

  const handleCopyUpi = () => {
    if (!upiId) return;
    navigator.clipboard?.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setStatusMessage({ type: 'error', text: 'Please login with OTP first.' });
      return;
    }
    if (numAmount < 1) {
      setStatusMessage({ type: 'error', text: 'Enter a valid amount (minimum ₹1).' });
      return;
    }
    const cleanUtr = utr.trim();
    if (cleanUtr.length < 6) {
      setStatusMessage({ type: 'error', text: 'Please enter the valid UPI UTR / Transaction ID (min 6 characters).' });
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);
    const res = await requestDeposit(numAmount, cleanUtr, playerNote);
    setSubmitting(false);

    if (res.success) {
      setUtr('');
      setPlayerNote('');
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message || 'Failed to submit deposit request.' });
    }
  };

  return (
    <>
      <Modal onClose={() => !showQrPreview && onClose()} maxWidth="xl">
        {/* Clean Checkout Header */}
        <div className="px-5 py-3.5 pr-12 bg-[#11192b] border-b border-white/[0.08] relative flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider">
                <QrCode className="w-3.5 h-3.5" />
                <span>APL 2026 Wallet Deposit</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                Add Money via UPI
              </h3>
            </div>

            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Balance</span>
              <span className="font-mono font-bold text-amber-300">₹{currentUser?.balance ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <form
          id="deposit-form"
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 text-xs bg-[#0c1322]"
        >
          {/* STEP 1: Enter Payable Amount & Scan/Pay via UPI */}
          <div className="p-4 rounded-2xl bg-[#111a2e] border border-white/[0.08] space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <span className="text-xs font-bold text-slate-100">
                  Enter Amount &amp; Pay via UPI
                </span>
              </div>
              <span className="text-[11px] text-slate-400 whitespace-nowrap">
                GPay • PhonePe • Paytm
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-center">
              {/* Unobstructed Crisp White QR Card */}
              <div className="flex flex-col items-center gap-2 mx-auto sm:mx-0">
                <button
                  type="button"
                  onClick={() => !qrError && setShowQrPreview(true)}
                  disabled={qrError}
                  title="Click to enlarge QR code"
                  className="relative w-44 h-44 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg border-2 border-white hover:border-emerald-400 transition overflow-hidden focus:outline-none"
                >
                  {!qrError ? (
                    <>
                      <img
                        src="/upiqr.png"
                        alt="Admin UPI QR Code"
                        onError={() => setQrError(true)}
                        className="w-full h-full object-contain"
                      />
                      <span className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-lg bg-slate-900/85 text-white flex items-center justify-center shadow">
                        <ZoomIn className="w-3.5 h-3.5" />
                      </span>
                    </>
                  ) : (
                    <div className="text-center text-slate-700 text-[11px] font-semibold p-2">
                      QR image unavailable. Pay using UPI ID.
                    </div>
                  )}
                </button>

                {!qrError && (
                  <div className="flex items-center gap-2.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setShowQrPreview(true)}
                      className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1 transition"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Enlarge</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <a
                      href="/upiqr.png"
                      download="apl-2026-upi-qr.png"
                      className="text-slate-300 hover:text-white font-medium flex items-center space-x-1 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save QR</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Right Payment Controls */}
              <div className="space-y-3 min-w-0">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Payable Amount (₹)
                    </label>
                    <span className="text-[11px] text-emerald-400 font-medium">
                      = {numAmount} Wallet Points
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      value={amount}
                      onKeyDown={(e) => ['-', '+', 'e', 'E', '.'].includes(e.key) && e.preventDefault()}
                      onChange={handleAmountChange}
                      placeholder="Enter amount"
                      className="w-full bg-slate-950 border border-white/[0.12] rounded-xl pl-8 pr-3 py-2 text-base font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    Organizer UPI ID
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2">
                    <span className="font-mono font-semibold text-slate-100 text-xs sm:text-sm truncate">
                      {upiId || 'Not configured'}
                    </span>
                    {upiId && (
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-slate-100 text-[11px] font-semibold flex items-center space-x-1 flex-shrink-0 transition"
                      >
                        {copiedUpi ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {upiDeepLink && (
                  <a
                    href={upiDeepLink}
                    className="inline-flex w-full items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Pay{numAmount > 0 ? ` ₹${numAmount}` : ''} with UPI App</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: Submit UTR Verification */}
          <div className="p-4 rounded-2xl bg-[#111a2e] border border-white/[0.08] space-y-3">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                2
              </span>
              <span className="text-xs font-bold text-slate-100">Confirm Payment Reference (UTR)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  UPI UTR / Transaction ID *
                </label>
                <input
                  type="text"
                  maxLength={64}
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="e.g. 432198765432"
                  className="w-full bg-slate-950 border border-white/[0.12] rounded-xl px-3 py-2 text-xs sm:text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  12-digit reference ID from your UPI receipt
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={playerNote}
                  onChange={(e) => setPlayerNote(e.target.value)}
                  placeholder="e.g. Paid via PhonePe"
                  className="w-full bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 transition"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Sender name or app used (optional)
                </p>
              </div>
            </div>

            {statusMessage && (
              <div className={`p-3 rounded-xl text-xs flex items-center space-x-2 border ${
                statusMessage.type === 'success'
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
          </div>

          {/* Recent Deposit History */}
          {myDeposits.length > 0 && (
            <div className="pt-1 space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Recent Deposits ({myDeposits.length})
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {myDeposits.map((d) => {
                  const st = DEPOSIT_STATUS[d.status] || DEPOSIT_STATUS.pending;
                  const Icon = st.icon;
                  return (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-xl bg-[#111a2e] border border-white/[0.06] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-slate-100">
                          ₹{d.amount}{' '}
                          <span className="text-[10px] font-normal text-slate-400">
                            • UTR: {d.utr}
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {new Date(d.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          {d.playerNote ? ` • ${d.playerNote}` : ''}
                        </p>
                      </div>
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full border text-[10px] font-bold flex-shrink-0 ${st.classes}`}>
                        <Icon className="w-3 h-3" />
                        <span>{st.label}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </form>

        {/* Sticky Footer */}
        <div className="px-5 py-3 bg-[#0a0f1c] border-t border-white/[0.08] flex-shrink-0">
          <button
            type="submit"
            form="deposit-form"
            disabled={!isReadyToSubmit}
            className={`w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-1.5 ${
              !isReadyToSubmit
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {submitting
                ? 'Submitting Payment...'
                : utr.trim().length < 6
                  ? `Enter UTR to Submit ₹${numAmount} Payment`
                  : `Submit ₹${numAmount} Payment for Verification`}
            </span>
          </button>
        </div>
      </Modal>

      {/* Fullscreen QR Lightbox Preview */}
      {showQrPreview && (
        <Modal onClose={() => setShowQrPreview(false)} maxWidth="sm">
          <div className="px-5 py-3.5 pr-12 bg-[#11192b] border-b border-white/[0.08] relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowQrPreview(false)}
              aria-label="Close QR preview"
              className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              Scan &amp; Pay
            </p>
            <h3 className="text-base font-bold text-white">
              {numAmount > 0 ? `Pay ₹${numAmount} via UPI` : 'Official Organizer UPI QR'}
            </h3>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 flex flex-col items-center gap-4 text-xs bg-[#0c1322]">
            <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl bg-white p-3 flex items-center justify-center shadow-2xl overflow-hidden flex-shrink-0">
              <img
                src="/upiqr.png"
                alt="UPI QR Full Preview"
                className="w-full h-full object-contain"
              />
            </div>

            {upiId && (
              <div className="w-full flex items-center justify-between gap-2 bg-slate-950 border border-white/[0.1] rounded-xl px-3 py-2">
                <span className="font-mono font-semibold text-slate-100 truncate">{upiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-slate-100 text-[11px] font-semibold flex items-center space-x-1 flex-shrink-0"
                >
                  {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}

            <div className="w-full grid grid-cols-2 gap-2">
              <a
                href="/upiqr.png"
                download="apl-2026-upi-qr.png"
                className="py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 font-semibold flex items-center justify-center space-x-1.5 border border-white/[0.08] transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save QR</span>
              </a>
              <button
                type="button"
                onClick={() => setShowQrPreview(false)}
                className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
